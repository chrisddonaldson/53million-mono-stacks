import type { ITTSEngine, TTSOptions } from "./types";

export class RemoteTTSEngine implements ITTSEngine {
  private apiUrl: string;
  private audioContext: AudioContext | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private isSpeakingFlag: boolean = false;
  private defaultOptions: Required<TTSOptions> = {
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    lang: "en-US",
    voice: ""
  };

  constructor(apiUrl: string = "http://localhost:3000") {
    this.apiUrl = apiUrl;
  }

  init(): void {
    // AudioContext usually needs user gesture anyway, so we just setup here
    console.log("[RemoteTTSEngine] Initialized with API URL:", this.apiUrl);
  }

  async unlock(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
    
    console.log("[RemoteTTSEngine] AudioContext unlocked ✅");
  }

  async speak(text: string, options?: TTSOptions): Promise<void> {
    if (!this.audioContext) {
      await this.unlock();
    }

    this.isSpeakingFlag = true;
    
    try {
      const response = await fetch(`${this.apiUrl}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voice: options?.voice || this.defaultOptions.voice
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

      return new Promise((resolve) => {
        const source = this.audioContext!.createBufferSource();
        source.buffer = audioBuffer;
        
        const gainNode = this.audioContext!.createGain();
        gainNode.gain.value = options?.volume ?? this.defaultOptions.volume;
        
        // Note: rate and pitch handling depends on what the remote API supports.
        // Piper usually does this server-side if requested, but our current API doesn't expose them.
        // We can use source.playbackRate for some control here if needed.
        source.playbackRate.value = options?.rate ?? this.defaultOptions.rate;

        source.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        this.activeSource = source;

        source.onended = () => {
          this.isSpeakingFlag = false;
          this.activeSource = null;
          resolve();
        };

        source.start(0);
      });
    } catch (error) {
      console.error("[RemoteTTSEngine] Failed to speak:", error);
      this.isSpeakingFlag = false;
      throw error;
    }
  }

  cancel(): void {
    if (this.activeSource) {
      this.activeSource.stop();
      this.activeSource = null;
    }
    this.isSpeakingFlag = false;
  }

  pause(): void {
    if (this.audioContext) {
      this.audioContext.suspend();
    }
  }

  resume(): void {
    if (this.audioContext) {
      this.audioContext.resume();
    }
  }

  isSpeaking(): boolean {
    return this.isSpeakingFlag;
  }

  setDefaultOptions(options: Partial<TTSOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  resetIfIdle(): void {
    // Not needed for Web Audio API implementation usually
  }
}
