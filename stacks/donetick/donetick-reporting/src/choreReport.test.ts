import { describe, it, expect } from 'vitest';
import {
  formatRelativeHours,
  groupChoresByRoom,
  formatChoreReport,
  formatRoomHealth,
  formatChoreReportWithHealth,
} from './choreReport.js';
import type { Chore, Label } from './types.js';
import type { RoomHealthScore } from './health/index.js';

const baseLabel: Label = {
  id: 1,
  name: 'Base',
  color: '#fff',
  created_by: 1,
};

const baseChore: Chore = {
  id: 1,
  name: 'Sample Chore',
  frequencyType: 'daily',
  frequency: 1,
  frequencyMetadata: null,
  nextDueDate: '2025-01-01T00:00:00Z',
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
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  createdBy: 1,
  updatedBy: 1,
  thingChore: null,
  status: 1,
  priority: 1,
};

const makeLabel = (name: string, idOffset = 0): Label => ({
  ...baseLabel,
  id: baseLabel.id + idOffset,
  name,
});

const buildChore = (overrides: Partial<Chore>): Chore => ({
  ...baseChore,
  ...overrides,
  labelsV2: overrides.labelsV2 ?? baseChore.labelsV2,
  assignees: overrides.assignees ?? baseChore.assignees,
});

describe('formatRelativeHours', () => {
  const now = new Date('2025-01-01T00:00:00Z');

  it('returns positive hour differences for upcoming chores', () => {
    expect(formatRelativeHours('2025-01-01T05:00:00Z', now)).toBe('5hrs');
  });

  it('returns negative hour differences for overdue chores', () => {
    expect(formatRelativeHours('2024-12-31T18:00:00Z', now)).toBe('-6hrs');
  });

  it('returns n/a when next due is missing', () => {
    expect(formatRelativeHours(null, now)).toBe('n/a');
  });

  it('returns n/a when next due date is malformed', () => {
    expect(formatRelativeHours('not-a-date', now)).toBe('n/a');
  });
});

describe('groupChoresByRoom', () => {
  const now = new Date('2025-01-01T00:00:00Z');

  it('groups chores by room and sorts by frequency', () => {
    const chores: Chore[] = [
      buildChore({
        id: 1,
        name: 'Take out trash',
        frequencyType: 'interval',
        frequency: 6,
        labelsV2: [makeLabel('Kitchen')],
        nextDueDate: '2025-01-01T01:00:00Z',
      }),
      buildChore({
        id: 2,
        name: 'Wipe counters',
        frequencyType: 'daily',
        frequency: 1,
        labelsV2: [makeLabel('Kitchen')],
        nextDueDate: '2025-01-01T02:30:00Z',
      }),
      buildChore({
        id: 3,
        name: 'Deep clean fridge',
        frequencyType: 'weekly',
        frequency: 1,
        labelsV2: [makeLabel('Kitchen')],
        nextDueDate: '2024-12-31T12:00:00Z',
      }),
    ];

    const [kitchenGroup] = groupChoresByRoom(chores, { now });

    expect(kitchenGroup.roomName).toBe('Kitchen');
    expect(kitchenGroup.chores.map((chore) => chore.chore.name)).toEqual([
      'Take out trash',
      'Wipe counters',
      'Deep clean fridge',
    ]);
    expect(kitchenGroup.chores[2].relativeNextDue).toBe('-12hrs');
  });

  it('duplicates chores across multiple rooms and handles unlabeled chores', () => {
    const hallwayLabel = makeLabel('Hallway', 10);
    const bathroomLabel = makeLabel('Bathroom', 20);

    const chores: Chore[] = [
      buildChore({
        id: 4,
        name: 'Mop floors',
        frequencyType: 'weekly',
        frequency: 1,
        labelsV2: [hallwayLabel, bathroomLabel],
        nextDueDate: '2025-01-02T00:00:00Z',
      }),
      buildChore({
        id: 5,
        name: 'Restock supplies',
        labelsV2: [],
        nextDueDate: null,
      }),
    ];

    const groups = groupChoresByRoom(chores, { now });
    const roomNames = groups.map((group) => group.roomName);
    expect(roomNames).toEqual(['Bathroom', 'Hallway', 'Unlabeled']);

    const bathroomGroup = groups.find((group) => group.roomName === 'Bathroom');
    expect(bathroomGroup?.chores).toHaveLength(1);
    expect(bathroomGroup?.chores[0].chore.name).toBe('Mop floors');

    const hallwayGroup = groups.find((group) => group.roomName === 'Hallway');
    expect(hallwayGroup?.chores).toHaveLength(1);
    expect(hallwayGroup?.chores[0].chore.name).toBe('Mop floors');

    const unlabeledGroup = groups.find((group) => group.roomName === 'Unlabeled');
    expect(unlabeledGroup?.chores).toHaveLength(1);
    expect(unlabeledGroup?.chores[0].relativeNextDue).toBe('n/a');
  });

  it('includes chore IDs in formatted report lines', () => {
    const chores: Chore[] = [
      buildChore({
        id: 99,
        name: 'Polish mirrors',
        labelsV2: [makeLabel('Bathroom')],
      }),
    ];

    const groups = groupChoresByRoom(chores, { now });
    const lines = formatChoreReport(groups);

    expect(lines[1]).toContain('[99]');
  });
});

describe('formatRoomHealth', () => {
  it('includes category breakdowns for each room', () => {
    const scores: RoomHealthScore[] = [
      {
        roomName: 'Kitchen',
        score: 64,
        label: 'Needs attention',
        breakdown: {
          overduePenalty: -8,
          priorityPenalty: -6,
          completionScore: 12,
        },
      },
      {
        roomName: 'Bathroom',
        score: 92,
        label: 'Pristine',
        breakdown: {
          overduePenalty: 0,
          priorityPenalty: 0,
          completionScore: 10,
        },
      },
    ];

    const lines = formatRoomHealth(scores);

    expect(lines[0]).toBe('=== ROOM HEALTH ===');
    expect(lines[2]).toContain('Kitchen');
    expect(lines[2]).toContain('overdue -8');
    expect(lines[2]).toContain('priority -6');
    expect(lines[2]).toContain('completion +12');

    expect(lines[3]).toContain('Bathroom');
    expect(lines[3]).toContain('overdue +0');
    expect(lines[3]).toContain('priority +0');
    expect(lines[3]).toContain('completion +10');
  });
});

describe('formatChoreReportWithHealth', () => {
  it('inlines health stats next to each room heading', () => {
    const now = new Date('2025-01-01T00:00:00Z');
    const chores: Chore[] = [
      buildChore({
        id: 1,
        name: 'Dishes',
        labelsV2: [makeLabel('Kitchen')],
        nextDueDate: '2024-12-31T22:00:00Z',
      }),
      buildChore({
        id: 2,
        name: 'Mop floor',
        labelsV2: [makeLabel('Bathroom')],
        nextDueDate: '2025-01-01T05:00:00Z',
      }),
    ];

    const groups = groupChoresByRoom(chores, { now });
    const healthScores: RoomHealthScore[] = [
      {
        roomName: 'Kitchen',
        score: 73,
        label: 'Healthy',
        breakdown: {
          overduePenalty: -5,
          priorityPenalty: -7,
          completionScore: 10,
        },
      },
    ];

    const lines = formatChoreReportWithHealth(groups, healthScores);

    const kitchenLine = lines.find((line) => line.startsWith('Kitchen'));
    expect(kitchenLine).toBeDefined();
    expect(kitchenLine).toContain('Kitchen - 73 (Healthy)');
    expect(kitchenLine).toContain('overdue -5');
    expect(kitchenLine).toContain('priority -7');
    expect(kitchenLine).toContain('completion +10');

    const bathroomHeaderIndex = lines.findIndex((line) => line.startsWith('Bathroom'));
    expect(bathroomHeaderIndex).toBeGreaterThan(-1);
    expect(lines[bathroomHeaderIndex]).toBe('Bathroom');
  });
});
