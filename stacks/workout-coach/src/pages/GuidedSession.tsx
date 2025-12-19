import { createSignal, onMount, onCleanup, Show, createEffect } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { sessionStore, sessionActions, sessionGetters } from "../stores/sessionStore";
import { workoutActions } from "../stores/workoutStore";
import { settingsStore } from "../stores/settingsStore";
import { WorkflowEngine } from "../engines/workflow/WorkflowEngine";
import { VoiceCoach } from "../engines/audio/VoiceCoach";
import { WebGPUEngine } from "../engines/webgpu/WebGPUEngine";
import { WebGLEngine } from "../engines/webgl/WebGLEngine";
import { Button } from "../components/ui/Button";
import { formatTime } from "../lib/utils";
import SummaryModal from "../components/modals/SummaryModal";
import PauseModal from "../components/modals/PauseModal";

// Import shader code
import intensityShader from "../shaders/intensity.wgsl?raw";
import vertexShader from "../shaders/intensity.vert.glsl?raw";
import fragmentShader from "../shaders/intensity.frag.glsl?raw";

import wristWorkout from "../data/workouts/wrist-workout.yaml";
import { YamlStepGenerator } from "../engines/workflow/YamlStepGenerator";
import TempoVisualizer from "../components/session/TempoVisualizer";
import type { YamlWorkout } from "../types/yaml-workout";
import { SessionEngine } from "../engines/SessionEngine";

export default function GuidedSession() {
  console.log("=== GuidedSession COMPONENT RENDER ===");
  const params = useParams();
  const navigate = useNavigate();
  
  const [initError, setInitError] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  
  let webgpuCanvasRef: HTMLCanvasElement | undefined;
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

  let webgpuEngine: WebGPUEngine | null = null;
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
  const [fallbackToWebGL, setFallbackToWebGL] = createSignal(false);
  const [hasStarted, setHasStarted] = createSignal(false);
  const [showSummary, setShowSummary] = createSignal(false);
  const [showPause, setShowPause] = createSignal(false);
  const [tempoProgress, setTempoProgress] = createSignal(0);
  const [currentRep, setCurrentRep] = createSignal(0);
  const [tempoPhase, setTempoPhase] = createSignal<string>("down");

  createEffect(() => {
    if (fallbackToWebGL()) {
      console.log("Fallback signal active, initializing WebGL...");
      
      // Ensure canvas is ready (ref updated)
      if (!webglCanvasRef) {
        console.error("Canvas ref missing in fallback effect");
        setRenderingSupported(false);
        return;
      }
      
      // Cleanup any existing engine just in case
      if (webglEngine) webglEngine.destroy();

      webglEngine = new WebGLEngine();
      const webglSuccess = webglEngine.init(webglCanvasRef, vertexShader, fragmentShader);
      
      if (webglSuccess) {
        console.log("WebGL init successful");
        setRenderingSupported(true);
        webglEngine.startRenderLoop(() => ({
          time: performance.now() / 1000,
          intensity: sessionGetters.getCurrentStep()?.visualIntensity || 0.3,
          tempoPhase: tempoProgress(),
          screenSize: [window.innerWidth, window.innerHeight],
        }));
      } else {
        console.error("WebGL init failed in effect");
        setRenderingSupported(false);
      }
    }
  });

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

    // Initialize WebGPU or WebGL (with fallback)
    console.log("CHECKPOINT 12: Initializing graphics...");
    if (webgpuCanvasRef) {
      // Try WebGPU first
      webgpuEngine = new WebGPUEngine();
      
      const timeoutMs = 3000;
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error(`WebGPU init timed out after ${timeoutMs}ms`)), timeoutMs);
      });

      let webgpuSuccess = false;
      try {
        webgpuSuccess = await Promise.race([
        webgpuEngine.init(webgpuCanvasRef, intensityShader),
          timeoutPromise
        ]);
      } catch (e) {
        console.warn("WebGPU init failed or timed out:", e);
        webgpuSuccess = false;
      }
      
      if (webgpuSuccess) {
        setRenderingSupported(true);
        webgpuEngine.startRenderLoop(() => ({
          time: performance.now() / 1000, 
          intensity: sessionGetters.getCurrentStep()?.visualIntensity || 0.3,
          tempoPhase: tempoProgress(),
          screenSize: [window.innerWidth, window.innerHeight],
        }));
      } else {
        // Fallback to WebGL
        console.warn("Falling back to WebGL...");
        webgpuEngine = null;
        setFallbackToWebGL(true);
        // Effect will handle init
      }
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
    webgpuEngine?.destroy();
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
            <div class="text-center space-y-6 animate-pulse">
              <div class="text-6xl">▶</div>
              <div class="text-2xl font-bold uppercase tracking-widest">Tap to Start</div>
              <div class="text-white/60">Enable audio and begin workout</div>
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

      {/* Rendering Canvas (WebGPU or WebGL) */}
      <Show when={renderingSupported()} fallback={
        <div class="flex items-center justify-center h-full text-white">
          <div class="text-center space-y-4">
            <div class="text-2xl">Graphics Not Supported</div>
            <div class="text-muted-foreground">
              Your browser doesn't support WebGL or WebGPU. Please update to a modern browser.
            </div>
            <Button onClick={() => navigate("/")}>Go Back</Button>
          </div>
        </div>
      }>
        <Show when={!fallbackToWebGL()} fallback={
          <canvas
            id="webgl-canvas"
            ref={webglCanvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            class="absolute inset-0"
          />
        }>
          <canvas
            id="webgpu-canvas"
            ref={webgpuCanvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            class="absolute inset-0"
          />
        </Show>
      </Show>

      {/* Tempo Visualizer Overlay */}
      <Show when={currentStep()?.repStructure}>
        <div class="absolute inset-0 flex items-center justify-center p-8 pointer-events-none z-10">
            <div class="w-full max-w-md pointer-events-auto">
                <TempoVisualizer 
                    repStructure={currentStep()!.repStructure}
                    elapsedTime={stepElapsed()}
                    duration={currentStep()!.duration}
                />
            </div>
        </div>
      </Show>

      {/* HUD Overlay */}
      <div class="absolute inset-0 pointer-events-none">
        {/* Page Label */}
        <div class="absolute top-4 left-4 text-xs text-white/60 pointer-events-none">
          System Menu / Guided Session
        </div>
        {/* Top Bar */}
        <div class="p-4 flex justify-between text-white text-sm pointer-events-auto">
          <div>Elapsed: {formatTime(elapsed())}</div>
          <div>
            <Show when={currentStep()?.duration && currentStep()!.duration > 0}>
              <div>Step: {formatTime(stepElapsed())} / {formatTime(currentStep()!.duration)}</div>
            </Show>
          </div>
          <div>Remaining: {formatTime(sessionGetters.getRemainingTime())}</div>
        </div>

        {/* Center HUD */}
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <div class="bg-black/60 backdrop-blur-sm rounded-lg p-6 min-w-[400px] text-white">
            <Show when={currentStep()} fallback={
              <div class="text-center">
                <div class="text-xl text-red-500">No current step available</div>
                <div class="text-sm mt-2">Session: {sessionStore.currentSession ? "exists" : "null"}</div>
                <div class="text-sm">Timeline length: {sessionStore.currentSession?.timeline.length || 0}</div>
              </div>
            }>
              {(step) => (
                <div class="space-y-4">
                  <div class="text-center">
                    <div class="text-sm text-gray-400 uppercase">{step().type}</div>
                    <div class="text-2xl font-bold mt-2">{step().exerciseName || "Ready"}</div>
                  </div>

                  <Show when={step().setNumber}>
                    <div class="text-center text-sm">
                      Set {step().setNumber} of {step().totalSets}
                    </div>
                  </Show>

                  <Show when={step().load}>
                    <div class="text-center text-lg">{step().load}</div>
                  </Show>

                  {/* Tempo display for tempo-based exercises */}
                  <Show when={(step().tempo || step().repStructure) && sessionEngine}>
                    <div class="text-center space-y-2">
                      <div class="text-sm text-gray-400">
                        Rep {currentRep()} of {step().exercise?.reps}
                      </div>
                      <div class="flex justify-center gap-2 text-xs">
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
                      <div class="text-center text-sm text-gray-400">
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
        <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div class="flex gap-4 bg-black/60 backdrop-blur-sm rounded-full p-4">
            <Button
              size="lg"
              variant="ghost"
              class="rounded-full w-12 h-12 p-0 text-white"
              onClick={handlePrevious}
            >
              ◀
            </Button>
            
            <Button
              size="lg"
              variant="ghost"
              class="rounded-full w-16 h-16 p-0 text-2xl text-white"
              onClick={handlePause}
            >
              {sessionGetters.isActive() ? "⏸" : "▶"}
            </Button>
            
            <Button
              size="lg"
              variant="ghost"
              class="rounded-full w-12 h-12 p-0 text-white"
              onClick={handleNext}
            >
              ▶
            </Button>
          </div>

          {/* Step minimap */}
          <div class="flex justify-center gap-1 mt-4">
            <Show when={sessionStore.currentSession}>
              {(session) => (
                <>
                  {session().timeline.map((_, index) => (
                    <div
                      class={`w-2 h-2 rounded-full ${
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
          class="absolute top-4 right-4 text-white pointer-events-auto"
          onClick={handleExit}
        >
          Exit
        </Button>
      </div>
    </div>
    </>
  );
}
