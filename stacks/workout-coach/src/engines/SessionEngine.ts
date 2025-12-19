import { IntervalTimer } from "./timer/IntervalTimer";
import { TempoEngine, type TempoEvent } from "./timer/TempoEngine";
import type { GuidedSession, SessionStep } from "../types/session";

type EventType = "tick" | "stepChange" | "statusChange" | "cue" | "completed";
type EventHandler = (data: any) => void;

export class SessionEngine {
  private session: GuidedSession;
  private timer: IntervalTimer; // For duration-based steps
  private tempoEngine: TempoEngine | null = null;
  private listeners: Record<EventType, EventHandler[]> = {
    tick: [],
    stepChange: [],
    statusChange: [],
    cue: [],
    completed: [],
  };

  private tempoUpdateLoop: number | null = null;
  private triggeredCues = new Set<number>();

  constructor(session: GuidedSession) {
    this.session = session;
    this.timer = new IntervalTimer("countup"); 
  }

  // Event Bus implementation
  on(event: EventType, handler: EventHandler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
    return () => this.off(event, handler);
  }

  off(event: EventType, handler: EventHandler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(h => h !== handler);
  }

  private emit(event: EventType, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(h => h(data));
    }
  }

  // Control Flow
  start() {
    console.log("SessionEngine: Start called");
    this.session.state = "active";
    this.session.startTime = Date.now();
    this.emit("statusChange", "active");
    this.startStep();
  }

  pause() {
    console.log("SessionEngine: Pause called");
    if (this.session.state !== "active") return;
    this.session.state = "paused";
    this.timer.pause(); 
    this.stopTempoLoop();
    this.emit("statusChange", "paused");
  }

  resume() {
    console.log("SessionEngine: Resume called");
    if (this.session.state !== "paused") return;
    this.session.state = "active";
    this.emit("statusChange", "active");

    const currentStep = this.getCurrentStep();
    if (currentStep) {
        if (currentStep.type === "work" && currentStep.tempo && currentStep.exercise) {
            this.startTempoLoop();
        } else {
            console.log("SessionEngine: Resuming timer");
            this.timer.resume(
                (elapsed, remaining) => this.onTick(elapsed, remaining),
                () => this.next()
            );
        }
    }
  }

  stop() {
    console.log("SessionEngine: Stop called");
    this.timer.stop();
    this.stopTempoLoop();
    this.session.state = "idle";
    this.emit("statusChange", "idle");
  }

  // Skip to next EXERCISE (skips rests)
  skipExercise() {
     // TODO: Implement similar logic to sessionStore.skipExercise
     // For now, simpler next()
     this.next();
  }

  private getCurrentStep(): SessionStep | undefined {
    return this.session.timeline[this.session.currentStepIndex];
  }

  private startStep() {
    const step = this.getCurrentStep();
    if (!step) {
      console.log("SessionEngine: No more steps, completing");
      this.complete();
      return;
    }
    
    console.log("SessionEngine: Starting step", this.session.currentStepIndex, step.type, step.exerciseName);

    this.triggeredCues.clear();
    this.emit("stepChange", step);

    // Initial cue? handled by listener mostly, but we can emit one if the step has immediate cues.
    // The previous logic in GuidedSession handled this by announcing immediately.
    // We will emit the first cue if time == 0
    if (step.voiceCues && step.voiceCues.length > 0) {
        if (step.voiceCues[0].time === 0) {
            this.emit("cue", step.voiceCues[0]);
            this.triggeredCues.add(0);
        }
    }

    if (step.type === "work" && step.tempo && step.exercise) {
      // Tempo based
      this.timer.stop(); 
      this.tempoEngine = new TempoEngine(step.tempo, step.exercise.reps);
      this.tempoEngine.start();
      this.startTempoLoop();

    } else {
      // Time based
      this.stopTempoLoop();
      this.timer = new IntervalTimer(step.duration > 0 ? "countdown" : "countup", step.duration);
      this.timer.start(
        (elapsed, remaining) => this.onTick(elapsed, remaining),
        () => {
            console.log("SessionEngine: Step timer complete");
            this.next();
        } 
      );
    }
  }

  private startTempoLoop() {
      if (this.tempoUpdateLoop) clearInterval(this.tempoUpdateLoop);
      
      let lastTime = performance.now();
      this.tempoUpdateLoop = window.setInterval(() => {
          if (this.session.state !== "active") return;
          
          const now = performance.now();
          const dt = (now - lastTime) / 1000;
          lastTime = now;
          
          if (this.tempoEngine) {
              const event = this.tempoEngine.update(dt, (e: TempoEvent) => {
                  this.emit("cue", { type: "tempo", phase: e.phase }); // Let voice coach handle formatting
                  
                  if (this.tempoEngine?.isComplete()) {
                      console.log("SessionEngine: Tempo complete");
                      this.stopTempoLoop();
                      this.next();
                  }
              });
              
              this.emit("tick", {
                  stepElapsed: this.tempoEngine.getElapsed(),
                  tempo: event,
              });
          }
      }, 16);
  }

  private stopTempoLoop() {
      if (this.tempoUpdateLoop) {
          clearInterval(this.tempoUpdateLoop);
          this.tempoUpdateLoop = null;
      }
  }

  private onTick(elapsed: number, remaining?: number) {
      const step = this.getCurrentStep();
      if (!step) return;

      // Check voice cues
      if (step.voiceCues) {
          step.voiceCues.forEach((cue, index) => {
              if (elapsed >= cue.time && !this.triggeredCues.has(index)) {
                  this.triggeredCues.add(index);
                  this.emit("cue", cue);
              }
          });
      }

      this.emit("tick", { elapsed, remaining });
  }

  next() {
    this.stopTempoLoop();
    this.timer.stop();
    
    if (this.session.currentStepIndex < this.session.timeline.length - 1) {
      this.session.currentStepIndex++;
      this.startStep();
    } else {
      this.complete();
    }
  }

  previous() {
    this.stopTempoLoop();
    this.timer.stop();
    
    if (this.session.currentStepIndex > 0) {
      this.session.currentStepIndex--;
      this.startStep();
    } else {
      this.startStep();
    }
  }

  complete() {
      this.session.state = "complete";
      this.emit("completed", {});
  }

  // Getters for UI sync (if needed, though events should drive state)
  getSession() {
      return this.session;
  }
}
