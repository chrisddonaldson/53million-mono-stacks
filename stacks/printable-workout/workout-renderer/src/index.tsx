import { render } from 'solid-js/web';
import defaultConfigRaw from './defaultConfig';
import type { WorkoutConfig } from './types';
import { WorkoutRootView } from './WorkoutView';

export type { WorkoutConfig, WorkoutGroup, Workout, SubSection, Exercise } from './types';
export const defaultConfig = defaultConfigRaw as unknown as WorkoutConfig;

export function renderWorkout(el: HTMLElement, config: WorkoutConfig = defaultConfig) {
  if (!el) throw new Error('renderWorkout: target element is required');
  return render(() => <WorkoutRootView config={config} />, el);
}
