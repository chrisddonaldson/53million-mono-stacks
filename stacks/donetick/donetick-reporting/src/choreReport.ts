import type { Chore, FrequencyType } from './types.js';
import { calculateRoomHealthScores, type RoomHealthScore } from './health/index.js';

const DEFAULT_ROOM_NAME = 'Unlabeled';
const DEFAULT_ROOM_KEY = DEFAULT_ROOM_NAME.toLowerCase();
const HOURS_PER_DAY = 24;
const HOURS_PER_WEEK = HOURS_PER_DAY * 7;
const HOURS_PER_MONTH = HOURS_PER_DAY * 30;
const HOURS_PER_YEAR = HOURS_PER_DAY * 365;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

const FREQUENCY_BASE_HOURS: Record<FrequencyType, number> = {
  daily: HOURS_PER_DAY,
  weekly: HOURS_PER_WEEK,
  monthly: HOURS_PER_MONTH,
  yearly: HOURS_PER_YEAR,
  interval: 1, // assume interval frequencies are defined in hours
  once: Number.POSITIVE_INFINITY,
};

const FREQUENCY_UNITS: Partial<Record<FrequencyType, { singular: string; plural: string }>> = {
  daily: { singular: 'daily', plural: 'days' },
  weekly: { singular: 'weekly', plural: 'weeks' },
  monthly: { singular: 'monthly', plural: 'months' },
  yearly: { singular: 'yearly', plural: 'years' },
};

export interface RoomGroupedChore {
  chore: Chore;
  relativeNextDue: string;
  frequencyDescription: string;
  frequencySortValue: number;
}

export interface RoomGroup {
  roomName: string;
  chores: RoomGroupedChore[];
}

/**
 * Extract the room names from a chore based on its labels
 */
export function extractRoomNames(chore: Chore): string[] {
  if (!chore.labelsV2 || chore.labelsV2.length === 0) {
    return [DEFAULT_ROOM_NAME];
  }

  const names: string[] = [];
  const seen = new Set<string>();

  for (const label of chore.labelsV2) {
    const trimmed = (label.name ?? '').trim();
    const normalized = trimmed.toLowerCase();

    if (!trimmed) {
      continue;
    }

    if (!seen.has(normalized)) {
      names.push(trimmed);
      seen.add(normalized);
    }
  }

  if (names.length === 0) {
    return [DEFAULT_ROOM_NAME];
  }

  return names;
}

/**
 * Format a next-due date as a relative number of hours (e.g. "3hrs", "-12hrs")
 */
export function formatRelativeHours(nextDueDate: string | null, now = new Date()): string {
  if (!nextDueDate) {
    return 'n/a';
  }

  const due = new Date(nextDueDate);
  if (Number.isNaN(due.getTime())) {
    return 'n/a';
  }

  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / MILLISECONDS_PER_HOUR);

  if (!Number.isFinite(diffHours)) {
    return 'n/a';
  }

  return `${diffHours}hrs`;
}

/**
 * Determine a deterministic numeric value to sort chores by their frequency
 */
export function getFrequencySortValue(chore: Chore): number {
  const baseHours = FREQUENCY_BASE_HOURS[chore.frequencyType];
  if (!Number.isFinite(baseHours)) {
    return Number.POSITIVE_INFINITY;
  }

  const normalizedFrequency =
    typeof chore.frequency === 'number' && chore.frequency > 0 ? chore.frequency : 1;

  return baseHours * normalizedFrequency;
}

/**
 * Convert frequency metadata into a human readable string
 */
export function describeFrequency(chore: Chore): string {
  const normalizedFrequency =
    typeof chore.frequency === 'number' && chore.frequency > 0 ? chore.frequency : 1;
  const formattedFrequency = Number.isInteger(normalizedFrequency)
    ? `${normalizedFrequency}`
    : normalizedFrequency.toFixed(1).replace(/\.0$/, '');

  switch (chore.frequencyType) {
    case 'once':
      return 'once';
    case 'interval': {
      if (normalizedFrequency === 1) {
        return 'every hour';
      }
      return `every ${formattedFrequency} hrs`;
    }
    default: {
      const unit = FREQUENCY_UNITS[chore.frequencyType];
      if (!unit) {
        return `${chore.frequencyType} (${formattedFrequency})`;
      }

      if (normalizedFrequency === 1) {
        return unit.singular;
      }

      return `every ${formattedFrequency} ${unit.plural}`;
    }
  }
}

/**
 * Group chores by room labels and sort each group by frequency
 */
export function groupChoresByRoom(chores: Chore[], options?: { now?: Date }): RoomGroup[] {
  const now = options?.now ?? new Date();
  const groupMap = new Map<string, { roomName: string; chores: RoomGroupedChore[] }>();

  for (const chore of chores) {
    const rooms = extractRoomNames(chore);
    for (const rawRoomName of rooms) {
      const trimmed = rawRoomName.trim();
      const key = trimmed ? trimmed.toLowerCase() : DEFAULT_ROOM_KEY;
      const displayName = trimmed || DEFAULT_ROOM_NAME;

      let group = groupMap.get(key);
      if (!group) {
        group = { roomName: displayName, chores: [] };
        groupMap.set(key, group);
      }

      group.chores.push({
        chore,
        relativeNextDue: formatRelativeHours(chore.nextDueDate, now),
        frequencyDescription: describeFrequency(chore),
        frequencySortValue: getFrequencySortValue(chore),
      });
    }
  }

  const groups = Array.from(groupMap.entries())
    .map(([key, group]) => ({ key, ...group }))
    .sort((a, b) => a.roomName.localeCompare(b.roomName, undefined, { sensitivity: 'base' }));

  for (const group of groups) {
    group.chores.sort((a, b) => {
      if (a.frequencySortValue !== b.frequencySortValue) {
        return a.frequencySortValue - b.frequencySortValue;
      }
      return a.chore.name.localeCompare(b.chore.name);
    });
  }

  return groups.map(({ roomName, chores }) => ({ roomName, chores }));
}

/**
 * Turn grouped chores into CLI-friendly output lines
 */
export function formatChoreReport(groups: RoomGroup[]): string[] {
  const lines: string[] = [];

  groups.forEach((group, index) => {
    lines.push(group.roomName);
    group.chores.forEach((entry) => {
      lines.push(
        `  - [${entry.chore.id}] ${entry.chore.name} | freq: ${entry.frequencyDescription} | next: ${entry.relativeNextDue}`,
      );
    });

    if (index < groups.length - 1) {
      lines.push('');
    }
  });

  return lines;
}

function formatContribution(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

function formatHealthBreakdown(health: RoomHealthScore): string {
  return `overdue ${formatContribution(health.breakdown.overduePenalty)} | priority ${formatContribution(
    health.breakdown.priorityPenalty,
  )} | completion ${formatContribution(health.breakdown.completionScore)}`;
}

/**
 * Calculate room health scores from grouped chores
 */
export function calculateGroupedRoomHealth(
  groups: RoomGroup[],
  options?: { now?: Date },
): RoomHealthScore[] {
  // Convert RoomGroup[] to Map<string, Chore[]>
  const roomChoresMap = new Map<string, Chore[]>();

  for (const group of groups) {
    const chores = group.chores.map((gc) => gc.chore);
    roomChoresMap.set(group.roomName, chores);
  }

  return calculateRoomHealthScores(roomChoresMap, options);
}

/**
 * Format room health scores into CLI-friendly output lines
 */
export function formatRoomHealth(healthScores: RoomHealthScore[]): string[] {
  const lines: string[] = [];

  lines.push('=== ROOM HEALTH ===');
  lines.push('');

  for (const health of healthScores) {
    const padding = ' '.repeat(Math.max(0, 15 - health.roomName.length));
    lines.push(
      `${health.roomName}${padding}: ${health.score} (${health.label}) | ${formatHealthBreakdown(health)}`,
    );
  }

  return lines;
}

/**
 * Format chore report lines with inline health summaries per room
 */
export function formatChoreReportWithHealth(
  groups: RoomGroup[],
  healthScores: RoomHealthScore[],
): string[] {
  const lines: string[] = [];
  const healthMap = new Map<string, RoomHealthScore>();

  for (const score of healthScores) {
    healthMap.set(score.roomName.toLowerCase(), score);
  }

  groups.forEach((group, index) => {
    const health = healthMap.get(group.roomName.toLowerCase());
    if (health) {
      lines.push(
        `${group.roomName} - ${health.score} (${health.label}) | ${formatHealthBreakdown(health)}`,
      );
    } else {
      lines.push(group.roomName);
    }

    group.chores.forEach((entry) => {
      lines.push(
        `  - [${entry.chore.id}] ${entry.chore.name} | freq: ${entry.frequencyDescription} | next: ${entry.relativeNextDue}`,
      );
    });

    if (index < groups.length - 1) {
      lines.push('');
    }
  });

  return lines;
}
