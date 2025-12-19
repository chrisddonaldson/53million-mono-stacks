import { describe, it, expect } from 'vitest';
import { calculateRoomHealth } from './index.js';
import type { Chore } from '../types.js';

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

describe('calculateRoomHealth', () => {
  it('returns pristine scores for empty rooms', () => {
    const result = calculateRoomHealth('Kitchen', []);

    expect(result).toEqual({
      roomName: 'Kitchen',
      score: 100,
      label: 'Pristine',
      breakdown: {
        overduePenalty: 0,
        priorityPenalty: 0,
        completionScore: 0,
      },
    });
  });

  it('combines overdue, priority and completion scores using default config', () => {
    const now = new Date('2024-12-19T12:00:00Z');
    const chores = [
      createMockChore({ nextDueDate: '2024-12-18T12:00:00Z', priority: 1 }),
      createMockChore({ nextDueDate: '2024-12-16T12:00:00Z', priority: 2 }),
      createMockChore({ nextDueDate: '2024-12-10T12:00:00Z', priority: 3 }),
      createMockChore({ nextDueDate: '2024-12-01T12:00:00Z', priority: 4 }),
      createMockChore({ nextDueDate: '2024-11-30T12:00:00Z', priority: 1 }),
    ];

    const result = calculateRoomHealth('Living Room', chores, { now });

    expect(result).toEqual({
      roomName: 'Living Room',
      score: 39,
      label: 'Unhealthy',
      breakdown: {
        overduePenalty: -19,
        priorityPenalty: -42,
        completionScore: 10,
      },
    });
  });

  it('respects custom configs and clamps score between 0 and 100', () => {
    const now = new Date('2024-12-19T12:00:00Z');
    const config = {
      overdue: {
        maxPenalty: -200,
        tiers: {
          tier1: { hours: 1, penalty: -10 },
          tier2: { hours: 2, penalty: -20 },
          tier3: { penalty: -30 },
        },
      },
      priority: {
        maxPenalty: -100,
        penaltyMap: { 1: -10 },
        defaultPenalty: -5,
      },
      completion: {
        maxScore: 50,
        defaultScore: 0,
      },
    };

    const chores = Array.from({ length: 10 }, (_, index) =>
      createMockChore({
        id: index + 1,
        priority: 1,
        nextDueDate: '2024-12-01T12:00:00Z',
      }),
    );

    const result = calculateRoomHealth('Garage', chores, { now, config });

    expect(result.score).toBe(0);
    expect(result.label).toBe('Unhealthy');
    expect(result.breakdown).toEqual({
      overduePenalty: -200,
      priorityPenalty: -100,
      completionScore: 0,
    });
  });
});
