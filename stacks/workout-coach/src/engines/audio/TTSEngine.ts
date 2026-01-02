import type { ITTSEngine, TTSOptions } from "./types";

export class TTSEngine implements ITTSEngine {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private activeResolve: (() => void) | null = null;
  private defaultOptions: Required<TTSOptions> = {
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    lang: "en-US",
    voice: ""
  };

  constructor() {
    if (!("speechSynthesis" in window)) {
      console.error("Text-to-Speech not supported in this browser");
    }
    this.synth = window.speechSynthesis;
  }

  private activeUtterance: SpeechSynthesisUtterance | null = null; // Prevent GC
  private isUnlocked: boolean = false;

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

  /**
   * MUST be called from a user gesture (click, touch, etc.)
   * This unlocks the Speech Synthesis API for subsequent calls
   */
  async unlock(): Promise<void> {
    if (this.isUnlocked) {
      console.log("[TTSEngine] Already unlocked, skipping");
      return;
    }
    
    console.log("[TTSEngine] Unlocking Speech Synthesis with user gesture");
    
    // Speak a very short, quiet utterance to unlock the API
    // Using a space instead of empty string because some browsers don't fire events for empty strings
    const silent = new SpeechSynthesisUtterance(' ');
    silent.volume = 0.01; // Very quiet but not silent
    silent.rate = 10; // Very fast
    
    return new Promise((resolve) => {
      let resolved = false;
      
      const finish = () => {
        if (resolved) return;
        resolved = true;
        this.isUnlocked = true;
        console.log("[TTSEngine] Speech Synthesis unlocked ✅");
        resolve();
      };
      
      silent.onend = finish;
      silent.onerror = (e) => {
        console.warn("[TTSEngine] Unlock error (continuing anyway):", e);
        finish();
      };
      
      // Fallback timeout in case events don't fire
      setTimeout(finish, 500);
      
      this.synth.speak(silent);
    });
  }

  speak(text: string, options?: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error("TTS not available"));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance = utterance; // Keep ref
      this.activeResolve = resolve;
      
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
        resolve();
      };
      utterance.onerror = async (event) => {
        console.error("TTS error:", event);
        
        // If 'not-allowed', try to resume and retry once
        if (event.error === 'not-allowed') {
          console.log("TTS not-allowed, attempting resume and retry...");
          try {
            this.synth.resume();
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Retry once
            const retryUtterance = new SpeechSynthesisUtterance(text);
            if (this.voice) retryUtterance.voice = this.voice;
            retryUtterance.rate = utterance.rate;
            retryUtterance.pitch = utterance.pitch;
            retryUtterance.volume = utterance.volume;
            retryUtterance.lang = utterance.lang;
            
            retryUtterance.onend = () => {
              this.activeUtterance = null;
              this.activeResolve = null;
              resolve();
            };
            retryUtterance.onerror = () => {
              console.error("TTS retry failed, skipping");
              this.activeUtterance = null;
              this.activeResolve = null;
              resolve(); // Resolve anyway to continue
            };
            
            this.synth.speak(retryUtterance);
          } catch (retryError) {
            console.error("TTS retry error:", retryError);
            this.activeUtterance = null;
            this.activeResolve = null;
            resolve(); // Resolve to continue queue
          }
        } else {
          this.activeUtterance = null;
          this.activeResolve = null;
          resolve(); // Resolve instead of reject to continue queue
        }
      };

      // CHROME WORKAROUND: Resume synthesis before speaking
      // Chrome can pause the synthesis queue between utterances
      if (this.synth.paused) {
        console.log("[TTSEngine] Synth was paused, resuming...");
        this.synth.resume();
      }

      // Safe reset: clear pending queue only when idle to avoid cutting audio
      if (this.synth.pending && !this.synth.speaking) {
        console.log("[TTSEngine] Clearing idle pending utterances...");
        this.synth.cancel();
      }
      
      console.log(`[TTSEngine] Speaking: "${text}"`);
      this.synth.speak(utterance);
    });
  }

  cancel(): void {
    if (this.activeResolve) {
      this.activeResolve();
    }
    this.activeResolve = null;
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
    if (this.synth) {
      this.synth.resume();
      // Wake up the engine with an empty utterance if idle
      if (!this.synth.speaking && !this.synth.pending) {
        const wakeUp = new SpeechSynthesisUtterance('');
        wakeUp.volume = 0;
        try {
          this.synth.speak(wakeUp);
        } catch (e) {
          // Ignore
        }
      }
    }
  }

  resetIfIdle(): void {
    if (!this.synth) return;
    if (!this.synth.speaking) {
      if (this.synth.pending) {
        this.synth.cancel();
      }
      this.synth.resume();
    }
  }

  isSpeaking(): boolean {
    return this.synth?.speaking || false;
  }

  setDefaultOptions(options: Partial<TTSOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }
}
