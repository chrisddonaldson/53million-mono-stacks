// Test script to verify microworkout data
const fs = require('fs');
const path = require('path');

// Read the full-workout-array.ts file
const filePath = path.join(__dirname, 'src/data/workouts/full-workout-array.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Extract Pull-Volume sections
const lines = content.split('\n');
let inPullVolume = false;
let pullVolumeSections = [];
let currentSection = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('workout: "Pull-Volume"')) {
    inPullVolume = true;
    currentSection = [line];
  } else if (inPullVolume) {
    currentSection.push(line);
    
    if (line.trim() === '},') {
      pullVolumeSections.push(currentSection.join('\n'));
      currentSection = [];
      inPullVolume = false;
    }
  }
}

console.log('Pull-Volume sections found:', pullVolumeSections.length);
console.log('\n=== Microworkout titles ===');

pullVolumeSections.forEach((section, index) => {
  if (section.includes('sectionType: "micro"')) {
    const titleMatch = section.match(/title:\s*"([^"]+)"/);
    if (titleMatch) {
      console.log(`${index + 1}. "${titleMatch[1]}"`);
    }
  }
});
