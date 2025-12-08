import type { MajorLift, MicroWorkout } from "../../types/config";

type WorkoutSection = 
  | ({ workout: string; sectionType: "major" } & MajorLift)
  | ({ workout: string; sectionType: "micro" } & MicroWorkout);

export const FULL_WORKOUT_ARRAY: WorkoutSection[] = [
  // Pull-Volume
  {
    workout: "Pull-Volume",
    sectionType: "major",
    lift: "deadlift",
    sets: 4,
    reps: 6,
    percent: 0.72,
  },
  {
    workout: "Pull-Volume",
    sectionType: "micro",
    title: "Back",
    items: [
      { name: "latPulldown", sets: 4, reps: 10, percent: 0.78 },
      { name: "highpull", sets: 4, reps: 10, percent: 0.78 },
      { name: "row", sets: 4, reps: 10, percent: 0.75 },
    ],
  },
  {
    workout: "Pull-Volume",
    sectionType: "micro",
    title: "Biceps Pump",
    items: [
      { name: "Barbell Bicep Curl", sets: 4, reps: 10, load: "hard" },
      { name: "Dumbbell Bicep Curl", sets: 3, reps: 12, load: "moderate" },
    ],
  },
  {
    workout: "Pull-Volume",
    sectionType: "micro",
    title: "Flexors & Core",
    items: [
      { name: "Knee Raises", sets: 3, reps: 15, load: "moderate" },
      { name: "TRX Folded Leg Raises", sets: 3, reps: 12, load: "moderate" },
    ],
  },
  {
    workout: "Pull-Volume",
    sectionType: "micro",
    title: "Trap Shrugs",
    items: [
      { name: "Dumbbell Shrugs", sets: 4, reps: 12, load: "hard" },
      { name: "Cable Shrugs", sets: 3, reps: 15, load: "moderate" },
    ],
  },
  {
    workout: "Pull-Volume",
    sectionType: "micro",
    title: "Forearm Finish",
    items: [
      { name: "Wrist Curls", sets: 3, reps: 15, load: "light" },
      { name: "Reverse Wrist Curls", sets: 3, reps: 15, load: "light" },
    ],
  },
  {
    workout: "Pull-Volume",
    sectionType: "micro",
    title: "Lower Back Strong",
    items: [
      { name: "Hyperextension", sets: 3, reps: 15, load: "moderate" },
      { name: "Jefferson Curl", sets: 3, reps: 15, load: "moderate" },
    ],
  },
  {
    workout: "Pull-Volume",
    sectionType: "micro",
    title: "Hamstring Flow",
    items: [
      {
        name: "Romanian Deadlift",
        sets: 3,
        reps: 10,
        percent: 0.6,
        liftRef: "deadlift",
      },
      { name: "Hamstring Curl", sets: 3, reps: 12, load: "moderate" },
    ],
  },
  {
    workout: "Pull-Volume",
    sectionType: "micro",
    title: "Glute Power",
    items: [
      {
        name: "Hip Thrust",
        sets: 3,
        reps: 10,
        percent: 0.65,
        liftRef: "deadlift",
      },
      { name: "Bulgarian Split Squat", sets: 3, reps: 10, load: "hard" },
    ],
  },

  // Calisthenics
  {
    workout: "Calisthenics",
    sectionType: "micro",
    title: "Calisthenics Practice",
    items: [
      { name: "Handstand progression", sets: 5, reps: 1, load: "moderate" },
      { name: "Ring rows", sets: 4, reps: 10, load: "moderate" },
      { name: "Dip holds", sets: 4, reps: 8, load: "moderate" },
      { name: "L-sit practice", sets: 4, reps: 30, load: "light" },
    ],
  },

  // Pull
  {
    workout: "Pull",
    sectionType: "major",
    lift: "deadlift",
    sets: 5,
    reps: 3,
    percent: 0.82,
  },
  {
    workout: "Pull",
    sectionType: "micro",
    title: "Forearms",
    items: [
      { name: "Wrist Curls", sets: 3, reps: 15, load: "light" },
      { name: "Wrist Twists", sets: 3, reps: 15, load: "light" },
      { name: "Reverse Wrist Curls", sets: 3, reps: 15, load: "light" },
    ],
  },
  {
    workout: "Pull",
    sectionType: "micro",
    title: "Biceps Pump",
    items: [
      { name: "Barbell Bicep Curl", sets: 4, reps: 8, load: "hard" },
      { name: "Hammer Curl", sets: 4, reps: 8, load: "hard" },
      { name: "Preacher curl", sets: 3, reps: 10, load: "moderate" },
    ],
  },
  {
    workout: "Pull",
    sectionType: "micro",
    title: "Trap Shrugs",
    items: [
      { name: "Dumbbell Shrugs", sets: 4, reps: 10, load: "hard" },
      { name: "Cable Shrugs", sets: 3, reps: 12, load: "moderate" },
    ],
  },
  {
    workout: "Pull",
    sectionType: "micro",
    title: "Back Tall",
    items: [
      { name: "latPulldown", sets: 4, reps: 10, percent: 0.78 },
      { name: "highpull", sets: 4, reps: 10, percent: 0.78 },
    ],
  },
  {
    workout: "Pull",
    sectionType: "micro",
    title: "Back Wide",
    items: [
      { name: "row", sets: 4, reps: 10, percent: 0.75 },
      { name: "Face Pull", sets: 4, reps: 10, percent: 0.75 },
      { name: "Reverse Flys", sets: 4, reps: 10, percent: 0.75 },
    ],
  },
  {
    workout: "Pull",
    sectionType: "micro",
    title: "Flexors & Core",
    items: [
      { name: "Knee Raises", sets: 3, reps: 15, load: "moderate" },
      { name: "Laying Leg raises", sets: 3, reps: 12, load: "moderate" },
    ],
  },
  {
    workout: "Pull",
    sectionType: "micro",
    title: "Lower Back Strong",
    items: [
      { name: "Hyperextension", sets: 3, reps: 12, load: "moderate" },
      { name: "Jefferson Curl", sets: 3, reps: 15, load: "moderate" },
    ],
  },
  {
    workout: "Pull",
    sectionType: "micro",
    title: "Glute Power",
    items: [
      {
        name: "Hip Thrust",
        sets: 4,
        reps: 8,
        percent: 0.7,
        liftRef: "deadlift",
      },
      { name: "Bulgarian Split Squat", sets: 3, reps: 8, load: "hard" },
    ],
  },
  {
    workout: "Pull",
    sectionType: "micro",
    title: "Hamstring Reload",
    items: [
      {
        name: "Romanian Deadlift",
        sets: 3,
        reps: 8,
        percent: 0.65,
        liftRef: "deadlift",
      },
      { name: "Hamstring Curl", sets: 3, reps: 10, load: "hard" },
    ],
  },

  // Push-Strength
  {
    workout: "Push-Strength",
    sectionType: "major",
    lift: "bench",
    sets: 4,
    reps: 8,
    percent: 0.74,
  },
  {
    workout: "Push-Strength",
    sectionType: "major",
    lift: "ohp",
    sets: 4,
    reps: 10,
    percent: 0.58,
  },
  {
    workout: "Push-Strength",
    sectionType: "major",
    lift: "squat",
    sets: 4,
    reps: 8,
    percent: 0.65,
  },
  {
    workout: "Push-Strength",
    sectionType: "micro",
    title: "Triceps Focus",
    items: [
      { name: "Tricep Extensions", sets: 3, reps: 12, load: "moderate" },
      { name: "Cable Pushdown", sets: 3, reps: 15, load: "moderate" },
      { name: "Bodyweight Dips", sets: 3, reps: 10, load: "hard" },
    ],
  },
  {
    workout: "Push-Strength",
    sectionType: "micro",
    title: "Shoulder Sculpt",
    items: [
      {
        name: "Smith Machine Overhead Press",
        sets: 3,
        reps: 10,
        percent: 0.65,
        liftRef: "ohp",
      },
      { name: "Lateral Raises", sets: 3, reps: 15, load: "light" },
      { name: "Rear Delt Fly", sets: 3, reps: 15, load: "light" },
      { name: "Front Raises", sets: 3, reps: 12, load: "light" },
    ],
  },
  {
    workout: "Push-Strength",
    sectionType: "micro",
    title: "Quad Drive",
    items: [
      { name: "Sled Pulls", sets: 4, reps: 20, load: "hard" },
      {
        name: "Hack Squat",
        sets: 3,
        reps: 12,
        percent: 0.6,
        liftRef: "squat",
      },
      { name: "Leg Extension", sets: 3, reps: 15, load: "moderate" },
    ],
  },
  {
    workout: "Push-Strength",
    sectionType: "micro",
    title: "Calf Flow",
    items: [
      {
        name: "Calf Raises (standing)",
        sets: 4,
        reps: 15,
        percent: 0.65,
        liftRef: "calfRaise",
      },
      { name: "Calf Raises (seated)", sets: 3, reps: 20, load: "moderate" },
    ],
  },
  {
    workout: "Push-Strength",
    sectionType: "micro",
    title: "Chest Finishers",
    items: [
      { name: "Chest Fly (machine)", sets: 3, reps: 12, load: "moderate" },
      {
        name: "Incline Bench Press",
        sets: 3,
        reps: 10,
        percent: 0.7,
        liftRef: "bench",
      },
    ],
  },
  {
    workout: "Push-Strength",
    sectionType: "micro",
    title: "Rotator Cuff Care",
    items: [{ name: "T-W-Y Raises", sets: 3, reps: 15, load: "light" }],
  },
  {
    workout: "Push-Strength",
    sectionType: "micro",
    title: "Core Stability",
    items: [{ name: "Weighted Crunch", sets: 3, reps: 15, load: "moderate" }],
  },

  // Push-Volume
  {
    workout: "Push-Volume",
    sectionType: "major",
    lift: "squat",
    sets: 5,
    reps: 3,
    percent: 0.68,
  },
  {
    workout: "Push-Volume",
    sectionType: "micro",
    title: "Chest 360",
    items: [
      {
        name: "Flat Bench Press",
        sets: 3,
        reps: 8,
        percent: 0.74,
        liftRef: "bench",
      },
      {
        name: "Incline Bench Press",
        sets: 3,
        reps: 8,
        percent: 0.74,
        liftRef: "bench",
      },
      { name: "Decline Bench Press", sets: 3, reps: 10, load: "moderate" },
    ],
  },
  {
    workout: "Push-Volume",
    sectionType: "micro",
    title: "Chest Flys",
    items: [
      {
        name: "Cable flies",
        sets: 3,
        reps: 6,
        percent: 0.7,
        liftRef: "ohp",
      },
      { name: "Cable lower flys", sets: 3, reps: 12, load: "light" },
      { name: "Rear Delt Fly", sets: 3, reps: 12, load: "light" },
    ],
  },
  {
    workout: "Push-Volume",
    sectionType: "micro",
    title: "Triceps Focus",
    items: [
      { name: "Tricep Extensions", sets: 3, reps: 10, load: "hard" },
      { name: "Cable Pushdown", sets: 3, reps: 12, load: "moderate" },
      { name: "Weighted Dips", sets: 4, reps: 6, load: "hard" },
    ],
  },
  {
    workout: "Push-Volume",
    sectionType: "micro",
    title: "Shoulder Sculpt",
    items: [
      {
        name: "Smith Machine Overhead Press",
        sets: 3,
        reps: 6,
        percent: 0.7,
        liftRef: "ohp",
      },
      { name: "Lateral Raises", sets: 3, reps: 12, load: "light" },
      { name: "Bent over Front Raises", sets: 3, reps: 10, load: "light" },
    ],
  },
  {
    workout: "Push-Volume",
    sectionType: "micro",
    title: "Core Stability",
    items: [
      { name: "Decline Weighted Situp", sets: 3, reps: 12, load: "moderate" },
      { name: "Decline Weighted Crunch", sets: 3, reps: 12, load: "moderate" },
      { name: "Decline Twist", sets: 3, reps: 12, load: "moderate" },
    ],
  },
  {
    workout: "Push-Volume",
    sectionType: "micro",
    title: "Quad Drive",
    items: [
      { name: "Sled Pulls", sets: 4, reps: 16, load: "hard" },
      {
        name: "Hack Squat",
        sets: 3,
        reps: 10,
        percent: 0.65,
        liftRef: "squat",
      },
      { name: "Leg Extension", sets: 3, reps: 12, load: "moderate" },
    ],
  },
  {
    workout: "Push-Volume",
    sectionType: "micro",
    title: "Calf Power",
    items: [
      {
        name: "Calf Raises (standing)",
        sets: 4,
        reps: 12,
        percent: 0.7,
        liftRef: "calfRaise",
      },
      { name: "Calf Raises (seated)", sets: 3, reps: 15, load: "moderate" },
    ],
  },

  // Upper-Strength
  {
    workout: "Upper-Strength",
    sectionType: "major",
    lift: "bench",
    sets: 4,
    reps: 5,
    percent: 0.8,
  },
  {
    workout: "Upper-Strength",
    sectionType: "major",
    lift: "row",
    sets: 4,
    reps: 6,
    percent: 0.78,
  },
  {
    workout: "Upper-Strength",
    sectionType: "major",
    lift: "ohp",
    sets: 3,
    reps: 5,
    percent: 0.72,
  },
  {
    workout: "Upper-Strength",
    sectionType: "micro",
    title: "Upper Back & Lats",
    items: [
      {
        name: "Lat Pulldown",
        sets: 3,
        reps: 8,
        percent: 0.7,
        liftRef: "latPulldown",
      },
      {
        name: "Chest Supported Row",
        sets: 3,
        reps: 10,
        percent: 0.68,
        liftRef: "chestSupportedRow",
      },
    ],
  },
  {
    workout: "Upper-Strength",
    sectionType: "micro",
    title: "Press Accessories",
    items: [
      { name: "Incline DB Press", sets: 3, reps: 10, load: "moderate" },
      { name: "Dumbbell OHP", sets: 3, reps: 10, load: "moderate" },
    ],
  },
  {
    workout: "Upper-Strength",
    sectionType: "micro",
    title: "Shoulder Polish",
    items: [
      { name: "Lateral Raises", sets: 3, reps: 15, load: "light" },
      { name: "Rear Delt Fly", sets: 3, reps: 15, load: "light" },
    ],
  },
  {
    workout: "Upper-Strength",
    sectionType: "micro",
    title: "Arm Finisher",
    items: [
      { name: "Cable Pushdown", sets: 3, reps: 12, load: "moderate" },
      { name: "Cable Curl", sets: 3, reps: 12, load: "moderate" },
    ],
  },

  // Lower-Strength
  {
    workout: "Lower-Strength",
    sectionType: "major",
    lift: "squat",
    sets: 4,
    reps: 5,
    percent: 0.78,
  },
  {
    workout: "Lower-Strength",
    sectionType: "major",
    lift: "deadlift",
    sets: 3,
    reps: 5,
    percent: 0.76,
  },
  {
    workout: "Lower-Strength",
    sectionType: "major",
    lift: "hipThrust",
    sets: 3,
    reps: 6,
    percent: 0.75,
  },
  {
    workout: "Lower-Strength",
    sectionType: "micro",
    title: "Posterior Chain",
    items: [
      {
        name: "Romanian Deadlift",
        sets: 3,
        reps: 8,
        percent: 0.6,
        liftRef: "rdl",
      },
      { name: "Back Extension", sets: 3, reps: 12, load: "moderate" },
    ],
  },
  {
    workout: "Lower-Strength",
    sectionType: "micro",
    title: "Quad Emphasis",
    items: [
      {
        name: "Leg Press",
        sets: 3,
        reps: 10,
        percent: 0.75,
        liftRef: "legPress",
      },
      { name: "Split Squat", sets: 3, reps: 12, load: "moderate" },
    ],
  },
  {
    workout: "Lower-Strength",
    sectionType: "micro",
    title: "Calves & Core",
    items: [
      {
        name: "Standing Calf Raise",
        sets: 4,
        reps: 15,
        percent: 0.7,
        liftRef: "calfRaise",
      },
      { name: "Hanging Knee Raise", sets: 3, reps: 12, load: "moderate" },
    ],
  },

  // Upper-Volume
  {
    workout: "Upper-Volume",
    sectionType: "major",
    lift: "bench",
    sets: 4,
    reps: 10,
    percent: 0.68,
  },
  {
    workout: "Upper-Volume",
    sectionType: "major",
    lift: "row",
    sets: 4,
    reps: 10,
    percent: 0.7,
  },
  {
    workout: "Upper-Volume",
    sectionType: "major",
    lift: "latPulldown",
    sets: 4,
    reps: 12,
    percent: 0.65,
  },
  {
    workout: "Upper-Volume",
    sectionType: "micro",
    title: "Chest & Shoulders",
    items: [
      { name: "DB Bench Press", sets: 3, reps: 12, load: "moderate" },
      { name: "Arnold Press", sets: 3, reps: 12, load: "moderate" },
      { name: "Cable Fly", sets: 3, reps: 15, load: "light" },
    ],
  },
  {
    workout: "Upper-Volume",
    sectionType: "micro",
    title: "Arms",
    items: [
      { name: "Skull Crushers", sets: 3, reps: 12, load: "moderate" },
      { name: "Hammer Curl", sets: 3, reps: 12, load: "moderate" },
    ],
  },
  {
    workout: "Upper-Volume",
    sectionType: "micro",
    title: "Core",
    items: [
      { name: "Russian Twist", sets: 3, reps: 20, load: "light" },
      { name: "Dead Bug", sets: 3, reps: 16, load: "light" },
    ],
  },

  // Lower-Volume
  {
    workout: "Lower-Volume",
    sectionType: "major",
    lift: "hipThrust",
    sets: 4,
    reps: 10,
    percent: 0.7,
  },
  {
    workout: "Lower-Volume",
    sectionType: "major",
    lift: "squat",
    sets: 3,
    reps: 8,
    percent: 0.7,
  },
  {
    workout: "Lower-Volume",
    sectionType: "major",
    lift: "deadlift",
    sets: 3,
    reps: 8,
    percent: 0.68,
  },
  {
    workout: "Lower-Volume",
    sectionType: "micro",
    title: "Glute Isolation",
    items: [
      { name: "Cable Kickback", sets: 3, reps: 15, load: "light" },
      { name: "45° Back Extension", sets: 3, reps: 15, load: "moderate" },
    ],
  },
  {
    workout: "Lower-Volume",
    sectionType: "micro",
    title: "Leg Accessories",
    items: [
      { name: "Walking Lunge", sets: 3, reps: 20, load: "moderate" },
      { name: "Leg Curl", sets: 3, reps: 12, load: "moderate" },
    ],
  },
  {
    workout: "Lower-Volume",
    sectionType: "micro",
    title: "Calves & Core",
    items: [
      { name: "Seated Calf Raise", sets: 4, reps: 15, load: "moderate" },
      { name: "Plank", sets: 3, reps: 45, load: "moderate" },
    ],
  },
];
