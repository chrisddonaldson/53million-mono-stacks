import { For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { workoutActions } from "../stores/workoutStore";

export default function WorkoutLibrary() {
  const navigate = useNavigate();
  const microworkouts = workoutActions.getAllMicroworkouts();

  const handleSelectWorkout = (microworkoutId: string) => {
    navigate(`/session/${microworkoutId}`);
  };

  return (
    <div class="min-h-screen bg-background p-4">
      <div class="absolute top-4 left-4 text-xs text-muted-foreground">
        System Menu / Workout Library
      </div>
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold">Workout Library</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back
          </Button>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <For each={microworkouts}>
            {({ id, microworkout, parentVariant }) => {
              const isFavorite = workoutActions.isFavorite(id);
              const totalSets = microworkout.items.reduce((sum, item) => sum + item.sets, 0);
              const totalExercises = microworkout.items.length;

              return (
                <Card class="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div class="flex items-start justify-between">
                      <div>
                        <CardTitle class="text-xl">{microworkout.title}</CardTitle>
                        <div class="text-xs text-muted-foreground mt-1">{parentVariant}</div>
                      </div>
                      <button
                        class="text-2xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          workoutActions.toggleFavorite(id);
                        }}
                      >
                        {isFavorite ? "⭐" : "☆"}
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent class="space-y-4">
                    <div class="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div class="text-muted-foreground">Exercises</div>
                        <div class="font-medium">{totalExercises}</div>
                      </div>
                      <div>
                        <div class="text-muted-foreground">Total Sets</div>
                        <div class="font-medium">{totalSets}</div>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <div class="text-sm font-medium">Exercises:</div>
                      <div class="flex flex-wrap gap-2">
                        <For each={microworkout.items}>
                          {(exercise) => (
                            <span class="text-xs bg-primary/10 px-2 py-1 rounded">
                              {exercise.name}
                            </span>
                          )}
                        </For>
                      </div>
                    </div>

                    <Button
                      class="w-full"
                      onClick={() => handleSelectWorkout(id)}
                    >
                      Start Guided Coaching
                    </Button>
                  </CardContent>
                </Card>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}
