import { UnifiedTimingEngine, type TimingEvent } from "./timer/UnifiedTimingEngine";
import type { GuidedSession, SessionStep } from "../types/session";
import { sessionActions } from "../stores/sessionStore";

type EventType = "tick" | "stepChange" | "statusChange" | "cue" | "completed" | "visualState";
type EventHandler = (data: any) => void;

export interface VisualState {
  phase: string;
  rep: number;
  progress: number;
  holdAnchor: number; // -1 for bottom, 1 for top
  lastMovementPhase: string; // "up" or "down"
}

export class SessionEngine {
  private session: GuidedSession;
  private timingEngine: UnifiedTimingEngine | null = null;
  private updateLoop: number | null = null;
  private listeners: Record<EventType, EventHandler[]> = {
    tick: [],
    stepChange: [],
    statusChange: [],
    cue: [],
    completed: [],
    visualState: [],
  };

  private triggeredCues = new Set<number>();
  
  // Visual state tracking (for WebGL rendering)
  private visualState: VisualState = {
    phase: "down",
    rep: 0,
    progress: 0,
    holdAnchor: 1,
    lastMovementPhase: "down",
  };

  constructor(session: GuidedSession) {
    this.session = session;
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
    console.log("[SessionEngine] Start called");
    sessionActions.startSession();
    this.emit("statusChange", "active");
    this.startStep();
  }

  pause() {
    console.log("[SessionEngine] Pause called");
    if (this.session.state !== "active") return;
    sessionActions.pauseSession();
    this.timingEngine?.pause();
    this.stopUpdateLoop();
    this.emit("statusChange", "paused");
  }

  resume() {
    console.log("[SessionEngine] Resume called");
    if (this.session.state !== "paused") return;
    sessionActions.resumeSession();
    this.emit("statusChange", "active");
    
    if (this.timingEngine) {
      this.timingEngine.resume();
      
      // Emit current state cue on resume to re-orient user
      const tempo = this.timingEngine.getCurrentTempo();
      if (tempo) {
        this.emit("cue", { type: "tempo", phase: tempo.phase, rep: tempo.rep });
      }
      
      this.startUpdateLoop();
    }
  }

  stop() {
    console.log("[SessionEngine] Stop called");
    this.stopUpdateLoop();
    this.timingEngine?.stop();
    sessionActions.endSession();
    this.emit("statusChange", "idle");
  }

  skipExercise() {
    sessionActions.skipExercise();
    this.startStep();
  }

  private getCurrentStep(): SessionStep | undefined {
    return this.session.timeline[this.session.currentStepIndex];
  }

  private startStep() {
    const step = this.getCurrentStep();
    if (!step) {
      console.log("[SessionEngine] No more steps, completing");
      this.complete();
      return;
    }
    
    console.log(`[SessionEngine] Starting step ${this.session.currentStepIndex}: ${step.type} - ${step.exerciseName || 'N/A'}`);

    this.triggeredCues.clear();
    this.emit("stepChange", step);

    // Emit first cue if time == 0
    if (step.voiceCues && step.voiceCues.length > 0) {
      if (step.voiceCues[0].time === 0) {
        this.emit("cue", step.voiceCues[0]);
        this.triggeredCues.add(0);
      }
    }

    // Determine timing mode
    const tempoReps = step.exercise?.reps ?? step.totalReps ?? 0;
    const hasTempoStructure = step.type === "work" && step.repStructure && step.repStructure.length > 0 && tempoReps > 0;

    if (hasTempoStructure) {
      // Tempo-based timing
      console.log(`[SessionEngine] Using tempo mode: ${tempoReps} reps`);
      this.timingEngine = new UnifiedTimingEngine({
        mode: "tempo",
        phases: step.repStructure!,
        targetReps: tempoReps,
      });
      
      // Initialize visual state
      this.visualState = {
        phase: step.repStructure![0].type,
        rep: 1,
        progress: 0,
        holdAnchor: 1,
        lastMovementPhase: "down",
      };
      
    } else {
      // Duration-based timing
      const duration = step.duration || 0;
      console.log(`[SessionEngine] Using duration mode: ${duration}s`);
      this.timingEngine = new UnifiedTimingEngine({
        mode: "duration",
        duration,
        countdown: duration > 0,
      });
    }

    this.timingEngine.start();
    
    // Emit initial cue for tempo mode
    if (hasTempoStructure) {
      const initialPhase = step.repStructure![0].type;
      this.emit("cue", { type: "tempo", phase: initialPhase, rep: 1 });
    }
    
    this.startUpdateLoop();
  }

  private startUpdateLoop() {
    if (this.updateLoop) clearInterval(this.updateLoop);
    
    let lastTime = performance.now();
    this.updateLoop = window.setInterval(() => {
      if (this.session.state !== "active" || !this.timingEngine) return;
      
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      
      // Get all events from timing engine
      const events = this.timingEngine.update(dt);
      
      // Process events
      events.forEach(event => this.handleTimingEvent(event));
      
      // Update global elapsed time
      const globalElapsed = Math.floor(
        (Date.now() - this.session.startTime - (this.session.pausedTime || 0)) / 1000
      );
      sessionActions.updateElapsedTime(globalElapsed);
      
    }, 16); // ~60fps
  }

  private handleTimingEvent(event: TimingEvent) {
    switch (event.type) {
      case "tick":
        // Forward tick event with all data
        this.emit("tick", {
          elapsed: event.elapsed,
          remaining: event.remaining,
          tempo: event.tempo,
        });
        
        // Update visual state if tempo data present
        if (event.tempo) {
          this.updateVisualState(event.tempo.phase, event.tempo.rep, event.tempo.progress);
        }
        
        // Check for time-based voice cues
        this.checkVoiceCues(event.elapsed || 0);
        break;
        
      case "cue":
        // Forward cue event
        if (event.cue) {
          console.log(`[SessionEngine] Forwarding cue:`, event.cue);
          this.emit("cue", event.cue);
        }
        break;
        
      case "phaseChange":
        // Phase changed - update visual state
        if (event.tempo) {
          this.updateVisualState(event.tempo.phase, event.tempo.rep, event.tempo.progress);
        }
        break;
        
      case "complete":
        // Step complete - advance to next
        console.log("[SessionEngine] Step complete, advancing");
        this.next();
        break;
    }
  }

  private updateVisualState(phase: string, rep: number, progress: number) {
    let nextMovementPhase = this.visualState.lastMovementPhase;
    
    if (phase === "eccentric" || phase === "down") {
      nextMovementPhase = "down";
    } else if (phase === "concentric" || phase === "up") {
      nextMovementPhase = "up";
    } else if (phase === "hold") {
      // Hold anchor depends on previous movement
      this.visualState.holdAnchor = nextMovementPhase === "down" ? -1 : 1;
    }
    
    this.visualState = {
      phase,
      rep,
      progress,
      holdAnchor: this.visualState.holdAnchor,
      lastMovementPhase: nextMovementPhase,
    };
    
    // Emit visual state update for WebGL
    this.emit("visualState", this.visualState);
  }

  private checkVoiceCues(elapsed: number) {
    const step = this.getCurrentStep();
    if (!step || !step.voiceCues) return;

    step.voiceCues.forEach((cue, index) => {
      if (elapsed >= cue.time && !this.triggeredCues.has(index)) {
        this.triggeredCues.add(index);
        this.emit("cue", cue);
      }
    });
  }

  private stopUpdateLoop() {
    if (this.updateLoop) {
      clearInterval(this.updateLoop);
      this.updateLoop = null;
    }
  }

  next() {
    this.stopUpdateLoop();
    this.timingEngine?.stop();
    
    const currentIndex = this.session.currentStepIndex;
    if (currentIndex < this.session.timeline.length - 1) {
      console.log("[SessionEngine] Advancing to next step");
      sessionActions.nextStep();
      this.startStep();
    } else {
      this.complete();
    }
  }

  previous() {
    this.stopUpdateLoop();
    this.timingEngine?.stop();
    
    if (this.session.currentStepIndex > 0) {
      sessionActions.previousStep();
      this.startStep();
    } else {
      this.startStep();
    }
  }

  complete() {
    this.stopUpdateLoop();
    sessionActions.completeSession();
    this.emit("completed", {});
  }

  getSession() {
    return this.session;
  }
  
  getVisualState(): VisualState {
    return this.visualState;
  }
}
