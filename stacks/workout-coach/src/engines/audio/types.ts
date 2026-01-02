
export interface TTSOptions {
  rate?: number; // 0.1 - 10 (default 1)
  pitch?: number; // 0 - 2 (default 1)
  volume?: number; // 0 - 1 (default 1)
  lang?: string; // default 'en-US'
  voice?: string; // optional voice model name
}

export interface ITTSEngine {
  init(): void;
  unlock(): Promise<void>;
  speak(text: string, options?: TTSOptions): Promise<void>;
  cancel(): void;
  pause(): void;
  resume(): void;
  isSpeaking(): boolean;
  setDefaultOptions(options: Partial<TTSOptions>): void;
  resetIfIdle?(): void;
}
