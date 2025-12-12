
import { createSignal, onCleanup } from "solid-js";

export function useAutoRefresh(intervalMs: number) {
  const [tick, setTick] = createSignal(0);

  const timer = setInterval(() => {
    setTick((t) => t + 1);
  }, intervalMs);

  onCleanup(() => clearInterval(timer));

  return tick;
}
