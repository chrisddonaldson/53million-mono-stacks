import { TTSEngine, type TTSOptions } from "./TTSEngine";
import type { VoiceCue } from "../../types/session";


export class VoiceCoach {
  private tts: TTSEngine;
  private cueQueue: Array<{ text: string; options?: TTSOptions }> = [];
  private isSpeaking: boolean = false;
  private isEnabled: boolean = true;

  constructor() {
    this.tts = new TTSEngine();
    this.tts.init();
  }

  async announce(cue: VoiceCue): Promise<void> {
    if (!this.isEnabled) return;

    this.cueQueue.push({
      text: cue.text,
      options: cue.options,
    });

    if (!this.isSpeaking) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    while (this.cueQueue.length > 0) {
      this.isSpeaking = true;
      const cue = this.cueQueue.shift()!;
      
      try {
        await this.tts.speak(cue.text, cue.options);
      } catch (error) {
        console.error("Voice cue failed:", error);
      }

      // Small delay between cues
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    this.isSpeaking = false;
  }

  async announceTempo(phase: string): Promise<void> {
    if (!this.isEnabled) return;

    const options: Record<string, TTSOptions> = {
      eccentric: { rate: 0.8, pitch: 0.9, volume: 0.8 },   // Down: Slower, lower
      concentric: { rate: 1.2, pitch: 1.1, volume: 0.8 },  // Up: Faster, higher
      hold: { rate: 0.8, pitch: 1.0, volume: 0.7 },        // Hold
      rest: { rate: 1.0, pitch: 1.0, volume: 0.7 },
    };

    const textMap: Record<string, string> = {
        eccentric: "Down",
        concentric: "Up",
        hold: "Hold",
        rest: "Rest"
    };

    const text = textMap[phase] || phase;
    const opts = options[phase] || { rate: 1.0 };

    await this.announce({
      text,
      time: 0,
      options: opts,
    });
  }

  async announceExercise(name: string, sets: number, reps: number, load?: string): Promise<void> {
    const text = load 
      ? `${name}, ${sets} sets of ${reps} reps at ${load}`
      : `${name}, ${sets} sets of ${reps} reps`;
    
    await this.announce({
      text,
      time: 0,
      options: { rate: 1.0, pitch: 1.0 },
    });
  }

  async announceTransition(type: "work" | "rest"): Promise<void> {
    const options: TTSOptions = type === "work"
      ? { rate: 1.2, pitch: 1.1, volume: 0.9 } // Energetic
      : { rate: 0.9, pitch: 0.9, volume: 0.7 }; // Calm

    await this.announce({
      text: type === "work" ? "Work!" : "Rest",
      time: 0,
      options,
    });
  }

  async announceSet(current: number, total: number): Promise<void> {
    await this.announce({
      text: `Set ${current} of ${total}`,
      time: 0,
      options: { rate: 1.1 },
    });
  }

  async announceMotivation(message: string): Promise<void> {
    await this.announce({
      text: message,
      time: 0,
      options: { rate: 1.1, pitch: 1.05, volume: 0.85 },
    });
  }

  async announceCountdown(seconds: number): Promise<void> {
    await this.announce({
      text: seconds.toString(),
      time: 0,
      options: { rate: 1.0, pitch: 1.0 },
    });
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearQueue();
    }
  }

  clearQueue(): void {
    this.cueQueue = [];
    this.tts.cancel();
    this.isSpeaking = false;
  }

  pause(): void {
    this.tts.pause();
  }

  resume(): void {
    this.tts.resume();
  }
}

// Motivational message pools
export const MOTIVATIONAL_MESSAGES = {
  start: [
    "Let's do this!",
    "Time to train!",
    "Ready to work!",
  ],
  midpoint: [
    "You're halfway there!",
    "Keep it up!",
    "Looking strong!",
  ],
  nearEnd: [
    "Almost done!",
    "Final push!",
    "You've got this!",
  ],
  complete: [
    "Workout complete!",
    "Great work!",
    "You crushed it!",
  ],
};
