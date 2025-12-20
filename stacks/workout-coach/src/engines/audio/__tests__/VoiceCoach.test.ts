import { describe, expect, test, vi } from "vitest";
import { VoiceCoach } from "../VoiceCoach";
import type { TTSOptions } from "../TTSEngine";

class FakeTTSEngine {
  public speakCalls: string[] = [];
  private speaking = false;

  init(): void {}
  unlock(): Promise<void> {
    return Promise.resolve();
  }
  isSpeaking(): boolean {
    return this.speaking;
  }
  async speak(text: string, _options?: TTSOptions): Promise<void> {
    this.speaking = true;
    this.speakCalls.push(text);
    this.speaking = false;
  }
  cancel(): void {}
  pause(): void {}
  resume(): void {}
  resetIfIdle(): void {}
}

describe("VoiceCoach", () => {
  test("queues tempo cues in order", async () => {
    vi.useFakeTimers();
    const tts = new FakeTTSEngine();
    const coach = new VoiceCoach(tts as unknown as any);

    const first = coach.announceTempo("eccentric", 1);
    const second = coach.announceTempo("concentric", 1);

    await vi.runAllTimersAsync();
    await Promise.all([first, second]);

    expect(tts.speakCalls).toEqual(["1", "Lift..."]);
    vi.useRealTimers();
  });

  test("pads short concentric cue to avoid clipping", async () => {
    vi.useFakeTimers();
    const tts = new FakeTTSEngine();
    const coach = new VoiceCoach(tts as unknown as any);

    const speak = coach.announceTempo("concentric", 1);
    await vi.runAllTimersAsync();
    await speak;

    expect(tts.speakCalls[0]).toBe("Lift...");
    vi.useRealTimers();
  });
});
