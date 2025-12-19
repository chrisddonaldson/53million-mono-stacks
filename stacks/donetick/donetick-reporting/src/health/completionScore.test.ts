import { describe, it, expect } from 'vitest';
import { calculateCompletionScore, DEFAULT_COMPLETION_CONFIG } from './completionScore.js';
import type { Chore } from '../types.js';

// Helper to create a mock chore
function createMockChore(overrides?: Partial<Chore>): Chore {
  return {
    id: 1,
    name: 'Test Chore',
    frequencyType: 'daily',
    frequency: 1,
    frequencyMetadata: null,
    nextDueDate: null,
    isRolling: false,
    assignedTo: 1,
    assignees: [],
    assignStrategy: 'random',
    isActive: true,
    notification: false,
    notificationMetadata: null,
    labels: null,
    labelsV2: [],
    circleId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 1,
    updatedBy: 1,
    thingChore: null,
    status: 1,
    priority: 3,
    ...overrides,
  };
}

describe('calculateCompletionScore', () => {
  it('should return default score when no completion data exists', () => {
    const chores = [createMockChore(), createMockChore()];
    expect(calculateCompletionScore(chores)).toBe(10);
  });

  it('should return default score for empty chore list', () => {
    expect(calculateCompletionScore([])).toBe(10);
  });

  it('should respect custom config defaultScore', () => {
    const customConfig = {
      maxScore: 30,
      defaultScore: 20,
    };

    const chores = [createMockChore()];
    expect(calculateCompletionScore(chores, customConfig)).toBe(20);
  });

  it('should use maxScore from config', () => {
    const customConfig = {
      maxScore: 40,
      defaultScore: 25,
    };

    const chores = [createMockChore()];
    expect(calculateCompletionScore(chores, customConfig)).toBe(25);
  });

  it('should handle default config', () => {
    const chores = [createMockChore()];
    expect(calculateCompletionScore(chores, DEFAULT_COMPLETION_CONFIG)).toBe(10);
  });

  // Future tests when completion history is implemented:
  // it('should calculate actual completion ratio when history is available', () => {
  //   // TODO: Implement when completion tracking is added
  // });
});
