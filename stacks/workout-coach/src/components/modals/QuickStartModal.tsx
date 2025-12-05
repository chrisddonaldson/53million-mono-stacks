import { createSignal, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { workoutActions } from "../../stores/workoutStore";
import { generateQuickStartWorkout, estimateQuickStartDuration } from "../../utils/workoutGenerator";
import { formatDuration } from "../../lib/utils";

interface QuickStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickStartModal(props: QuickStartModalProps) {
  const navigate = useNavigate();
  
  const [duration, setDuration] = createSignal(15); // minutes
  const [goal, setGoal] = createSignal<"strength" | "hypertrophy" | "conditioning">("hypertrophy");
  const [equipment, setEquipment] = createSignal<string[]>(["dumbbells"]);

  const EQUIPMENT_OPTIONS = [
    { id: "none", label: "Bodyweight Only" },
    { id: "dumbbells", label: "Dumbbells" },
    { id: "barbell", label: "Barbell" },
    { id: "kettlebell", label: "Kettlebell" },
    { id: "resistance-bands", label: "Resistance Bands" },
  ];

  const toggleEquipment = (eq: string) => {
    if (eq === "none") {
      setEquipment([]);
    } else {
      const current = equipment();
      if (current.includes(eq)) {
        setEquipment(current.filter(e => e !== eq));
      } else {
        setEquipment([...current.filter(e => e !== "none"), eq]);
      }
    }
  };

  const handleStartQuickWorkout = () => {
    const profile = workoutActions.getCurrentProfile();
    const workout = generateQuickStartWorkout({
      duration: duration(),
      goal: goal(),
      equipment: equipment(),
      profile,
    });

    // Store as a temporary workout variant
    const quickStartId = `quick-start-${Date.now()}`;
    
    // We need to add this to the workout store temporarily
    // For now, navigate with the workout in state
    navigate(`/session/${quickStartId}`, {
      state: { workout, isQuickStart: true },
    });
    
    props.onOpenChange(false);
  };

  const estimatedDuration = () => {
    const profile = workoutActions.getCurrentProfile();
    return estimateQuickStartDuration({
      duration: duration(),
      goal: goal(),
      equipment: equipment(),
      profile,
    });
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Start Workout</DialogTitle>
          <DialogDescription>
            Generate a custom workout based on your time and goals
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-6">
          {/* Duration Slider */}
          <div class="space-y-2">
            <label class="text-sm font-medium">
              Duration: {duration()} minutes
            </label>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={duration()}
              onInput={(e) => setDuration(parseInt(e.currentTarget.value))}
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>5 min</span>
              <span>15 min</span>
              <span>30 min</span>
            </div>
          </div>

          {/* Goal Selection */}
          <div class="space-y-2">
            <label class="text-sm font-medium">Goal</label>
            <div class="grid grid-cols-3 gap-2">
              <Button
                variant={goal() === "strength" ? "default" : "outline"}
                onClick={() => setGoal("strength")}
                class="w-full"
              >
                💪 Strength
              </Button>
              <Button
                variant={goal() === "hypertrophy" ? "default" : "outline"}
                onClick={() => setGoal("hypertrophy")}
                class="w-full"
              >
                🏋️ Hypertrophy
              </Button>
              <Button
                variant={goal() === "conditioning" ? "default" : "outline"}
                onClick={() => setGoal("conditioning")}
                class="w-full"
              >
                🏃 Conditioning
              </Button>
            </div>
          </div>

          {/* Equipment Checklist */}
          <div class="space-y-2">
            <label class="text-sm font-medium">Available Equipment</label>
            <div class="grid grid-cols-2 gap-2">
              <For each={EQUIPMENT_OPTIONS}>
                {(option) => (
                  <Button
                    variant={
                      (option.id === "none" && equipment().length === 0) ||
                      equipment().includes(option.id)
                        ? "default"
                        : "outline"
                    }
                    onClick={() => toggleEquipment(option.id)}
                    size="sm"
                    class="w-full justify-start"
                  >
                    {option.label}
                  </Button>
                )}
              </For>
            </div>
          </div>

          {/* Preview */}
          <Card class="bg-secondary/50">
            <CardContent class="pt-4">
              <div class="text-sm space-y-2">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Estimated Duration:</span>
                  <span class="font-medium">{formatDuration(estimatedDuration())}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Focus:</span>
                  <span class="font-medium capitalize">{goal()}</span>
                </div>
                <Show when={equipment().length > 0}>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Equipment:</span>
                    <span class="font-medium">{equipment().join(", ")}</span>
                  </div>
                </Show>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div class="flex gap-2">
            <Button
              variant="outline"
              onClick={() => props.onOpenChange(false)}
              class="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartQuickWorkout}
              class="flex-1"
            >
              Start Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
