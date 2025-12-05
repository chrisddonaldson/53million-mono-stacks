import type { Config, WorkoutsProfiles } from "../../types/config";

const chrisConfig: Config = {
  meta: {
    title: "Chris's Plan",
    weekStart: "2025-10-20",
    roundingStep: 2.5,
    units: "kg",
    showPercentsByDefault: true,
  },
  goals: [
    "Drive squat strength to a 200 kg 1RM",
    "Pull a 300 kg deadlift with confident form",
    "Press 150 kg on the bench for a new PR",
    "Overhead press 100 kg with stability",
    "Grow arm circumference and density",
    "Build powerful legs with visible quad/hamstring growth",
    "Add size and shape to the chest",
    "Develop fuller, stronger calves",
    "Reduce body fat from ~23% (starting 22 Oct) while staying athletic",
  ],
  startDate: "2025-10-20",
  schedule: [
    { day: "Mon", type: "Push-Volume" },
    { day: "Tue", type: "Pull" },
    { day: "Wed", type: "Calisthenics" },
    { day: "Thu", type: "Push-Volume" },
    { day: "Fri", type: "Pull" },
    { day: "Sat", type: "Calisthenics" },
    { day: "Sun", type: "Rest" },
  ],
  lifts: {
    deadlift: { oneRm: 220, isLower: true },
    row: { oneRm: 160, isLower: false },
    bench: { oneRm: 150, isLower: false },
    ohp: { oneRm: 100, isLower: false },
    squat: { oneRm: 200, isLower: true },
    latPulldown: { oneRm: 150, isLower: false },
    highRow: { oneRm: 135, isLower: false },
    calfRaise: { oneRm: 180, isLower: false },
  },
  progression: { weeks: 12, addUpper: 2.5, addLower: 5.0 },
  variants: {
    "Pull-Volume": {
      major: [{ lift: "deadlift", sets: 4, reps: 6, percent: 0.72 }],
      micro: [
        {
          title: "Back",
          items: [
            { name: "latPulldown", sets: 4, reps: 10, percent: 0.78 },
            { name: "highpull", sets: 4, reps: 10, percent: 0.78 },
            { name: "row", sets: 4, reps: 10, percent: 0.75 },
          ],
        },
        {
          title: "Biceps Pump",
          items: [
            { name: "Barbell Bicep Curl", sets: 4, reps: 10, load: "hard" },
            {
              name: "Dumbbell Bicep Curl",
              sets: 3,
              reps: 12,
              load: "moderate",
            },
          ],
        },
        {
          title: "Flexors & Core",
          items: [
            { name: "Knee Raises", sets: 3, reps: 15, load: "moderate" },
            {
              name: "TRX Folded Leg Raises",
              sets: 3,
              reps: 12,
              load: "moderate",
            },
          ],
        },
        {
          title: "Trap Shrugs",
          items: [
            { name: "Dumbbell Shrugs", sets: 4, reps: 12, load: "hard" },
            { name: "Cable Shrugs", sets: 3, reps: 15, load: "moderate" },
          ],
        },
        {
          title: "Forearm Finish",
          items: [
            { name: "Wrist Curls", sets: 3, reps: 15, load: "light" },
            { name: "Reverse Wrist Curls", sets: 3, reps: 15, load: "light" },
          ],
        },
        {
          title: "Lower Back Strong",
          items: [
            { name: "Hyperextension", sets: 3, reps: 15, load: "moderate" },
            { name: "Jefferson Curl", sets: 3, reps: 15, load: "moderate" },
          ],
        },
        {
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
      ],
    },
    Calisthenics: {
      major: [],
      micro: [
        {
          title: "Calisthenics Practice",
          items: [
            {
              name: "Handstand progression",
              sets: 5,
              reps: 1,
              load: "moderate",
            },
            { name: "Ring rows", sets: 4, reps: 10, load: "moderate" },
            { name: "Dip holds", sets: 4, reps: 8, load: "moderate" },
            { name: "L-sit practice", sets: 4, reps: 30, load: "light" },
          ],
        },
      ],
    },
    Pull: {
      major: [{ lift: "deadlift", sets: 5, reps: 3, percent: 0.82 }],
      micro: [
        {
          title: "Forearms",
          items: [
            { name: "Wrist Curls", sets: 3, reps: 15, load: "light" },
            { name: "Wrist Twists", sets: 3, reps: 15, load: "light" },
            { name: "Reverse Wrist Curls", sets: 3, reps: 15, load: "light" },
          ],
        },
        {
          title: "Biceps Pump",
          items: [
            { name: "Barbell Bicep Curl", sets: 4, reps: 8, load: "hard" },
            { name: "Hammer Curl", sets: 4, reps: 8, load: "hard" },
            {
              name: "Preacher curl",
              sets: 3,
              reps: 10,
              load: "moderate",
            },
          ],
        },
        {
          title: "Trap Shrugs",
          items: [
            { name: "Dumbbell Shrugs", sets: 4, reps: 10, load: "hard" },
            { name: "Cable Shrugs", sets: 3, reps: 12, load: "moderate" },
          ],
        },
        {
          title: "Back Tall",
          items: [
            { name: "latPulldown", sets: 4, reps: 10, percent: 0.78 },
            { name: "highpull", sets: 4, reps: 10, percent: 0.78 },
          ],
        },
        {
          title: "Back Wide",
          items: [
            { name: "row", sets: 4, reps: 10, percent: 0.75 },
            { name: "Face Pull", sets: 4, reps: 10, percent: 0.75 },
            { name: "Reverse Flys", sets: 4, reps: 10, percent: 0.75 },
          ],
        },
        {
          title: "Flexors & Core",
          items: [
            { name: "Knee Raises", sets: 3, reps: 15, load: "moderate" },
            {
              name: "Laying Leg raises ",
              sets: 3,
              reps: 12,
              load: "moderate",
            },
          ],
        },
        {
          title: "Lower Back Strong",
          items: [
            { name: "Hyperextension", sets: 3, reps: 12, load: "moderate" },
            { name: "Jefferson Curl", sets: 3, reps: 15, load: "moderate" },
          ],
        },
        {
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
      ],
    },
    "Push-Strength": {
      major: [
        { lift: "bench", sets: 4, reps: 8, percent: 0.74 },
        { lift: "ohp", sets: 4, reps: 10, percent: 0.58 },
        { lift: "squat", sets: 4, reps: 8, percent: 0.65 },
      ],
      micro: [
        {
          title: "Triceps Focus",
          items: [
            { name: "Tricep Extensions", sets: 3, reps: 12, load: "moderate" },
            { name: "Cable Pushdown", sets: 3, reps: 15, load: "moderate" },
            { name: "Bodyweight Dips", sets: 3, reps: 10, load: "hard" },
          ],
        },
        {
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
          title: "Calf Flow",
          items: [
            {
              name: "Calf Raises (standing)",
              sets: 4,
              reps: 15,
              percent: 0.65,
              liftRef: "calfRaise",
            },
            {
              name: "Calf Raises (seated)",
              sets: 3,
              reps: 20,
              load: "moderate",
            },
          ],
        },
        {
          title: "Chest Finishers",
          items: [
            {
              name: "Chest Fly (machine)",
              sets: 3,
              reps: 12,
              load: "moderate",
            },
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
          title: "Rotator Cuff Care",
          items: [{ name: "T-W-Y Raises", sets: 3, reps: 15, load: "light" }],
        },
        {
          title: "Core Stability",
          items: [
            { name: "Weighted Crunch", sets: 3, reps: 15, load: "moderate" },
          ],
        },
      ],
    },
    "Push-Volume": {
      major: [{ lift: "squat", sets: 5, reps: 3, percent: 0.68 }],
      micro: [
        {
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
            {
              name: "Decline Bench Press",
              sets: 3,
              reps: 10,
              load: "moderate",
            },
          ],
        },

        {
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
          title: "Triceps Focus",
          items: [
            { name: "Tricep Extensions", sets: 3, reps: 10, load: "hard" },
            { name: "Cable Pushdown", sets: 3, reps: 12, load: "moderate" },
            { name: "Weighted Dips", sets: 4, reps: 6, load: "hard" },
          ],
        },
        {
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

            {
              name: "Bent over Front Raises",
              sets: 3,
              reps: 10,
              load: "light",
            },
          ],
        },
        {
          title: "Core Stability",
          items: [
            {
              name: "Decline Weighted Situp",
              sets: 3,
              reps: 12,
              load: "moderate",
            },
            {
              name: "Decline Weighted Crunch",
              sets: 3,
              reps: 12,
              load: "moderate",
            },
            { name: "Decline Twist", sets: 3, reps: 12, load: "moderate" },
          ],
        },
        {
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
          title: "Calf Power",
          items: [
            {
              name: "Calf Raises (standing)",
              sets: 4,
              reps: 12,
              percent: 0.7,
              liftRef: "calfRaise",
            },
            {
              name: "Calf Raises (seated)",
              sets: 3,
              reps: 15,
              load: "moderate",
            },
          ],
        },
      ],
    },
  },
  warmup: {
    general: [
      "Walk to the gym / brisk walk",
      "5 min easy cardio (rower or bike)",
      "Knee and ankle mobility priming",
      "Dynamic hips/shoulders and band activation",
    ],
    rampPercents: [0.4, 0.6, 0.8],
    dailyYoga: [
      {
        title: "Cardio",
        items: ["Light treadmill - 30 minutes at conversational pace"],
      },
      {
        title: "Warm-up",
        items: [
          "Arm and leg swings - 5 swings forward + backwards, 5 side to side, top and bottom",
          "Door frame chest stretch",
          "Tricep stretches - overhead, across chest",
          "Bend and fold - Sun salute + hip bend x5",
        ],
      },
      {
        title: "Drills",
        items: [
          "Hollow body - hold for 1min",
          "Plank - hold for 1min",
          "Side plank",
          "Laying TWY raises",
          "Jefferson curl",
          "Leg lift side",
          "Leg lift front",
          "Deep squats",
          "Cossack squat",
        ],
      },
    ],
  },
  stretch: {
    durationMin: 15,
    drills: [
      "Forward fold + deep squat hold (90s each)",
      "Shoulder dislocates with band x20",
      "Thoracic bridge hold 2x30s",
      "Pigeon pose 2x45s per side",
    ],
    cooldownYoga: {
      title: "Evening Holds & Stretches",
      items: [
        "Deep squat - hold",
        "Floor fold - Sat on floor, grab toes",
        "Front split - left/right forwards + backwards",
        "Pigeon - left/right",
        "Bounce butterfly - Hip stretch",
        "Seated hamstring PNF",
        "Side split stretch - Head in-between legs",
        "Floor twist - Hold, each side",
        "Back bend - wheel hold",
        "Down dog - Hold",
        "Down dog calf - Pump",
        "Cossack hold - stretching out the adductors",
        "Crow pose",
        "Side crow pose",
      ],
    },
  },
};

const ancaConfig: Config = {
  startDate: "2025-10-20",
  meta: {
    title: "Anca's Plan",
    weekStart: "2025-10-20",
    roundingStep: 2.5,
    units: "kg",
    showPercentsByDefault: false,
  },
  goals: [
    "Unlock stronger, more athletic glutes",
    "Build lower-body strength with hip thrust and squat focus",
    "Maintain crisp upper-body pressing and pulling mechanics",
    "Support physique changes with relaxed conditioning",
  ],
  schedule: [
    { day: "Mon", type: "Upper-Strength" },
    { day: "Tue", type: "Lower-Strength" },
    { day: "Wed", type: "Rest" },
    { day: "Thu", type: "Upper-Volume" },
    { day: "Fri", type: "Lower-Volume" },
    { day: "Sat", type: "Rest" },
    { day: "Sun", type: "Rest" },
  ],
  lifts: {
    bench: { oneRm: 65, isLower: false },
    row: { oneRm: 70, isLower: false },
    ohp: { oneRm: 40, isLower: false },
    deadlift: { oneRm: 125, isLower: true },
    squat: { oneRm: 110, isLower: true },
    hipThrust: { oneRm: 160, isLower: true },
    latPulldown: { oneRm: 80, isLower: false },
    chestSupportedRow: { oneRm: 75, isLower: false },
    rdl: { oneRm: 120, isLower: true },
    legPress: { oneRm: 220, isLower: true },
    calfRaise: { oneRm: 120, isLower: false },
  },
  progression: { weeks: 10, addUpper: 1.5, addLower: 3 },
  variants: {
    "Upper-Strength": {
      major: [
        { lift: "bench", sets: 4, reps: 5, percent: 0.8 },
        { lift: "row", sets: 4, reps: 6, percent: 0.78 },
        { lift: "ohp", sets: 3, reps: 5, percent: 0.72 },
      ],
      micro: [
        {
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
          title: "Press Accessories",
          items: [
            { name: "Incline DB Press", sets: 3, reps: 10, load: "moderate" },
            { name: "Dumbbell OHP", sets: 3, reps: 10, load: "moderate" },
          ],
        },
        {
          title: "Shoulder Polish",
          items: [
            { name: "Lateral Raises", sets: 3, reps: 15, load: "light" },
            { name: "Rear Delt Fly", sets: 3, reps: 15, load: "light" },
          ],
        },
        {
          title: "Arm Finisher",
          items: [
            { name: "Cable Pushdown", sets: 3, reps: 12, load: "moderate" },
            { name: "Cable Curl", sets: 3, reps: 12, load: "moderate" },
          ],
        },
      ],
      cardio: {
        type: "Incline walk",
        durationMin: 12,
        intensity: "easy",
      },
    },
    "Lower-Strength": {
      major: [
        { lift: "squat", sets: 4, reps: 5, percent: 0.78 },
        { lift: "deadlift", sets: 3, reps: 5, percent: 0.76 },
        { lift: "hipThrust", sets: 3, reps: 6, percent: 0.75 },
      ],
      micro: [
        {
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
      ],
      cardio: {
        type: "Bike intervals",
        durationMin: 10,
        intensity: "moderate",
      },
    },
    "Upper-Volume": {
      major: [
        { lift: "bench", sets: 4, reps: 10, percent: 0.68 },
        { lift: "row", sets: 4, reps: 10, percent: 0.7 },
        { lift: "latPulldown", sets: 4, reps: 12, percent: 0.65 },
      ],
      micro: [
        {
          title: "Chest & Shoulders",
          items: [
            { name: "DB Bench Press", sets: 3, reps: 12, load: "moderate" },
            { name: "Arnold Press", sets: 3, reps: 12, load: "moderate" },
            { name: "Cable Fly", sets: 3, reps: 15, load: "light" },
          ],
        },
        {
          title: "Arms",
          items: [
            { name: "Skull Crushers", sets: 3, reps: 12, load: "moderate" },
            { name: "Hammer Curl", sets: 3, reps: 12, load: "moderate" },
          ],
        },
        {
          title: "Core",
          items: [
            { name: "Russian Twist", sets: 3, reps: 20, load: "light" },
            { name: "Dead Bug", sets: 3, reps: 16, load: "light" },
          ],
        },
      ],
      cardio: {
        type: "Zone 2 bike",
        durationMin: 15,
        intensity: "easy",
      },
    },
    "Lower-Volume": {
      major: [
        { lift: "hipThrust", sets: 4, reps: 10, percent: 0.7 },
        { lift: "squat", sets: 3, reps: 8, percent: 0.7 },
        { lift: "deadlift", sets: 3, reps: 8, percent: 0.68 },
      ],
      micro: [
        {
          title: "Glute Isolation",
          items: [
            { name: "Cable Kickback", sets: 3, reps: 15, load: "light" },
            { name: "45° Back Extension", sets: 3, reps: 15, load: "moderate" },
          ],
        },
        {
          title: "Leg Accessories",
          items: [
            { name: "Walking Lunge", sets: 3, reps: 20, load: "moderate" },
            { name: "Leg Curl", sets: 3, reps: 12, load: "moderate" },
          ],
        },
        {
          title: "Calves & Core",
          items: [
            { name: "Seated Calf Raise", sets: 4, reps: 15, load: "moderate" },
            { name: "Plank", sets: 3, reps: 45, load: "moderate" },
          ],
        },
      ],
      cardio: {
        type: "Incline walk",
        durationMin: 12,
        intensity: "easy",
      },
    },
  },
  warmup: {
    general: [
      "Bike 5 min LISS",
      "Dynamic warm-up: band pull-aparts, cat-cow, hip circles",
      "Glute activation: clamshells, glute bridges, monster walks",
    ],
    rampPercents: [0.3, 0.5, 0.65, 0.75],
  },
  stretch: {
    durationMin: 12,
    drills: [
      "90/90 hip stretch 2x45s each side",
      "Thoracic rotation with reach x12 each side",
      "Couch stretch 2x45s each side",
      "Band shoulder opener x15",
    ],
  },
};

export const WORKOUT_PROFILES: WorkoutsProfiles = {
  chris: chrisConfig,
  anca: ancaConfig,
};

export const DEFAULT_WORKOUT_PROFILE_ID = "chris" as const;

export const LIFT_WARMUPS: Record<string, string[]> = {
  squat: ["Deep squat hold with plate 60s", "Banded ankle dorsiflexion 2×30s"],
  bench: [
    "Band pull-aparts 2×20",
    "Light triceps push-down 2×15",
    "Chest fly activation 2×15",
  ],
  ohp: [
    "Shoulder controlled rotations 2×5 each direction",
    "Banded elbow extensions 2×15",
    "Scapular wall slides 2×10",
  ],
  deadlift: ["Hip hinge with PVC 2×10", "Glute bridge with pause 2×12"],
  hipThrust: ["Glute bridge 2×12", "Single-leg hip thrust 2×10/leg"],
};
