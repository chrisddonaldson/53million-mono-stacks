import { z } from 'zod';

const UrlString = z.string().trim().url();
const MediaPath = z.string().trim().regex(/^\.?\/?media\//);
const NonEmptyString = z.string().trim().min(1);

const StageEnum = z.enum(['neural', 'stability', 'mechanical', 'metabolic']);

export const ExerciseSchema = z.object({
  id: NonEmptyString,
  name: NonEmptyString,
  thumbnail: z.union([UrlString, MediaPath]),
  video: z.string().trim().url().optional(),
  at_home: z.string().trim().optional(),
  stage: StageEnum.optional(),
  sets: z.number().int().positive().optional(),
  reps: z.string().trim().optional(),
  work_seconds: z.number().int().positive().optional(),
  rest_seconds: z.number().int().positive().optional(),
  prescription: z.string().trim().optional(),
  notes: z.array(NonEmptyString).optional(),
});

export const SubSectionSchema = z.object({
  id: NonEmptyString,
  name: NonEmptyString,
  focus: z.string().trim().optional(),
  role: z.string().trim().optional(),
  notes: z.array(NonEmptyString).optional(),
  exercises: z.array(ExerciseSchema).min(1, 'Each subsection needs at least one exercise'),
});

export const WorkoutSchema = z.object({
  id: NonEmptyString,
  name: NonEmptyString,
  group: NonEmptyString,
  tags: z.array(NonEmptyString).optional(),
  subsections: z.array(SubSectionSchema).default([{ id: 'default', name: 'Default', exercises: [] }]),
});

export const WorkoutGroupSchema = z.object({
  id: NonEmptyString,
  name: NonEmptyString,
  workouts: z.array(WorkoutSchema),
});

export const RootSchema = z.object({
  metadata: z
    .object({
      source: NonEmptyString.optional(),
      generated_at: NonEmptyString.optional(),
    })
    .optional(),
  workout_groups: z.array(WorkoutGroupSchema),
});

export function formatZodErrors(error) {
  return error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });
}
