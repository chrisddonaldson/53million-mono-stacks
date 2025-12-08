// Simulate the FULL_WORKOUT_ARRAY structure
const FULL_WORKOUT_ARRAY = [
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
    title: "Biceps Pump",
    items: [
      { name: "Barbell Bicep Curl", sets: 4, reps: 10, load: "hard" },
      { name: "Dumbbell Bicep Curl", sets: 3, reps: 12, load: "moderate" },
    ],
  },
];

// Test the query
const variantId = "Pull-Volume";
const sections = FULL_WORKOUT_ARRAY.filter(section => section.workout === variantId);
console.log("Sections found:", sections.length);
console.log("Sections:", JSON.stringify(sections, null, 2));

// Build variant
const major = [];
const micro = [];

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

console.log("\nBuilt variant:");
console.log("Major:", major);
console.log("Micro:", micro);

// Test finding microworkout
const microworkoutTitle = "Biceps Pump";
const found = micro.find(m => m.title === microworkoutTitle);
console.log("\nFound microworkout:", found);
