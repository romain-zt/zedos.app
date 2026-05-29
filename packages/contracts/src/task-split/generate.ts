import { z } from 'zod';

/** Request to AI-generate task split draft from user stories corpus. */
export const GenerateTaskSplitRequestSchema = z.object({
  /** Optional stable key of the user story to generate tasks from. */
  sourceUserStoryKey: z.string().max(500).optional(),
  /** Optional snapshot of the story title to include in prompt context. */
  storyTitleSnapshot: z.string().max(500).optional(),
});

export type GenerateTaskSplitRequest = z.infer<typeof GenerateTaskSplitRequestSchema>;

/** AI response shape for a single generated task. */
export const GeneratedTaskItemSchema = z.object({
  title: z.string().min(1).max(500),
  promptBody: z.string().min(1).max(10_000),
});

export type GeneratedTaskItem = z.infer<typeof GeneratedTaskItemSchema>;

/** AI response shape — array of tasks. Validated before any DB write. */
export const GenerateTaskSplitAiResponseSchema = z.object({
  tasks: z.array(GeneratedTaskItemSchema).min(1).max(20),
});

export type GenerateTaskSplitAiResponse = z.infer<typeof GenerateTaskSplitAiResponseSchema>;
