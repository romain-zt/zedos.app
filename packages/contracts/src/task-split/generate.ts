/**
 * Task-split draft generation — template or assisted (AI) task lists.
 */

import { z } from 'zod';
import { IdSchema } from '../shared/common';
import { TaskSplitTaskSaveInputSchema } from './bundle';

export const GenerateTaskSplitRequestSchema = z.object({
  userStoryLineId: IdSchema,
  mode: z.enum(['template', 'ai']),
});

export type GenerateTaskSplitRequest = z.infer<typeof GenerateTaskSplitRequestSchema>;

export const TaskSplitAiDraftTaskSchema = z.object({
  title: z.string().min(1).max(2000),
  promptBody: z.string().min(1).max(20_000),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const TaskSplitAiDraftListSchema = z.object({
  tasks: z.array(TaskSplitAiDraftTaskSchema).min(1).max(32),
});

export type TaskSplitAiDraftList = z.infer<typeof TaskSplitAiDraftListSchema>;

export const GenerateTaskSplitDraftResponseSchema = z.object({
  userStoryLineId: IdSchema,
  storyTitle: z.string().min(1),
  storyBody: z.string().min(1),
  tasks: z.array(TaskSplitTaskSaveInputSchema).min(1).max(64),
});

export type GenerateTaskSplitDraftResponse = z.infer<typeof GenerateTaskSplitDraftResponseSchema>;
