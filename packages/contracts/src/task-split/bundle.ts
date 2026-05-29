import { z } from 'zod';
import { IdSchema } from '../shared/common';

export const TaskSplitTaskSchema = z.object({
  id: IdSchema,
  sortOrder: z.number().int().nonnegative(),
  title: z.string().min(1).max(500),
  promptBody: z.string().min(1).max(10_000),
  manual: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TaskSplitTaskDTO = z.infer<typeof TaskSplitTaskSchema>;

export const TaskSplitBundleSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  sourceUserStoryKey: z.string().nullable(),
  storyTitleSnapshot: z.string().nullable(),
  lockedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  tasks: z.array(TaskSplitTaskSchema),
});

export type TaskSplitBundleDTO = z.infer<typeof TaskSplitBundleSchema>;

/** Task row for save — id optional (new rows assigned server-side). */
export const TaskSplitTaskSaveInputSchema = z.object({
  id: IdSchema.optional(),
  sortOrder: z.number().int().nonnegative(),
  title: z.string().min(1).max(500),
  promptBody: z.string().min(1).max(10_000),
  manual: z.boolean().default(false),
});

export type TaskSplitTaskSaveInput = z.infer<typeof TaskSplitTaskSaveInputSchema>;

export const SaveTaskSplitBundleRequestSchema = z.object({
  sourceUserStoryKey: z.string().max(500).nullable().optional(),
  storyTitleSnapshot: z.string().max(500).nullable().optional(),
  tasks: z.array(TaskSplitTaskSaveInputSchema).min(1).max(100),
});

export type SaveTaskSplitBundleRequest = z.infer<typeof SaveTaskSplitBundleRequestSchema>;
