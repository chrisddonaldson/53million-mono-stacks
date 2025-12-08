// Test the workout store logic
import { readFileSync } from 'fs';

// Load and parse the FULL_WORKOUT_ARRAY
const arrayContent = readFileSync('./src/data/workouts/full-workout-array.ts', 'utf-8');

// Count sections
const pullVolumeSections = (arrayContent.match(/workout: "Pull-Volume"/g) || []).length;
const bicepsPumpSections = (arrayContent.match(/title: "Biceps Pump"/g) || []).length;

console.log('Pull-Volume sections:', pullVolumeSections);
console.log('Biceps Pump sections:', bicepsPumpSections);

// Check if the array export is there
const hasExport = arrayContent.includes('export const FULL_WORKOUT_ARRAY');
console.log('Has export:', hasExport);
