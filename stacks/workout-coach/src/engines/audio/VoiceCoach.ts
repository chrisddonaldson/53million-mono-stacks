import type { ITTSEngine, TTSOptions } from "./types";
import { TTSEngine } from "./TTSEngine";
import type { VoiceCue } from "../../types/session";


export class VoiceCoach {
  private tts: ITTSEngine;
  private cueQueue: Array<{ text: string; options?: TTSOptions }> = [];
  private isEnabled: boolean = true;
  private queueVersion: number = 0;
  private masterVolume: number = 1;
  private lastAnnouncedTime: number = 0;
  private shortCueRegex = /^[A-Za-z]{1,4}$/;

  constructor(tts?: ITTSEngine) {
    this.tts = tts ?? new TTSEngine();
    this.tts.init();
  }

  /**
   * Unlock TTS with user gesture - MUST be called from click/touch handler
   */
  async unlock(): Promise<void> {
    await this.tts.unlock();
  }

  async announce(cue: VoiceCue): Promise<void> {
    if (!this.isEnabled) return;
    
    const now = performance.now();
    const timeSinceLastAnnounce = now - this.lastAnnouncedTime;
    const isSpeaking = this.tts.isSpeaking();
    // Don't cancel if actively speaking - let it finish naturally
    // Only cancel if it's been too long (stale queue)
    const shouldCancel = !isSpeaking && timeSinceLastAnnounce > 5000;
    
    console.log(`[VoiceCoach.announce] text="${cue.text}", isSpeaking=${isSpeaking}, timeSince=${timeSinceLastAnnounce.toFixed(0)}ms, shouldCancel=${shouldCancel}`);
    
    if (shouldCancel) {
      // Cancel and reset queue
      this.queueVersion += 1;
      this.tts.cancel();
      this.cueQueue = [];
    }
    
    const version = this.queueVersion;
    
    this.lastAnnouncedTime = now;
    
    // Add to queue
    this.cueQueue.push({
      text: cue.text,
      options: this.applyMasterVolume(cue.options),
    });
    
    // Only start processing if not already processing
    if (this.cueQueue.length === 1) {
      await this.processQueue(version);
    }
  }

  private async processQueue(version: number): Promise<void> {
    while (this.cueQueue.length > 0 && version === this.queueVersion) {
      const cue = this.cueQueue.shift()!;
      
      const speakText = this.extendShortCue(cue.text);
      
      console.log(`[VoiceCoach.processQueue] Speaking: "${speakText}"`);
      
      // Wait for any currently speaking utterance to finish
      while (this.tts.isSpeaking()) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      try {
        await this.tts.speak(speakText, cue.options);
        console.log(`[VoiceCoach.processQueue] Finished: "${cue.text}"`);
      } catch (error) {
        console.error("Voice cue failed:", error);
      }

      const postDelayMs = 100;
      await new Promise(resolve => setTimeout(resolve, postDelayMs));
      this.tts.resetIfIdle?.();
    }
  }

  async announceTempo(phase: string, rep?: number): Promise<void> {
    if (!this.isEnabled) return;

    const options: Record<string, TTSOptions> = {
      eccentric: { rate: 1.0, pitch: 1.0, volume: 1.0 },
      concentric: { rate: 1.0, pitch: 1.0, volume: 1.0 },
      hold: { rate: 1.0, pitch: 1.0, volume: 1.0 },
      rest: { rate: 1.0, pitch: 1.0, volume: 1.0 },
    };

    const textMap: Record<string, string> = {
        eccentric: "Down",
        concentric: "Lift",
        hold: "Hold",
        rest: "Rest"
    };

    let text = textMap[phase] || phase;
    
    // Replace "Down" with the rep number if provided
    if (phase === "eccentric" && rep !== undefined) {
      text = `${rep}`;
    }

    const opts = options[phase] || { rate: 1.0 };

    console.log(`[VoiceCoach] announceTempo: phase=${phase}, rep=${rep}, text="${text}"`);

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

  async announceRep(current: number, total?: number): Promise<void> {
    const text = total ? `${current} of ${total}` : `${current}`;
    await this.announce({
      text,
      time: 0,
      options: { rate: 1.1, pitch: 1.0 },
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
    this.queueVersion += 1;
    this.cueQueue = [];
    this.tts.cancel();
  }

  pause(): void {
    this.tts.pause();
  }

  resume(): void {
    this.tts.resume();
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  private applyMasterVolume(options?: TTSOptions): TTSOptions | undefined {
    if (!options) {
      return { volume: this.masterVolume };
    }
    const baseVolume = options.volume ?? 1;
    return { ...options, volume: Math.max(0, Math.min(1, baseVolume * this.masterVolume)) };
  }

  private isShortWord(text: string): boolean {
    const normalized = text.trim().replace(/[!?.]+$/g, "");
    return this.shortCueRegex.test(normalized);
  }

  private extendShortCue(text: string): string {
    if (!this.isShortWord(text)) {
      return text;
    }
    const normalized = text.trim().replace(/[!?.]+$/g, "");
    return `${normalized}...`;
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
