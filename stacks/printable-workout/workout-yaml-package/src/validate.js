import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { RootSchema, formatZodErrors } from './schema.js';

function validateFile(filePath) {
  const absolute = path.resolve(process.cwd(), filePath);
  const text = fs.readFileSync(absolute, 'utf8');
  const data = YAML.parse(text);
  const parsed = RootSchema.safeParse(data);
  if (!parsed.success) {
    console.error(`❌ Validation failed for ${filePath}`);
    formatZodErrors(parsed.error).forEach((msg) => console.error(` - ${msg}`));
    process.exitCode = 1;
  } else {
    console.log(`✅ ${filePath} is valid`);
    const doc = parsed.data;
    const counts = {
      groups: doc.workout_groups.length,
      workouts: doc.workout_groups.reduce((a, g) => a + g.workouts.length, 0),
      subsections: doc.workout_groups.reduce(
        (a, g) => a + g.workouts.reduce((b, w) => b + w.subsections.length, 0),
        0
      ),
      exercises: doc.workout_groups.reduce(
        (a, g) =>
          a +
          g.workouts.reduce(
            (b, w) => b + w.subsections.reduce((c, s) => c + s.exercises.length, 0),
            0
          ),
        0
      ),
    };
    console.log(
      `Counts → groups: ${counts.groups}, workouts: ${counts.workouts}, subsections: ${counts.subsections}, exercises: ${counts.exercises}`
    );
  }
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node src/validate.js <yaml-files...>');
  process.exit(1);
}

files.forEach(validateFile);
