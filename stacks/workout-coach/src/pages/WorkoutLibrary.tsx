import { For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { workoutActions } from "../stores/workoutStore";
import { WorkflowEngine } from "../engines/workflow/WorkflowEngine";
import { formatDuration } from "../lib/utils";

export default function WorkoutLibrary() {
  const navigate = useNavigate();
  const variants = workoutActions.getAllVariants();

  const handleSelectWorkout = (variantId: string) => {
    navigate(`/session/${variantId}`);
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
          <For each={variants}>
            {({ id, variant }) => {
              const summary = WorkflowEngine.getWorkoutSummary(variant);
              const isFavorite = workoutActions.isFavorite(id);

              return (
                <Card class="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div class="flex items-start justify-between">
                      <CardTitle class="text-xl">{id}</CardTitle>
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
                        <div class="font-medium">{summary.totalExercises}</div>
                      </div>
                      <div>
                        <div class="text-muted-foreground">Total Sets</div>
                        <div class="font-medium">{summary.totalSets}</div>
                      </div>
                      <div class="col-span-2">
                        <div class="text-muted-foreground">Est. Duration</div>
                        <div class="font-medium">
                          {formatDuration(summary.estimatedDuration)}
                        </div>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <div class="text-sm font-medium">Major Lifts:</div>
                      <div class="flex flex-wrap gap-2">
                        <For each={variant.major}>
                          {(lift) => (
                            <span class="text-xs bg-primary/10 px-2 py-1 rounded">
                              {lift.lift}
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
