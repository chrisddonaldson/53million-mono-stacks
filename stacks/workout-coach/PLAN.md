# Workout Coach App - Implementation Plan

## Overview
Building a guided workout coaching app using SolidJS, TypeScript, Vite, WebGPU, and shadcn-solid. The app will deliver an interactive, game-like coaching experience with timers, voice cues, diegetic WebGPU visuals, and a wizard-like workout flow.

---

## Phase 1: Project Foundation (Days 1-2)

### 1.1 Project Initialization
- [x] Initialize SolidJS project with Vite template
  ```bash
  pnpm create vite workout-coach --template solid-ts
  ```
- [ ] Configure TypeScript with strict mode
- [ ] Set up project structure (see folder layout below)
- [ ] Install core dependencies:
  - `@solidjs/router` - Routing
  - `solid-js` - Framework
  - `vite` - Build tool

### 1.2 UI Framework Setup
- [ ] Install shadcn-solid components
- [ ] Configure Tailwind CSS
- [ ] Set up base UI components:
  - Button, Card, Dialog, Progress, Slider
  - Input, Label, Tabs, Badge
- [ ] Create design system tokens (colors, spacing, typography)
- [ ] Build responsive layout components

### 1.3 WebGPU Foundation
- [ ] Create WebGPU detection utility
- [ ] Build WebGPU initialization module
- [ ] Set up fallback for unsupported browsers
- [ ] Create canvas component with proper lifecycle
- [ ] Implement basic render loop

---

## Phase 2: Type System & Data Models (Days 2-3)

### 2.1 Core Type Definitions
Based on `example-workout-config.ts`, create:

**Workout Configuration Types:**
```typescript
// src/types/workout.ts
interface Config {
  meta: MetaConfig;
  goals: string[];
  startDate: string;
  schedule: DaySchedule[];
  lifts: Record<string, Lift>;
  progression: ProgressionConfig;
  variants: Record<string, WorkoutVariant>;
  warmup: WarmupConfig;
  stretch: StretchConfig;
}

interface WorkoutVariant {
  major: MajorLift[];          // Main compound lifts
  micro: MicroWorkout[];       // Accessory work grouped by theme
  cardio?: CardioConfig;
}

interface MicroWorkout {
  title: string;               // e.g., "Biceps Pump", "Chest 360"
  items: Exercise[];
}

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  load?: "light" | "moderate" | "hard";  // For bodyweight/accessories
  percent?: number;            // % of 1RM
  liftRef?: string;            // Reference to lifts config
  tempo?: Tempo;               // e.g., "3-1-1" (down-hold-up)
  rest?: number;               // Rest in seconds
}
```

**Guided Session Types:**
```typescript
// src/types/session.ts
interface GuidedSession {
  id: string;
  workoutVariant: string;
  profile: string;             // "chris" | "anca"
  timeline: SessionStep[];
  currentStepIndex: number;
  state: "idle" | "warmup" | "active" | "rest" | "paused" | "complete";
  startTime: number;
  elapsedTime: number;
  settings: SessionSettings;
}

interface SessionStep {
  type: "setup" | "warmup" | "work" | "rest" | "transition" | "summary";
  exercise?: Exercise;
  duration: number;            // In seconds
  tempo?: Tempo;
  voiceCues: VoiceCue[];
  visualIntensity: number;     // 0-1 for WebGPU
}

interface Tempo {
  down: number;                // Eccentric phase (seconds)
  hold: number;                // Isometric hold
  up: number;                  // Concentric phase
}

interface SessionSettings {
  globalRestTime: number;      // Default rest between sets
  voiceEnabled: boolean;
  musicDucking: boolean;
  motivationalLevel: "off" | "low" | "medium" | "high";
  progressionVariant: "easy" | "standard" | "hard";
}
```

### 2.2 Timeline Generation
- [ ] Create `WorkflowEngine` to parse workout config
- [ ] Generate complete timeline from config:
  - Setup phase (equipment check, progression selection)
  - Major lifts with warmup sets
  - Micro workout groupings
  - Rest intervals between sets/exercises
  - Transition cues
  - Summary phase
- [ ] Calculate total duration
- [ ] Validate timeline completeness

---

## Phase 3: State Management (Days 3-4)

### 3.1 SolidJS Stores
Create reactive stores for:

**Workout Store** (`src/stores/workoutStore.ts`):
```typescript
const [workoutLibrary, setWorkoutLibrary] = createStore({
  profiles: WORKOUT_PROFILES,
  currentProfile: "chris",
  favorites: [],
  lastCompleted: null,
});
```

**Session Store** (`src/stores/sessionStore.ts`):
```typescript
const [session, setSession] = createStore<GuidedSession | null>(null);

// Derived signals
const currentStep = () => session?.timeline[session.currentStepIndex];
const nextStep = () => session?.timeline[session.currentStepIndex + 1];
const progress = () => (session?.currentStepIndex / session?.timeline.length) * 100;
const timeRemaining = () => calculateTimeRemaining(session);
```

**Settings Store** (`src/stores/settingsStore.ts`):
```typescript
const [settings, setSettings] = createStore({
  audio: { voiceVolume: 0.8, musicDucking: true },
  display: { theme: "dark", hapticsEnabled: true },
  workout: { defaultRestTime: 90, autoAdvance: true },
});
```

### 3.2 Store Actions
- [ ] `startWorkout(variant, profile)` - Initialize session
- [ ] `pauseSession()` / `resumeSession()`
- [ ] `nextStep()` / `previousStep()`
- [ ] `skipExercise()`
- [ ] `adjustRestTime(delta)`
- [ ] `completeSession()`

---

## Phase 4: Timer & Tempo Engine (Days 4-5)

### 4.1 Interval Timer
**File:** `src/engines/timer/IntervalTimer.ts`

```typescript
class IntervalTimer {
  private startTime: number = 0;
  private elapsed: number = 0;
  private rafId: number | null = null;

  start(onTick: (elapsed: number) => void) {
    this.startTime = performance.now();
    const tick = (now: number) => {
      this.elapsed = (now - this.startTime) / 1000;
      onTick(this.elapsed);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  pause() { /* ... */ }
  resume() { /* ... */ }
  reset() { /* ... */ }
}
```

Features:
- [ ] High-precision timing with `performance.now()`
- [ ] Pause/resume without drift
- [ ] Countdown mode for timed intervals
- [ ] Count-up mode for tracking elapsed time

### 4.2 Tempo Engine
**File:** `src/engines/timer/TempoEngine.ts`

Handles tempo-based rep counting (e.g., "3-1-1" = 3s down, 1s hold, 1s up):

```typescript
class TempoEngine {
  private tempo: Tempo;
  private currentPhase: "down" | "hold" | "up" = "down";
  private phaseProgress: number = 0;
  
  update(deltaTime: number): void {
    // Track phase progress
    // Emit events: onPhaseChange, onRepComplete
    // Sync with voice cues and WebGPU visuals
  }
}
```

Features:
- [ ] Phase tracking (down/hold/up)
- [ ] Automatic rep counting
- [ ] Voice cue triggers ("down", "hold", "up")
- [ ] Visual sync points for WebGPU

### 4.3 Integration
- [ ] Connect timer to session store
- [ ] Trigger step transitions automatically
- [ ] Update HUD in real-time
- [ ] Sync WebGPU animations to timer

---

## Phase 5: Audio Engine (Days 5-6)

### 5.1 Voice Coach System
**File:** `src/engines/audio/VoiceCoach.ts`

```typescript
class VoiceCoach {
  private tts: TTSEngine;
  private cueQueue: string[] = [];
  private isSpeaking: boolean = false;

  async announce(cue: VoiceCue): Promise<void> {
    // Add to queue to prevent overlaps
    this.cueQueue.push(cue.text);
    if (!this.isSpeaking) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    while (this.cueQueue.length > 0) {
      this.isSpeaking = true;
      const text = this.cueQueue.shift()!;
      await this.tts.speak(text, { rate: 1.1, volume: 0.9 });
    }
    this.isSpeaking = false;
  }

  announceTempo(phase: "down" | "hold" | "up"): void {
    // Use different pitch/rate for each phase
    const options = {
      down: { rate: 0.8, pitch: 0.9 },   // Slower, lower
      hold: { rate: 0.7, pitch: 1.0 },   // Very slow
      up: { rate: 1.2, pitch: 1.1 },     // Faster, higher
    };
    this.tts.speak(phase, options[phase]);
  }
}
```

Cue Types:
- [ ] Exercise transitions ("Next: Barbell Bicep Curl")
- [ ] Work/rest announcements ("Work", "Rest")
- [ ] Tempo coaching ("Down... hold... up")
- [ ] Motivational messages (based on intensity)
- [ ] Rep counts (optional)
- [ ] Set progress ("Set 2 of 4")
- [ ] Load reminders ("40 kilograms")

### 5.2 Music Ducking
**File:** `src/engines/audio/MusicDucker.ts`

```typescript
class MusicDucker {
  duck(duration: number): void {
    // Lower external music volume before voice cues
    // Restore after duration
  }
}
```

- [ ] Web Audio API integration
- [ ] Fade in/out transitions
- [ ] Toggle in settings

### 5.3 Text-to-Speech (TTS) Integration
Use Web Speech API for voice cues:

```typescript
class TTSEngine {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;

  init(): void {
    this.synth = window.speechSynthesis;
    // Select preferred voice (male/female, language)
    const voices = this.synth.getVoices();
    this.voice = voices.find(v => v.lang === 'en-US') || voices[0];
  }

  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.voice;
      utterance.rate = options?.rate || 1.0;      // Speed (0.1-10)
      utterance.pitch = options?.pitch || 1.0;    // Pitch (0-2)
      utterance.volume = options?.volume || 0.8;  // Volume (0-1)
      utterance.onend = () => resolve();
      this.synth.speak(utterance);
    });
  }

  cancel(): void {
    this.synth.cancel(); // Stop all queued speech
  }
}
```

Benefits:
- [ ] No audio file storage required
- [ ] Dynamic exercise names without pre-recording
- [ ] Adjustable speech rate and pitch
- [ ] Multi-language support
- [ ] Instant updates without asset management

---

## Phase 6: WebGPU Rendering Engine (Days 6-8)

### 6.1 Core WebGPU Setup
**File:** `src/engines/webgpu/WebGPUEngine.ts`

```typescript
class WebGPUEngine {
  private device: GPUDevice;
  private context: GPUCanvasContext;
  private pipeline: GPURenderPipeline;
  private uniformBuffer: GPUBuffer;

  async init(canvas: HTMLCanvasElement): Promise<void> {
    // Request adapter and device
    // Configure canvas context
    // Create render pipeline
  }

  render(uniforms: RenderUniforms): void {
    // Update uniform buffers (time, intensity, tempo phase)
    // Execute render pass
  }
}
```

### 6.2 Shader Programs
**Visual Styles:**
- Liquid/arcade-style pulses
- Wave patterns
- Intensity bursts
- Tempo arcs
- Transition effects

**Shader 1: Intensity Pulses** (`src/shaders/intensity.wgsl`):
```wgsl
struct Uniforms {
  time: f32,
  intensity: f32,      // 0-1 (rest=0.2, work=1.0)
  tempo_phase: f32,    // 0-1 within current tempo phase
  screen_size: vec2<f32>,
}

@fragment
fn main(@location(0) fragCoord: vec2<f32>) -> @location(0) vec4<f32> {
  // Radial pulse from center
  // Scale amplitude by intensity
  // Modulate by tempo phase
}
```

**Shader 2: Tempo Waves** (`src/shaders/tempo.wgsl`):
```wgsl
// Animated waves that sync to tempo
// Down phase: slow, flowing waves
// Hold phase: stable, pulsing rings
// Up phase: fast, explosive bursts
```

**Shader 3: Transitions** (`src/shaders/transitions.wgsl`):
```wgsl
// Exercise transitions (work → rest)
// Smooth color/intensity morphing
```

### 6.3 Visual-Audio-Timer Sync
```typescript
// In GuidedSession component
createEffect(() => {
  const step = currentStep();
  const elapsed = timer.elapsed();
  
  // Update WebGPU uniforms
  webgpu.render({
    time: elapsed,
    intensity: step.visualIntensity,
    tempoPhase: tempoEngine.phaseProgress,
    screenSize: [canvas.width, canvas.height],
  });
});
```

- [ ] Render loop independent of React rendering
- [ ] Smooth 60fps animations
- [ ] Intensity gradients (rest=low, work=high, max effort=explosive)

---

## Phase 7: UI Components (Days 8-10)

### 7.1 HUD Overlay (Diegetic UI)
**File:** `src/components/hud/HUDOverlay.tsx`

Layout:
```
┌─────────────────────────────────────┐
│  [05:32 elapsed]    [12:18 remain]  │  <- Top bar
│                                     │
│          WebGPU Canvas              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Current: Barbell Bicep Curl │   │  <- Center HUD
│  │ 4 sets × 10 reps @ 40kg    │   │
│  │ Tempo: 3-1-1                │   │
│  │ [=========>    ] Set 2/4    │   │
│  │                             │   │
│  │ Next: Hammer Curl           │   │
│  └─────────────────────────────┘   │
│                                     │
│        [◀] [⏸] [▶]                 │  <- Toolbar
│     ●━━━●━━━○━━━○━━━○              │  <- Step minimap
└─────────────────────────────────────┘
```

Components:
- [x] `CurrentExercise.tsx` - Exercise name, sets, reps, load, tempo
- [x] `NextExercise.tsx` - Preview of upcoming exercise
- [x] `ProgressBar.tsx` - Overall workout progress
- [x] `Toolbar.tsx` - Pause/play, skip controls
- [x] `TimeDisplay.tsx` - Elapsed/remaining time

### 7.2 Pages & Navigation
**Routing Structure:**
```typescript
// src/App.tsx
<Router>
  <Route path="/" component={Home} />
  <Route path="/library" component={WorkoutLibrary} />
  <Route path="/session/:id" component={GuidedSession} />
  <Route path="/stats" component={Stats} />
</Router>
```

**Home Page** (`src/pages/Home.tsx`):
- [ ] Start Workout button (SYS-1)
- [ ] Quick Start button (QS-1)
- [ ] Last completed session summary
- [ ] Shortcut to favorites

**Workout Library** (`src/pages/WorkoutLibrary.tsx`):
- [ ] Grid/list of all workout variants (SYS-2)
- [ ] Filter by: duration, equipment, muscle group
- [ ] Tap workout → detail page → "Start Guided Coaching"

**Guided Session** (`src/pages/GuidedSession.tsx`):
- [ ] Full-screen WebGPU canvas
- [ ] HUD overlay
- [ ] Pre-start screen (countdown/equipment check)
- [ ] Pause modal
- [ ] Summary modal (UI-4)

### 7.3 Modals
**Quick Start Modal** (`src/components/modals/QuickStartModal.tsx`):
- [ ] Duration slider (5-30 min)
- [ ] Goal selection (strength/hypertrophy/conditioning)
- [ ] Equipment checklist
- [ ] "Start Now" button → auto-generate workout

**Pause Modal:**
- [ ] Resume, Skip Exercise, Exit options
- [ ] Current progress preview

**Summary Modal:**
- [ ] Total time, exercises completed, reps/sets
- [ ] XP earned, calories burned (estimated)
- [ ] Save, Favorite, Share buttons
- [ ] "Start Cooldown" option

---

## Phase 8: Workflow Engine (Days 10-11)

### 8.1 Timeline Generation
**File:** `src/engines/workflow/StepGenerator.ts`

```typescript
function generateTimeline(
  variant: WorkoutVariant,
  profile: Config,
  settings: SessionSettings
): SessionStep[] {
  const steps: SessionStep[] = [];

  // 1. Setup phase
  steps.push({
    type: "setup",
    duration: 30,
    voiceCues: [{ text: "Prepare your equipment", time: 0 }],
    visualIntensity: 0.3,
  });

  // 2. Major lifts (with warmup sets)
  for (const major of variant.major) {
    const warmupSets = generateWarmupSets(major, profile);
    steps.push(...warmupSets);
    steps.push(generateWorkSet(major, profile));
  }

  // 3. Micro workouts (grouped by title)
  for (const micro of variant.micro) {
    for (const exercise of micro.items) {
      for (let set = 0; set < exercise.sets; set++) {
        steps.push(generateWorkSet(exercise, profile, set + 1));
        if (set < exercise.sets - 1) {
          steps.push(generateRestStep(exercise.rest || settings.globalRestTime));
        }
      }
    }
  }

  // 4. Summary
  steps.push({
    type: "summary",
    duration: 0,
    voiceCues: [{ text: "Workout complete!", time: 0 }],
    visualIntensity: 1.0,
  });

  return steps;
}
```

### 8.2 Wizard Flow
- [ ] Auto-advance on timer completion
- [ ] Manual next/previous navigation
- [ ] Smooth transitions between steps
- [ ] Preserve state on pause

---

## Phase 9: Quick Start & Auto-Generation (Days 11-12)

### 9.1 Workout Generator
**File:** `src/utils/workoutGenerator.ts`

```typescript
interface QuickStartParams {
  duration: number;         // 5-30 minutes
  goal: "strength" | "hypertrophy" | "conditioning";
  equipment: string[];
  profile: string;
}

function generateQuickStartWorkout(params: QuickStartParams): WorkoutVariant {
  // 1. Calculate available time budget
  // 2. Select exercises based on goal and equipment
  // 3. Assign sets/reps based on goal
  // 4. Add warmup and cooldown
  // 5. Validate total duration fits budget
}
```

Algorithm:
- [ ] Parse duration into work blocks
- [ ] Select 3-5 exercises based on goal
- [ ] Strength: 3-5 reps, higher intensity
- [ ] Hypertrophy: 8-12 reps, moderate intensity
- [ ] Conditioning: 15+ reps, lower rest
- [ ] Auto-assign tempo and rest intervals

### 9.2 One-Tap Repeat
- [ ] Store last Quick Start config in localStorage
- [ ] "Repeat Last Quick Start" button on home screen
- [ ] Bypass setup, launch directly

---

## Phase 10: Polish & Testing (Days 12-14)

### 10.1 Responsive Design
- [ ] Mobile-first layout (primary use case)
- [ ] Tablet landscape mode
- [ ] Desktop fallback with WebGPU warnings

### 10.2 Performance Optimization
- [ ] Lazy load workout configs
- [ ] Optimize WebGPU shader compilation
- [ ] Minimize re-renders with SolidJS memoization
- [ ] Service worker for offline support

### 10.3 Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader labels (ARIA)
- [ ] High-contrast mode
- [ ] Voice cue captions (optional)

### 10.4 Testing
- [ ] Unit tests for timeline generation
- [ ] Timer accuracy tests
- [ ] WebGPU fallback testing
- [ ] Voice cue queue tests
- [ ] E2E tests: Start → complete workout flow

### 10.5 Error Handling
- [ ] WebGPU not supported → fallback message
- [ ] Missing equipment → prompt user
- [ ] Invalid config → validation errors
- [ ] Audio playback failures → silent fallback

---

## Project Structure

```
workout-coach/
├── src/
│   ├── components/
│   │   ├── ui/                       # shadcn-solid components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── progress.tsx
│   │   │   └── slider.tsx
│   │   ├── hud/                      # HUD overlays
│   │   │   ├── HUDOverlay.tsx
│   │   │   ├── CurrentExercise.tsx
│   │   │   ├── NextExercise.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   └── TimeDisplay.tsx
│   │   ├── webgpu/                   # WebGPU components
│   │   │   ├── WebGPUCanvas.tsx
│   │   │   └── IntensityVisuals.tsx
│   │   ├── workout/
│   │   │   ├── WorkoutCard.tsx
│   │   │   ├── WorkoutDetail.tsx
│   │   │   └── ExercisePreview.tsx
│   │   └── modals/
│   │       ├── QuickStartModal.tsx
│   │       ├── PauseModal.tsx
│   │       └── SummaryModal.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── WorkoutLibrary.tsx
│   │   ├── GuidedSession.tsx
│   │   └── Stats.tsx
│   ├── engines/
│   │   ├── timer/
│   │   │   ├── IntervalTimer.ts
│   │   │   ├── RepCounter.ts
│   │   │   └── TempoEngine.ts
│   │   ├── webgpu/
│   │   │   ├── WebGPUEngine.ts
│   │   │   ├── ShaderManager.ts
│   │   │   └── RenderPipeline.ts
│   │   ├── audio/
│   │   │   ├── VoiceCoach.ts
│   │   │   ├── AudioCues.ts
│   │   │   └── MusicDucker.ts
│   │   └── workflow/
│   │       ├── WorkflowEngine.ts
│   │       └── StepGenerator.ts
│   ├── shaders/
│   │   ├── intensity.wgsl
│   │   ├── tempo.wgsl
│   │   └── transitions.wgsl
│   ├── stores/
│   │   ├── workoutStore.ts
│   │   ├── sessionStore.ts
│   │   ├── settingsStore.ts
│   │   └── progressStore.ts
│   ├── types/
│   │   ├── config.ts              # Based on example-workout-config.ts
│   │   ├── workout.ts
│   │   ├── exercise.ts
│   │   ├── session.ts
│   │   └── webgpu.ts
│   ├── utils/
│   │   ├── workoutGenerator.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── calculations.ts
│   ├── data/
│   │   ├── workouts/              # Import from example-workout-config.ts
│   │   │   └── profiles.ts
│   │   └── exercises/
│   │       └── library.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── styles/
│       └── globals.css
├── public/
│   └── fonts/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## Technical Specifications

### Dependencies
```json
{
  "dependencies": {
    "solid-js": "^1.8.0",
    "@solidjs/router": "^0.13.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vite-plugin-solid": "^2.8.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/webgpu": "^0.1.0"
  }
}
```

### Browser Support
- Chrome/Edge 113+ (WebGPU support)
- Safari 18+ (WebGPU experimental)
- Firefox: Not yet supported (fallback message)

---

## Key Implementation Notes

### Data Model Alignment
The workout config from `example-workout-config.ts` defines:
1. **Profiles** (Chris, Anca) with different 1RMs and goals
2. **Workout Variants** (Pull, Push-Volume, Calisthenics, etc.)
3. **Major Lifts** - Heavy compound movements
4. **Micro Workouts** - Grouped accessory work by theme (e.g., "Biceps Pump", "Chest 360")
5. **Load Types** - Percentage-based (`percent` + `liftRef`) or qualitative (`load: "light" | "moderate" | "hard"`)

### Timeline Generation Logic
1. Each `micro.title` becomes a section in the guided flow
2. Each `item` in `micro.items` is expanded into: work sets + rest intervals
3. Rest times use `exercise.rest` if defined, else fall back to `settings.globalRestTime`
4. Tempo (if defined) triggers tempo coaching cues
5. Major lifts get auto-generated warmup sets based on `warmup.rampPercents`

### Voice Cue Timing
- **Exercise start:** "Next: [Exercise name]"
- **Set start:** "[Set X of Y]"
- **Tempo coaching:** Triggered every rep if tempo is defined
- **Rest start:** "Rest"
- **Motivational:** Triggered at 50%, 75%, 90% of workout completion

### WebGPU Intensity Mapping
- **Setup/Warmup:** 0.3
- **Rest:** 0.2-0.4 (pulsing gently)
- **Work (light):** 0.5-0.6
- **Work (moderate):** 0.7-0.8
- **Work (hard):** 0.9-1.0
- **Max effort (1-3 reps):** 1.0 (explosive visuals)

---

## Success Criteria

### Completion Checklist
- [ ] User can browse workout library
- [ ] User can start guided session from any workout variant
- [ ] WebGPU visuals sync with workout intensity
- [ ] Voice cues announce transitions and tempo
- [ ] Tempo-based rep counting works accurately
- [ ] Pause/resume preserves exact state
- [ ] Quick Start generates valid workouts in <2 seconds
- [ ] Summary screen shows complete workout stats
- [ ] Mobile responsive (primary target)
- [ ] Works offline (PWA with service worker)

### Performance Targets
- WebGPU rendering: 60fps on mid-range devices
- Voice cue latency: <100ms from trigger
- Timer accuracy: <10ms drift over 30min session
- Initial load: <2s on 3G connection

---

## Next Steps

1. Review this plan and approve
2. Provide any missing requirements or modifications
3. Begin Phase 1: Project initialization
4. Iterate on design with user feedback

---

## Questions for Review

1. ✅ **Audio approach:** TTS (text-to-speech) using Web Speech API
2. **Progression variants:** How should Easy/Standard/Hard modes modify the workout config (reduce weight %, reduce reps, or both)?
3. **Quick Start constraints:** Should the generator prioritize compound movements, or allow isolation exercises?
4. **WebGPU fallback:** If WebGPU is unavailable, should we use Canvas 2D animations, or just show static UI?
5. **Offline mode:** Should workout history sync to cloud, or stay local-only?

