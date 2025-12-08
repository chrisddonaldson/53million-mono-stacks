// Simulate the workflow
const workoutId = "Pull-Volume/Back";
const parts = workoutId.split("/");
console.log("Parts:", parts);
console.log("Length:", parts.length);

if (parts.length === 2) {
  const [variantId, microworkoutTitle] = parts;
  console.log("Variant ID:", variantId);
  console.log("Microworkout Title:", microworkoutTitle);
  console.log("Should call WorkflowEngine.generateMicroworkoutTimeline()");
}
