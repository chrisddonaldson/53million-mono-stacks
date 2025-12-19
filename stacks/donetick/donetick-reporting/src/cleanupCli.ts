#!/usr/bin/env node
/**
 * CLI for cleaning up and rescheduling overdue chores
 */

import 'dotenv/config';
import { DoneTickClient } from './client.js';
import { DoneTickError } from './types.js';
import { logger } from './logger.js';
import {
  analyzeChores,
  createCleanupSummary,
  formatCleanupSummary,
  ChoreCleanupAnalysis,
} from './choreCleanup.js';

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

    console.log('\n=== CHORE CLEANUP ===\n');

    // Fetch all chores
    logger.info('Fetching all chores...');
    const chores = await client.getAllChores();
    console.log(`Fetched ${chores.length} chores`);

    // Analyze chores for cleanup
    const analyses = analyzeChores(chores);

    if (analyses.length === 0) {
      console.log('\nNo chores need cleanup. All chores are up to date!\n');
      return;
    }

    console.log(`\nFound ${analyses.length} chores needing cleanup\n`);

    // Process each chore that needs cleanup
    let successCount = 0;
    let failCount = 0;

    for (const analysis of analyses) {
      try {
        await updateChoreFromAnalysis(client, analysis);
        successCount++;
      } catch (error) {
        failCount++;
        logger.error(`Failed to update chore ${analysis.chore.id} (${analysis.chore.name})`, {
          error,
        });
        // Continue with other chores even if one fails
      }
    }

    // Display summary
    console.log('\n=== SUMMARY ===\n');
    const summary = createCleanupSummary(chores, analyses);
    console.log(formatCleanupSummary(summary));

    if (failCount > 0) {
      console.log(`\nWarning: ${failCount} chore(s) failed to update`);
    }

    console.log(`\nSuccessfully updated: ${successCount}/${analyses.length}\n`);
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

/**
 * Updates a chore based on cleanup analysis
 * @param client - DoneTick API client
 * @param analysis - Cleanup analysis for the chore
 */
async function updateChoreFromAnalysis(
  client: DoneTickClient,
  analysis: ChoreCleanupAnalysis,
): Promise<void> {
  const { chore, needsRescheduling, needsPriorityAdjustment } = analysis;

  const updates: Partial<typeof chore> = {};

  if (needsRescheduling && analysis.suggestedNextDueDate) {
    updates.nextDueDate = analysis.suggestedNextDueDate;
    logger.info(
      `Rescheduling chore ${chore.id} (${chore.name}): ${chore.nextDueDate} → ${analysis.suggestedNextDueDate}`,
    );
  }

  if (needsPriorityAdjustment && analysis.suggestedPriority !== undefined) {
    logger.warn(
      `Cannot update priority for chore ${chore.id} (${chore.name}): API does not support priority updates. Would change ${chore.priority} → ${analysis.suggestedPriority}`,
    );
  }

  // Only update if there are actual changes
  if (Object.keys(updates).length > 0) {
    // Include the name since the API requires it
    updates.name = chore.name;
    await client.updateChore(chore.id, updates);
    console.log(
      `✓ Updated: ${chore.name} (ID: ${chore.id}) - ${analysis.overdueHours.toFixed(1)}hrs overdue`,
    );
  }
}

main();
