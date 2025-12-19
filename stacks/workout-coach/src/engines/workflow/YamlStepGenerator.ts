
import type { SessionSettings, SessionStep, StepPhase } from "../../types/session";
import type { YamlWorkout, YamlExercise } from "../../types/yaml-workout";

export class YamlStepGenerator {
  private workout: YamlWorkout;

  constructor(workout: YamlWorkout, _settings: SessionSettings) {
    this.workout = workout;
  }

  generateTimeline(): SessionStep[] {
    const steps: SessionStep[] = [];
    
    // Get the first key (workout name)
    const workoutName = Object.keys(this.workout)[0];
    const workoutData = this.workout[workoutName];

    // 1. Initial Setup
    steps.push(this.createSetupStep(workoutName));

    for (const exercise of workoutData.exercises) {
      if (exercise.optional) continue; // Skip optional for now or handle via settings

      // 2. Exercise Setup
      steps.push(this.createExerciseSetupStep(exercise));

      const sets = this.val(exercise.sets);
      
      for (let s = 1; s <= sets; s++) {
        // 3. Work Set
        steps.push(this.createWorkStep(exercise, s, sets));

        // 4. Rest (except after last set)
        if (s < sets) {
          steps.push(this.createRestStep(exercise.reset_between_sets_seconds));
        }
      }
      
      // longer rest/transition could go here if needed
    }

    // 5. Summary
    steps.push(this.createSummaryStep());

    return steps;
  }

  // Helper to handle potentially ranged values (take max for safety/completeness or min? let's take min for now or average? 
  // actually for reps/sets usually you target the range. Let's pick the mean or max. 
  // For 'Guitar Hero' style fixed track, we probably need a fixed number. Let's pick max for a good workout.)
  private val(value: number | { min: number, max: number } | undefined): number {
    if (value === undefined) return 0;
    if (typeof value === 'number') return value;
    return value.max;
  }
  
  private createSetupStep(workoutName: string): SessionStep {
    return {
      type: "setup",
      duration: 10,
      voiceCues: [{ text: `Starting ${workoutName.replace(/_/g, ' ')}`, time: 0 }],
      visualIntensity: 0.2,
    };
  }

  private createExerciseSetupStep(exercise: YamlExercise): SessionStep {
    const equipment = exercise.equipment.join(", ");
    return {
      type: "transition",
      duration: exercise.setup_seconds,
      exerciseName: exercise.name,
      voiceCues: [
        { text: `Get ready for ${exercise.name}.`, time: 0 },
        { text: `Equipment needed: ${equipment}`, time: 3 },
      ],
      visualIntensity: 0.4,
    };
  }

  private createWorkStep(exercise: YamlExercise, setNum: number, totalSets: number): SessionStep {
    const reps = this.val(exercise.reps);
    const repStructure: StepPhase[] = [];
    
    // If tempo is defined, build the structure
    let duration = 0;
    
    if (exercise.tempo && reps > 0) {
        // One full rep cycle
        const concentric = exercise.tempo.concentric_seconds;
        const topPause = exercise.tempo.top_pause_seconds;
        const eccentric = exercise.tempo.eccentric_seconds;
        const bottomPause = exercise.tempo.bottom_pause_seconds;
        
        for(let i=0; i<reps; i++) {
            // Standard order: Eccentric (lowering) -> Bottom -> Concentric (lifting) -> Top?
            // Actually usually tempo is written Concentric/Pause/Eccentric/Pause in some notations, or Eccentric first.
            // The YAML keys are explicit: eccentric_seconds, concentric_seconds.
            // Let's assume standard lift starts with eccentric (e.g. squat/bench) or concentric (pullup/deadlift)?
            // For wrist extension (lifting dumbbell), it starts with Concentric (up).
            // Let's assume Concentric Start for this specific workout type or generally.
            
            if (concentric > 0) repStructure.push({ type: 'concentric', duration: concentric });
            if (topPause > 0) repStructure.push({ type: 'hold', duration: topPause });
            if (eccentric > 0) repStructure.push({ type: 'eccentric', duration: eccentric });
            if (bottomPause > 0) repStructure.push({ type: 'hold', duration: bottomPause }); // restful hold?
        }
        
        duration = repStructure.reduce((acc, phase) => acc + phase.duration, 0);
    } else if (exercise.time_seconds) {
        duration = this.val(exercise.time_seconds);
    } else {
        duration = 60; // fallback
    }

    return {
      type: "work",
      exerciseName: exercise.name,
      duration: duration,
      setNumber: setNum,
      totalSets: totalSets,
      totalReps: reps,
      repStructure: repStructure,
      voiceCues: [
         { text: `Set ${setNum}`, time: 0 }
      ],
      visualIntensity: 0.8,
    };
  }

  private createRestStep(seconds: number): SessionStep {
     const voiceCues = [{ text: "Rest", time: 0 }];
     if (seconds > 10) {
         voiceCues.push({ text: "10 seconds left", time: seconds - 10 });
     }
     return {
         type: "rest",
         duration: seconds,
         voiceCues,
         visualIntensity: 0.1
     };
  }

  private createSummaryStep(): SessionStep {
    return {
      type: "summary",
      duration: 0,
      voiceCues: [{ text: "Workout Complete", time: 0 }],
      visualIntensity: 1,
    };
  }
}
