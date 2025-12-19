import { createStore } from "solid-js/store";
import { WORKOUT_PROFILES, DEFAULT_WORKOUT_PROFILE_ID } from "../data/workouts/profiles";
import { FULL_WORKOUT_ARRAY } from "../data/workouts/full-workout-array";
import type { Config, WorkoutVariant, MajorLift, MicroWorkout } from "../types/config";
import wristWorkout from "../data/workouts/wrist-workout.yaml";
import type { YamlWorkout } from "../types/yaml-workout";

interface WorkoutStoreState {
  profiles: Record<string, Config>;
  currentProfile: string;
  favorites: string[]; // workout variant IDs
  lastCompleted: {
    variantId: string;
    profileId: string;
    timestamp: number;
  } | null;
}

const [workoutStore, setWorkoutStore] = createStore<WorkoutStoreState>({
  profiles: WORKOUT_PROFILES,
  currentProfile: DEFAULT_WORKOUT_PROFILE_ID,
  favorites: [],
  lastCompleted: null,
});

// Actions
export const workoutActions = {
  setCurrentProfile(profileId: string) {
    if (workoutStore.profiles[profileId]) {
      setWorkoutStore("currentProfile", profileId);
    }
  },

  toggleFavorite(variantId: string) {
    const index = workoutStore.favorites.indexOf(variantId);
    if (index >= 0) {
      setWorkoutStore("favorites", (prev) => prev.filter((id) => id !== variantId));
    } else {
      setWorkoutStore("favorites", (prev) => [...prev, variantId]);
    }
  },

  setLastCompleted(variantId: string, profileId: string) {
    setWorkoutStore("lastCompleted", {
      variantId,
      profileId,
      timestamp: Date.now(),
    });
  },

  getCurrentProfile(): Config {
    return workoutStore.profiles[workoutStore.currentProfile];
  },

  getWorkoutVariant(variantId: string): WorkoutVariant | null {
    // Build variant from FULL_WORKOUT_ARRAY
    const sections = FULL_WORKOUT_ARRAY.filter(section => section.workout === variantId);
    
    if (sections.length === 0) return null;

    const major: MajorLift[] = [];
    const micro: MicroWorkout[] = [];

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
  },

  getAllVariants(): Array<{ id: string; variant: WorkoutVariant; profile: string }> {
    // Get unique workout names from FULL_WORKOUT_ARRAY
    const workoutNames = new Set<string>();
    FULL_WORKOUT_ARRAY.forEach(section => {
      workoutNames.add(section.workout);
    });

    const variants: Array<{ id: string; variant: WorkoutVariant; profile: string }> = [];

    workoutNames.forEach(workoutName => {
      const variant = this.getWorkoutVariant(workoutName);
      if (variant) {
        // Determine which profile this workout belongs to
        const profile = this._getProfileForWorkout(workoutName);
        variants.push({
          id: workoutName,
          variant,
          profile,
        });
      }
    });

    return variants;
  },


  getAllMicroworkouts(): Array<{ id: string; microworkout: { title: string; items: any[] }; parentVariant: string; profile: string }> {
    // New logic: Only return YAML workouts (specifically wrist workout for now)
    const microworkouts: Array<{ id: string; microworkout: { title: string; items: any[] }; parentVariant: string; profile: string }> = [];
    
    // Process wrist workout
    const workoutData = wristWorkout as unknown as YamlWorkout;
    const rootKey = Object.keys(workoutData)[0];
    const data = workoutData[rootKey];
    
    if (data && data.exercises) {
      const items = data.exercises.map(ex => ({
        name: ex.name,
        sets: typeof ex.sets === 'number' ? ex.sets : ex.sets.max,
        reps: typeof ex.reps === 'number' ? ex.reps : (ex.reps as any)?.max || 0,
        load: "moderate"
      }));

      microworkouts.push({
        id: "wrist-workout",
        microworkout: {
          title: "Wrist Extension System",
          items: items,
        },
        parentVariant: "Wrist Health",
        profile: "chris",
      });
    }

    return microworkouts;
  },

  _getProfileForWorkout(workoutName: string): string {
    // Helper function to determine which profile a workout belongs to
    // Based on the original profiles.ts structure
    const chrisWorkouts = ["Pull-Volume", "Calisthenics", "Pull", "Push-Strength", "Push-Volume"];
    const ancaWorkouts = ["Upper-Strength", "Lower-Strength", "Upper-Volume", "Lower-Volume"];
    
    if (chrisWorkouts.includes(workoutName)) return "chris";
    if (ancaWorkouts.includes(workoutName)) return "anca";
    return "chris"; // default
  },

  isFavorite(variantId: string): boolean {
    return workoutStore.favorites.includes(variantId);
  },
};

export { workoutStore };
