import { describe, it, expect } from 'vitest';
import {
  calculateOverdueHours,
  calculateChorePenalty,
  calculateOverduePenalty,
  DEFAULT_OVERDUE_CONFIG,
} from './overdueScore.js';
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

describe('calculateOverdueHours', () => {
  const now = new Date('2024-12-19T12:00:00Z');

  it('should return 0 for chores with no due date', () => {
    const chore = createMockChore({ nextDueDate: null });
    expect(calculateOverdueHours(chore, now)).toBe(0);
  });

  it('should return 0 for chores that are not yet due', () => {
    const chore = createMockChore({ nextDueDate: '2024-12-19T18:00:00Z' }); // 6 hours in future
    expect(calculateOverdueHours(chore, now)).toBe(0);
  });

  it('should calculate positive hours for overdue chores', () => {
    const chore = createMockChore({ nextDueDate: '2024-12-19T06:00:00Z' }); // 6 hours ago
    expect(calculateOverdueHours(chore, now)).toBe(6);
  });

  it('should handle chores overdue by 1 day', () => {
    const chore = createMockChore({ nextDueDate: '2024-12-18T12:00:00Z' }); // 24 hours ago
    expect(calculateOverdueHours(chore, now)).toBe(24);
  });

  it('should handle chores overdue by 3 days', () => {
    const chore = createMockChore({ nextDueDate: '2024-12-16T12:00:00Z' }); // 72 hours ago
    expect(calculateOverdueHours(chore, now)).toBe(72);
  });

  it('should return 0 for invalid date strings', () => {
    const chore = createMockChore({ nextDueDate: 'invalid-date' });
    expect(calculateOverdueHours(chore, now)).toBe(0);
  });
});

describe('calculateChorePenalty', () => {
  it('should return 0 for non-overdue chores', () => {
    expect(calculateChorePenalty(0)).toBe(0);
    expect(calculateChorePenalty(-10)).toBe(0);
  });

  it('should apply tier 1 penalty for 1-24 hours overdue', () => {
    expect(calculateChorePenalty(1)).toBe(-1);
    expect(calculateChorePenalty(12)).toBe(-1);
    expect(calculateChorePenalty(24)).toBe(-1);
  });

  it('should apply tier 2 penalty for 24-72 hours overdue', () => {
    expect(calculateChorePenalty(25)).toBe(-3);
    expect(calculateChorePenalty(48)).toBe(-3);
    expect(calculateChorePenalty(72)).toBe(-3);
  });

  it('should apply tier 3 penalty for >72 hours overdue', () => {
    expect(calculateChorePenalty(73)).toBe(-5);
    expect(calculateChorePenalty(100)).toBe(-5);
    expect(calculateChorePenalty(1000)).toBe(-5);
  });

  it('should respect custom config', () => {
    const customConfig = {
      maxPenalty: -40,
      tiers: {
        tier1: { hours: 12, penalty: -2 },
        tier2: { hours: 48, penalty: -4 },
        tier3: { penalty: -10 },
      },
    };

    expect(calculateChorePenalty(6, customConfig)).toBe(-2);
    expect(calculateChorePenalty(24, customConfig)).toBe(-4);
    expect(calculateChorePenalty(72, customConfig)).toBe(-10);
  });
});

describe('calculateOverduePenalty', () => {
  const now = new Date('2024-12-19T12:00:00Z');

  it('should return 0 for empty chore list', () => {
    expect(calculateOverduePenalty([], { now })).toBe(0);
  });

  it('should return 0 for chores with no overdue items', () => {
    const chores = [
      createMockChore({ nextDueDate: '2024-12-19T18:00:00Z' }),
      createMockChore({ nextDueDate: '2024-12-20T12:00:00Z' }),
    ];
    expect(calculateOverduePenalty(chores, { now })).toBe(0);
  });

  it('should sum penalties for multiple overdue chores', () => {
    const chores = [
      createMockChore({ nextDueDate: '2024-12-19T06:00:00Z' }), // 6 hrs overdue = -1
      createMockChore({ nextDueDate: '2024-12-18T12:00:00Z' }), // 24 hrs overdue = -1
      createMockChore({ nextDueDate: '2024-12-17T12:00:00Z' }), // 48 hrs overdue = -3
    ];
    expect(calculateOverduePenalty(chores, { now })).toBe(-5);
  });

  it('should cap total penalty at maxPenalty', () => {
    // Create many severely overdue chores
    const chores = Array.from(
      { length: 20 },
      () => createMockChore({ nextDueDate: '2024-12-15T12:00:00Z' }), // 96 hrs overdue = -5 each
    );
    // 20 * -5 = -100, but should be capped at -40
    expect(calculateOverduePenalty(chores, { now })).toBe(-40);
  });

  it('should handle mixed overdue and non-overdue chores', () => {
    const chores = [
      createMockChore({ nextDueDate: '2024-12-20T12:00:00Z' }), // not overdue = 0
      createMockChore({ nextDueDate: '2024-12-19T06:00:00Z' }), // 6 hrs = -1
      createMockChore({ nextDueDate: '2024-12-17T12:00:00Z' }), // 48 hrs = -3
      createMockChore({ nextDueDate: null }), // no date = 0
    ];
    expect(calculateOverduePenalty(chores, { now })).toBe(-4);
  });

  it('should respect custom config maxPenalty', () => {
    const customConfig = {
      ...DEFAULT_OVERDUE_CONFIG,
      maxPenalty: -15,
    };

    const chores = Array.from(
      { length: 10 },
      () => createMockChore({ nextDueDate: '2024-12-15T12:00:00Z' }), // 96 hrs overdue = -5 each
    );
    // 10 * -5 = -50, but should be capped at -15
    expect(calculateOverduePenalty(chores, { now, config: customConfig })).toBe(-15);
  });
});
