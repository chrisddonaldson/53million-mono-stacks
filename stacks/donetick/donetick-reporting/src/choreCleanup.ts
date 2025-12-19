/**
 * Chore Cleanup Logic
 * Handles rescheduling and priority adjustment for overdue chores
 */

import { Chore, FrequencyType } from './types.js';
import { logger } from './logger.js';

/**
 * Configuration constants for cleanup behavior
 */
export const CLEANUP_CONFIG = {
  /** Maximum hours a chore should be overdue before being rescheduled from today */
  MAX_OVERDUE_HOURS: 72,

  /** Priority adjustment thresholds based on overdue hours */
  PRIORITY_THRESHOLDS: [
    { maxHours: 24, adjustment: 0 },
    { maxHours: 72, adjustment: 1 },
    { maxHours: Infinity, adjustment: 2 },
  ],
} as const;

/**
 * Result of analyzing a chore for cleanup
 */
export interface ChoreCleanupAnalysis {
  chore: Chore;
  isOverdue: boolean;
  overdueHours: number;
  needsRescheduling: boolean;
  needsPriorityAdjustment: boolean;
  suggestedNextDueDate?: string;
  suggestedPriority?: number;
}

/**
 * Summary of cleanup operation results
 */
export interface CleanupSummary {
  totalChores: number;
  overdueChores: number;
  rescheduled: number;
  priorityUpgraded: number;
}

/**
 * Calculates how many hours a chore is overdue
 * @param chore - The chore to check
 * @returns Number of hours overdue (0 if not overdue or no due date)
 */
export function calculateOverdueHours(chore: Chore): number {
  if (!chore.nextDueDate) {
    logger.debug(`Chore ${chore.id} (${chore.name}) has no due date`);
    return 0;
  }

  const now = new Date();
  const dueDate = new Date(chore.nextDueDate);

  if (isNaN(dueDate.getTime())) {
    logger.warn(`Chore ${chore.id} (${chore.name}) has invalid due date: ${chore.nextDueDate}`);
    return 0;
  }

  if (dueDate >= now) {
    logger.debug(`Chore ${chore.id} (${chore.name}) is not overdue`);
    return 0;
  }

  const overdueMs = now.getTime() - dueDate.getTime();
  const overdueHours = overdueMs / (1000 * 60 * 60);

  logger.debug(`Chore ${chore.id} (${chore.name}) is ${overdueHours.toFixed(1)} hours overdue`);
  return overdueHours;
}

/**
 * Calculates priority adjustment based on how overdue a chore is
 * @param overdueHours - Number of hours the chore is overdue
 * @returns Priority adjustment to add to current priority
 */
export function calculatePriorityAdjustment(overdueHours: number): number {
  for (const threshold of CLEANUP_CONFIG.PRIORITY_THRESHOLDS) {
    if (overdueHours < threshold.maxHours) {
      return threshold.adjustment;
    }
  }

  // Fallback to maximum adjustment
  return CLEANUP_CONFIG.PRIORITY_THRESHOLDS[CLEANUP_CONFIG.PRIORITY_THRESHOLDS.length - 1]
    .adjustment;
}

/**
 * Calculates the next due date based on frequency type and frequency
 * @param frequencyType - The type of frequency (daily, weekly, etc.)
 * @param frequency - The frequency value
 * @param fromDate - The date to calculate from (defaults to now)
 * @returns ISO string of the next due date
 */
export function calculateNextDueDate(
  frequencyType: FrequencyType,
  frequency: number,
  fromDate: Date = new Date(),
): string {
  const nextDue = new Date(fromDate);

  switch (frequencyType) {
    case 'once':
      // For one-time chores, set to tomorrow
      nextDue.setDate(nextDue.getDate() + 1);
      break;

    case 'daily':
      nextDue.setDate(nextDue.getDate() + frequency);
      break;

    case 'weekly':
      nextDue.setDate(nextDue.getDate() + frequency * 7);
      break;

    case 'monthly':
      nextDue.setMonth(nextDue.getMonth() + frequency);
      break;

    case 'yearly':
      nextDue.setFullYear(nextDue.getFullYear() + frequency);
      break;

    case 'interval':
      // For interval-based, treat as days
      nextDue.setDate(nextDue.getDate() + frequency);
      break;

    default:
      logger.warn(`Unknown frequency type: ${frequencyType}, defaulting to 1 day`);
      nextDue.setDate(nextDue.getDate() + 1);
  }

  return nextDue.toISOString();
}

/**
 * Analyzes a chore to determine if it needs cleanup
 * @param chore - The chore to analyze
 * @returns Analysis result with recommendations
 */
export function analyzeChore(chore: Chore): ChoreCleanupAnalysis {
  const overdueHours = calculateOverdueHours(chore);
  const isOverdue = overdueHours > 0;

  if (!isOverdue) {
    return {
      chore,
      isOverdue: false,
      overdueHours: 0,
      needsRescheduling: false,
      needsPriorityAdjustment: false,
    };
  }

  // Determine if rescheduling is needed
  const needsRescheduling = overdueHours > CLEANUP_CONFIG.MAX_OVERDUE_HOURS;

  // Calculate priority adjustment
  const priorityAdjustment = calculatePriorityAdjustment(overdueHours);
  const needsPriorityAdjustment = priorityAdjustment > 0;
  const suggestedPriority = needsPriorityAdjustment
    ? chore.priority + priorityAdjustment
    : undefined;

  // Calculate new due date if rescheduling
  const suggestedNextDueDate = needsRescheduling
    ? calculateNextDueDate(chore.frequencyType, chore.frequency)
    : undefined;

  return {
    chore,
    isOverdue,
    overdueHours,
    needsRescheduling,
    needsPriorityAdjustment,
    suggestedNextDueDate,
    suggestedPriority,
  };
}

/**
 * Analyzes all chores and returns those needing cleanup
 * @param chores - Array of chores to analyze
 * @returns Array of analyses for chores needing updates
 */
export function analyzeChores(chores: Chore[]): ChoreCleanupAnalysis[] {
  logger.info(`Analyzing ${chores.length} chores for cleanup`);

  const analyses = chores.map((chore) => analyzeChore(chore));

  const needsCleanup = analyses.filter(
    (analysis) => analysis.needsRescheduling || analysis.needsPriorityAdjustment,
  );

  logger.info(`Found ${needsCleanup.length} chores needing cleanup`);

  return needsCleanup;
}

/**
 * Creates a summary of cleanup results
 * @param allChores - All chores that were scanned
 * @param analyses - Cleanup analyses that were performed
 * @returns Summary object
 */
export function createCleanupSummary(
  allChores: Chore[],
  analyses: ChoreCleanupAnalysis[],
): CleanupSummary {
  const overdueChores = analyses.filter((a) => a.isOverdue).length;
  const rescheduled = analyses.filter((a) => a.needsRescheduling).length;
  const priorityUpgraded = analyses.filter((a) => a.needsPriorityAdjustment).length;

  return {
    totalChores: allChores.length,
    overdueChores,
    rescheduled,
    priorityUpgraded,
  };
}

/**
 * Formats a cleanup summary for display
 * @param summary - The summary to format
 * @returns Formatted string
 */
export function formatCleanupSummary(summary: CleanupSummary): string {
  return `Cleanup complete
- Total chores scanned: ${summary.totalChores}
- Overdue chores: ${summary.overdueChores}
- Rescheduled: ${summary.rescheduled}
- Priority upgraded: ${summary.priorityUpgraded}`;
}
