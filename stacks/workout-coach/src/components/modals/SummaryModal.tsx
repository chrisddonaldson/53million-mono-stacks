import { Show } from "solid-js";
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
import { formatTime } from "../../lib/utils";
import type { SessionStats } from "../../types/session";

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: SessionStats | null;
  variantName: string;
}

export default function SummaryModal(props: SummaryModalProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    props.onOpenChange(false);
    navigate("/");
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workout Complete! 🎉</DialogTitle>
          <DialogDescription>
            Great work on completing {props.variantName}
          </DialogDescription>
        </DialogHeader>

        <Show when={props.stats}>
          {(stats) => (
            <div class="space-y-4">
              <Card class="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent class="pt-6">
                  <div class="text-center space-y-2">
                    <div class="text-4xl font-bold">
                      {formatTime(stats().totalDuration)}
                    </div>
                    <div class="text-sm text-muted-foreground">Total Time</div>
                  </div>
                </CardContent>
              </Card>

              <div class="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent class="pt-4">
                    <div class="text-center">
                      <div class="text-2xl font-bold">{stats().exercisesCompleted}</div>
                      <div class="text-xs text-muted-foreground">Exercises</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent class="pt-4">
                    <div class="text-center">
                      <div class="text-2xl font-bold">{stats().totalSets}</div>
                      <div class="text-xs text-muted-foreground">Total Sets</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent class="pt-4">
                    <div class="text-center">
                      <div class="text-2xl font-bold">{stats().totalReps}</div>
                      <div class="text-xs text-muted-foreground">Total Reps</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent class="pt-4">
                    <div class="text-center">
                      <div class="text-2xl font-bold">{stats().estimatedCalories}</div>
                      <div class="text-xs text-muted-foreground">Calories</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card class="bg-secondary/50">
                <CardContent class="pt-4">
                  <div class="text-center space-y-1">
                    <div class="text-lg font-bold text-primary">+{stats().xpEarned} XP</div>
                    <div class="text-xs text-muted-foreground">Experience Earned</div>
                  </div>
                </CardContent>
              </Card>

              <div class="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleClose} class="flex-1">
                  Done
                </Button>
                <Button onClick={() => navigate("/library")} class="flex-1">
                  Start Another
                </Button>
              </div>
            </div>
          )}
        </Show>
      </DialogContent>
    </Dialog>
  );
}
