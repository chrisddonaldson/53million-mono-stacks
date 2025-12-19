import type { Chore } from '../types.js';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

export interface OverdueScoreConfig {
  /**
   * Maximum total penalty cap for overdue chores in a room
   * @default -40
   */
  maxPenalty: number;

  /**
   * Penalty tiers based on overdue hours
   * @default { tier1: { hours: 24, penalty: -1 }, tier2: { hours: 72, penalty: -3 }, tier3: { penalty: -5 } }
   */
  tiers: {
    tier1: { hours: number; penalty: number };
    tier2: { hours: number; penalty: number };
    tier3: { penalty: number };
  };
}

export const DEFAULT_OVERDUE_CONFIG: OverdueScoreConfig = {
  maxPenalty: -40,
  tiers: {
    tier1: { hours: 24, penalty: -1 },
    tier2: { hours: 72, penalty: -3 },
    tier3: { penalty: -5 },
  },
};

/**
 * Calculate the overdue hours for a single chore
 */
export function calculateOverdueHours(chore: Chore, now = new Date()): number {
  if (!chore.nextDueDate) {
    return 0;
  }

  const dueDate = new Date(chore.nextDueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return 0;
  }

  const diffMs = now.getTime() - dueDate.getTime();
  const diffHours = diffMs / MILLISECONDS_PER_HOUR;

  // Only count positive overdue hours (negative means not yet due)
  return Math.max(0, diffHours);
}

/**
 * Calculate the penalty for a single overdue chore based on how overdue it is
 */
export function calculateChorePenalty(
  overdueHours: number,
  config: OverdueScoreConfig = DEFAULT_OVERDUE_CONFIG,
): number {
  if (overdueHours <= 0) {
    return 0;
  }

  if (overdueHours <= config.tiers.tier1.hours) {
    return config.tiers.tier1.penalty;
  }

  if (overdueHours <= config.tiers.tier2.hours) {
    return config.tiers.tier2.penalty;
  }

  return config.tiers.tier3.penalty;
}

/**
 * Calculate the total overdue penalty for a list of chores
 * Returns a negative number (penalty) capped by maxPenalty
 */
export function calculateOverduePenalty(
  chores: Chore[],
  options?: { now?: Date; config?: OverdueScoreConfig },
): number {
  const now = options?.now ?? new Date();
  const config = options?.config ?? DEFAULT_OVERDUE_CONFIG;

  let totalPenalty = 0;

  for (const chore of chores) {
    const overdueHours = calculateOverdueHours(chore, now);
    const penalty = calculateChorePenalty(overdueHours, config);
    totalPenalty += penalty;
  }

  // Apply cap (both are negative, so we use Math.max to ensure we don't exceed the cap)
  return Math.max(totalPenalty, config.maxPenalty);
}
