import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { sessionStore, sessionActions, sessionGetters } from "../stores/sessionStore";
import { workoutActions } from "../stores/workoutStore";
import { settingsStore } from "../stores/settingsStore";
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

  const [elapsed, setElapsed] = createSignal(0);
  const [stepElapsed, setStepElapsed] = createSignal(0);
  const [renderingSupported, setRenderingSupported] = createSignal(true);
  const [hasStarted, setHasStarted] = createSignal(false);
  const [showSummary, setShowSummary] = createSignal(false);
  const [showPause, setShowPause] = createSignal(false);
  const [tempoProgress, setTempoProgress] = createSignal(0);
  const [currentRep, setCurrentRep] = createSignal(0);
  const [tempoPhase, setTempoPhase] = createSignal<string>("down");
  
  const getPhaseColor = () => {
    const step = sessionGetters.getCurrentStep();
    if (step?.type === "rest") return [0.2, 0.45, 1.0] as const;
    if (step?.type === "setup" || step?.type === "warmup" || step?.type === "transition" || step?.type === "summary") {
      return [0.5, 0.5, 0.5] as const;
    }
    const phase = tempoPhase();
    if (phase === "concentric" || phase === "up") return [1.0, 0.2, 0.2] as const;
    if (phase === "hold") return [1.0, 0.85, 0.2] as const;
    if (phase === "eccentric" || phase === "down") return [0.2, 0.85, 0.3] as const;
    if (phase === "rest") return [0.2, 0.45, 1.0] as const;
    return [0.5, 0.5, 0.5] as const;
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
            voiceEnabled: settingsStore.audio.voiceVolume > 0,
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
            voiceEnabled: settingsStore.audio.voiceVolume > 0,
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
            voiceEnabled: settingsStore.audio.voiceVolume > 0,
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
    
    if (sessionStore.currentSession) {
        sessionEngine = new SessionEngine(sessionStore.currentSession);
        
        // Bind SessionEngine Events
        sessionEngine.on("tick", (data: any) => {
            if (data.elapsed !== undefined) {
               // setElapsed(data.elapsed); // Wait, tick elapsed is Step elapsed or Global?
               // In SessionEngine I implemented onTick(elapsed, remaining) for timer.
               // It's step elapsed if using timer for step.
               setStepElapsed(data.elapsed);
            }
            // Update Global Elapsed from Session Store (which Engine updates? Engine should update store)
            // Or Engine should emit global elapsed.
            setElapsed(Math.floor((Date.now() - sessionStore.currentSession!.startTime - (sessionStore.currentSession!.pausedTime || 0)) / 1000));
            sessionActions.updateElapsedTime(elapsed());
            
            if (data.stepElapsed !== undefined) {
                setStepElapsed(data.stepElapsed);
            }
            
            if (data.tempo) {
               setTempoPhase(data.tempo.phase);
               setCurrentRep(data.tempo.rep);
               setTempoProgress(data.tempo.progress);
            }
        });

// in onStepChange
        sessionEngine.on("stepChange", (_step: any) => {
            // Force update signals if needed
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
            if (settingsStore.audio.voiceVolume > 0) {
               if (cue.type === "tempo") {
                   voiceCoach.announceTempo(cue.phase);
               } else if (cue.type === "rep") {
                   voiceCoach.announceRep(cue.rep, cue.totalReps);
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

    // Do NOT start session automatically. Wait for user interaction.
    // sessionEngine.start(); removed.
    
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
    // Resume/Unmute Audio Contexts
    if (voiceCoach) {
        await voiceCoach.resume(); // Ensure context is unlocked
    }
    
    if (sessionEngine) {
        sessionEngine.start();
    }
    setHasStarted(true);
  };

  onCleanup(() => {
    sessionEngine?.stop();
    webglEngine?.destroy();
    voiceCoach?.clearQueue();
  });

  const handlePause = () => sessionEngine?.pause();
  const handleResume = () => sessionEngine?.resume();
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
  const progress = () => sessionGetters.getProgress();

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

        {/* Start Overlay - Required for Audio Autoplay Policy */}
        <Show when={!isLoading() && !initError() && !hasStarted()}>
          <div
            class="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={handleStart}
          >
            <div class="text-center space-y-4 animate-pulse px-4">
              <div class="text-[clamp(2.25rem,10vw,3.75rem)]">▶</div>
              <div class="text-[clamp(1rem,4.5vw,1.5rem)] font-bold uppercase tracking-widest">Tap to Start</div>
              <div class="text-[clamp(0.7rem,3vw,1rem)] text-white/60">Enable audio and begin workout</div>
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
        {/* Page Label */}
        <div class="absolute top-2 left-2 text-[clamp(0.55rem,2vw,0.75rem)] text-white/60 pointer-events-none">
          System Menu / Guided Session
        </div>
        {/* Top Bar */}
        <div class="pt-2 px-2 sm:pt-4 sm:px-4 flex flex-wrap justify-between gap-x-4 gap-y-1 text-white text-[clamp(0.65rem,2.4vw,0.9rem)] pointer-events-auto">
          <div class="shrink-0">Elapsed: {formatTime(elapsed())}</div>
          <div class="shrink-0">
            <Show when={currentStep()?.duration && currentStep()!.duration > 0}>
              <div>Step: {formatTime(stepElapsed())} / {formatTime(currentStep()!.duration)}</div>
            </Show>
          </div>
          <div class="shrink-0">Remaining: {formatTime(sessionGetters.getRemainingTime())}</div>
        </div>

        {/* Center HUD */}
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto px-2">
          <div class="bg-black/60 backdrop-blur-sm rounded-lg p-[clamp(0.75rem,3.5vw,1.5rem)] w-[min(92vw,28rem)] max-h-[60vh] overflow-y-auto text-white">
            <Show when={currentStep()} fallback={
              <div class="text-center">
                <div class="text-[clamp(0.9rem,4vw,1.25rem)] text-red-500">No current step available</div>
                <div class="text-sm mt-2">Session: {sessionStore.currentSession ? "exists" : "null"}</div>
                <div class="text-sm">Timeline length: {sessionStore.currentSession?.timeline.length || 0}</div>
              </div>
            }>
              {(step) => (
                <div class="space-y-4">
                  <div class="text-center">
                    <div class="text-[clamp(0.65rem,2.5vw,0.9rem)] text-gray-400 uppercase">{step().type}</div>
                    <div class="text-[clamp(1.1rem,5vw,1.7rem)] font-bold mt-2">{step().exerciseName || "Ready"}</div>
                  </div>

                  <Show when={step().setNumber}>
                    <div class="text-center text-[clamp(0.65rem,2.4vw,0.9rem)]">
                      Set {step().setNumber} of {step().totalSets}
                    </div>
                  </Show>

                  <Show when={step().load}>
                    <div class="text-center text-[clamp(0.9rem,3.2vw,1.1rem)]">{step().load}</div>
                  </Show>

                  {/* Tempo display for tempo-based exercises */}
                  <Show when={(step().tempo || step().repStructure) && sessionEngine}>
                    <div class="text-center space-y-2">
                      <div class="text-[clamp(0.65rem,2.4vw,0.9rem)] text-gray-400">
                        Rep {currentRep()} of {step().exercise?.reps}
                      </div>
                      <div class="flex justify-center gap-[clamp(0.25rem,2.5vw,0.5rem)] text-[clamp(0.6rem,2.2vw,0.8rem)]">
                        <span class={tempoPhase() === "eccentric" || tempoPhase() === "down" ? "text-primary font-bold" : "text-gray-500"}>
                          DOWN
                        </span>
                        <span class={tempoPhase() === "hold" ? "text-primary font-bold" : "text-gray-500"}>
                          HOLD
                        </span>
                        <span class={tempoPhase() === "concentric" || tempoPhase() === "up" ? "text-primary font-bold" : "text-gray-500"}>
                          UP
                        </span>
                      </div>
                      <div class="w-full bg-gray-700 rounded-full h-2">
                        <div
                          class="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${tempoProgress() * 100}%` }}
                        />
                      </div>
                    </div>
                  </Show>

                  {/* Overall Progress bar */}
                  <div class="w-full bg-gray-700 rounded-full h-2">
                    <div
                      class="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${progress()}%` }}
                    />
                  </div>

                  <Show when={nextStep()}>
                    {(next) => (
                      <div class="text-center text-[clamp(0.65rem,2.4vw,0.9rem)] text-gray-400">
                        Next: {next().exerciseName || next().type}
                      </div>
                    )}
                  </Show>
                </div>
              )}
            </Show>
          </div>
        </div>

        {/* Bottom Toolbar */}
        <div class="absolute bottom-2 left-0 right-0 flex flex-col items-center justify-center pointer-events-auto px-2 sm:bottom-6">
          <div class="flex flex-row items-center gap-[clamp(0.5rem,3vw,1rem)] bg-black/60 backdrop-blur-sm rounded-full px-[clamp(0.6rem,4vw,1.5rem)] py-[clamp(0.4rem,3vw,0.9rem)]">
            <Button
              size="lg"
              variant="ghost"
              class="rounded-full w-[clamp(2.25rem,12vw,3rem)] h-[clamp(2.25rem,12vw,3rem)] p-0 text-white text-[clamp(0.9rem,4vw,1.2rem)]"
              onClick={handlePrevious}
            >
              ◀
            </Button>
            
            <Button
              size="lg"
              variant="ghost"
              class="rounded-full w-[clamp(2.75rem,16vw,4rem)] h-[clamp(2.75rem,16vw,4rem)] p-0 text-[clamp(1.1rem,6vw,1.7rem)] text-white"
              onClick={handlePause}
            >
              {sessionGetters.isActive() ? "⏸" : "▶"}
            </Button>
            
            <Button
              size="lg"
              variant="ghost"
              class="rounded-full w-[clamp(2.25rem,12vw,3rem)] h-[clamp(2.25rem,12vw,3rem)] p-0 text-white text-[clamp(0.9rem,4vw,1.2rem)]"
              onClick={handleNext}
            >
              ▶
            </Button>
          </div>

          {/* Step minimap */}
          <div class="flex justify-center gap-[clamp(0.2rem,2vw,0.35rem)] mt-[clamp(0.4rem,3vw,0.8rem)]">
            <Show when={sessionStore.currentSession}>
              {(session) => (
                <>
                  {session().timeline.map((_, index) => (
                    <div
                      class={`w-[clamp(0.25rem,2.2vw,0.5rem)] h-[clamp(0.25rem,2.2vw,0.5rem)] rounded-full ${
                        index === session().currentStepIndex
                          ? "bg-primary"
                          : index < session().currentStepIndex
                          ? "bg-white"
                          : "bg-gray-600"
                      }`}
                    />
                  ))}
                </>
              )}
            </Show>
          </div>
        </div>

        {/* Exit button */}
        <Button
          variant="ghost"
          class="absolute top-2 right-2 text-white pointer-events-auto text-[clamp(0.65rem,2.5vw,0.85rem)] px-2 py-1"
          onClick={handleExit}
        >
          Exit
        </Button>
      </div>
    </div>
    </>
  );
}
