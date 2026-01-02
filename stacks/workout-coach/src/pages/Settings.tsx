
import { useNavigate } from "@solidjs/router";
import { settingsStore, settingsActions } from "../stores/settingsStore";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";

export default function Settings() {
  const navigate = useNavigate();

  const handleProviderChange = (provider: "browser" | "stack") => {
    settingsActions.setAudioSettings({ ttsProvider: provider });
  };

  const handleUrlChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    settingsActions.setAudioSettings({ ttsUrl: target.value });
  };

  return (
    <div class="min-h-screen bg-background p-6 flex flex-col items-center">
      <div class="w-full max-w-2xl space-y-8">
        <div class="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")}>
            ← Back
          </Button>
          <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
          <div class="w-10" /> {/* Spacer */}
        </div>

        <section class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audio & Voice Coach</CardTitle>
              <CardDescription>
                Configure how the AI workout coach speaks to you.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
              <div class="space-y-3">
                <label class="text-sm font-medium">Voice Provider</label>
                <div class="grid grid-cols-2 gap-3">
                  <Button
                    variant={settingsStore.audio.ttsProvider === "browser" ? "default" : "outline"}
                    onClick={() => handleProviderChange("browser")}
                    class="h-20 flex-col gap-1"
                  >
                    <span class="text-lg">🌐</span>
                    <span>Browser Native</span>
                  </Button>
                  <Button
                    variant={settingsStore.audio.ttsProvider === "stack" ? "default" : "outline"}
                    onClick={() => handleProviderChange("stack")}
                    class="h-20 flex-col gap-1"
                  >
                    <span class="text-lg">🤖</span>
                    <span>TTS Stack (AI)</span>
                  </Button>
                </div>
              </div>

              {settingsStore.audio.ttsProvider === "stack" && (
                <div class="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label class="text-sm font-medium">TTS Stack URL</label>
                  <input
                    type="text"
                    value={settingsStore.audio.ttsUrl}
                    onInput={handleUrlChange}
                    class="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="http://localhost:3000"
                  />
                  <p class="text-xs text-muted-foreground">
                    Ensure your TTS-Stack is running at this address.
                  </p>
                </div>
              )}

              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <label class="text-sm font-medium">Master Volume</label>
                  <span class="text-sm tabular-nums">
                    {Math.round(settingsStore.audio.masterVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settingsStore.audio.masterVolume}
                  onInput={(e) => settingsActions.setAudioSettings({ masterVolume: parseFloat(e.currentTarget.value) })}
                  class="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workout Preferences</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium">Default Rest Time</div>
                  <div class="text-sm text-muted-foreground">Seconds between sets</div>
                </div>
                <input
                  type="number"
                  value={settingsStore.workout.defaultRestTime}
                  onInput={(e) => settingsActions.setWorkoutSettings({ defaultRestTime: parseInt(e.currentTarget.value) })}
                  class="w-20 px-3 py-1 bg-secondary rounded border border-border text-center"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <div class="flex justify-center pt-4">
          <Button variant="ghost" class="text-muted-foreground" onClick={() => settingsActions.resetToDefaults()}>
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}
