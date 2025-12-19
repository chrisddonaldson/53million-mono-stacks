
export interface YamlRange {
  min: number;
  max: number;
}

export interface YamlTempo {
  concentric_seconds: number;
  top_pause_seconds: number;
  eccentric_seconds: number;
  bottom_pause_seconds: number;
}

export interface YamlCalculatedFields {
  time_per_rep_seconds?: number;
  set_duration_seconds?: YamlRange;
  total_exercise_time_seconds?: YamlRange;
  total_workout_time_seconds?: YamlRange;
  total_workout_time_hms?: { min: string; max: string };
  total_workout_time_seconds_with_optional_exercises?: YamlRange;
  total_workout_time_hms_with_optional_exercises?: { min: string; max: string };
}

export interface YamlExercise {
  id: number;
  name: string;
  equipment: string[];
  setup_seconds: number;
  reset_between_sets_seconds: number;
  sets: number | YamlRange;
  reps?: number | YamlRange;
  time_seconds?: number | YamlRange;
  tempo?: YamlTempo;
  calculated_fields?: YamlCalculatedFields;
  coaching_cues?: string[];
  emphasis?: string[];
  optional?: boolean;
}

export interface YamlWorkout {
  [key: string]: {
    calculated_fields?: YamlCalculatedFields;
    exercises: YamlExercise[];
  };
}
