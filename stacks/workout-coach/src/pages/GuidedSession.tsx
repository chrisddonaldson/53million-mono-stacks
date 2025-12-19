import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { sessionStore, sessionActions, sessionGetters } from "../stores/sessionStore";
import { workoutActions } from "../stores/workoutStore";
import { settingsStore } from "../stores/settingsStore";
import { WorkflowEngine } from "../engines/workflow/WorkflowEngine";
import { IntervalTimer } from "../engines/timer/IntervalTimer";
import { VoiceCoach } from "../engines/audio/VoiceCoach";
import { WebGPUEngine } from "../engines/webgpu/WebGPUEngine";
import { WebGLEngine } from "../engines/webgl/WebGLEngine";
import { TempoEngine, type TempoEvent } from "../engines/timer/TempoEngine";
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

export default function GuidedSession() {
  console.log("=== GuidedSession COMPONENT RENDER ===");
  const params = useParams();
  const navigate = useNavigate();
  
  console.log("GuidedSession params at component level:", params);
  console.log("GuidedSession params.id at component level:", params.id);
  
  const [initError, setInitError] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  
  let canvasRef: HTMLCanvasElement | undefined;
  
  // Early return test to ensure component renders
  if (!params.id) {
    console.error("No params.id found!");
    return (
      <div class="h-screen w-screen flex items-center justify-center bg-black text-white">
        <div class="max-w-2xl p-8 space-y-4">
          <h1 class="text-2xl font-bold text-red-500">No Workout ID</h1>
          <p class="text-lg">params.id is missing or empty</p>
          <p class="text-sm">params: {JSON.stringify(params)}</p>
          <Button onClick={() => navigate("/library")}>Go to Library</Button>
        </div>
      </div>
    );
  }
  let webgpuEngine: WebGPUEngine | null = null;
  let webglEngine: WebGLEngine | null = null;
  let globalTimer: IntervalTimer;
  let stepTimer: IntervalTimer;
  let voiceCoach: VoiceCoach;
  let tempoEngine: TempoEngine | null = null;
  let tempoUpdateInterval: number | null = null;

  const [elapsed, setElapsed] = createSignal(0);
  const [stepElapsed, setStepElapsed] = createSignal(0);
  const [renderingSupported, setRenderingSupported] = createSignal(true);
  const [showSummary, setShowSummary] = createSignal(false);
  const [showPause, setShowPause] = createSignal(false);
  const [tempoProgress, setTempoProgress] = createSignal(0);
  const [currentRep, setCurrentRep] = createSignal(0);
  const [tempoPhase, setTempoPhase] = createSignal<"down" | "hold" | "up">("down");
  
  // Track which voice cues have been triggered for current step
  let triggeredCues = new Set<number>();

  const startStepTimer = () => {
    const currentStep = sessionGetters.getCurrentStep();
    if (!currentStep) return;

    // Reset step timer and voice cue tracking
    stepTimer?.reset();
    setStepElapsed(0);
    triggeredCues.clear();

    // Stop any existing tempo engine
    if (tempoUpdateInterval !== null) {
      clearInterval(tempoUpdateInterval);
      tempoUpdateInterval = null;
    }
    tempoEngine?.stop();
    tempoEngine = null;

    // Check if step has tempo (for tempo-based exercises)
    if (currentStep.type === "work" && currentStep.tempo && currentStep.exercise) {
      const reps = currentStep.exercise.reps;
      tempoEngine = new TempoEngine(currentStep.tempo, reps);
      tempoEngine.start();
      
      setCurrentRep(1);
      setTempoPhase("down");
      
      // Update tempo engine at 60fps
      let lastTime = performance.now();
      tempoUpdateInterval = window.setInterval(() => {
        const now = performance.now();
        const deltaTime = (now - lastTime) / 1000;
        lastTime = now;
        
        const event = tempoEngine!.update(deltaTime, (tempoEvent: TempoEvent) => {
          // Phase changed - announce it
          setTempoPhase(tempoEvent.phase);
          setCurrentRep(tempoEvent.rep);
          
          // Voice cue for phase
          if (settingsStore.audio.voiceVolume > 0) {
            voiceCoach.announceTempo(tempoEvent.phase);
          }
          
          // Check if all reps complete
          if (tempoEngine?.isComplete()) {
            clearInterval(tempoUpdateInterval!);
            tempoUpdateInterval = null;
            handleNext();
          }
        });
        
        setTempoProgress(event.progress);
        setCurrentRep(event.rep);
        setTempoPhase(event.phase);
      }, 16); // ~60fps
      
    } else if (currentStep.duration > 0) {
      // Standard timed interval (no tempo)
      stepTimer = new IntervalTimer("countdown", currentStep.duration);
      stepTimer.start(
        (e, _remaining) => {
          setStepElapsed(e);
          
          // Check for voice cues that should trigger at this time
          if (currentStep.voiceCues && settingsStore.audio.voiceVolume > 0) {
            for (let i = 0; i < currentStep.voiceCues.length; i++) {
              const cue = currentStep.voiceCues[i];
              // Trigger if we've reached the cue time and haven't triggered it yet
              if (e >= cue.time && !triggeredCues.has(i)) {
                triggeredCues.add(i);
                voiceCoach.announce(cue);
              }
            }
          }
        },
        () => {
          // Auto-advance when step duration completes
          handleNext();
        }
      );
    }
  };

  onMount(async () => {
    try {
      console.log("=== GuidedSession onMount START ===");
      console.log("params:", params);
      console.log("params.id:", params.id);
      
      // Initialize session
      // The wildcard route *id captures everything after /session/
      // SolidJS router automatically decodes URL parameters
      const workoutId = params.id || "";
      
      console.log("GuidedSession workoutId:", workoutId);
      console.log("GuidedSession params.id type:", typeof params.id);
      console.log("GuidedSession workoutId length:", workoutId.length);
      
      if (!workoutId) {
        console.log("No workoutId, navigating to /library");
        setInitError("No workout ID provided");
        setIsLoading(false);
        return;
      }
      
      console.log("CHECKPOINT 1: Getting profile...");
      const profile = workoutActions.getCurrentProfile();
      console.log("Profile:", profile);
      console.log("Profile meta:", profile.meta);
      console.log("Profile title:", profile.meta?.title);
      
      // Check if this is a microworkout ID (format: "variantId/microworkoutTitle")
      console.log("CHECKPOINT 2: Splitting workoutId...");
      const parts = workoutId.split("/");
      console.log("Parts:", parts, "Length:", parts.length);
      console.log("Parts[0]:", parts[0]);
      console.log("Parts[1]:", parts[1]);
      
      let timeline: any[];

      if (parts.length === 2) {
        console.log("CHECKPOINT 3: Microworkout mode detected");
        // Microworkout session
        const [variantId, microworkoutTitle] = parts;
        console.log("Microworkout mode - variantId:", variantId, "title:", microworkoutTitle);
        console.log("Getting variant for:", variantId);
        const variant = workoutActions.getWorkoutVariant(variantId);
        console.log("Variant result:", variant);
        console.log("Variant micro:", variant?.micro);

        if (!variant) {
          console.error("CHECKPOINT 3.1: Workout variant not found for:", variantId);
          const errorMsg = `Workout variant not found: ${variantId}`;
          setInitError(errorMsg);
          setIsLoading(false);
          alert(errorMsg);
          return;
        }

        console.log("CHECKPOINT 3.2: Variant found, checking micro workouts...");
        console.log("Variant micro workouts:", variant.micro.map(m => m.title));
        const microworkout = variant.micro.find(m => m.title === microworkoutTitle);
        console.log("Found microworkout:", microworkout);
        
        if (!microworkout) {
          console.error("CHECKPOINT 3.3: Microworkout not found");
          console.error(`Microworkout "${microworkoutTitle}" not found in variant "${variantId}"`);
          console.error("Available microworkouts:", variant.micro.map(m => m.title));
          const errorMsg = `Microworkout "${microworkoutTitle}" not found. Available: ${variant.micro.map(m => m.title).join(", ")}`;
          setInitError(errorMsg);
          setIsLoading(false);
          alert(errorMsg);
          return;
        }

        console.log("CHECKPOINT 4: Generating microworkout timeline...");
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
        console.log("CHECKPOINT 5: Timeline generated:", timeline.length, "steps");
      } else if (workoutId === "wrist_extension_training_system" || workoutId === "wrist-workout") {
      console.log("CHECKPOINT 6.5: New YAML workout mode detected");
         // Cast the imported yaml to our type
         const yamlData = wristWorkout as unknown as YamlWorkout;
         console.log("YAML Data:", yamlData);
         
         const generator = new YamlStepGenerator(yamlData, {
            globalRestTime: settingsStore.workout.defaultRestTime,
            voiceEnabled: settingsStore.audio.voiceVolume > 0,
            musicDucking: settingsStore.audio.musicDucking,
            motivationalLevel: "medium",
            progressionVariant: "standard",
         });
         timeline = generator.generateTimeline();
         console.log("Timeline generated from YAML:", timeline);
      } else {
        console.log("CHECKPOINT 6: Full workout mode");
        // Full workout variant session
        const variant = workoutActions.getWorkoutVariant(workoutId);

        if (!variant) {
          console.error("CHECKPOINT 6.1: Workout variant not found");
          const errorMsg = "Workout variant not found: " + workoutId;
          setInitError(errorMsg);
          setIsLoading(false);
          return;
        }

        console.log("CHECKPOINT 7: Generating full workout timeline...");
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
    console.log("Creating session with:", { workoutId, profile: profile.meta.title, timelineLength: timeline.length });
    sessionActions.createSession(workoutId, profile.meta.title, timeline);
    console.log("CHECKPOINT 9: Session created");

    // Initialize engines
    console.log("CHECKPOINT 10: Initializing engines...");
    voiceCoach = new VoiceCoach();
    globalTimer = new IntervalTimer("countup");
    console.log("CHECKPOINT 11: VoiceCoach and Timer initialized");

    // Initialize WebGPU or WebGL (with fallback)
    console.log("CHECKPOINT 12: Initializing graphics...");
    console.log("Canvas ref exists:", !!canvasRef);
    if (canvasRef) {
      console.log("CHECKPOINT 13: Trying WebGPU...");
      // Try WebGPU first
      webgpuEngine = new WebGPUEngine();
      
      // Add timeout to WebGPU init
      const timeoutMs = 3000;
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error(`WebGPU init timed out after ${timeoutMs}ms`)), timeoutMs);
      });

      let webgpuSuccess = false;
      try {
        console.log("Starting WebGPU init race...");
        // Assuming webgpuEngine.init returns Promise<boolean>
        webgpuSuccess = await Promise.race([
          webgpuEngine.init(canvasRef, intensityShader),
          timeoutPromise
        ]);
        console.log("WebGPU init race finished, success:", webgpuSuccess);
      } catch (e) {
        console.warn("WebGPU init failed or timed out:", e);
        webgpuSuccess = false;
      }
      
      console.log("CHECKPOINT 14: WebGPU final result:", webgpuSuccess);

      if (webgpuSuccess) {
        setRenderingSupported(true);
        webgpuEngine.startRenderLoop(() => ({
          time: elapsed(),
          intensity: sessionGetters.getCurrentStep()?.visualIntensity || 0.3,
          tempoPhase: tempoProgress(),
          screenSize: [window.innerWidth, window.innerHeight],
        }));
      } else {
        // Fallback to WebGL
        webgpuEngine = null;
        webglEngine = new WebGLEngine();
        const webglSuccess = webglEngine.init(canvasRef, vertexShader, fragmentShader);
        
        if (webglSuccess) {
          setRenderingSupported(true);
          webglEngine.startRenderLoop(() => ({
            time: elapsed(),
            intensity: sessionGetters.getCurrentStep()?.visualIntensity || 0.3,
            tempoPhase: tempoProgress(),
            screenSize: [window.innerWidth, window.innerHeight],
          }));
        } else {
          setRenderingSupported(false);
        }
      }
    }

    // Start session
    sessionActions.startSession();
    
    // Announce first exercise
    const firstStep = sessionGetters.getCurrentStep();
    if (firstStep && firstStep.voiceCues.length > 0) {
      voiceCoach.announce(firstStep.voiceCues[0]);
    }

    // Start global timer
    globalTimer.start((e) => {
      setElapsed(e);
      sessionActions.updateElapsedTime(e);
    });

    // Start step timer
    console.log("Starting step timer...");
    startStepTimer();
    
    // Mark as loaded
    setIsLoading(false);
    console.log("=== GuidedSession onMount COMPLETE ===");
    } catch (error) {
      console.error("!!! Error in GuidedSession onMount:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "no stack");
      const errorMessage = error instanceof Error ? error.message : String(error);
      setInitError(errorMessage);
      setIsLoading(false);
      alert("Failed to load workout: " + errorMessage);
      // navigate("/library"); // Comment out to see error on page
    } finally {
      setIsLoading(false);
    }
  });

  onCleanup(() => {
    globalTimer?.stop();
    stepTimer?.stop();
    if (tempoUpdateInterval !== null) {
      clearInterval(tempoUpdateInterval);
    }
    tempoEngine?.stop();
    webgpuEngine?.destroy();
    webglEngine?.destroy();
    voiceCoach?.clearQueue();
  });

  const handlePause = () => {
    if (sessionGetters.isActive()) {
      sessionActions.pauseSession();
      globalTimer.pause();
      stepTimer?.pause();
      voiceCoach.pause();
      setShowPause(true);
    } else if (sessionGetters.isPaused()) {
      handleResume();
    }
  };

  const handleResume = () => {
    sessionActions.resumeSession();
    globalTimer.resume((e) => {
      setElapsed(e);
      sessionActions.updateElapsedTime(e);
    });
    
    const currentStep = sessionGetters.getCurrentStep();
    if (currentStep && currentStep.duration > 0 && !currentStep.tempo) {
      stepTimer?.resume(
        (e, _remaining) => {
          setStepElapsed(e);
          
          // Re-check voice cues after resume
          if (currentStep.voiceCues && settingsStore.audio.voiceVolume > 0) {
            for (let i = 0; i < currentStep.voiceCues.length; i++) {
              const cue = currentStep.voiceCues[i];
              if (e >= cue.time && !triggeredCues.has(i)) {
                triggeredCues.add(i);
                voiceCoach.announce(cue);
              }
            }
          }
        },
        () => {
          handleNext();
        }
      );
    }
    
    voiceCoach.resume();
    setShowPause(false);
  };

  const handleSkipFromPause = () => {
    setShowPause(false);
    handleResume();
    setTimeout(() => {
      sessionActions.skipExercise();
      startStepTimer();
    }, 100);
  };

  const handleNext = () => {
    sessionActions.nextStep();
    
    // Check if workout is complete (after advancing)
    if (sessionGetters.isComplete()) {
      sessionActions.completeSession();
      workoutActions.setLastCompleted(params.id || "", workoutActions.getCurrentProfile().meta.title);
      setShowSummary(true);
      return;
    }

    // Announce new step
    const step = sessionGetters.getCurrentStep();
    if (step && step.voiceCues.length > 0) {
      voiceCoach.announce(step.voiceCues[0]);
    }

    // Start new step timer
    startStepTimer();
  };

  const handlePrevious = () => {
    sessionActions.previousStep();
    
    // Announce step
    const step = sessionGetters.getCurrentStep();
    if (step && step.voiceCues.length > 0) {
      voiceCoach.announce(step.voiceCues[0]);
    }

    // Restart step timer
    startStepTimer();
  };

  const handleExit = () => {
    if (confirm("Are you sure you want to exit this workout?")) {
      sessionActions.endSession();
      navigate("/");
    }
  };

  const currentStep = () => sessionGetters.getCurrentStep();
  const nextStep = () => sessionGetters.getNextStep();
  const progress = () => sessionGetters.getProgress();

  console.log("=== GuidedSession RENDERING JSX ===");
  console.log("Current session exists:", !!sessionStore.currentSession);
  console.log("Current step exists:", !!currentStep());
  console.log("Is loading:", isLoading());
  console.log("Init error:", initError());

  // Show loading state
  if (isLoading()) {
    return (
      <div class="h-screen w-screen flex items-center justify-center bg-black text-white">
        <div class="text-2xl">Loading workout...</div>
      </div>
    );
  }

  // Show error if initialization failed
  if (initError()) {
    return (
      <div class="h-screen w-screen flex items-center justify-center bg-black text-white">
        <div class="max-w-2xl p-8 space-y-4">
          <h1 class="text-2xl font-bold text-red-500">Failed to Load Workout</h1>
          <p class="text-lg">{initError()}</p>
          <Button onClick={() => navigate("/library")}>Go to Library</Button>
        </div>
      </div>
    );
  }

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
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          class="absolute inset-0"
        />
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
                  <Show when={step().tempo && tempoEngine}>
                    <div class="text-center space-y-2">
                      <div class="text-sm text-gray-400">
                        Rep {currentRep()} of {step().exercise?.reps}
                      </div>
                      <div class="flex justify-center gap-2 text-xs">
                        <span class={tempoPhase() === "down" ? "text-primary font-bold" : "text-gray-500"}>
                          DOWN
                        </span>
                        <span class={tempoPhase() === "hold" ? "text-primary font-bold" : "text-gray-500"}>
                          HOLD
                        </span>
                        <span class={tempoPhase() === "up" ? "text-primary font-bold" : "text-gray-500"}>
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
