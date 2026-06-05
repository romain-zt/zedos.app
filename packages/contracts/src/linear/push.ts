import { z } from 'zod';

export const LinearIssueLinkStatusSchema = z.enum([
  'triage',
  'backlog',
  'todo',
  'in_progress',
  'done',
  'canceled',
  'unknown',
]);
export type LinearIssueLinkStatusContract = z.infer<typeof LinearIssueLinkStatusSchema>;

export const PushStoryToLinearRequestSchema = z.object({
  userStoryLineId: z.string().min(1),
});

export type PushStoryToLinearRequest = z.infer<typeof PushStoryToLinearRequestSchema>;

export const LinearIssueLinkDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userStoryLineId: z.string(),
  linearIssueId: z.string(),
  linearIssueIdentifier: z.string(),
  status: LinearIssueLinkStatusSchema,
  lastSyncedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export type LinearIssueLinkDTO = z.infer<typeof LinearIssueLinkDTOSchema>;

export const PushStoryToLinearResponseSchema = z.object({
  link: LinearIssueLinkDTOSchema,
});

export type PushStoryToLinearResponse = z.infer<typeof PushStoryToLinearResponseSchema>;
