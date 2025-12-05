import { useNavigate } from "@solidjs/router";
import { Show } from "solid-js";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { workoutStore } from "../stores/workoutStore";

export default function Stats() {
  const navigate = useNavigate();

  return (
    <div class="min-h-screen bg-background p-4">
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold">Workout Stats</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back
          </Button>
        </div>

        <Show 
          when={workoutStore.lastCompleted}
          fallback={
            <Card>
              <CardContent class="py-12">
                <div class="text-center text-muted-foreground">
                  <div class="text-4xl mb-4">📊</div>
                  <div>No workouts completed yet</div>
                  <div class="text-sm mt-2">Start your first workout to see stats here!</div>
                </div>
              </CardContent>
            </Card>
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>Last Completed Workout</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-sm text-muted-foreground">Workout</div>
                  <div class="font-medium">{workoutStore.lastCompleted!.variantId}</div>
                </div>
                <div>
                  <div class="text-sm text-muted-foreground">Profile</div>
                  <div class="font-medium">{workoutStore.lastCompleted!.profileId}</div>
                </div>
                <div class="col-span-2">
                  <div class="text-sm text-muted-foreground">Date</div>
                  <div class="font-medium">
                    {new Date(workoutStore.lastCompleted!.timestamp).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>

              <Button 
                class="w-full" 
                onClick={() => navigate(`/session/${workoutStore.lastCompleted!.variantId}`)}
              >
                Repeat This Workout
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workout History</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="text-sm text-muted-foreground text-center py-4">
                Full workout history coming soon...
              </div>
            </CardContent>
          </Card>
        </Show>
      </div>
    </div>
  );
}
