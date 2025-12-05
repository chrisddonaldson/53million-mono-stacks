import { createStore } from "solid-js/store";

interface AudioSettings {
  voiceVolume: number; // 0-1
  musicDucking: boolean;
}

interface DisplaySettings {
  theme: "light" | "dark";
  hapticsEnabled: boolean;
}

interface WorkoutSettings {
  defaultRestTime: number; // seconds
  autoAdvance: boolean;
}

interface SettingsStoreState {
  audio: AudioSettings;
  display: DisplaySettings;
  workout: WorkoutSettings;
}

const [settingsStore, setSettingsStore] = createStore<SettingsStoreState>({
  audio: {
    voiceVolume: 0.8,
    musicDucking: true,
  },
  display: {
    theme: "dark",
    hapticsEnabled: true,
  },
  workout: {
    defaultRestTime: 90,
    autoAdvance: true,
  },
});

// Actions
export const settingsActions = {
  setAudioSettings(settings: Partial<AudioSettings>) {
    setSettingsStore("audio", (prev) => ({ ...prev, ...settings }));
    this.saveToLocalStorage();
  },

  setDisplaySettings(settings: Partial<DisplaySettings>) {
    setSettingsStore("display", (prev) => ({ ...prev, ...settings }));
    this.saveToLocalStorage();
  },

  setWorkoutSettings(settings: Partial<WorkoutSettings>) {
    setSettingsStore("workout", (prev) => ({ ...prev, ...settings }));
    this.saveToLocalStorage();
  },

  saveToLocalStorage() {
    try {
      localStorage.setItem("workout-coach-settings", JSON.stringify(settingsStore));
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  },

  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem("workout-coach-settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettingsStore(parsed);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  },

  resetToDefaults() {
    setSettingsStore({
      audio: {
        voiceVolume: 0.8,
        musicDucking: true,
      },
      display: {
        theme: "dark",
        hapticsEnabled: true,
      },
      workout: {
        defaultRestTime: 90,
        autoAdvance: true,
      },
    });
    this.saveToLocalStorage();
  },
};

// Initialize from localStorage
settingsActions.loadFromLocalStorage();

export { settingsStore };
