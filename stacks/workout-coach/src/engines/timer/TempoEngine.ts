import type { StepPhase } from "../../types/session";

export interface TempoEvent {
  phase: StepPhase["type"];
  rep: number;
  progress: number; // 0-1 within current phase
}

export class TempoEngine {
  private phases: StepPhase[];
  private currentPhaseIndex: number = 0;
  private currentRep: number = 1;
  private targetReps: number;
  private isActive: boolean = false;
  private elapsed: number = 0;
  private currentPhaseElapsed: number = 0;

  constructor(phases: StepPhase[], targetReps: number) {
    // Ensure we have at least one phase
    this.phases = phases.length > 0 ? phases : [{ type: "concentric", duration: 1 }];
    this.targetReps = targetReps;
  }

  start(): void {
    this.isActive = true;
    this.currentPhaseIndex = 0;
    this.currentPhaseElapsed = 0;
    this.currentRep = 1;
    this.elapsed = 0;
  }

  update(deltaTime: number, onPhaseChange?: (event: TempoEvent) => void): TempoEvent {
    if (!this.isActive) {
      return {
        phase: this.getCurrentPhase().type,
        rep: this.currentRep,
        progress: 1,
      };
    }

    this.elapsed += deltaTime;
    this.currentPhaseElapsed += deltaTime;

    const currentPhase = this.getCurrentPhase();
    const phaseDuration = currentPhase.duration;
    let progress = phaseDuration > 0 ? Math.min(1, this.currentPhaseElapsed / phaseDuration) : 1;

    // Check if phase is complete
    if (this.currentPhaseElapsed >= phaseDuration) {
      // Advance to next phase
      this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phases.length;
      this.currentPhaseElapsed = 0;
      progress = 0;

      // If we wrapped around to the first phase, we completed a rep
      if (this.currentPhaseIndex === 0) {
        this.currentRep++;
        if (this.currentRep > this.targetReps) {
          this.stop();
          return { 
            phase: this.phases[this.phases.length - 1].type, 
            rep: this.targetReps, 
            progress: 1 
          };
        }
      }

      // Trigger callback for the NEW phase
      if (this.isActive) {
        const phaseEvent = {
          phase: this.phases[this.currentPhaseIndex].type,
          rep: this.currentRep,
          progress: 0,
        };
        console.log(`[TempoEngine] Phase change: ${phaseEvent.phase}, rep ${phaseEvent.rep}`);
        onPhaseChange?.(phaseEvent);
      }
    }

    return {
      phase: this.getCurrentPhase().type,
      rep: this.currentRep,
      progress,
    };
  }

  getCurrentPhase(): StepPhase {
    return this.phases[this.currentPhaseIndex];
  }

  stop(): void {
    this.isActive = false;
  }

  reset(): void {
    this.currentPhaseIndex = 0;
    this.currentRep = 1;
    this.isActive = false;
    this.elapsed = 0;
    this.currentPhaseElapsed = 0;
  }

  getProgress(): number {
    const currentPhase = this.getCurrentPhase();
    const phaseDuration = currentPhase.duration;
    return phaseDuration > 0 ? Math.min(1, this.currentPhaseElapsed / phaseDuration) : 1;
  }

  getCurrentRep(): number {
    return this.currentRep;
  }

  isComplete(): boolean {
    return this.currentRep > this.targetReps;
  }

  getElapsed(): number {
    return this.elapsed;
  }
}
