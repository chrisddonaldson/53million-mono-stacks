import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { RootSchema, formatZodErrors } from './schema.js';

const PLACEHOLDER = 'https://placehold.co/200x200/EEE/31343C';
const MEDIA_DIR = path.resolve('..', 'media');
const mediaFiles = fs.existsSync(MEDIA_DIR) ? fs.readdirSync(MEDIA_DIR) : [];

function normalizeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findMediaFile(label) {
  if (!label) return null;
  const clean = normalizeName(label.replace(path.extname(label), ''));
  const match = mediaFiles.find((file) => normalizeName(file.replace(path.extname(file), '')) === clean);
  return match ? `./media/${match}` : null;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

function placeholderWithText(text) {
  const media = findMediaFile(text || '');
  if (media) return media;
  const clean = encodeURIComponent((text || 'Exercise').substring(0, 40));
  return `${PLACEHOLDER}?text=${clean}`;
}

function parseSetsReps(text) {
  if (!text) return {};
  const xMatch = text.match(/(\d+)\s*[x×]\s*([^\s]+)/i);
  if (xMatch) {
    return { sets: Number(xMatch[1]) || undefined, reps: xMatch[2].trim() };
  }
  const timeMatch = text.match(/(\d+)\s*(?:–|-|to)\s*(\d+)\s*(s|sec|seconds|m|min|minutes)/i);
  if (timeMatch) {
    return { sets: undefined, reps: `${timeMatch[1]}-${timeMatch[2]} ${timeMatch[3]}`.trim() };
  }
  const single = text.match(/^(\d+)\s*(reps?|s|sec|seconds)$/i);
  if (single) return { reps: single[0] };
  return {};
}

function classifyStage(exercise) {
  const haystack = [exercise.prescription, ...(exercise.notes || [])].join(' ').toLowerCase();
  if (/activation|primer|prime|wake|neural|intent/.test(haystack)) return 'neural';
  if (/stability|control|isometric|iso|anti-|balance|holds?/.test(haystack)) return 'stability';
  if (/metabolic|burn|amrap|drop set|finisher|partials/.test(haystack)) return 'metabolic';
  if (/heavy|mechanical|tension|load|strength|press|squat|deadlift|curl|row/.test(haystack)) return 'mechanical';
  return 'mechanical';
}

function parseRawMarkdown(raw) {
  const lines = raw.split(/\r?\n/);
  const workoutGroups = [];
  let currentGroup = null;
  let currentWorkout = null;
  let currentSub = null;
  let currentExercise = null;

  const pushExercise = () => {
    if (currentExercise && currentSub) {
      if (!currentExercise.thumbnail) {
        currentExercise.thumbnail = placeholderWithText(currentExercise.name);
      }
      if (!currentExercise.stage) {
        currentExercise.stage = classifyStage(currentExercise);
      }
      // Trim empty notes
      if (currentExercise.notes && currentExercise.notes.length === 0) {
        delete currentExercise.notes;
      }
      currentSub.exercises.push(currentExercise);
    }
    currentExercise = null;
  };

  lines.forEach((lineRaw) => {
    const line = lineRaw.trim();
    if (!line) return;
    if (line === '---') return;

    const headingMatch = line.match(/^(#+)\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      if (level === 1) {
        pushExercise();
        currentSub = null;
        currentWorkout = null;
        currentGroup = { id: slugify(title), name: title, workouts: [] };
        workoutGroups.push(currentGroup);
      } else if (level === 2) {
        pushExercise();
        currentSub = null;
        currentWorkout = {
          id: slugify(title),
          name: title,
          group: currentGroup ? currentGroup.id : 'ungrouped',
          tags: currentGroup ? [currentGroup.id] : [],
          subsections: [],
        };
        if (!currentGroup) {
          currentGroup = { id: 'ungrouped', name: 'Ungrouped', workouts: [] };
          workoutGroups.push(currentGroup);
        }
        currentGroup.workouts.push(currentWorkout);
      } else if (level === 3) {
        pushExercise();
        currentSub = {
          id: slugify(title),
          name: title,
          notes: [],
          exercises: [],
        };
        if (!currentWorkout) {
          currentWorkout = {
            id: 'default-workout',
            name: 'Default Workout',
            group: currentGroup ? currentGroup.id : 'ungrouped',
            subsections: [],
          };
          if (!currentGroup) {
            currentGroup = { id: 'ungrouped', name: 'Ungrouped', workouts: [] };
            workoutGroups.push(currentGroup);
          }
          currentGroup.workouts.push(currentWorkout);
        }
        currentWorkout.subsections.push(currentSub);
      } else if (level === 4) {
        pushExercise();
        if (!currentSub) {
          currentSub = { id: 'default', name: 'Default', exercises: [] };
          if (!currentWorkout) {
            currentWorkout = {
              id: 'default-workout',
              name: 'Default Workout',
              group: currentGroup ? currentGroup.id : 'ungrouped',
              subsections: [],
            };
            if (!currentGroup) {
              currentGroup = { id: 'ungrouped', name: 'Ungrouped', workouts: [] };
              workoutGroups.push(currentGroup);
            }
            currentGroup.workouts.push(currentWorkout);
          }
          currentWorkout.subsections.push(currentSub);
        }
        currentExercise = {
          id: slugify(title),
          name: title,
          thumbnail: placeholderWithText(title),
          notes: [],
        };
      }
      return;
    }

    if (line.startsWith('>')) {
      const content = line.replace(/^>\s*/, '');
      if (!currentSub) return;
      const focusOrderMatch = content.match(/focus order/i);
      if (focusOrderMatch) return; // drop legacy focus order lines
      const focusMatch = content.match(/^\*\*Focus:?\*\*\s*(.*)$/i);
      const roleMatch = content.match(/^\*\*Role.*?:\*\*\s*(.*)$/i);
      if (focusMatch) {
        currentSub.focus = focusMatch[1].trim();
      } else if (roleMatch) {
        currentSub.role = roleMatch[1].trim();
      } else {
        currentSub.notes = currentSub.notes || [];
        currentSub.notes.push(content.replace(/^\*\*|\*\*$/g, '').trim());
      }
      return;
    }

    if (!currentExercise) return;

    if (line.startsWith('**[') && line.includes('Image:')) {
      const match = line.match(/\[Image:\s*([^\]]+)\]/i);
      if (match) {
        currentExercise.thumbnail = placeholderWithText(match[1].trim());
      }
      return;
    }

    if (/^https?:\/\//i.test(line)) {
      currentExercise.video = line;
      return;
    }

    if (line.startsWith('- ')) {
      const detailRaw = line.slice(2).trim();
      const detail = detailRaw.replace(/\*\*/g, '').trim();
      const plain = detail.replace(/^_+|_+$/g, '');
      const urlMatch = detail.match(/https?:\/\/\S+/i);
      if (urlMatch) {
        currentExercise.video = currentExercise.video || urlMatch[0];
      }
      const atHomeMatch = plain.match(/At-home\s*\(([^)]+)\)\s*:\s*(.*)/i);
      if (atHomeMatch) {
        currentExercise.at_home = atHomeMatch[2].trim();
      }
      if (!currentExercise.prescription) {
        currentExercise.prescription = detail;
        const { sets, reps } = parseSetsReps(detail);
        if (sets) currentExercise.sets = sets;
        if (reps) currentExercise.reps = reps;
      } else {
        currentExercise.notes.push(detail);
      }
      return;
    }

    // Other free text lines (e.g., NOTE: ...)
    currentExercise.notes.push(line);
  });

  pushExercise();
  return workoutGroups;
}

function extractRawMarkdown(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const match = html.match(/const\s+rawMarkdown\s*=\s*`([\s\S]*?)`;?/);
  if (!match) throw new Error('rawMarkdown block not found in index.html');
  return match[1];
}

function main() {
  const sourcePath = path.resolve('..', 'index.html');
  const raw = extractRawMarkdown(sourcePath);
  const workoutGroups = parseRawMarkdown(raw);
  const doc = {
    metadata: {
      source: path.relative(process.cwd(), sourcePath),
      generated_at: new Date().toISOString(),
    },
    workout_groups: workoutGroups,
  };

  const parsed = RootSchema.safeParse(doc);
  if (!parsed.success) {
    console.error('Validation failed while converting markdown to YAML:');
    formatZodErrors(parsed.error).forEach((msg) => console.error(` - ${msg}`));
    process.exit(1);
  }

  const yaml = YAML.stringify(doc, { indent: 2, lineWidth: 120 });
  const outPath = path.join(process.cwd(), 'data', 'upper-lower.yaml');
  fs.writeFileSync(outPath, yaml, 'utf8');
  console.log(`YAML written to ${outPath}`);
  console.log(
    `Groups: ${doc.workout_groups.length}, Workouts: ${doc.workout_groups.reduce((a, g) => a + g.workouts.length, 0)}, Exercises: ${doc.workout_groups.reduce((a, g) => a + g.workouts.reduce((b, w) => b + w.subsections.reduce((c, s) => c + s.exercises.length, 0), 0), 0)}`
  );
}

main();
