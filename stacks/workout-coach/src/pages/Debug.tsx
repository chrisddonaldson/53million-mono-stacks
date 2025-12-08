import { workoutActions } from "../stores/workoutStore";
import { FULL_WORKOUT_ARRAY } from "../data/workouts/full-workout-array";

export default function Debug() {
  const variant = workoutActions.getWorkoutVariant("Pull-Volume");
  const allMicros = workoutActions.getAllMicroworkouts();
  const bicepsPump = allMicros.find(m => m.id === "Pull-Volume/Biceps Pump");

  return (
    <div class="p-8 bg-white text-black">
      <h1 class="text-2xl mb-4">Debug Page</h1>
      
      <div class="mb-8">
        <h2 class="text-xl mb-2">FULL_WORKOUT_ARRAY</h2>
        <div>Total sections: {FULL_WORKOUT_ARRAY.length}</div>
        <div>Pull-Volume sections: {FULL_WORKOUT_ARRAY.filter(s => s.workout === "Pull-Volume").length}</div>
      </div>

      <div class="mb-8">
        <h2 class="text-xl mb-2">Pull-Volume Variant</h2>
        <pre class="bg-gray-100 p-4 overflow-auto">{JSON.stringify(variant, null, 2)}</pre>
      </div>

      <div class="mb-8">
        <h2 class="text-xl mb-2">All Microworkouts</h2>
        <div>Total: {allMicros.length}</div>
        <ul>
          {allMicros.map(m => (
            <li>{m.id}</li>
          ))}
        </ul>
      </div>

      <div class="mb-8">
        <h2 class="text-xl mb-2">Biceps Pump (Pull-Volume)</h2>
        <pre class="bg-gray-100 p-4 overflow-auto">{JSON.stringify(bicepsPump, null, 2)}</pre>
      </div>
    </div>
  );
}
