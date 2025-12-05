import { Show } from "solid-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { formatTime } from "../../lib/utils";

interface PauseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResume: () => void;
  onSkip: () => void;
  onExit: () => void;
  elapsedTime: number;
  remainingTime: number;
  currentExercise?: string;
}

export default function PauseModal(props: PauseModalProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workout Paused</DialogTitle>
          <DialogDescription>
            Take your time and resume when ready
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <Card class="bg-secondary/50">
            <CardContent class="pt-4">
              <div class="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div class="text-2xl font-bold">{formatTime(props.elapsedTime)}</div>
                  <div class="text-xs text-muted-foreground">Elapsed</div>
                </div>
                <div>
                  <div class="text-2xl font-bold">{formatTime(props.remainingTime)}</div>
                  <div class="text-xs text-muted-foreground">Remaining</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Show when={props.currentExercise}>
            <div class="text-center text-sm text-muted-foreground">
              Current: {props.currentExercise}
            </div>
          </Show>

          <div class="space-y-2">
            <Button
              class="w-full"
              size="lg"
              onClick={() => {
                props.onOpenChange(false);
                props.onResume();
              }}
            >
              ▶ Resume Workout
            </Button>

            <div class="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  props.onOpenChange(false);
                  props.onSkip();
                }}
              >
                Skip Exercise
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm("Are you sure you want to exit? Your progress will be saved.")) {
                    props.onExit();
                  }
                }}
              >
                Exit Workout
              </Button>
            </div>
          </div>

          <div class="text-center text-xs text-muted-foreground pt-2">
            Your timer is paused. No time is being counted.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
