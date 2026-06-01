/**
 * Task-split bundle HTTP DTOs — ordered tasks with Cursor-ready prompts per user story line.
 */

import { z } from 'zod';
import { IdSchema } from '../shared/common';

export const TaskSplitTaskSchema = z.object({
  id: IdSchema,
  sortOrder: z.number().int().nonnegative(),
  title: z.string().min(1).max(2000),
  promptBody: z.string().min(1).max(20_000),
  manual: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TaskSplitTaskDTO = z.infer<typeof TaskSplitTaskSchema>;

export const TaskSplitBundleSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  userStoryLineId: IdSchema.nullable(),
  storyTitle: z.string().max(2000).nullable(),
  storyBody: z.string().max(50_000).nullable(),
  lockedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  tasks: z.array(TaskSplitTaskSchema),
});

export type TaskSplitBundleDTO = z.infer<typeof TaskSplitBundleSchema>;

export const TaskSplitTaskSaveInputSchema = z.object({
  id: IdSchema.optional(),
  sortOrder: z.number().int().nonnegative(),
  title: z.string().min(1).max(2000),
  promptBody: z.string().min(1).max(20_000),
  manual: z.boolean().optional().default(false),
});

export type TaskSplitTaskSaveInput = z.infer<typeof TaskSplitTaskSaveInputSchema>;

export const SaveTaskSplitBundleRequestSchema = z.object({
  userStoryLineId: IdSchema,
  tasks: z.array(TaskSplitTaskSaveInputSchema).min(1).max(64),
});

export type SaveTaskSplitBundleRequest = z.infer<typeof SaveTaskSplitBundleRequestSchema>;

export const GetTaskSplitBundleQuerySchema = z.object({
  userStoryLineId: IdSchema,
});

export type GetTaskSplitBundleQuery = z.infer<typeof GetTaskSplitBundleQuerySchema>;

export const LockTaskSplitBundleRequestSchema = z.object({
  bundleId: IdSchema,
});

export type LockTaskSplitBundleRequest = z.infer<typeof LockTaskSplitBundleRequestSchema>;
