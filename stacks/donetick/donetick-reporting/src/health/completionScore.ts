import type { Chore } from '../types.js';

export interface CompletionScoreConfig {
  /**
   * Maximum contribution from completion performance
   * @default 30
   */
  maxScore: number;

  /**
   * Default score when no completion data exists
   * @default 15
   */
  defaultScore: number;
}

export const DEFAULT_COMPLETION_CONFIG: CompletionScoreConfig = {
  maxScore: 30,
  defaultScore: 10,
};

/**
 * Calculate completion performance score for a list of chores
 *
 * This reflects whether chores are actually being completed on time.
 * Currently returns a neutral default since we don't have historical completion data.
 *
 * Future enhancement: Track actual completion history and calculate:
 *   completion_ratio = completed_on_time / expected_completions
 *   completion_score = clamp(completion_ratio * maxScore, 0, maxScore)
 *
 * @param _chores - List of chores to analyze (unused until completion history is available)
 * @param config - Configuration for completion scoring
 * @returns A positive score contribution (0 to maxScore)
 */
export function calculateCompletionScore(
  _chores: Chore[],
  config: CompletionScoreConfig = DEFAULT_COMPLETION_CONFIG,
): number {
  // TODO: When completion history is available, calculate actual ratio
  // For now, return neutral default as specified in ticket
  return config.defaultScore;
}
