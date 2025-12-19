#!/usr/bin/env node
/**
 * CLI for fetching and displaying all chores from DoneTick
 */

import 'dotenv/config';
import { DoneTickClient } from './client.js';
import { DoneTickError } from './types.js';
import { logger } from './logger.js';
import {
  groupChoresByRoom,
  calculateGroupedRoomHealth,
  formatChoreReportWithHealth,
} from './choreReport.js';

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
    const client = new DoneTickClient({ url, accessToken });
    const chores = await client.getAllChores();

    console.log('\n=== CHORE REPORT ===\n');

    if (chores.length === 0) {
      console.log('No chores found.');
      return;
    }

    const roomGroups = groupChoresByRoom(chores);
    const healthScores = calculateGroupedRoomHealth(roomGroups);
    const lines = formatChoreReportWithHealth(roomGroups, healthScores);

    if (lines.length === 0) {
      console.log('No chores found.');
      return;
    }

    lines.forEach((line) => console.log(line));

    console.log(`\nTotal chores: ${chores.length}\n`);
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
