import type { Config, WorkoutVariant } from "../../types/config";
import type { SessionSettings, SessionStep } from "../../types/session";
import { StepGenerator } from "./StepGenerator";
import { FULL_WORKOUT_ARRAY } from "../../data/workouts/full-workout-array";

export class WorkflowEngine {
  static generateWorkoutTimeline(
    config: Config,
    variantId: string,
    settings: SessionSettings
  ): SessionStep[] {
    const variant = this.getWorkoutVariantFromArray(variantId);
    if (!variant) {
      throw new Error(`Workout variant "${variantId}" not found`);
    }

    const generator = new StepGenerator(config, variant, settings);
    return generator.generateTimeline();
  }

  static generateMicroworkoutTimeline(
    config: Config,
    variantId: string,
    microworkoutTitle: string,
    settings: SessionSettings
  ): SessionStep[] {
    const variant = this.getWorkoutVariantFromArray(variantId);
    if (!variant) {
      throw new Error(`Workout variant "${variantId}" not found`);
    }

    const microworkout = variant.micro.find(m => m.title === microworkoutTitle);
    if (!microworkout) {
      throw new Error(`Microworkout "${microworkoutTitle}" not found in variant "${variantId}"`);
    }

    // Create a minimal variant with just this microworkout
    const microVariant: WorkoutVariant = {
      major: [],
      micro: [microworkout],
    };

    const generator = new StepGenerator(config, microVariant, settings);
    return generator.generateTimeline();
  }

  private static getWorkoutVariantFromArray(variantId: string): WorkoutVariant | null {
    const sections = FULL_WORKOUT_ARRAY.filter(section => section.workout === variantId);
    
    if (sections.length === 0) return null;

    const major: WorkoutVariant['major'] = [];
    const micro: WorkoutVariant['micro'] = [];

    sections.forEach(section => {
      if (section.sectionType === "major") {
        major.push({
          lift: section.lift,
          sets: section.sets,
          reps: section.reps,
          percent: section.percent,
        });
      } else if (section.sectionType === "micro") {
        micro.push({
          title: section.title,
          items: section.items,
        });
      }
    });

    return { major, micro };
  }

  static validateTimeline(timeline: SessionStep[]): boolean {
    if (timeline.length === 0) return false;
    
    // Must start with setup
    if (timeline[0].type !== "setup") return false;
    
    // Must end with summary
    if (timeline[timeline.length - 1].type !== "summary") return false;
    
    // All steps must have valid duration or be indefinite (summary)
    for (const step of timeline) {
      if (step.duration < 0) return false;
    }

    return true;
  }

  static estimateTotalDuration(timeline: SessionStep[]): number {
    return timeline.reduce((total, step) => total + step.duration, 0);
  }

  static getWorkoutSummary(variant: WorkoutVariant): {
    totalExercises: number;
    totalSets: number;
    estimatedDuration: number;
  } {
    let totalExercises = variant.major.length;
    let totalSets = 0;

    // Count major lifts
    for (const major of variant.major) {
      totalSets += major.sets;
    }

    // Count micro exercises
    for (const micro of variant.micro) {
      totalExercises += micro.items.length;
      for (const item of micro.items) {
        totalSets += item.sets;
      }
    }

    // Rough estimate: 60s per set + 90s rest between
    const estimatedDuration = totalSets * 150;

    return {
      totalExercises,
      totalSets,
      estimatedDuration,
    };
  }
}
