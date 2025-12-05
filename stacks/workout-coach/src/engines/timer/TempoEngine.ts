import type { Tempo } from "../../types/session";

export type TempoPhase = "down" | "hold" | "up";

export interface TempoEvent {
  phase: TempoPhase;
  rep: number;
  progress: number; // 0-1 within current phase
}

export class TempoEngine {
  private tempo: Tempo;
  private currentPhase: TempoPhase = "down";
  private phaseStartTime: number = 0;
  private currentRep: number = 1;
  private targetReps: number;
  private isActive: boolean = false;
  private elapsed: number = 0;

  constructor(tempo: Tempo, targetReps: number) {
    this.tempo = tempo;
    this.targetReps = targetReps;
  }

  start(): void {
    this.isActive = true;
    this.phaseStartTime = performance.now();
    this.currentPhase = "down";
    this.currentRep = 1;
    this.elapsed = 0;
  }

  update(deltaTime: number, onPhaseChange?: (event: TempoEvent) => void): TempoEvent {
    if (!this.isActive) {
      return {
        phase: this.currentPhase,
        rep: this.currentRep,
        progress: 0,
      };
    }

    this.elapsed += deltaTime;

    // Get duration of current phase
    const phaseDuration = this.getPhaseDuration(this.currentPhase);
    const phaseElapsed = (performance.now() - this.phaseStartTime) / 1000;
    const progress = Math.min(1, phaseElapsed / phaseDuration);

    // Check if phase is complete
    if (phaseElapsed >= phaseDuration) {
      const nextPhase = this.getNextPhase();
      const wasUp = this.currentPhase === "up";
      
      this.currentPhase = nextPhase;
      this.phaseStartTime = performance.now();

      // If we just completed "up" phase, increment rep
      if (wasUp) {
        this.currentRep++;
        
        // Check if all reps completed
        if (this.currentRep > this.targetReps) {
          this.stop();
        }
      }

      // Trigger callback
      onPhaseChange?.({
        phase: this.currentPhase,
        rep: this.currentRep,
        progress: 0,
      });
    }

    return {
      phase: this.currentPhase,
      rep: this.currentRep,
      progress,
    };
  }

  private getPhaseDuration(phase: TempoPhase): number {
    switch (phase) {
      case "down":
        return this.tempo.down;
      case "hold":
        return this.tempo.hold;
      case "up":
        return this.tempo.up;
    }
  }

  private getNextPhase(): TempoPhase {
    switch (this.currentPhase) {
      case "down":
        return "hold";
      case "hold":
        return "up";
      case "up":
        return "down";
    }
  }

  stop(): void {
    this.isActive = false;
  }

  reset(): void {
    this.currentPhase = "down";
    this.phaseStartTime = 0;
    this.currentRep = 1;
    this.isActive = false;
    this.elapsed = 0;
  }

  getProgress(): number {
    const phaseDuration = this.getPhaseDuration(this.currentPhase);
    const phaseElapsed = (performance.now() - this.phaseStartTime) / 1000;
    return Math.min(1, phaseElapsed / phaseDuration);
  }

  getCurrentRep(): number {
    return this.currentRep;
  }

  isComplete(): boolean {
    return this.currentRep > this.targetReps;
  }

  // Parse tempo string like "3-1-1" into Tempo object
  static parseTempo(tempoString: string): Tempo {
    const parts = tempoString.split("-").map(Number);
    return {
      down: parts[0] || 2,
      hold: parts[1] || 0,
      up: parts[2] || 1,
    };
  }
}
