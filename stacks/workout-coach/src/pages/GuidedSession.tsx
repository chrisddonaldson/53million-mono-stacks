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

export default function GuidedSession() {
  const params = useParams();
  const navigate = useNavigate();
  
  let canvasRef: HTMLCanvasElement | undefined;
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
    // Initialize session
    const variantId = params.id || "";
    if (!variantId) {
      navigate("/library");
      return;
    }
    
    const profile = workoutActions.getCurrentProfile();
    const variant = workoutActions.getWorkoutVariant(variantId);

    if (!variant) {
      console.error("Workout variant not found");
      navigate("/library");
      return;
    }

    // Generate timeline
    const timeline = WorkflowEngine.generateWorkoutTimeline(
      profile,
      variantId,
      {
        globalRestTime: settingsStore.workout.defaultRestTime,
        voiceEnabled: settingsStore.audio.voiceVolume > 0,
        musicDucking: settingsStore.audio.musicDucking,
        motivationalLevel: "medium",
        progressionVariant: "standard",
      }
    );

    // Create session
    sessionActions.createSession(variantId, profile.meta.title, timeline);

    // Initialize engines
    voiceCoach = new VoiceCoach();
    globalTimer = new IntervalTimer("countup");

    // Initialize WebGPU or WebGL (with fallback)
    if (canvasRef) {
      // Try WebGPU first
      webgpuEngine = new WebGPUEngine();
      const webgpuSuccess = await webgpuEngine.init(canvasRef, intensityShader);

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
    startStepTimer();
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

  return (
    <>
      <SummaryModal 
        open={showSummary()} 
        onOpenChange={setShowSummary}
        stats={sessionGetters.getSessionStats()}
        variantName={params.id || "Workout"}
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
            <Show when={currentStep()}>
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
