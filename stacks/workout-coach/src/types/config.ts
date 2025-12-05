// Core workout configuration types based on example-workout-config.ts

export interface MetaConfig {
  title: string;
  weekStart: string;
  roundingStep: number;
  units: "kg" | "lbs";
  showPercentsByDefault: boolean;
}

export interface DaySchedule {
  day: string;
  type: string;
}

export interface Lift {
  oneRm: number;
  isLower: boolean;
}

export interface ProgressionConfig {
  weeks: number;
  addUpper: number;
  addLower: number;
}

export interface MajorLift {
  lift: string;
  sets: number;
  reps: number;
  percent: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  load?: "light" | "moderate" | "hard";
  percent?: number;
  liftRef?: string;
  tempo?: string; // e.g., "3-1-1"
  rest?: number; // seconds
}

export interface MicroWorkout {
  title: string;
  items: Exercise[];
}

export interface CardioConfig {
  type: string;
  durationMin: number;
  intensity: "easy" | "moderate" | "hard";
}

export interface WorkoutVariant {
  major: MajorLift[];
  micro: MicroWorkout[];
  cardio?: CardioConfig;
}

export interface WarmupConfig {
  general: string[];
  rampPercents: number[];
  dailyYoga?: {
    title: string;
    items: string[];
  }[];
}

export interface StretchConfig {
  durationMin: number;
  drills: string[];
  cooldownYoga?: {
    title: string;
    items: string[];
  };
}

export interface Config {
  meta: MetaConfig;
  goals: string[];
  startDate: string;
  schedule: DaySchedule[];
  lifts: Record<string, Lift>;
  progression: ProgressionConfig;
  variants: Record<string, WorkoutVariant>;
  warmup: WarmupConfig;
  stretch: StretchConfig;
}

export interface WorkoutsProfiles {
  [profileId: string]: Config;
}
