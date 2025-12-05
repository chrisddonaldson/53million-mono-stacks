export type TimerMode = "countup" | "countdown";

export class IntervalTimer {
  private startTime: number = 0;
  private pauseTime: number = 0;
  private elapsed: number = 0;
  private rafId: number | null = null;
  private isPaused: boolean = false;
  private mode: TimerMode = "countup";
  private targetDuration: number = 0; // For countdown mode

  constructor(mode: TimerMode = "countup", duration: number = 0) {
    this.mode = mode;
    this.targetDuration = duration;
  }

  start(onTick: (elapsed: number, remaining: number) => void, onComplete?: () => void): void {
    this.startTime = performance.now();
    this.isPaused = false;

    const tick = (now: number) => {
      if (this.isPaused) return;

      const totalElapsed = (now - this.startTime) / 1000 + this.elapsed;
      const remaining = this.mode === "countdown" 
        ? Math.max(0, this.targetDuration - totalElapsed)
        : 0;

      onTick(totalElapsed, remaining);

      // Check if countdown completed
      if (this.mode === "countdown" && totalElapsed >= this.targetDuration) {
        this.stop();
        onComplete?.();
        return;
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  pause(): void {
    if (this.isPaused) return;
    
    this.isPaused = true;
    this.pauseTime = performance.now();
    this.elapsed += (this.pauseTime - this.startTime) / 1000;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume(onTick: (elapsed: number, remaining: number) => void, onComplete?: () => void): void {
    if (!this.isPaused) return;

    this.isPaused = false;
    this.start(onTick, onComplete);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isPaused = false;
  }

  reset(): void {
    this.stop();
    this.startTime = 0;
    this.pauseTime = 0;
    this.elapsed = 0;
  }

  getElapsed(): number {
    if (this.isPaused) {
      return this.elapsed;
    }
    return this.elapsed + (performance.now() - this.startTime) / 1000;
  }

  getRemaining(): number {
    return this.mode === "countdown" 
      ? Math.max(0, this.targetDuration - this.getElapsed())
      : 0;
  }

  setDuration(duration: number): void {
    this.targetDuration = duration;
  }
}
