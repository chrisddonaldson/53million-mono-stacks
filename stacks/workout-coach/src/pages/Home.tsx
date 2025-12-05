import { createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { workoutStore, workoutActions } from "../stores/workoutStore";
import QuickStartModal from "../components/modals/QuickStartModal";

export default function Home() {
  const navigate = useNavigate();
  const [quickStartOpen, setQuickStartOpen] = createSignal(false);

  const handleStartWorkout = () => {
    navigate("/library");
  };

  const handleQuickStart = () => {
    setQuickStartOpen(true);
  };

  const handleRepeatLast = () => {
    if (workoutStore.lastCompleted) {
      navigate(`/session/${workoutStore.lastCompleted.variantId}`);
    }
  };

  return (
    <>
      <QuickStartModal open={quickStartOpen()} onOpenChange={setQuickStartOpen} />
      
      <div class="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
        <div class="w-full max-w-2xl space-y-6">
        <div class="text-center space-y-2">
          <h1 class="text-4xl font-bold tracking-tight">Workout Coach</h1>
          <p class="text-muted-foreground">
            AI-powered guided workouts with immersive visuals
          </p>
        </div>

        <div class="space-y-4">
          <Button
            size="lg"
            class="w-full text-xl h-16"
            onClick={handleStartWorkout}
          >
            Start Workout
          </Button>

          <Button
            size="lg"
            variant="secondary"
            class="w-full text-xl h-16"
            onClick={handleQuickStart}
          >
            Quick Start
          </Button>

          <Show when={workoutStore.lastCompleted}>
            <Button
              size="lg"
              variant="outline"
              class="w-full"
              onClick={handleRepeatLast}
            >
              Repeat Last Workout
            </Button>
          </Show>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-4">
          <Button
            variant="ghost"
            class="h-20 flex-col gap-2"
            onClick={() => navigate("/library")}
          >
            <div class="text-2xl">📚</div>
            <div>Library</div>
          </Button>

          <Button
            variant="ghost"
            class="h-20 flex-col gap-2"
            onClick={() => navigate("/stats")}
          >
            <div class="text-2xl">📊</div>
            <div>Stats</div>
          </Button>
        </div>

        <Show when={workoutStore.lastCompleted}>
          <Card>
            <CardHeader>
              <CardTitle class="text-lg">Last Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-2">
                <div class="font-medium">
                  {workoutStore.lastCompleted!.variantId}
                </div>
                <div class="text-sm text-muted-foreground">
                  {new Date(workoutStore.lastCompleted!.timestamp).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </Show>

        <div class="text-center text-sm text-muted-foreground">
          Profile: {workoutActions.getCurrentProfile().meta.title}
        </div>
      </div>
    </div>
    </>
  );
}
