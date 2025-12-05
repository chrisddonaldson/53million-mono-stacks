import { createStore } from "solid-js/store";
import { WORKOUT_PROFILES, DEFAULT_WORKOUT_PROFILE_ID } from "../data/workouts/profiles";
import type { Config, WorkoutVariant } from "../types/config";

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
    const profile = this.getCurrentProfile();
    return profile.variants[variantId] || null;
  },

  getAllVariants(): Array<{ id: string; variant: WorkoutVariant; profile: string }> {
    const variants: Array<{ id: string; variant: WorkoutVariant; profile: string }> = [];
    
    Object.entries(workoutStore.profiles).forEach(([profileId, profile]) => {
      Object.entries(profile.variants).forEach(([variantId, variant]) => {
        variants.push({ id: variantId, variant, profile: profileId });
      });
    });

    return variants;
  },

  isFavorite(variantId: string): boolean {
    return workoutStore.favorites.includes(variantId);
  },
};

export { workoutStore };
