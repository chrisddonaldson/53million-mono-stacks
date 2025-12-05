import { createStore } from "solid-js/store";
import type { GuidedSession, SessionSettings, SessionStep, SessionStats } from "../types/session";

interface SessionStoreState {
  currentSession: GuidedSession | null;
}

const defaultSettings: SessionSettings = {
  globalRestTime: 90,
  voiceEnabled: true,
  musicDucking: false,
  motivationalLevel: "medium",
  progressionVariant: "standard",
};

const [sessionStore, setSessionStore] = createStore<SessionStoreState>({
  currentSession: null,
});

// Actions
export const sessionActions = {
  createSession(
    workoutVariant: string,
    profile: string,
    timeline: SessionStep[],
    settings?: Partial<SessionSettings>
  ): void {
    const session: GuidedSession = {
      id: `session-${Date.now()}`,
      workoutVariant,
      profile,
      timeline,
      currentStepIndex: 0,
      state: "idle",
      startTime: Date.now(),
      elapsedTime: 0,
      pausedTime: 0,
      settings: { ...defaultSettings, ...settings },
    };

    setSessionStore("currentSession", session);
  },

  startSession(): void {
    if (sessionStore.currentSession) {
      setSessionStore("currentSession", "state", "active");
      setSessionStore("currentSession", "startTime", Date.now());
    }
  },

  pauseSession(): void {
    if (sessionStore.currentSession) {
      setSessionStore("currentSession", "state", "paused");
    }
  },

  resumeSession(): void {
    if (sessionStore.currentSession && sessionStore.currentSession.state === "paused") {
      setSessionStore("currentSession", "state", "active");
    }
  },

  nextStep(): void {
    if (!sessionStore.currentSession) return;

    const nextIndex = sessionStore.currentSession.currentStepIndex + 1;
    if (nextIndex < sessionStore.currentSession.timeline.length) {
      setSessionStore("currentSession", "currentStepIndex", nextIndex);
    } else {
      this.completeSession();
    }
  },

  previousStep(): void {
    if (!sessionStore.currentSession) return;

    const prevIndex = sessionStore.currentSession.currentStepIndex - 1;
    if (prevIndex >= 0) {
      setSessionStore("currentSession", "currentStepIndex", prevIndex);
    }
  },

  skipExercise(): void {
    // Skip to the next non-rest step
    if (!sessionStore.currentSession) return;

    let nextIndex = sessionStore.currentSession.currentStepIndex + 1;
    while (
      nextIndex < sessionStore.currentSession.timeline.length &&
      sessionStore.currentSession.timeline[nextIndex].type === "rest"
    ) {
      nextIndex++;
    }

    if (nextIndex < sessionStore.currentSession.timeline.length) {
      setSessionStore("currentSession", "currentStepIndex", nextIndex);
    }
  },

  completeSession(): void {
    if (sessionStore.currentSession) {
      setSessionStore("currentSession", "state", "complete");
    }
  },

  endSession(): void {
    setSessionStore("currentSession", null);
  },

  updateElapsedTime(elapsed: number): void {
    if (sessionStore.currentSession) {
      setSessionStore("currentSession", "elapsedTime", elapsed);
    }
  },

  adjustRestTime(delta: number): void {
    if (sessionStore.currentSession) {
      const current = sessionStore.currentSession.settings.globalRestTime;
      const newRest = Math.max(30, Math.min(300, current + delta)); // 30s - 5min
      setSessionStore("currentSession", "settings", "globalRestTime", newRest);
    }
  },

  updateSettings(settings: Partial<SessionSettings>): void {
    if (sessionStore.currentSession) {
      setSessionStore("currentSession", "settings", (prev) => ({
        ...prev,
        ...settings,
      }));
    }
  },
};

// Getters (computed values)
export const sessionGetters = {
  getCurrentStep(): SessionStep | null {
    if (!sessionStore.currentSession) return null;
    return sessionStore.currentSession.timeline[sessionStore.currentSession.currentStepIndex];
  },

  getNextStep(): SessionStep | null {
    if (!sessionStore.currentSession) return null;
    const nextIndex = sessionStore.currentSession.currentStepIndex + 1;
    return sessionStore.currentSession.timeline[nextIndex] || null;
  },

  getProgress(): number {
    if (!sessionStore.currentSession) return 0;
    const total = sessionStore.currentSession.timeline.length;
    const current = sessionStore.currentSession.currentStepIndex + 1;
    return (current / total) * 100;
  },

  getTotalDuration(): number {
    if (!sessionStore.currentSession) return 0;
    return sessionStore.currentSession.timeline.reduce((sum, step) => sum + step.duration, 0);
  },

  getRemainingTime(): number {
    if (!sessionStore.currentSession) return 0;
    const remaining = sessionStore.currentSession.timeline
      .slice(sessionStore.currentSession.currentStepIndex)
      .reduce((sum, step) => sum + step.duration, 0);
    return remaining;
  },

  isActive(): boolean {
    return sessionStore.currentSession?.state === "active";
  },

  isPaused(): boolean {
    return sessionStore.currentSession?.state === "paused";
  },

  isComplete(): boolean {
    return sessionStore.currentSession?.state === "complete";
  },

  getSessionStats(): SessionStats | null {
    if (!sessionStore.currentSession) return null;

    const session = sessionStore.currentSession;
    let exercisesCompleted = 0;
    let totalSets = 0;
    let totalReps = 0;

    // Count completed exercises
    const completedSteps = session.timeline.slice(0, session.currentStepIndex);
    
    for (const step of completedSteps) {
      if (step.type === "work") {
        totalSets += 1;
        if (step.exercise) {
          totalReps += step.exercise.reps;
        }
      }
    }

    // Count unique exercises
    const uniqueExercises = new Set(
      completedSteps
        .filter(s => s.type === "work" && s.exerciseName)
        .map(s => s.exerciseName)
    );
    exercisesCompleted = uniqueExercises.size;

    // Rough calorie estimation: 5 calories per set
    const estimatedCalories = Math.round(totalSets * 5);

    // XP calculation: 10 XP per exercise, 5 XP per set
    const xpEarned = exercisesCompleted * 10 + totalSets * 5;

    return {
      totalDuration: session.elapsedTime,
      exercisesCompleted,
      totalSets,
      totalReps,
      estimatedCalories,
      xpEarned,
    };
  },
};

export { sessionStore };
