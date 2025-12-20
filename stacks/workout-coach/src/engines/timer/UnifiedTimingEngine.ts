import type { StepPhase } from "../../types/session";

export type TimingMode = "duration" | "tempo";

export interface TimingEvent {
  type: "tick" | "cue" | "phaseChange" | "complete";
  elapsed?: number;
  remaining?: number;
  tempo?: {
    phase: StepPhase["type"];
    rep: number;
    progress: number; // 0-1 within current phase
  };
  cue?: {
    type: "tempo" | "general";
    phase?: StepPhase["type"];
    rep?: number;
    text?: string;
    options?: any;
  };
}

interface DurationConfig {
  mode: "duration";
  duration: number; // seconds
  countdown: boolean;
}

interface TempoConfig {
  mode: "tempo";
  phases: StepPhase[];
  targetReps: number;
}

type TimingConfig = DurationConfig | TempoConfig;

/**
 * UnifiedTimingEngine - Single source of truth for all timing
 * Handles both duration-based (rest, setup) and tempo-based (work sets) timing
 */
export class UnifiedTimingEngine {
  private config: TimingConfig;
  private isActive: boolean = false;
  private elapsed: number = 0;
  private pausedAt: number = 0;
  private pausedDuration: number = 0;

  // Tempo-specific state
  private currentPhaseIndex: number = 0;
  private currentPhaseElapsed: number = 0;
  private currentRep: number = 1;
  private lastEmittedPhase: string = "";
  private lastEmittedRep: number = 0;

  constructor(config: TimingConfig) {
    this.config = config;
  }

  start(): void {
    this.isActive = true;
    this.elapsed = 0;
    this.pausedDuration = 0;
    
    if (this.config.mode === "tempo") {
      this.currentPhaseIndex = 0;
      this.currentPhaseElapsed = 0;
      this.currentRep = 1;
      this.lastEmittedPhase = "";
      this.lastEmittedRep = 0;
    }
  }

  pause(): void {
    if (!this.isActive) return;
    this.isActive = false;
    this.pausedAt = performance.now();
  }

  resume(): void {
    if (this.isActive) return;
    this.isActive = true;
    if (this.pausedAt > 0) {
      this.pausedDuration += performance.now() - this.pausedAt;
      this.pausedAt = 0;
    }
  }

  stop(): void {
    this.isActive = false;
  }

  /**
   * Update timing state and return events that occurred
   * Call this every frame (16ms) from your render loop
   */
  update(deltaTime: number): TimingEvent[] {
    if (!this.isActive) return [];

    const events: TimingEvent[] = [];
    this.elapsed += deltaTime;

    if (this.config.mode === "duration") {
      events.push(...this.updateDuration());
    } else {
      events.push(...this.updateTempo(deltaTime));
    }

    return events;
  }

  private updateDuration(): TimingEvent[] {
    const events: TimingEvent[] = [];
    if (this.config.mode !== "duration") return events;
    const { duration, countdown } = this.config;

    const remaining = Math.max(0, duration - this.elapsed);
    
    // Emit tick event
    events.push({
      type: "tick",
      elapsed: this.elapsed,
      remaining: countdown ? remaining : undefined,
    });

    // Check completion
    if (this.elapsed >= duration && duration > 0) {
      events.push({ type: "complete" });
      this.stop();
    }

    return events;
  }

  private updateTempo(deltaTime: number): TimingEvent[] {
    const events: TimingEvent[] = [];
    if (this.config.mode !== "tempo") return events;
    const { phases, targetReps } = this.config;

    if (phases.length === 0) {
      console.warn("UnifiedTimingEngine: No phases defined for tempo mode");
      return events;
    }

    this.currentPhaseElapsed += deltaTime;
    const currentPhase = phases[this.currentPhaseIndex];
    const phaseDuration = currentPhase.duration;
    const progress = phaseDuration > 0 ? Math.min(1, this.currentPhaseElapsed / phaseDuration) : 1;

    // Emit tick with tempo data
    events.push({
      type: "tick",
      elapsed: this.elapsed,
      tempo: {
        phase: currentPhase.type,
        rep: this.currentRep,
        progress,
      },
    });

    // Check if phase is complete
    if (this.currentPhaseElapsed >= phaseDuration) {
      // Advance to next phase
      this.currentPhaseIndex = (this.currentPhaseIndex + 1) % phases.length;
      this.currentPhaseElapsed = 0;

      // If we wrapped around, we completed a rep
      if (this.currentPhaseIndex === 0) {
        this.currentRep++;
        
        // Check if all reps complete
        if (this.currentRep > targetReps) {
          events.push({ type: "complete" });
          this.stop();
          return events;
        }
      }

      const newPhase = phases[this.currentPhaseIndex];
      
      // Emit phase change event
      events.push({
        type: "phaseChange",
        tempo: {
          phase: newPhase.type,
          rep: this.currentRep,
          progress: 0,
        },
      });

      // Emit cue for new phase (only if phase or rep changed)
      const shouldEmitCue = 
        newPhase.type !== this.lastEmittedPhase || 
        this.currentRep !== this.lastEmittedRep;

      console.log(`[UnifiedTimingEngine] Phase complete check:`, {
        newPhase: newPhase.type,
        currentRep: this.currentRep,
        lastEmittedPhase: this.lastEmittedPhase,
        lastEmittedRep: this.lastEmittedRep,
        shouldEmitCue,
      });

      if (shouldEmitCue) {
        this.lastEmittedPhase = newPhase.type;
        this.lastEmittedRep = this.currentRep;

        console.log(`[UnifiedTimingEngine] ✅ EMITTING CUE: phase=${newPhase.type}, rep=${this.currentRep}`);

        events.push({
          type: "cue",
          cue: {
            type: "tempo",
            phase: newPhase.type,
            rep: this.currentRep,
          },
        });
      } else {
        console.log(`[UnifiedTimingEngine] ⏭️  SKIPPING CUE (duplicate)`);
      }
    }

    return events;
  }

  // Getters for UI state
  getElapsed(): number {
    return this.elapsed;
  }

  getRemaining(): number | null {
    if (this.config.mode === "duration") {
      return Math.max(0, this.config.duration - this.elapsed);
    }
    return null;
  }

  getCurrentTempo(): { phase: StepPhase["type"]; rep: number; progress: number } | null {
    if (this.config.mode === "tempo") {
      const { phases } = this.config;
      const currentPhase = phases[this.currentPhaseIndex];
      const progress = currentPhase.duration > 0 
        ? Math.min(1, this.currentPhaseElapsed / currentPhase.duration) 
        : 1;
      
      return {
        phase: currentPhase.type,
        rep: this.currentRep,
        progress,
      };
    }
    return null;
  }

  isComplete(): boolean {
    if (this.config.mode === "duration") {
      return this.elapsed >= this.config.duration && this.config.duration > 0;
    } else {
      return this.currentRep > this.config.targetReps;
    }
  }

  getMode(): TimingMode {
    return this.config.mode;
  }
}
