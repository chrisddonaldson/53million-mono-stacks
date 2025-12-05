# 💥 **Epic: Guided Coaching & Timers (with Quick-Start)**

**Epic ID: 2.1.3**

Deliver an interactive, game-like guided coaching experience powered by timers, voice cues, diegetic WebGPU visuals, and a wizard-like flow. The system should make it effortless for Chris to start and complete short, motivating, structured workouts.

---

# 🎯 **Goals**

- Make guided micro workouts **effortless to start**, **easy to follow**, and **highly motivating**.
- Increase **completion rate**, **frequency**, and **workout duration**.
- Achieve a **4.5+/5 satisfaction score** for Coaching.

---

# 📦 **Rewritten User Stories (Consolidated)**

---

# **A. System Start & Navigation**

### **SYS-1 – Start Menu with “Start Workout”**

**As Chris, I want a simple start menu with a clear “Start Workout” entry point so I can begin a session without friction.**

**Acceptance Criteria**

- Start screen displays: _Start Workout_, _Quick Start_, _Workout Library_, _Stats_, last completed session.
- Tapping **Start Workout** opens the workout selection menu.

---

### **SYS-2 – Workout Selection Menu**

**As Chris, I want to browse all available micro workouts so I can pick the one I want to follow.**

**Acceptance Criteria**

- Grid/list of all micro workouts with tags, duration, equipment icons.
- Tapping one opens the workout detail page.

---

### **SYS-3 – Start Selected Workout Immediately**

**As Chris, I want to select a workout and start guided coaching right away so I can get moving quickly.**

**Acceptance Criteria**

- “Start Guided Coaching” begins pre-start screen → WebGPU scene loads → timer countdown.
- If required load/equipment is missing, system prompts before starting.

---

# **B. Guided Coaching Flow**

### **GC-1 – Launch a Guided Session**

**As Chris, I want guided mode to load from any micro workout so I can follow structured, AI-timed steps.**

**Acceptance Criteria**

- Pre-start screen shows name, duration, equipment, progression level.
- Countdown or “Tap to Start.”
- Loads WebGPU scene, HUD, and audio engines.

---

### **GC-2 – View Current Exercise Information**

**As Chris, I want clear instructions for what I should be doing right now.**

**Acceptance Criteria**

- HUD shows: exercise name, reps/time, load, short cue.
- Diegetic visuals pulse to tempo.
- HUD + visuals stay in sync.

---

### **GC-3 – See Upcoming Exercise**

**As Chris, I want a preview of the next exercise so I can prepare.**

**Acceptance Criteria**

- HUD shows “Next: \_\_\_” during current step or rest.
- 3-second transition cue.
- Final step shows “Last exercise.”

---

### **GC-4 – Wizard-Style Step Flow**

**As Chris, I want the workout to guide me step-by-step in a clean wizard-like sequence.**

**Acceptance Criteria**

- Flow: **setup → work → rest → work → rest → … → summary**.
- Smooth animated transitions.
- Supports next/previous step navigation.

---

### **GC-5 – Pause / Resume / Skip Controls**

**As Chris, I want to control the session without losing progress.**

**Acceptance Criteria**

- Pause freezes timers + visuals + optional music dimming.
- Resume restores state.
- Skip/Back steps available via mini toolbar.

---

# **C. Timers & Reps Engine**

### **TE-1 – Timed Intervals (Tabata Style)**

**As Chris, I want automatic work/rest intervals so I can train hands-free.**

**Acceptance Criteria**

- Work/rest durations run automatically.
- HUD + voice announce “Work,” “Rest.”
- WebGPU visuals increase/decrease intensity.

---

### **TE-2 – Tempo-Synced Rep Counting**

**As Chris, I want paced reps so I can maintain consistent tempo.**

**Acceptance Criteria**

- Tempo defines down/hold/up durations.
- Voice cues match tempo exactly.
- Automatic rep counting.

---

### **TE-3 – Adjustable Rest Times**

**As Chris, I want to adjust rest durations to match how I feel.**

**Acceptance Criteria**

- Editable before workout (global rest setting).
- In-session +/-5s adjustments for next rest interval.
- HUD updates instantly.

---

### **TE-4 – Overall Workout Progress**

**As Chris, I want to know how much of the workout is complete.**

**Acceptance Criteria**

- HUD: elapsed time, remaining time, progress bar.
- Auto summary when workflow ends.

---

# **D. Coaching Instructions & Feedback**

### **CF-1 – Voice Cues for Transitions**

**As Chris, I want audio cues so I don’t need to watch the screen constantly.**

**Acceptance Criteria**

- Announces exercise name, reps/time, load, rest transitions.
- Respects phone/system mute settings.

---

### **CF-2 – Motivational Messages**

**As Chris, I want encouraging messages so I stay motivated.**

**Acceptance Criteria**

- Delivered at logical intensity moments.
- Level adjustable.
- Never overlaps with other voice cues.

---

### **CF-3 – Up/Down Tempo Coaching**

**As Chris, I want clear pacing cues to help maintain form.**

**Acceptance Criteria**

- “Down… hold… up…” synced to tempo.
- WebGPU visuals pulse to match phases.
- Auto-updates if tempo changes.

---

# **E. WebGPU Coach & Diegetic Visuals**

### **VC-1 – Tempo & Intensity Animations**

**As Chris, I want high-energy visuals that express tempo without a character avatar.**

**Acceptance Criteria**

- Liquid/arcade-style pulses, waves, bursts.
- Slow vs. fast animations for intensity changes.
- Smooth loops.

---

### **VC-2 – Progression Variants**

**As Chris, I want to switch between easier or harder variants.**

**Acceptance Criteria**

- Toggles: Easy / Standard / Hard.
- HUD updates description + load guidance.
- Visuals adjust intensity cues.

---

# **F. Micro Workout Configuration**

### **MW-1 – Micro Workout Structure**

**As Chris, I want each workout to define exercises, timing, rest, tempo, and load so the coach knows what to do.**

**Acceptance Criteria**

- Config includes all parameters needed for guidance.
- Validated before session starts.

---

### **MW-2 – Edit Workouts**

**As Chris, I want to modify a workout to match my fitness level.**

**Acceptance Criteria**

- Edit reps/sets/rest/load/tempo.
- Save changes or “Save as new.”
- Guided flow updates accordingly.

---

### **MW-3 – Auto Generate Coaching Timeline**

**As Chris, I want the system to translate config into a guided flow automatically.**

**Acceptance Criteria**

- Generates steps (ex → rest → ex).
- Auto-generates voice cues + visuals mapping.
- Clear errors if config incomplete.

---

# **G. Music Integration**

_(MU-1 and MU-2 removed as requested.)_

### **MU-3 – Music Ducking for Voice Cues**

**As Chris, I want my phone’s music to subtly lower during instructions so I can hear prompts clearly.**

**Acceptance Criteria**

- Ducking before cues, restore after.
- Toggle available in settings.

---

# **H. Game UI Layers**

### **UI-1 – Diegetic WebGPU UI**

**As Chris, I want workout feedback to appear inside the 3D scene.**

**Acceptance Criteria**

- In-scene pulse rings, intensity flares, tempo arcs.
- Synced with HUD and tempo engine.

---

### **UI-2 – HUD Overlay**

**As Chris, I want a clean HUD showing essential information.**

**Acceptance Criteria**

- Current exercise, interval countdown, total time, progress bar.
- Responsive across devices.

---

### **UI-3 – Mini Toolbar (Center Bottom HUD)**

**As Chris, I want quick access to core controls during the workout.**

**Acceptance Criteria**

- Buttons: **Pause/Play**, **Back**, **Forward**.
- Displays a step-completion minimap.
- Nonintrusive placement centered at bottom.

---

### **UI-4 – Meta UI Summary**

**As Chris, I want a detailed summary when I finish.**

**Acceptance Criteria**

- Time, reps, sets, XP, calories, achievements.
- Options: save, favourite, share, cooldown.

---

### **UI-5 – System UI for Global Controls**

**As Chris, I want consistent navigation and global settings.**

**Acceptance Criteria**

- Back/exit, settings, help.
- Exit confirmation.

---

# **I. Quick-Start Mode**

### **QS-1 – Quick-Start Entry Point**

**As Chris, I want a fast way to start training with minimal input.**

**Acceptance Criteria**

- Prominent button on home screen.
- Modal for duration, goal, equipment.
- “Start Now” with defaults.

---

### **QS-2 – Auto-Generated Quick-Start Workout**

**As Chris, I want the system to build a workout based on my quick-start choices.**

**Acceptance Criteria**

- Generates appropriate exercises.
- Shows a short preview.
- Launches guided flow immediately.

---

### **QS-3 – One-Tap Repeat of Last Quick-Start**

**As Chris, I want to quickly repeat the last auto-generated workout.**

**Acceptance Criteria**

- “Repeat Last Quick Start” visible if data exists.
- Starts instantly, bypassing config.
