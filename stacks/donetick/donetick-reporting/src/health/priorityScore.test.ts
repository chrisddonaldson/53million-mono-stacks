import { describe, it, expect } from 'vitest';
import {
  calculateChorePriorityPenalty,
  calculatePriorityPenalty,
  DEFAULT_PRIORITY_CONFIG,
} from './priorityScore.js';
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

describe('calculateChorePriorityPenalty', () => {
  it('should apply -15 penalty for priority 1 (urgent)', () => {
    const chore = createMockChore({ priority: 1 });
    expect(calculateChorePriorityPenalty(chore)).toBe(-15);
  });

  it('should apply -9 penalty for priority 2 (high)', () => {
    const chore = createMockChore({ priority: 2 });
    expect(calculateChorePriorityPenalty(chore)).toBe(-9);
  });

  it('should apply -3 penalty for priority 3 (medium)', () => {
    const chore = createMockChore({ priority: 3 });
    expect(calculateChorePriorityPenalty(chore)).toBe(-3);
  });

  it('should apply 0 penalty for priority 4+ (low)', () => {
    const chore4 = createMockChore({ priority: 4 });
    expect(calculateChorePriorityPenalty(chore4)).toBe(0);

    const chore5 = createMockChore({ priority: 5 });
    expect(calculateChorePriorityPenalty(chore5)).toBe(0);
  });

  it('should use default penalty for unknown priority levels', () => {
    const chore = createMockChore({ priority: 99 });
    expect(calculateChorePriorityPenalty(chore)).toBe(0);
  });

  it('should respect custom config', () => {
    const customConfig = {
      maxPenalty: -20,
      penaltyMap: {
        1: -10,
        2: -7,
        3: -3,
      },
      defaultPenalty: -1,
    };

    expect(calculateChorePriorityPenalty(createMockChore({ priority: 1 }), customConfig)).toBe(-10);
    expect(calculateChorePriorityPenalty(createMockChore({ priority: 2 }), customConfig)).toBe(-7);
    expect(calculateChorePriorityPenalty(createMockChore({ priority: 3 }), customConfig)).toBe(-3);
    expect(calculateChorePriorityPenalty(createMockChore({ priority: 4 }), customConfig)).toBe(-1);
  });
});

describe('calculatePriorityPenalty', () => {
  it('should return 0 for empty chore list', () => {
    expect(calculatePriorityPenalty([])).toBe(0);
  });

  it('should return 0 for chores with low priority', () => {
    const chores = [
      createMockChore({ priority: 4 }),
      createMockChore({ priority: 5 }),
      createMockChore({ priority: 10 }),
    ];
    expect(calculatePriorityPenalty(chores)).toBe(0);
  });

  it('should sum penalties for multiple chores', () => {
    const chores = [
      createMockChore({ priority: 1 }), // -15
      createMockChore({ priority: 2 }), // -9
      createMockChore({ priority: 3 }), // -3
    ];
    expect(calculatePriorityPenalty(chores)).toBe(-27);
  });

  it('should cap total penalty at maxPenalty', () => {
    // Create many urgent chores
    const chores = Array.from(
      { length: 10 },
      () => createMockChore({ priority: 1 }), // -15 each
    );
    // 10 * -15 = -150, but should be capped at -60
    expect(calculatePriorityPenalty(chores)).toBe(-60);
  });

  it('should handle mixed priorities', () => {
    const chores = [
      createMockChore({ priority: 1 }), // -15
      createMockChore({ priority: 2 }), // -9
      createMockChore({ priority: 3 }), // -3
      createMockChore({ priority: 4 }), // 0
      createMockChore({ priority: 1 }), // -15
    ];
    expect(calculatePriorityPenalty(chores)).toBe(-42);
  });

  it('should respect custom maxPenalty', () => {
    const customConfig = {
      ...DEFAULT_PRIORITY_CONFIG,
      maxPenalty: -10,
    };

    const chores = Array.from(
      { length: 5 },
      () => createMockChore({ priority: 1 }), // -15 each
    );
    // 5 * -15 = -75, but should be capped at -10
    expect(calculatePriorityPenalty(chores, customConfig)).toBe(-10);
  });

  it('should not cap if total is above maxPenalty', () => {
    const chores = [
      createMockChore({ priority: 3 }), // -3
      createMockChore({ priority: 3 }), // -3
    ];
    expect(calculatePriorityPenalty(chores)).toBe(-6);
  });
});
