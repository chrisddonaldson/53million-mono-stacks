export interface TTSOptions {
  rate?: number; // 0.1 - 10 (default 1)
  pitch?: number; // 0 - 2 (default 1)
  volume?: number; // 0 - 1 (default 1)
  lang?: string; // default 'en-US'
}

export class TTSEngine {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private activeResolve: (() => void) | null = null;
  private activeReject: ((reason?: unknown) => void) | null = null;
  private defaultOptions: Required<TTSOptions> = {
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    lang: "en-US",
  };

  constructor() {
    if (!("speechSynthesis" in window)) {
      console.error("Text-to-Speech not supported in this browser");
    }
    this.synth = window.speechSynthesis;
  }

  private activeUtterance: SpeechSynthesisUtterance | null = null; // Prevent GC

  init(): void {
    // Load voices (may be async in some browsers)
    const loadVoices = () => {
      const voices = this.synth.getVoices();
      
      // Prefer English voices
      this.voice = 
        voices.find(v => v.lang === "en-US" && v.name.includes("Male")) ||
        voices.find(v => v.lang === "en-US") ||
        voices.find(v => v.lang.startsWith("en")) ||
        voices[0] ||
        null;

      if (this.voice) {
        console.log("TTS Voice selected:", this.voice.name);
      }
    };

    // Voices might not be loaded immediately
    if (this.synth.getVoices().length > 0) {
      loadVoices();
    } else {
      this.synth.addEventListener("voiceschanged", loadVoices, { once: true });
    }
  }

  speak(text: string, options?: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error("TTS not available"));
        return;
      }

      // Ensure any pending speech resolves before starting a new utterance.
      this.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance = utterance; // Keep ref
      this.activeResolve = resolve;
      this.activeReject = reject;
      
      if (this.voice) {
        utterance.voice = this.voice;
      }

      utterance.rate = options?.rate ?? this.defaultOptions.rate;
      utterance.pitch = options?.pitch ?? this.defaultOptions.pitch;
      utterance.volume = options?.volume ?? this.defaultOptions.volume;
      utterance.lang = options?.lang ?? this.defaultOptions.lang;

      utterance.onend = () => {
        this.activeUtterance = null;
        this.activeResolve = null;
        this.activeReject = null;
        resolve();
      };
      utterance.onerror = (event) => {
        console.error("TTS error:", event);
        this.activeUtterance = null;
        this.activeResolve = null;
        this.activeReject = null;
        reject(event);
      };

      this.synth.speak(utterance);
    });
  }

  cancel(): void {
    if (this.activeResolve) {
      this.activeResolve();
    }
    this.activeResolve = null;
    this.activeReject = null;
    if (this.activeUtterance) {
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      this.activeUtterance = null;
    }
    this.synth?.cancel();
  }

  pause(): void {
    this.synth?.pause();
  }

  resume(): void {
    this.synth?.resume();
  }

  isSpeaking(): boolean {
    return this.synth?.speaking || false;
  }

  setDefaultOptions(options: Partial<TTSOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }
}
