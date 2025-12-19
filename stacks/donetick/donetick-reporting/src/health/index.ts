import type { Chore } from '../types.js';
import {
  calculateOverduePenalty,
  DEFAULT_OVERDUE_CONFIG,
  type OverdueScoreConfig,
} from './overdueScore.js';
import {
  calculatePriorityPenalty,
  DEFAULT_PRIORITY_CONFIG,
  type PriorityScoreConfig,
} from './priorityScore.js';
import {
  calculateCompletionScore,
  DEFAULT_COMPLETION_CONFIG,
  type CompletionScoreConfig,
} from './completionScore.js';

export interface RoomHealthConfig {
  overdue?: OverdueScoreConfig;
  priority?: PriorityScoreConfig;
  completion?: CompletionScoreConfig;
}

export interface RoomHealthScore {
  roomName: string;
  score: number;
  label: string;
  breakdown: {
    overduePenalty: number;
    priorityPenalty: number;
    completionScore: number;
  };
}

/**
 * Get the health label for a given score
 */
export function getHealthLabel(score: number): string {
  if (score >= 90) return 'Pristine';
  if (score >= 70) return 'Healthy';
  if (score >= 40) return 'Needs attention';
  return 'Unhealthy';
}

/**
 * Calculate the health score for a single room
 *
 * Health score is 0-100 where:
 * - 100 = pristine, no attention needed
 * - 70-89 = healthy, minor issues
 * - 40-69 = degraded, needs attention
 * - 0-39 = unhealthy, urgent
 *
 * @param roomName - Name of the room
 * @param chores - Chores in this room
 * @param options - Configuration and current time
 * @returns Room health score with breakdown
 */
export function calculateRoomHealth(
  roomName: string,
  chores: Chore[],
  options?: { now?: Date; config?: RoomHealthConfig },
): RoomHealthScore {
  const now = options?.now ?? new Date();
  const config = options?.config ?? {};

  // Handle empty rooms
  if (chores.length === 0) {
    return {
      roomName,
      score: 100,
      label: 'Pristine',
      breakdown: {
        overduePenalty: 0,
        priorityPenalty: 0,
        completionScore: 0,
      },
    };
  }

  // Calculate individual components
  const overduePenalty = calculateOverduePenalty(chores, {
    now,
    config: config.overdue ?? DEFAULT_OVERDUE_CONFIG,
  });

  const priorityPenalty = calculatePriorityPenalty(
    chores,
    config.priority ?? DEFAULT_PRIORITY_CONFIG,
  );

  const completionConfig = config.completion ?? DEFAULT_COMPLETION_CONFIG;
  const completionScore = calculateCompletionScore(chores, completionConfig);

  // Calculate final health score
  let health = 100 - completionConfig.defaultScore;
  health += overduePenalty; // negative penalty
  health += priorityPenalty; // negative penalty
  health += completionScore; // positive contribution

  // Clamp to 0-100
  health = Math.max(0, Math.min(100, health));

  return {
    roomName,
    score: Math.round(health),
    label: getHealthLabel(health),
    breakdown: {
      overduePenalty,
      priorityPenalty,
      completionScore,
    },
  };
}

/**
 * Calculate health scores for multiple rooms
 * Returns scores sorted by health (worst to best)
 */
export function calculateRoomHealthScores(
  roomChoresMap: Map<string, Chore[]>,
  options?: { now?: Date; config?: RoomHealthConfig },
): RoomHealthScore[] {
  const scores: RoomHealthScore[] = [];

  for (const [roomName, chores] of roomChoresMap.entries()) {
    scores.push(calculateRoomHealth(roomName, chores, options));
  }

  // Sort by score ascending (worst rooms first)
  scores.sort((a, b) => a.score - b.score);

  return scores;
}

// Re-export types and configs for convenience
export type { OverdueScoreConfig, PriorityScoreConfig, CompletionScoreConfig };
export { DEFAULT_OVERDUE_CONFIG, DEFAULT_PRIORITY_CONFIG, DEFAULT_COMPLETION_CONFIG };
