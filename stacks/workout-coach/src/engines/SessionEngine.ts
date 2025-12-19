import { IntervalTimer } from "./timer/IntervalTimer";
import { TempoEngine, type TempoEvent } from "./timer/TempoEngine";
import type { GuidedSession, SessionStep } from "../types/session";
import { sessionActions } from "../stores/sessionStore";

type EventType = "tick" | "stepChange" | "statusChange" | "cue" | "completed";
type EventHandler = (data: any) => void;

export class SessionEngine {
  private session: GuidedSession; // This is a reference to the store proxy
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
    sessionActions.startSession();
    this.emit("statusChange", "active");
    this.startStep();
  }

  pause() {
    console.log("SessionEngine: Pause called");
    if (this.session.state !== "active") return;
    sessionActions.pauseSession();
    this.timer.pause(); 
    this.stopTempoLoop();
    this.emit("statusChange", "paused");
  }

  resume() {
    console.log("SessionEngine: Resume called");
    if (this.session.state !== "paused") return;
    sessionActions.resumeSession();
    this.emit("statusChange", "active");

    const currentStep = this.getCurrentStep();
    if (currentStep) {
        if (currentStep.type === "work" && currentStep.repStructure && currentStep.repStructure.length > 0 && currentStep.exercise) {
            // Emit current phase cue on resume to re-orient user
            if (this.tempoEngine) {
                 const currentPhase = this.tempoEngine.getCurrentPhase();
                 this.emit("cue", { type: "tempo", phase: currentPhase.type });
            }
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
    sessionActions.endSession(); // Or define a stop action? endSession clears it.
    // Maybe just set state to idle?
    // sessionActions.pauseSession();
    this.emit("statusChange", "idle");
  }

  // Skip to next EXERCISE (skips rests)
  skipExercise() {
     sessionActions.skipExercise();
     // We need to restart step processing for the new step
     this.startStep();
  }

  private getCurrentStep(): SessionStep | undefined {
    // Always read from the session reference, which is the store proxy.
    // Solid proxies should give fresh values.
    return this.session.timeline[this.session.currentStepIndex];
  }

  private startStep() {
    // IMPORTANT: getCurrentStep() reads from the session store proxy.
    // When next() calls sessionActions.nextStep(), the store updates.
    // We assume this.session.currentStepIndex reflects that change immediately 
    // because standard JS references to proxies usually work that way in the same tick 
    // if action was synchronous? Yes, Solid stores are synchronous.
    
    const step = this.getCurrentStep();
    if (!step) {
      console.log("SessionEngine: No more steps, completing");
      this.complete();
      return;
    }
    
    console.log("SessionEngine: Starting step", this.session.currentStepIndex, step.type, step.exerciseName);

    this.triggeredCues.clear();
    this.emit("stepChange", step);

    // Emit first cue if time == 0
    if (step.voiceCues && step.voiceCues.length > 0) {
        if (step.voiceCues[0].time === 0) {
            this.emit("cue", step.voiceCues[0]);
            this.triggeredCues.add(0);
        }
    }

    if (step.type === "work" && step.repStructure && step.repStructure.length > 0 && step.exercise) {
      // Tempo based
      this.timer.stop(); 
      this.tempoEngine = new TempoEngine(step.repStructure, step.exercise.reps);
      this.tempoEngine.start();
      // Emit initial cue for the first phase
      const initialPhase = this.tempoEngine.getCurrentPhase();
      this.emit("cue", { type: "tempo", phase: initialPhase.type });
      
      this.startTempoLoop();

    } else {
      // Time based
      this.stopTempoLoop();
      // Reset timer for new step
      // duration > 0 ? countdown : countup.
      // If duration is 0, it's effectively a manual step or instant?
      // If duration is 0, we shouldn't auto-complete immediately unless we want to skip it?
      // Usually steps have duration. Setup steps might have 5s.
      
      const isCountdown = step.duration > 0;
      this.timer = new IntervalTimer(isCountdown ? "countdown" : "countup", step.duration);
      
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
    this.timer.stop(); // Stop current step timer
    
    const currentIndex = this.session.currentStepIndex;
    if (currentIndex < this.session.timeline.length - 1) {
      console.log("SessionEngine: Advancing to next step");
      sessionActions.nextStep(); // Mutate store
      // Wait? Solid store update is synchronous.
      // So this.session.currentStepIndex should likely be updated by the time we run next line?
      // But let's verify.
      
      this.startStep();
    } else {
      this.complete();
    }
  }

  previous() {
    this.stopTempoLoop();
    this.timer.stop();
    
    if (this.session.currentStepIndex > 0) {
        sessionActions.previousStep();
        this.startStep();
    } else {
        // Just restart current?
        // sessionActions.previousStep() checks boundary.
        this.startStep();
    }
  }

  complete() {
      sessionActions.completeSession();
      this.emit("completed", {});
  }

  // Getters for UI sync (if needed, though events should drive state)
  getSession() {
      return this.session;
  }
}
