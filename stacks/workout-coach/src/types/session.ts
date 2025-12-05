// Guided session and workout flow types

import type { Exercise } from "./config";

export interface Tempo {
  down: number; // Eccentric phase (seconds)
  hold: number; // Isometric hold
  up: number; // Concentric phase
}

export interface VoiceCue {
  text: string;
  time: number; // Time offset in seconds when to trigger
  options?: {
    rate?: number; // Speech rate (0.1-10)
    pitch?: number; // Pitch (0-2)
    volume?: number; // Volume (0-1)
  };
}

export type StepType = "setup" | "warmup" | "work" | "rest" | "transition" | "summary";

export interface SessionStep {
  type: StepType;
  exercise?: Exercise;
  exerciseName?: string;
  duration: number; // In seconds (0 = indefinite)
  tempo?: Tempo;
  voiceCues: VoiceCue[];
  visualIntensity: number; // 0-1 for WebGPU rendering
  setNumber?: number;
  totalSets?: number;
  load?: string; // Calculated weight or "bodyweight"
}

export interface SessionSettings {
  globalRestTime: number; // Default rest between sets (seconds)
  voiceEnabled: boolean;
  musicDucking: boolean;
  motivationalLevel: "off" | "low" | "medium" | "high";
  progressionVariant: "easy" | "standard" | "hard";
}

export type SessionState = "idle" | "warmup" | "active" | "rest" | "paused" | "complete";

export interface GuidedSession {
  id: string;
  workoutVariant: string;
  profile: string;
  timeline: SessionStep[];
  currentStepIndex: number;
  state: SessionState;
  startTime: number; // Unix timestamp
  elapsedTime: number; // Total elapsed seconds
  pausedTime: number; // Total time spent paused
  settings: SessionSettings;
}

export interface SessionStats {
  totalDuration: number; // seconds
  exercisesCompleted: number;
  totalSets: number;
  totalReps: number;
  estimatedCalories: number;
  xpEarned: number;
}
