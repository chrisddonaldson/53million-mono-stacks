import { createMemo, createSignal, onMount, onCleanup, Show } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { sessionStore, sessionActions, sessionGetters } from "../stores/sessionStore";
import { workoutActions } from "../stores/workoutStore";
import { settingsActions, settingsStore } from "../stores/settingsStore";
import { WorkflowEngine } from "../engines/workflow/WorkflowEngine";
import { VoiceCoach } from "../engines/audio/VoiceCoach";
import { WebGLEngine } from "../engines/webgl/WebGLEngine";
import { Button } from "../components/ui/Button";
import { formatTime } from "../lib/utils";
import SummaryModal from "../components/modals/SummaryModal";
import PauseModal from "../components/modals/PauseModal";

// Import shader code
import vertexShader from "../shaders/intensity.vert.glsl?raw";
import fragmentShader from "../shaders/intensity.frag.glsl?raw";

import wristWorkout from "../data/workouts/wrist-workout.yaml";
import { YamlStepGenerator } from "../engines/workflow/YamlStepGenerator";
import type { YamlWorkout } from "../types/yaml-workout";
import { SessionEngine } from "../engines/SessionEngine";

export default function GuidedSession() {
  console.log("=== GuidedSession COMPONENT RENDER ===");
  const params = useParams();
  const navigate = useNavigate();
  
  const [initError, setInitError] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  
  let webglCanvasRef: HTMLCanvasElement | undefined;
  
  // Early return test to ensure component renders
  if (!params.id) {
    return (
      <div class="h-screen w-screen flex items-center justify-center bg-black text-white">
        <div class="max-w-2xl p-8 space-y-4">
          <h1 class="text-2xl font-bold text-red-500">No Workout ID</h1>
          <p class="text-lg">params.id is missing or empty</p>
          <Button onClick={() => navigate("/library")}>Go to Library</Button>
        </div>
      </div>
    );
  }

  let webglEngine: WebGLEngine | null = null;
  
  // New Engine
  let sessionEngine: SessionEngine | null = null;

  // Global Timer for updating Elapsed Time in UI if needed separately?
  // Or handled by SessionEngine events.
  // We'll keep a simple interval to update elapsed if SessionEngine doesn't emit tick often enough?
  // SessionEngine emits tick, we can use that.

  let voiceCoach: VoiceCoach;
  let repAnnounceTimeout: number | null = null;

  const [elapsed, setElapsed] = createSignal(0);
  const [stepElapsed, setStepElapsed] = createSignal(0);
  const [renderingSupported, setRenderingSupported] = createSignal(true);
  const [hasStarted, setHasStarted] = createSignal(false);
  const [showSummary, setShowSummary] = createSignal(false);
  const [showPause, setShowPause] = createSignal(false);
  const [tempoProgress, setTempoProgress] = createSignal(0);
  const [currentRep, setCurrentRep] = createSignal(0);
  const [tempoPhase, setTempoPhase] = createSignal<string>("down");
  const [holdAnchor, setHoldAnchor] = createSignal(1);
  const [showVolume, setShowVolume] = createSignal(false);

  const exerciseTree = createMemo(() => {
    const session = sessionStore.currentSession;
    if (!session) {
      return {
        exercises: [] as Array<{ name: string; sets: Array<{ number: number; stepIndex: number }> }>,
        currentExerciseIndex: -1,
        currentSetNumber: null as number | null,
        currentStepIndex: -1,
      };
    }

    const exercises: Array<{ name: string; sets: Array<{ number: number; stepIndex: number }> }> = [];
    const exerciseMap = new Map<string, { index: number; setIndex: Map<number, number> }>();

    session.timeline.forEach((step, index) => {
      const name = step.exerciseName || step.exercise?.name;
      if (!name) return;

      let entry = exerciseMap.get(name);
      if (!entry) {
        entry = { index: exercises.length, setIndex: new Map() };
        exerciseMap.set(name, entry);
        exercises.push({ name, sets: [] });
      }

      if (step.setNumber && !entry.setIndex.has(step.setNumber)) {
        entry.setIndex.set(step.setNumber, index);
        exercises[entry.index].sets.push({ number: step.setNumber, stepIndex: index });
      }
    });

    exercises.forEach((exercise) => {
      exercise.sets.sort((a, b) => a.number - b.number);
    });

    const extractContext = (step: typeof session.timeline[number] | undefined) => {
      if (!step) return null;
      const name = step.exerciseName || step.exercise?.name;
      if (!name) return null;
      return {
        name,
        setNumber: step.setNumber ?? null,
      };
    };

    const currentIndex = session.currentStepIndex;
    let context = extractContext(session.timeline[currentIndex]);

    if (!context) {
      for (let i = currentIndex + 1; i < session.timeline.length; i += 1) {
        context = extractContext(session.timeline[i]);
        if (context) break;
      }
    }

    if (!context) {
      for (let i = currentIndex - 1; i >= 0; i -= 1) {
        context = extractContext(session.timeline[i]);
        if (context) break;
      }
    }

    const currentExerciseIndex = context
      ? exercises.findIndex((exercise) => exercise.name === context!.name)
      : -1;

    return {
      exercises,
      currentExerciseIndex,
      currentSetNumber: context?.setNumber ?? null,
      currentStepIndex: currentIndex,
    };
  });
  
  const getPhaseColor = () => {
    const step = sessionGetters.getCurrentStep();
    if (step?.type === "rest") return [0.2, 0.45, 1.0] as [number, number, number];
    if (step?.type === "setup" || step?.type === "warmup" || step?.type === "transition" || step?.type === "summary") {
      return [0.5, 0.5, 0.5] as [number, number, number];
    }
    const phase = tempoPhase();
    if (phase === "concentric" || phase === "up") return [1.0, 0.2, 0.2] as [number, number, number];
    if (phase === "hold") return [1.0, 0.85, 0.2] as [number, number, number];
    if (phase === "eccentric" || phase === "down") return [0.2, 0.85, 0.3] as [number, number, number];
    if (phase === "rest") return [0.2, 0.45, 1.0] as [number, number, number];
    return [0.5, 0.5, 0.5] as [number, number, number];
  };

  const getPhaseType = () => {
    const step = sessionGetters.getCurrentStep();
    if (step?.type === "rest") return 3;
    if (step?.type === "setup" || step?.type === "warmup" || step?.type === "transition" || step?.type === "summary") {
      return 4;
    }
    const phase = tempoPhase();
    if (phase === "concentric" || phase === "up") return 0;
    if (phase === "hold") return 1;
    if (phase === "eccentric" || phase === "down") return 2;
    return 4;
  };

  const getPhaseProgress = () => {
    const step = sessionGetters.getCurrentStep();
    if (step?.repStructure && step.repStructure.length > 0) return tempoProgress();
    if (step?.duration && step.duration > 0) {
      return Math.min(1, stepElapsed() / step.duration);
    }
    return 0;
  };

  onMount(async () => {
    try {
      console.log("=== GuidedSession onMount START ===");
      const workoutId = params.id || "";
      
      console.log("CHECKPOINT 1: Getting profile...");
      const profile = workoutActions.getCurrentProfile();
      
      // Check if this is a microworkout ID
      const parts = workoutId.split("/");
      let timeline: any[];

      if (parts.length === 2) {
        console.log("CHECKPOINT 3: Microworkout mode detected");
        const [variantId, microworkoutTitle] = parts;
        const variant = workoutActions.getWorkoutVariant(variantId);

        if (!variant) {
          throw new Error(`Workout variant not found: ${variantId}`);
        }

        const microworkout = variant.micro.find(m => m.title === microworkoutTitle);
        
        if (!microworkout) {
            throw new Error(`Microworkout "${microworkoutTitle}" not found.`);
        }

        timeline = WorkflowEngine.generateMicroworkoutTimeline(
          profile,
          variantId,
          microworkoutTitle,
          {
            globalRestTime: settingsStore.workout.defaultRestTime,
            voiceEnabled: (settingsStore.audio.masterVolume ?? 0.5) > 0,
            musicDucking: settingsStore.audio.musicDucking,
            motivationalLevel: "medium",
            progressionVariant: "standard",
          }
        );
      } else if (workoutId === "wrist_extension_training_system" || workoutId === "wrist-workout") {
         console.log("CHECKPOINT 6.5: New YAML workout mode detected");
         const yamlData = wristWorkout as unknown as YamlWorkout;
         
         const generator = new YamlStepGenerator(yamlData, {
            globalRestTime: settingsStore.workout.defaultRestTime,
            voiceEnabled: (settingsStore.audio.masterVolume ?? 0.5) > 0,
            musicDucking: settingsStore.audio.musicDucking,
            motivationalLevel: "medium",
            progressionVariant: "standard",
         });
         timeline = generator.generateTimeline();
      } else {
        console.log("CHECKPOINT 6: Full workout mode");
        const variant = workoutActions.getWorkoutVariant(workoutId);

        if (!variant) {
           throw new Error("Workout variant not found: " + workoutId);
        }

        timeline = WorkflowEngine.generateWorkoutTimeline(
          profile,
          workoutId,
          {
            globalRestTime: settingsStore.workout.defaultRestTime,
            voiceEnabled: (settingsStore.audio.masterVolume ?? 0.5) > 0,
            musicDucking: settingsStore.audio.musicDucking,
            motivationalLevel: "medium",
            progressionVariant: "standard",
          }
        );
      }

    // Create session
    console.log("CHECKPOINT 8: Creating session...");
    sessionActions.createSession(workoutId, profile.meta.title, timeline);
    
    // Initialize engines
    voiceCoach = new VoiceCoach();
    voiceCoach.setMasterVolume(settingsStore.audio.masterVolume ?? 0.5);
    
    if (sessionStore.currentSession) {
        sessionEngine = new SessionEngine(sessionStore.currentSession);
        
        // Bind SessionEngine Events
        sessionEngine.on("tick", (data: any) => {
            // Update step elapsed
            if (data.elapsed !== undefined) {
                setStepElapsed(data.elapsed);
            }
            
            // Update tempo progress for WebGL
            if (data.tempo) {
                setTempoProgress(data.tempo.progress);
                setCurrentRep(data.tempo.rep);
            }
            
            // Update global elapsed (SessionEngine handles this in store)
            setElapsed(Math.floor((Date.now() - sessionStore.currentSession!.startTime - (sessionStore.currentSession!.pausedTime || 0)) / 1000));
        });

        // Visual state updates from SessionEngine
        sessionEngine.on("visualState", (state: any) => {
            setTempoPhase(state.phase);
            setCurrentRep(state.rep);
            setTempoProgress(state.progress);
            setHoldAnchor(state.holdAnchor);
        });

        sessionEngine.on("stepChange", (_step: any) => {
            setStepElapsed(0);
        });

        sessionEngine.on("statusChange", (status: any) => {
             if (status === "paused") setShowPause(true);
             if (status === "active") setShowPause(false);
             if (status === "complete") {
                 workoutActions.setLastCompleted(params.id || "", workoutActions.getCurrentProfile().meta.title);
                 setShowSummary(true);
             }
        });

        sessionEngine.on("cue", (cue: any) => {
            console.log(`[GuidedSession] Received cue:`, cue, `volume=${settingsStore.audio.masterVolume}`);
            if ((settingsStore.audio.masterVolume ?? 0.5) > 0) {
                if (cue.type === "tempo") {
                    console.log(`[GuidedSession] Calling voiceCoach.announceTempo(${cue.phase}, ${cue.rep})`);
                    voiceCoach.announceTempo(cue.phase, cue.rep);
                } else if (cue.type === "rep") {
                    if (repAnnounceTimeout) {
                        clearTimeout(repAnnounceTimeout);
                        repAnnounceTimeout = null;
                    }
                    const delayMs = typeof cue.delayMs === "number" ? cue.delayMs : 0;
                    repAnnounceTimeout = window.setTimeout(() => {
                        voiceCoach.announceRep(cue.rep, cue.totalReps);
                        repAnnounceTimeout = null;
                    }, delayMs);
                } else {
                    voiceCoach.announce(cue);
                }
            }
        });
    }

    // Initialize WebGL
    console.log("CHECKPOINT 12: Initializing graphics...");
    if (webglCanvasRef) {
      webglEngine = new WebGLEngine();
      const webglSuccess = webglEngine.init(webglCanvasRef, vertexShader, fragmentShader);

      if (webglSuccess) {
        setRenderingSupported(true);
        webglEngine.startRenderLoop(() => ({
          time: performance.now() / 1000,
          intensity: sessionGetters.getCurrentStep()?.visualIntensity || 0.3,
          tempoPhase: getPhaseProgress(),
          phaseColor: getPhaseColor(),
          phaseType: getPhaseType(),
          holdAnchor: holdAnchor(),
          screenSize: [window.innerWidth, window.innerHeight],
        }));
      } else {
        console.error("WebGL init failed");
        setRenderingSupported(false);
      }
    } else {
      console.error("WebGL canvas ref missing");
      setRenderingSupported(false);
    }

    // Don't start automatically - wait for user interaction for TTS
    // handleStart() removed to comply with browser autoplay policies
    
    // Mark as loaded
    setIsLoading(false);
    console.log("=== GuidedSession onMount COMPLETE ===");
    } catch (error) {
      console.error("!!! Error in GuidedSession onMount:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setInitError(errorMessage);
      setIsLoading(false);
    } 
  });

  const handleStart = async () => {
    console.log("[GuidedSession] User clicked START - unlocking TTS");
    
    // CRITICAL: Unlock TTS with this user gesture
    if (voiceCoach) {
      await voiceCoach.unlock();
    }
    
    // Small delay to ensure audio context is fully unlocked
    setTimeout(() => {
      if (sessionEngine) {
        sessionEngine.start();
      }
      setHasStarted(true);
    }, 100);
  };

  onCleanup(() => {
    sessionEngine?.stop();
    webglEngine?.destroy();
    voiceCoach?.clearQueue();
    if (repAnnounceTimeout) {
      clearTimeout(repAnnounceTimeout);
      repAnnounceTimeout = null;
    }
  });

  const handlePause = () => sessionEngine?.pause();
  const handleResume = () => sessionEngine?.resume();
  const handleMasterVolumeChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const nextValue = Number.parseFloat(target.value);
    const clamped = Math.max(0, Math.min(1, Number.isFinite(nextValue) ? nextValue : 0));
    settingsActions.setAudioSettings({ masterVolume: clamped });
    voiceCoach?.setMasterVolume(clamped);
  };
  const handleToggleMute = () => {
    const current = settingsStore.audio.masterVolume ?? 0.5;
    const nextValue = current > 0 ? 0 : 0.5;
    settingsActions.setAudioSettings({ masterVolume: nextValue });
    voiceCoach?.setMasterVolume(nextValue);
  };
  const handleToggleVolumePanel = () => {
    setShowVolume(!showVolume());
  };
  const handleSkipFromPause = () => {
    setShowPause(false);
    sessionEngine?.resume();
    setTimeout(() => sessionEngine?.skipExercise(), 100);
  };
  const handleNext = () => sessionEngine?.next();
  const handlePrevious = () => sessionEngine?.previous();
  const handleExit = () => {
    if (confirm("Are you sure you want to exit this workout?")) {
      sessionActions.endSession();
      navigate("/");
    }
  };

  const currentStep = () => sessionGetters.getCurrentStep();
  const nextStep = () => sessionGetters.getNextStep();

  // REMOVED early returns for loading/error to allow canvas to mount

  return (
    <>
      <SummaryModal 
        open={showSummary()} 
        onOpenChange={setShowSummary}
        stats={sessionGetters.getSessionStats()}
        variantName={sessionStore.currentSession?.profile || params.id || "Workout"}
      />

      <PauseModal
        open={showPause()}
        onOpenChange={setShowPause}
        onResume={handleResume}
        onSkip={handleSkipFromPause}
        onExit={handleExit}
        elapsedTime={elapsed()}
        remainingTime={sessionGetters.getRemainingTime()}
        currentExercise={currentStep()?.exerciseName}
      />

      <div class="relative h-screen w-screen overflow-hidden bg-black">
        {/* Loading Overlay */}
        <Show when={isLoading()}>
          <div class="absolute inset-0 z-50 flex items-center justify-center bg-black text-white">
            <div class="text-2xl">Loading workout...</div>
          </div>
        </Show>

        {/* Start Button - Required for TTS autoplay policy */}
        <Show when={!isLoading() && !initError() && !hasStarted()}>
          <div
            class="absolute inset-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer"
            onClick={handleStart}
          >
            <div class="text-center space-y-6 animate-pulse px-4">
              <div class="text-[clamp(3rem,12vw,5rem)] font-bold text-primary">START</div>
            </div>
          </div>
        </Show>

        {/* Error Overlay */}
        <Show when={initError()}>
          <div class="absolute inset-0 z-50 flex items-center justify-center bg-black text-white">
            <div class="max-w-2xl p-8 space-y-4">
              <h1 class="text-2xl font-bold text-red-500">Failed to Load Workout</h1>
              <p class="text-lg">{initError()}</p>
              <Button onClick={() => navigate("/library")}>Go to Library</Button>
            </div>
          </div>
        </Show>

      {/* Rendering Canvas (WebGL) */}
      <Show when={renderingSupported()} fallback={
        <div class="flex items-center justify-center h-full text-white">
          <div class="text-center space-y-4">
            <div class="text-2xl">Graphics Not Supported</div>
            <div class="text-muted-foreground">
              Your browser doesn't support WebGL. Please update to a modern browser.
            </div>
            <Button onClick={() => navigate("/")}>Go Back</Button>
          </div>
        </div>
      }>
        <canvas
          id="webgl-canvas"
          ref={webglCanvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          class="absolute inset-0"
        />
      </Show>

      {/* HUD Overlay */}
      <div class="absolute inset-0 pointer-events-none">
        {/* Top Toolbar */}
        <div class="absolute top-[clamp(0.5rem,4vw,1.5rem)] left-2 right-2 pointer-events-auto sm:left-4 sm:right-4 pr-[env(safe-area-inset-right,0)] pl-[env(safe-area-inset-left,0)] pt-[env(safe-area-inset-top,0)]">
          <div class="flex flex-row items-center justify-between gap-x-2 bg-black/75 backdrop-blur-md rounded-[clamp(1rem,4vw,1.5rem)] px-3 py-2 text-white border border-white/5 shadow-2xl">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="shrink-0 text-primary font-bold tracking-tighter text-[clamp(0.7rem,3vw,0.9rem)]">
                53M
              </div>
              <div class="hidden sm:block w-px h-4 bg-white/20 shrink-0" />
              <div class="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-0.5 leading-tight overflow-hidden">
                <div class="shrink-0 text-[clamp(0.6rem,2.2vw,0.75rem)] tabular-nums truncate">
                  {formatTime(elapsed())}
                </div>
                <Show when={currentStep()?.duration && currentStep()!.duration > 0}>
                  <div class="hidden sm:block w-1 h-1 rounded-full bg-white/20 shrink-0" />
                  <div class="shrink-0 text-[clamp(0.6rem,2.2vw,0.75rem)] opacity-60 tabular-nums truncate">
                    Step: {formatTime(stepElapsed())}
                  </div>
                </Show>
              </div>
            </div>
            <div class="flex items-center gap-2 pointer-events-auto">
              {/* Pause/Play control */}
              <Button
                size="sm"
                variant="ghost"
                class="rounded-full w-8 h-8 p-0 text-white text-base hover:bg-white/10"
                onClick={handlePause}
              >
                {sessionGetters.isActive() ? "⏸" : "▶"}
              </Button>

              {/* Volume control */}
              <div class="relative flex items-center text-white">
                <Button
                  size="sm"
                  variant="ghost"
                  class={`rounded-full w-8 h-8 p-0 text-white text-sm transition-colors hover:bg-white/10 ${showVolume() ? 'text-primary' : ''}`}
                  onClick={handleToggleVolumePanel}
                >
                  {settingsStore.audio.masterVolume > 0 ? "🔊" : "🔇"}
                </Button>
                
                <Show when={showVolume()}>
                  <div 
                    class="absolute top-full right-0 mt-4 p-4 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-200 z-[9999]"
                  >
                    <div class="text-[clamp(0.6rem,2.5vw,0.85rem)] font-medium tabular-nums">
                      {Math.round((settingsStore.audio.masterVolume ?? 0.5) * 100)}%
                    </div>
                    
                    <div class="h-40 flex items-center py-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={settingsStore.audio.masterVolume ?? 0.5}
                        onInput={handleMasterVolumeChange}
                        class="accent-primary cursor-pointer"
                        style={{
                          "appearance": "slider-vertical" as any,
                          "width": "12px",
                          "height": "160px"
                        }}
                      />
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      class="text-[clamp(0.6rem,2vw,0.75rem)] uppercase tracking-wider text-white/60 hover:text-white"
                      onClick={handleToggleMute}
                    >
                      {settingsStore.audio.masterVolume > 0 ? "Mute" : "Unmute"}
                    </Button>
                  </div>
                </Show>
              </div>

              <div class="w-px h-4 bg-white/20 mx-1" />

              <Button
                variant="ghost"
                class="text-white text-[clamp(0.6rem,2.3vw,0.8rem)] px-2 py-1 hover:bg-white/10"
                onClick={handleExit}
              >
                Exit
              </Button>
            </div>
          </div>
        </div>

        {/* Center HUD removed to save vertical space and prevent overlap */}


        {/* Bottom Toolbar */}
        <div class="absolute bottom-[clamp(1.5rem,6vw,2.5rem)] left-0 right-0 flex flex-col items-center justify-center pointer-events-auto px-2 pb-[env(safe-area-inset-bottom,0)]">
          <div class="w-full max-w-[min(100%,48rem)] bg-black/75 backdrop-blur-md rounded-[clamp(1.2rem,6vw,2.5rem)] px-4 py-4 border border-white/5 shadow-2xl">
            <div class="flex flex-col gap-[clamp(0.4rem,2.5vw,0.8rem)] items-center">
              <Show when={currentStep()}>
                {(step) => (
                  <div class="flex flex-col items-center text-white w-full gap-1">
                    <div class="flex items-center gap-3 text-[clamp(0.55rem,2.2vw,0.75rem)] uppercase tracking-wide text-white/60">
                      <span>{step().type}</span>
                      <Show when={step().setNumber}>
                        <span class="w-1 h-1 rounded-full bg-white/20" />
                        <span>Set {step().setNumber}/{step().totalSets}</span>
                      </Show>
                      <Show when={step().load}>
                        <span class="w-1 h-1 rounded-full bg-white/20" />
                        <span>{step().load}</span>
                      </Show>
                    </div>
                    
                    <div class="flex items-center justify-center gap-[clamp(0.4rem,3vw,1.5rem)] w-full">
                      <div class="text-[clamp(0.95rem,4vw,1.3rem)] font-semibold truncate shrink min-w-0">
                        {step().exerciseName || "Ready"}
                      </div>
                      
                      <Show when={(step().tempo || step().repStructure) && sessionEngine}>
                        <div class="flex items-baseline gap-1 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10 shrink-0">
                          <span class="text-[clamp(1.1rem,4.5vw,1.5rem)] font-bold tabular-nums text-primary">
                            {currentRep()}
                          </span>
                          <Show when={step().totalReps}>
                            <span class="text-[clamp(0.8rem,3.5vw,1.1rem)] text-white/40 font-medium">
                              /{step().totalReps}
                            </span>
                          </Show>
                          <span class="text-[clamp(0.5rem,2.2vw,0.65rem)] text-white/40 uppercase tracking-widest font-bold ml-1">
                            REPS
                          </span>
                        </div>
                      </Show>
                    </div>

                    <Show when={nextStep()}>
                      <div class="text-[clamp(0.55rem,2.2vw,0.75rem)] text-white/40 font-medium">
                        NEXT: {nextStep()?.exerciseName || nextStep()?.type}
                      </div>
                    </Show>
                  </div>
                )}
              </Show>

              <div class="flex w-full items-center justify-center">
                {/* Exercise + set tree toolbar section */}
              </div>

              {/* Exercise + set tree */}
              <div class="w-full">
                <Show when={sessionStore.currentSession && exerciseTree().exercises.length > 0}>
                  <div class="flex items-center gap-[clamp(0.2rem,2vw,1rem)]">
                    <Button
                      variant="ghost"
                      class="shrink-0 rounded-full w-[clamp(1.8rem,10vw,2.6rem)] h-[clamp(1.8rem,10vw,2.6rem)] p-0 text-white/40 hover:text-white text-[clamp(0.8rem,4vw,1.2rem)]"
                      onClick={handlePrevious}
                    >
                      ◀
                    </Button>

                    <div 
                      class="flex-1 flex flex-wrap justify-center gap-x-[clamp(0.4rem,3vw,1.2rem)] gap-y-[clamp(0.6rem,4vw,1rem)] px-1 mx-auto"
                      style={{ "max-width": exerciseTree().exercises.length > 4 ? "min(100%, 36rem)" : "none" }}
                    >
                      {exerciseTree().exercises.map((exercise, exerciseIndex) => {
                        const isCurrentExercise = exerciseIndex === exerciseTree().currentExerciseIndex;
                        return (
                          <div class="flex flex-col items-center gap-[clamp(0.2rem,2vw,0.4rem)] min-w-[clamp(4rem,15vw,6rem)]">
                            <div class="flex flex-col items-center gap-[clamp(0.15rem,1.6vw,0.3rem)]">
                              <div
                                class={`flex items-center justify-center rounded-full border w-[clamp(1rem,6vw,1.6rem)] h-[clamp(1rem,6vw,1.6rem)] text-[clamp(0.5rem,2.6vw,0.8rem)] ${
                                  isCurrentExercise
                                    ? "bg-primary text-black border-primary"
                                    : "bg-white/10 text-white/70 border-white/30"
                                }`}
                              >
                                {exerciseIndex + 1}
                              </div>
                              <div
                                class={`text-[clamp(0.45rem,2.2vw,0.7rem)] max-w-[clamp(3.5rem,15vw,6rem)] truncate text-center ${
                                  isCurrentExercise ? "text-white" : "text-white/70"
                                }`}
                              >
                                {exercise.name}
                              </div>
                            </div>
                            <div class="w-px h-[clamp(0.35rem,2vw,0.6rem)] bg-white/20" />
                            <div class="flex flex-wrap justify-center items-center gap-[clamp(0.2rem,2vw,0.35rem)]">
                              {exercise.sets.map((set) => {
                                const isCurrentSet = isCurrentExercise && exerciseTree().currentSetNumber === set.number;
                                const isComplete = exerciseTree().currentStepIndex > set.stepIndex;
                                const setStateClass = isCurrentSet
                                  ? "bg-primary text-black border-primary"
                                  : isComplete
                                  ? "bg-white text-black border-white"
                                  : "bg-white/10 text-white/60 border-white/20";
                                return (
                                  <div
                                    class={`flex items-center justify-center rounded-full border w-[clamp(0.7rem,4.2vw,1.1rem)] h-[clamp(0.7rem,4.2vw,1.1rem)] text-[clamp(0.4rem,2vw,0.6rem)] ${setStateClass}`}
                                  >
                                    {set.number}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Button
                      variant="ghost"
                      class="shrink-0 rounded-full w-[clamp(1.8rem,10vw,2.6rem)] h-[clamp(1.8rem,10vw,2.6rem)] p-0 text-white/40 hover:text-white text-[clamp(0.8rem,4vw,1.2rem)]"
                      onClick={handleNext}
                    >
                      ▶
                    </Button>
                  </div>
                </Show>

              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
    </>
  );
}
