import type { Chore } from '../types.js';

export interface PriorityScoreConfig {
  /**
   * Maximum total penalty cap for priority pressure in a room
   * @default -20
   */
  maxPenalty: number;

  /**
   * Priority level penalties
   * Maps priority values to their penalty scores
   * Higher priority = higher penalty (more stress/urgency)
   * @default { 1: -5, 2: -3, 3: -1, default: 0 }
   */
  penaltyMap: Record<number, number>;

  /**
   * Default penalty for unknown priority levels
   * @default 0
   */
  defaultPenalty: number;
}

export const DEFAULT_PRIORITY_CONFIG: PriorityScoreConfig = {
  maxPenalty: -60,
  penaltyMap: {
    1: -15, // Urgent (priority 1 is highest in DoneTick)
    2: -9, // High
    3: -3, // Medium
    // priority 4+ = low, no penalty
  },
  defaultPenalty: 0,
};

/**
 * Calculate the penalty for a single chore based on its priority
 */
export function calculateChorePriorityPenalty(
  chore: Chore,
  config: PriorityScoreConfig = DEFAULT_PRIORITY_CONFIG,
): number {
  const priority = chore.priority;

  // Look up penalty in map, fall back to default
  const penalty = config.penaltyMap[priority] ?? config.defaultPenalty;

  return penalty;
}

/**
 * Calculate the total priority penalty for a list of chores
 * Returns a negative number (penalty) capped by maxPenalty
 */
export function calculatePriorityPenalty(
  chores: Chore[],
  config: PriorityScoreConfig = DEFAULT_PRIORITY_CONFIG,
): number {
  let totalPenalty = 0;

  for (const chore of chores) {
    const penalty = calculateChorePriorityPenalty(chore, config);
    totalPenalty += penalty;
  }

  // Apply cap (both are negative, so we use Math.max to ensure we don't exceed the cap)
  return Math.max(totalPenalty, config.maxPenalty);
}
