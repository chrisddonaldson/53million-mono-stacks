/**
 * DoneTick Reporting Library
 * Main entry point for the library
 */

export { DoneTickClient } from './client.js';
export {
  Chore,
  ChoresResponse,
  DoneTickConfig,
  DoneTickError,
  Assignee,
  Label,
  FrequencyType,
  AssignStrategy,
} from './types.js';
export { Logger, LogLevel, logger } from './logger.js';
export {
  calculateOverdueHours,
  calculatePriorityAdjustment,
  calculateNextDueDate,
  analyzeChore,
  analyzeChores,
  createCleanupSummary,
  formatCleanupSummary,
  CLEANUP_CONFIG,
  ChoreCleanupAnalysis,
  CleanupSummary,
} from './choreCleanup.js';
export {
  calculateRoomHealth,
  calculateRoomHealthScores,
  getHealthLabel,
  RoomHealthScore,
  RoomHealthConfig,
  OverdueScoreConfig,
  PriorityScoreConfig,
  CompletionScoreConfig,
  DEFAULT_OVERDUE_CONFIG,
  DEFAULT_PRIORITY_CONFIG,
  DEFAULT_COMPLETION_CONFIG,
} from './health/index.js';
