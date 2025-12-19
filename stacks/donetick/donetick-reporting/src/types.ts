/**
 * DoneTick API Types
 * Types for interacting with the DoneTick API
 */

/**
 * Represents a user assignee for a chore
 */
export interface Assignee {
  userId: number;
}

/**
 * Represents a label attached to a chore
 */
export interface Label {
  id: number;
  name: string;
  color: string;
  created_by: number;
}

/**
 * Frequency types for chores
 */
export type FrequencyType = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'interval';

/**
 * Assignment strategies for chores
 */
export type AssignStrategy = 'random' | 'least_completed' | 'least_assigned';

/**
 * Represents a chore in the DoneTick system
 */
export interface Chore {
  id: number;
  name: string;
  frequencyType: FrequencyType;
  frequency: number;
  frequencyMetadata: Record<string, unknown> | null;
  nextDueDate: string | null;
  isRolling: boolean;
  assignedTo: number;
  assignees: Assignee[];
  assignStrategy: AssignStrategy;
  isActive: boolean;
  notification: boolean;
  notificationMetadata: Record<string, unknown> | null;
  labels: unknown[] | null;
  labelsV2: Label[];
  circleId: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  thingChore: unknown | null;
  status: number;
  priority: number;
  description?: string;
  subTasks?: unknown[];
}

/**
 * API response wrapper for chores list
 */
export interface ChoresResponse {
  res: Chore[];
}

/**
 * Configuration for DoneTick client
 */
export interface DoneTickConfig {
  url: string;
  accessToken: string;
}

/**
 * Custom error class for DoneTick API errors
 */
export class DoneTickError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public cause?: unknown,
  ) {
    super(message);
    this.name = 'DoneTickError';
  }
}
