import type { StepPhase } from "../../types/session";

export interface TempoEvent {
  phase: StepPhase["type"];
  rep: number;
  progress: number; // 0-1 within current phase
}

export class TempoEngine {
  private phases: StepPhase[];
  private currentPhaseIndex: number = 0;
  private phaseStartTime: number = 0;
  private currentRep: number = 1;
  private targetReps: number;
  private isActive: boolean = false;
  private elapsed: number = 0;

  constructor(phases: StepPhase[], targetReps: number) {
    // Ensure we have at least one phase
    this.phases = phases.length > 0 ? phases : [{ type: "concentric", duration: 1 }];
    this.targetReps = targetReps;
  }

  start(): void {
    this.isActive = true;
    this.phaseStartTime = performance.now();
    this.currentPhaseIndex = 0;
    this.currentRep = 1;
    this.elapsed = 0;
  }

  update(deltaTime: number, onPhaseChange?: (event: TempoEvent) => void): TempoEvent {
    if (!this.isActive) {
      return {
        phase: this.getCurrentPhase().type,
        rep: this.currentRep,
        progress: 0,
      };
    }

    this.elapsed += deltaTime;

    const currentPhase = this.getCurrentPhase();
    const phaseDuration = currentPhase.duration;
    const phaseElapsed = (performance.now() - this.phaseStartTime) / 1000;
    const progress = phaseDuration > 0 ? Math.min(1, phaseElapsed / phaseDuration) : 1;

    // Check if phase is complete
    if (phaseElapsed >= phaseDuration) {
      // Advance to next phase
      this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phases.length;
      this.phaseStartTime = performance.now(); // Reset time for new phase

      // If we wrapped around to the first phase, we completed a rep
      if (this.currentPhaseIndex === 0) {
        this.currentRep++;
        
        // Check if all reps completed
        if (this.currentRep > this.targetReps) {
          this.stop();
        }
      }

      // Trigger callback ONLY if we changed phases (and not stopped)
      // Actually we always trigger on phase change
      if (this.isActive || this.currentRep > this.targetReps) {
          onPhaseChange?.({
            phase: this.getCurrentPhase().type,
            rep: this.currentRep,
            progress: 0,
          });
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
    this.phaseStartTime = 0;
    this.currentRep = 1;
    this.isActive = false;
    this.elapsed = 0;
  }

  getProgress(): number {
    const currentPhase = this.getCurrentPhase();
    const phaseDuration = currentPhase.duration;
    const phaseElapsed = (performance.now() - this.phaseStartTime) / 1000;
    return phaseDuration > 0 ? Math.min(1, phaseElapsed / phaseDuration) : 1;
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
