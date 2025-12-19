import type { Config, WorkoutVariant, Exercise, MajorLift } from "../../types/config";
import type { SessionStep, SessionSettings, Tempo, StepPhase } from "../../types/session";


export class StepGenerator {
  private config: Config;
  private variant: WorkoutVariant;
  private settings: SessionSettings;

  constructor(config: Config, variant: WorkoutVariant, settings: SessionSettings) {
    this.config = config;
    this.variant = variant;
    this.settings = settings;
  }

  generateTimeline(): SessionStep[] {
    const steps: SessionStep[] = [];

    // 1. Setup phase
    steps.push(this.createSetupStep());

    // 2. Major lifts with warmup sets
    for (const major of this.variant.major) {
      // Warmup sets
      const warmupSteps = this.generateWarmupSets(major);
      steps.push(...warmupSteps);

      // Work sets
      for (let set = 0; set < major.sets; set++) {
        steps.push(this.createWorkStep(major, set + 1, major.sets));
        
        // Rest between sets (except after last set)
        if (set < major.sets - 1) {
          steps.push(this.createRestStep(this.settings.globalRestTime));
        }
      }

      // Longer rest after major lift
      steps.push(this.createRestStep(this.settings.globalRestTime * 1.5));
    }

    // 3. Micro workouts
    for (const micro of this.variant.micro) {
      // Section transition
      steps.push(this.createTransitionStep(micro.title));

      for (const exercise of micro.items) {
        for (let set = 0; set < exercise.sets; set++) {
          steps.push(this.createWorkStep(exercise, set + 1, exercise.sets));

          // Rest between sets
          if (set < exercise.sets - 1) {
            const restTime = exercise.rest || this.settings.globalRestTime;
            steps.push(this.createRestStep(restTime));
          }
        }

        // Shorter rest between exercises in same micro group
        steps.push(this.createRestStep(this.settings.globalRestTime * 0.75));
      }
    }

    // 4. Summary
    steps.push(this.createSummaryStep());

    return steps;
  }

  private createSetupStep(): SessionStep {
    return {
      type: "setup",
      duration: 30,
      voiceCues: [
        { text: "Prepare your equipment and get ready to start", time: 0 },
      ],
      visualIntensity: 0.3,
    };
  }

  private createTransitionStep(sectionTitle: string): SessionStep {
    return {
      type: "transition",
      exerciseName: sectionTitle,
      duration: 5,
      voiceCues: [
        { text: `Starting ${sectionTitle}`, time: 0 },
      ],
      visualIntensity: 0.4,
    };
  }

  private generateWarmupSets(major: MajorLift): SessionStep[] {
    const steps: SessionStep[] = [];
    const { rampPercents } = this.config.warmup;

    for (const percent of rampPercents) {
      const warmupPercent = major.percent * percent;
      const weight = this.calculateWeight(major.lift, warmupPercent);
      const reps = Math.min(major.reps, 5); // Warmup reps capped at 5

      steps.push({
        type: "warmup",
        exerciseName: major.lift,
        duration: 60, // Approximate time for warmup set
        voiceCues: [
          {
            text: `Warmup set: ${reps} reps at ${weight} ${this.config.meta.units}`,
            time: 0,
          },
        ],
        visualIntensity: 0.5,
        setNumber: 0,
        totalSets: major.sets,
        load: `${weight} ${this.config.meta.units}`,
      });

      // Short rest between warmup sets
      steps.push(this.createRestStep(30));
    }

    return steps;
  }

  private createWorkStep(
    exercise: Exercise | MajorLift,
    setNumber: number,
    totalSets: number
  ): SessionStep {
    const isMajor = "lift" in exercise;
    const name = isMajor ? exercise.lift : exercise.name;
    const reps = exercise.reps;
    
    // Calculate load
    let load: string;
    if ("percent" in exercise && exercise.percent !== undefined) {
      const liftRef = "liftRef" in exercise && exercise.liftRef ? exercise.liftRef : (isMajor ? exercise.lift : undefined);
      const weight = this.calculateWeight(liftRef || name, exercise.percent);
      load = `${weight} ${this.config.meta.units}`;
    } else if ("load" in exercise && exercise.load) {
      load = exercise.load;
    } else {
      load = "bodyweight";
    }

    // Parse tempo if available
    let tempo: Tempo | undefined;
    let duration = 60; // Default duration
    let repStructure: StepPhase[] | undefined;
    
    if ("tempo" in exercise && exercise.tempo) {
      const parts = exercise.tempo.split("-").map(Number);
      tempo = {
        down: parts[0] || 2,
        hold: parts[1] || 0,
        up: parts[2] || 1,
      };
      duration = (tempo.down + tempo.hold + tempo.up) * reps + 10; // +10s for setup
      
      // Auto-generate repStructure for compatibility with new TempoEngine
      // Assuming standard Down -> Hold -> Up ? Or 3-1-1 usually means Down-Hold-Up.
      // But we just implemented Down/Hold/Up mapping in VoiceCoach.
      // Let's generate a basic rep structure.
      // 3-phases: Eccentric (Down), Hold, Concentric (Up)
      // Wait, 3-1-1 is Down 3, Hold 1, Up 1.
      // If we want "Up, Hold, Down, Hold" as requested for YAML, that's specific to YAML.
      // Old workouts can use 3-phase.
      // TempoEngine supports arbitrary phases now!
      
      /* 
         Standard tempo "3-0-1" usually means:
         Eccentric (Down) 3s
         Bottom Pause 0s
         Concentric (Up) 1s
         (Top pause implicit or 4th digit)
      */
      
      repStructure = [];
      const repPhases: any[] = []; // StepPhase[]
      
      // Eccentric
      if (tempo.down > 0) repPhases.push({ type: "eccentric", duration: tempo.down });
      // Hold (Bottom)
      if (tempo.hold > 0) repPhases.push({ type: "hold", duration: tempo.hold });
      // Concentric
      if (tempo.up > 0) repPhases.push({ type: "concentric", duration: tempo.up });
      
      // Repeat for all reps? 
      // TempoEngine iterates phases. If we want it to count reps, we need a SINGLE rep structure.
      // TempoEngine takes repStructure and loops it `reps` times.
      
      repStructure = repPhases;
    }

    // Determine intensity based on load and exercise type
    let intensity = 0.7;
    if (("load" in exercise && exercise.load === "hard") || (isMajor && exercise.reps <= 5)) {
      intensity = 0.95;
    } else if ("load" in exercise && exercise.load === "light") {
      intensity = 0.6;
    } else if ("load" in exercise && exercise.load === "moderate") {
      intensity = 0.75;
    }

    const voiceCues: SessionStep["voiceCues"] = [
      {
        text: setNumber === 1 
          ? `${name}, ${totalSets} sets of ${reps} reps at ${load}`
          : `Set ${setNumber} of ${totalSets}`,
        time: 0,
      },
    ];

    return {
      type: "work",
      exercise: exercise as Exercise,
      exerciseName: name,
      duration,
      tempo,
      voiceCues,
      visualIntensity: intensity,
      setNumber,
      totalSets,
      load,
      repStructure,
    };
  }

  private createRestStep(duration: number): SessionStep {
    const voiceCues: SessionStep["voiceCues"] = [
      { text: "Rest", time: 0 },
    ];

    // Add countdown cues based on duration
    if (duration >= 30) {
      voiceCues.push({ text: "30 seconds remaining", time: duration - 30 });
    }
    if (duration >= 15) {
      voiceCues.push({ text: "15 seconds", time: duration - 15 });
    }
    if (duration >= 10) {
      voiceCues.push({ text: "10 seconds", time: duration - 10 });
    }
    if (duration >= 5) {
      voiceCues.push({ text: "5", time: duration - 5 });
      voiceCues.push({ text: "4", time: duration - 4 });
      voiceCues.push({ text: "3", time: duration - 3 });
      voiceCues.push({ text: "2", time: duration - 2 });
      voiceCues.push({ text: "1", time: duration - 1 });
    }

    return {
      type: "rest",
      duration,
      voiceCues,
      visualIntensity: 0.3,
    };
  }

  private createSummaryStep(): SessionStep {
    return {
      type: "summary",
      duration: 0,
      voiceCues: [
        { text: "Workout complete! Great work!", time: 0 },
      ],
      visualIntensity: 1.0,
    };
  }

  private calculateWeight(liftName: string, percent: number): number {
    const lift = this.config.lifts[liftName];
    if (!lift) return 0;

    const weight = lift.oneRm * percent;
    const roundingStep = this.config.meta.roundingStep;
    return Math.round(weight / roundingStep) * roundingStep;
  }
}
