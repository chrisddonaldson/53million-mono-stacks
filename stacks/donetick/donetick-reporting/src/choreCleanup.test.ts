/**
 * Unit tests for choreCleanup module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateOverdueHours,
  calculatePriorityAdjustment,
  calculateNextDueDate,
  analyzeChore,
  analyzeChores,
  createCleanupSummary,
  formatCleanupSummary,
  CLEANUP_CONFIG,
} from './choreCleanup.js';
import { Chore } from './types.js';

// Mock the logger
vi.mock('./logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('choreCleanup', () => {
  const mockChore: Chore = {
    id: 1,
    name: 'Test Chore',
    frequencyType: 'daily',
    frequency: 1,
    frequencyMetadata: null,
    nextDueDate: '2024-01-01T12:00:00Z',
    isRolling: false,
    assignedTo: 1,
    assignees: [{ userId: 1 }],
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
    priority: 1,
  };

  describe('calculateOverdueHours', () => {
    beforeEach(() => {
      // Mock current time to 2024-01-05 12:00:00 UTC (4 days after due date)
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-05T12:00:00Z'));
    });

    it('should return 0 for chore with no due date', () => {
      const chore = { ...mockChore, nextDueDate: null };
      expect(calculateOverdueHours(chore)).toBe(0);
    });

    it('should return 0 for chore not yet due', () => {
      const chore = { ...mockChore, nextDueDate: '2024-01-10T12:00:00Z' };
      expect(calculateOverdueHours(chore)).toBe(0);
    });

    it('should return 0 for chore due exactly now', () => {
      const chore = { ...mockChore, nextDueDate: '2024-01-05T12:00:00Z' };
      expect(calculateOverdueHours(chore)).toBe(0);
    });

    it('should calculate overdue hours correctly for past due date', () => {
      const chore = { ...mockChore, nextDueDate: '2024-01-01T12:00:00Z' };
      const overdueHours = calculateOverdueHours(chore);
      expect(overdueHours).toBe(96); // 4 days = 96 hours
    });

    it('should handle invalid due date gracefully', () => {
      const chore = { ...mockChore, nextDueDate: 'invalid-date' };
      expect(calculateOverdueHours(chore)).toBe(0);
    });

    it('should calculate fractional hours correctly', () => {
      const chore = { ...mockChore, nextDueDate: '2024-01-05T10:00:00Z' };
      const overdueHours = calculateOverdueHours(chore);
      expect(overdueHours).toBe(2); // 2 hours
    });
  });

  describe('calculatePriorityAdjustment', () => {
    it('should return 0 for 0-24 hours overdue', () => {
      expect(calculatePriorityAdjustment(0)).toBe(0);
      expect(calculatePriorityAdjustment(12)).toBe(0);
      expect(calculatePriorityAdjustment(23.9)).toBe(0);
    });

    it('should return 1 for 24-72 hours overdue', () => {
      expect(calculatePriorityAdjustment(24)).toBe(1);
      expect(calculatePriorityAdjustment(48)).toBe(1);
      expect(calculatePriorityAdjustment(71.9)).toBe(1);
    });

    it('should return 2 for more than 72 hours overdue', () => {
      expect(calculatePriorityAdjustment(72)).toBe(2);
      expect(calculatePriorityAdjustment(100)).toBe(2);
      expect(calculatePriorityAdjustment(1000)).toBe(2);
    });
  });

  describe('calculateNextDueDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    it('should calculate next due date for daily frequency', () => {
      const result = calculateNextDueDate('daily', 1);
      const expected = new Date('2024-01-02T12:00:00Z');
      expect(new Date(result).getTime()).toBe(expected.getTime());
    });

    it('should calculate next due date for weekly frequency', () => {
      const result = calculateNextDueDate('weekly', 1);
      const expected = new Date('2024-01-08T12:00:00Z');
      expect(new Date(result).getTime()).toBe(expected.getTime());
    });

    it('should calculate next due date for monthly frequency', () => {
      const result = calculateNextDueDate('monthly', 1);
      const expected = new Date('2024-02-01T12:00:00Z');
      expect(new Date(result).getTime()).toBe(expected.getTime());
    });

    it('should calculate next due date for yearly frequency', () => {
      const result = calculateNextDueDate('yearly', 1);
      const expected = new Date('2025-01-01T12:00:00Z');
      expect(new Date(result).getTime()).toBe(expected.getTime());
    });

    it('should calculate next due date for once frequency', () => {
      const result = calculateNextDueDate('once', 1);
      const expected = new Date('2024-01-02T12:00:00Z');
      expect(new Date(result).getTime()).toBe(expected.getTime());
    });

    it('should calculate next due date for interval frequency', () => {
      const result = calculateNextDueDate('interval', 3);
      const expected = new Date('2024-01-04T12:00:00Z');
      expect(new Date(result).getTime()).toBe(expected.getTime());
    });

    it('should handle multiple frequency units', () => {
      const result = calculateNextDueDate('daily', 7);
      const expected = new Date('2024-01-08T12:00:00Z');
      expect(new Date(result).getTime()).toBe(expected.getTime());
    });

    it('should use custom fromDate if provided', () => {
      const fromDate = new Date('2024-06-15T12:00:00Z');
      const result = calculateNextDueDate('daily', 1, fromDate);
      const expected = new Date('2024-06-16T12:00:00Z');
      expect(new Date(result).getTime()).toBe(expected.getTime());
    });
  });

  describe('analyzeChore', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-05T12:00:00Z'));
    });

    it('should return no cleanup needed for non-overdue chore', () => {
      const chore = { ...mockChore, nextDueDate: '2024-01-10T12:00:00Z' };
      const result = analyzeChore(chore);

      expect(result.isOverdue).toBe(false);
      expect(result.overdueHours).toBe(0);
      expect(result.needsRescheduling).toBe(false);
      expect(result.needsPriorityAdjustment).toBe(false);
      expect(result.suggestedNextDueDate).toBeUndefined();
      expect(result.suggestedPriority).toBeUndefined();
    });

    it('should detect overdue chore within 24 hours', () => {
      const chore = { ...mockChore, nextDueDate: '2024-01-05T00:00:00Z' }; // 12 hours overdue
      const result = analyzeChore(chore);

      expect(result.isOverdue).toBe(true);
      expect(result.overdueHours).toBe(12);
      expect(result.needsRescheduling).toBe(false); // Not past 72 hour threshold
      expect(result.needsPriorityAdjustment).toBe(false); // No adjustment for < 24 hours
    });

    it('should suggest priority adjustment for 24-72 hours overdue', () => {
      const chore = { ...mockChore, nextDueDate: '2024-01-03T12:00:00Z', priority: 1 }; // 48 hours overdue
      const result = analyzeChore(chore);

      expect(result.isOverdue).toBe(true);
      expect(result.overdueHours).toBe(48);
      expect(result.needsRescheduling).toBe(false); // Not past 72 hour threshold
      expect(result.needsPriorityAdjustment).toBe(true);
      expect(result.suggestedPriority).toBe(2); // priority 1 + adjustment 1
    });

    it('should suggest rescheduling and priority adjustment for > 72 hours overdue', () => {
      const chore = { ...mockChore, nextDueDate: '2024-01-01T12:00:00Z', priority: 1 }; // 96 hours overdue
      const result = analyzeChore(chore);

      expect(result.isOverdue).toBe(true);
      expect(result.overdueHours).toBe(96);
      expect(result.needsRescheduling).toBe(true);
      expect(result.needsPriorityAdjustment).toBe(true);
      expect(result.suggestedPriority).toBe(3); // priority 1 + adjustment 2
      expect(result.suggestedNextDueDate).toBeDefined();

      // Verify the new due date is in the future (tomorrow for daily)
      const suggestedDate = new Date(result.suggestedNextDueDate!);
      const expectedDate = new Date('2024-01-06T12:00:00Z');
      expect(suggestedDate.getTime()).toBe(expectedDate.getTime());
    });

    it('should handle chore with no due date', () => {
      const chore = { ...mockChore, nextDueDate: null };
      const result = analyzeChore(chore);

      expect(result.isOverdue).toBe(false);
      expect(result.needsRescheduling).toBe(false);
      expect(result.needsPriorityAdjustment).toBe(false);
    });
  });

  describe('analyzeChores', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-05T12:00:00Z'));
    });

    it('should analyze multiple chores and return only those needing cleanup', () => {
      const chores: Chore[] = [
        { ...mockChore, id: 1, nextDueDate: '2024-01-10T12:00:00Z' }, // Not overdue
        { ...mockChore, id: 2, nextDueDate: '2024-01-05T00:00:00Z' }, // 12 hours overdue - no action
        { ...mockChore, id: 3, nextDueDate: '2024-01-03T12:00:00Z' }, // 48 hours - priority adjustment
        { ...mockChore, id: 4, nextDueDate: '2024-01-01T12:00:00Z' }, // 96 hours - reschedule
      ];

      const results = analyzeChores(chores);

      expect(results).toHaveLength(2); // Only chores 3 and 4 need cleanup
      expect(results[0].chore.id).toBe(3);
      expect(results[0].needsPriorityAdjustment).toBe(true);
      expect(results[0].needsRescheduling).toBe(false);

      expect(results[1].chore.id).toBe(4);
      expect(results[1].needsPriorityAdjustment).toBe(true);
      expect(results[1].needsRescheduling).toBe(true);
    });

    it('should return empty array when no chores need cleanup', () => {
      const chores: Chore[] = [
        { ...mockChore, id: 1, nextDueDate: '2024-01-10T12:00:00Z' },
        { ...mockChore, id: 2, nextDueDate: '2024-01-08T12:00:00Z' },
      ];

      const results = analyzeChores(chores);
      expect(results).toHaveLength(0);
    });

    it('should handle empty chores array', () => {
      const results = analyzeChores([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('createCleanupSummary', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-05T12:00:00Z'));
    });

    it('should create accurate summary from analyses', () => {
      const allChores: Chore[] = [
        { ...mockChore, id: 1, nextDueDate: '2024-01-10T12:00:00Z' },
        { ...mockChore, id: 2, nextDueDate: '2024-01-03T12:00:00Z' },
        { ...mockChore, id: 3, nextDueDate: '2024-01-01T12:00:00Z' },
        { ...mockChore, id: 4, nextDueDate: '2024-01-05T00:00:00Z' },
      ];

      const analyses = analyzeChores(allChores);
      const summary = createCleanupSummary(allChores, analyses);

      expect(summary.totalChores).toBe(4);
      expect(summary.overdueChores).toBe(2); // chores 2 and 3 (chore 4 is < 24hrs)
      expect(summary.rescheduled).toBe(1); // only chore 3 (> 72 hours)
      expect(summary.priorityUpgraded).toBe(2); // chores 2 and 3
    });

    it('should handle no cleanup needed', () => {
      const allChores: Chore[] = [
        { ...mockChore, id: 1, nextDueDate: '2024-01-10T12:00:00Z' },
        { ...mockChore, id: 2, nextDueDate: '2024-01-08T12:00:00Z' },
      ];

      const analyses = analyzeChores(allChores);
      const summary = createCleanupSummary(allChores, analyses);

      expect(summary.totalChores).toBe(2);
      expect(summary.overdueChores).toBe(0);
      expect(summary.rescheduled).toBe(0);
      expect(summary.priorityUpgraded).toBe(0);
    });
  });

  describe('formatCleanupSummary', () => {
    it('should format summary correctly', () => {
      const summary = {
        totalChores: 10,
        overdueChores: 5,
        rescheduled: 3,
        priorityUpgraded: 4,
      };

      const formatted = formatCleanupSummary(summary);

      expect(formatted).toContain('Cleanup complete');
      expect(formatted).toContain('Total chores scanned: 10');
      expect(formatted).toContain('Overdue chores: 5');
      expect(formatted).toContain('Rescheduled: 3');
      expect(formatted).toContain('Priority upgraded: 4');
    });

    it('should handle zero values', () => {
      const summary = {
        totalChores: 0,
        overdueChores: 0,
        rescheduled: 0,
        priorityUpgraded: 0,
      };

      const formatted = formatCleanupSummary(summary);

      expect(formatted).toContain('Total chores scanned: 0');
      expect(formatted).toContain('Overdue chores: 0');
    });
  });

  describe('CLEANUP_CONFIG', () => {
    it('should have expected configuration values', () => {
      expect(CLEANUP_CONFIG.MAX_OVERDUE_HOURS).toBe(72);
      expect(CLEANUP_CONFIG.PRIORITY_THRESHOLDS).toHaveLength(3);
      expect(CLEANUP_CONFIG.PRIORITY_THRESHOLDS[0]).toEqual({ maxHours: 24, adjustment: 0 });
      expect(CLEANUP_CONFIG.PRIORITY_THRESHOLDS[1]).toEqual({ maxHours: 72, adjustment: 1 });
      expect(CLEANUP_CONFIG.PRIORITY_THRESHOLDS[2]).toEqual({
        maxHours: Infinity,
        adjustment: 2,
      });
    });
  });
});
