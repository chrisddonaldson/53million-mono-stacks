export type WorkoutConfig = {
  metadata?: {
    source?: string;
    generated_at?: string;
  };
  workout_groups: WorkoutGroup[];
};

export type WorkoutGroup = {
  id: string;
  name: string;
  workouts: Workout[];
};

export type Workout = {
  id: string;
  name: string;
  group: string;
  tags?: string[];
  subsections: SubSection[];
};

export type SubSection = {
  id: string;
  name: string;
  focus?: string;
  role?: string;
  notes?: string[];
  exercises: Exercise[];
};

export type ExerciseStage = 'neural' | 'stability' | 'mechanical' | 'metabolic';

export type Exercise = {
  id: string;
  name: string;
  thumbnail: string;
  video?: string;
  at_home?: string;
  stage?: ExerciseStage;
  sets?: number;
  reps?: string | number;
  work_seconds?: number;
  rest_seconds?: number;
  prescription?: string;
  notes?: string[];
};
