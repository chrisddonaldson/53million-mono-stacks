#!/usr/bin/env node
/**
 * CLI for fetching filtered chores (overdue or due within 24 hours)
 */

import 'dotenv/config';
import { DoneTickClient } from './client.js';
import { DoneTickError, type Chore } from './types.js';
import { logger } from './logger.js';
import {
  groupChoresByRoom,
  calculateGroupedRoomHealth,
  formatChoreReportWithHealth,
} from './choreReport.js';

const HOURS_24_IN_MS = 24 * 60 * 60 * 1000;

function isWithinNext24Hours(chore: Chore, now: Date): boolean {
  if (!chore.nextDueDate) {
    return false;
  }

  const due = new Date(chore.nextDueDate);
  if (Number.isNaN(due.getTime())) {
    return false;
  }

  const diff = due.getTime() - now.getTime();
  return diff >= 0 && diff <= HOURS_24_IN_MS;
}

function isOverdue(chore: Chore, now: Date): boolean {
  if (!chore.nextDueDate) {
    return false;
  }

  const due = new Date(chore.nextDueDate);
  if (Number.isNaN(due.getTime())) {
    return false;
  }

  return due.getTime() < now.getTime();
}

function removeSkincareLabel(chore: Chore): Chore {
  const filteredLabels = chore.labelsV2?.filter((label) => {
    const name = (label.name ?? '').trim().toLowerCase();
    return name !== 'skincare';
  });

  return {
    ...chore,
    labelsV2: filteredLabels ?? chore.labelsV2,
  };
}

async function main(): Promise<void> {
  const url = process.env.DONETICK_URL;
  const accessToken = process.env.DONETICK_ACCESS_TOKEN;

  if (!url) {
    logger.error('DONETICK_URL environment variable is not set');
    process.exit(1);
  }

  if (!accessToken) {
    logger.error('DONETICK_ACCESS_TOKEN environment variable is not set');
    process.exit(1);
  }

  try {
    const now = new Date();
    const client = new DoneTickClient({ url, accessToken });
    const chores = await client.getAllChores();

    const filtered = chores
      .filter((chore) => isOverdue(chore, now) || isWithinNext24Hours(chore, now))
      .map(removeSkincareLabel);

    console.log('\n=== FILTERED CHORE REPORT ===\n');

    if (filtered.length === 0) {
      console.log('No overdue or upcoming chores within 24 hours.');
      return;
    }

    const roomGroups = groupChoresByRoom(filtered, { now });
    const healthScores = calculateGroupedRoomHealth(roomGroups, { now });
    const lines = formatChoreReportWithHealth(roomGroups, healthScores);

    if (lines.length === 0) {
      console.log('No overdue or upcoming chores within 24 hours.');
      return;
    }

    lines.forEach((line) => console.log(line));

    console.log(`\nTotal filtered chores: ${filtered.length}\n`);
  } catch (error) {
    if (error instanceof DoneTickError) {
      logger.error(`DoneTick API Error: ${error.message}`);
      if (error.statusCode) {
        logger.error(`Status code: ${error.statusCode}`);
      }
    } else if (error instanceof Error) {
      logger.error(`Unexpected error: ${error.message}`);
    } else {
      logger.error('An unknown error occurred');
    }
    process.exit(1);
  }
}

main();
