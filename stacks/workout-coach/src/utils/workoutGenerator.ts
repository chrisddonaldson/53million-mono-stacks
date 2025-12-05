import type { WorkoutVariant, MicroWorkout, Config } from "../types/config";

export interface QuickStartParams {
  duration: number; // minutes
  goal: "strength" | "hypertrophy" | "conditioning";
  equipment: string[];
  profile: Config;
}

// Exercise library for quick start
const EXERCISE_LIBRARY: Record<string, {
  name: string;
  equipment: string[];
  muscleGroups: string[];
  compound: boolean;
}> = {
  pushup: {
    name: "Push-ups",
    equipment: [],
    muscleGroups: ["chest", "triceps", "shoulders"],
    compound: true,
  },
  squat: {
    name: "Bodyweight Squats",
    equipment: [],
    muscleGroups: ["legs", "glutes"],
    compound: true,
  },
  lunge: {
    name: "Lunges",
    equipment: [],
    muscleGroups: ["legs", "glutes"],
    compound: true,
  },
  plank: {
    name: "Plank Hold",
    equipment: [],
    muscleGroups: ["core"],
    compound: false,
  },
  burpee: {
    name: "Burpees",
    equipment: [],
    muscleGroups: ["full body"],
    compound: true,
  },
  jumpingJack: {
    name: "Jumping Jacks",
    equipment: [],
    muscleGroups: ["cardio"],
    compound: true,
  },
  mountainClimber: {
    name: "Mountain Climbers",
    equipment: [],
    muscleGroups: ["core", "cardio"],
    compound: true,
  },
  dumbellCurl: {
    name: "Dumbbell Bicep Curl",
    equipment: ["dumbbells"],
    muscleGroups: ["biceps"],
    compound: false,
  },
  dumbbellPress: {
    name: "Dumbbell Shoulder Press",
    equipment: ["dumbbells"],
    muscleGroups: ["shoulders", "triceps"],
    compound: true,
  },
  dumbbellRow: {
    name: "Dumbbell Row",
    equipment: ["dumbbells"],
    muscleGroups: ["back", "biceps"],
    compound: true,
  },
  tricepDip: {
    name: "Tricep Dips",
    equipment: [],
    muscleGroups: ["triceps", "chest"],
    compound: false,
  },
};

export function generateQuickStartWorkout(params: QuickStartParams): WorkoutVariant {
  const { duration, goal, equipment } = params;

  // Calculate time budget (convert minutes to seconds)
  const totalSeconds = duration * 60;
  const setupTime = 30;
  const summaryTime = 30;
  const availableTime = totalSeconds - setupTime - summaryTime;

  // Select exercises based on goal and equipment
  const selectedExercises = selectExercises(goal, equipment);

  // Determine sets/reps based on goal
  const { reps, rest } = getWorkParameters(goal);

  // Estimate time per exercise set (work + rest)
  const timePerSet = 60 + rest; // Approximate 60s work + rest
  
  // Calculate how many total sets fit in available time
  const maxTotalSets = Math.floor(availableTime / timePerSet);
  
  // Distribute sets across exercises
  const setsPerExercise = Math.max(2, Math.floor(maxTotalSets / selectedExercises.length));

  // Build micro workouts
  const microWorkouts: MicroWorkout[] = [];
  
  // Group exercises by muscle group
  const compoundExercises = selectedExercises.filter(e => e.compound);
  const isolationExercises = selectedExercises.filter(e => !e.compound);

  if (compoundExercises.length > 0) {
    microWorkouts.push({
      title: `${goal.charAt(0).toUpperCase() + goal.slice(1)} Focus`,
      items: compoundExercises.map(ex => ({
        name: ex.name,
        sets: setsPerExercise,
        reps,
        load: goal === "strength" ? "hard" : goal === "hypertrophy" ? "moderate" : "light",
        rest,
      })),
    });
  }

  if (isolationExercises.length > 0) {
    microWorkouts.push({
      title: "Accessory Work",
      items: isolationExercises.map(ex => ({
        name: ex.name,
        sets: Math.max(2, setsPerExercise - 1),
        reps: reps + 2,
        load: "moderate",
        rest: rest - 15,
      })),
    });
  }

  return {
    major: [], // No major lifts in quick start
    micro: microWorkouts,
  };
}

function selectExercises(
  goal: "strength" | "hypertrophy" | "conditioning",
  equipment: string[]
): Array<typeof EXERCISE_LIBRARY[string]> {
  const availableExercises = Object.values(EXERCISE_LIBRARY).filter(ex => {
    // Check if we have the required equipment
    return ex.equipment.every(eq => equipment.includes(eq) || eq === "");
  });

  // Select exercises based on goal
  let selected: typeof availableExercises = [];

  switch (goal) {
    case "strength":
      // Prioritize compound movements
      selected = availableExercises
        .filter(ex => ex.compound)
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);
      break;

    case "hypertrophy":
      // Mix of compound and isolation
      const compounds = availableExercises.filter(ex => ex.compound).slice(0, 3);
      const isolations = availableExercises.filter(ex => !ex.compound).slice(0, 2);
      selected = [...compounds, ...isolations];
      break;

    case "conditioning":
      // High-rep, cardio-focused exercises
      selected = availableExercises
        .filter(ex => ex.muscleGroups.includes("cardio") || ex.compound)
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);
      break;
  }

  // Ensure we have at least 3 exercises
  if (selected.length < 3) {
    const additional = availableExercises
      .filter(ex => !selected.includes(ex))
      .slice(0, 3 - selected.length);
    selected = [...selected, ...additional];
  }

  return selected;
}

function getWorkParameters(goal: "strength" | "hypertrophy" | "conditioning"): {
  reps: number;
  rest: number;
} {
  switch (goal) {
    case "strength":
      return { reps: 5, rest: 120 }; // Heavy, low reps, long rest

    case "hypertrophy":
      return { reps: 10, rest: 90 }; // Moderate, medium reps

    case "conditioning":
      return { reps: 15, rest: 45 }; // Light, high reps, short rest

    default:
      return { reps: 10, rest: 90 };
  }
}

export function estimateQuickStartDuration(params: QuickStartParams): number {
  const workout = generateQuickStartWorkout(params);
  
  let totalTime = 30 + 30; // Setup + summary
  
  for (const micro of workout.micro) {
    for (const exercise of micro.items) {
      const setTime = 60; // Approximate work time per set
      const restTime = exercise.rest || 90;
      totalTime += exercise.sets * (setTime + restTime);
    }
  }
  
  return totalTime;
}
