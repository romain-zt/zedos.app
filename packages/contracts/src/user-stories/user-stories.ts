import { z } from 'zod';
import { IdSchema } from '../common';

/** Draft line shape returned only from structured AI responses (validated before ledger/DB writes). */
export const UserStoryAiDraftItemSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(8000),
});

export type UserStoryAiDraftItem = z.infer<typeof UserStoryAiDraftItemSchema>;

export const UserStoryAiDraftListSchema = z.object({
  stories: z.array(UserStoryAiDraftItemSchema).min(1).max(50),
});

export type UserStoryAiDraftList = z.infer<typeof UserStoryAiDraftListSchema>;

export const UserStoryLineSchema = z.object({
  id: IdSchema,
  sortOrder: z.number().int().nonnegative(),
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(8000),
  archivedAt: z.coerce.date().nullable(),
  draftMarker: z.string().max(128).nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const UserStoryCorpusSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  featureSplitClusterId: IdSchema,
  reviewReadyAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  lines: z.array(UserStoryLineSchema),
});

export type UserStoryCorpusDTO = z.infer<typeof UserStoryCorpusSchema>;

/** Confirmed cluster summary for selectors (consistent with split labels/value lines). */
export const ConfirmedClusterSummarySchema = z.object({
  id: IdSchema,
  label: z.string(),
  valueLine: z.string(),
  boundaryCue: z.string(),
  sortOrder: z.number().int().nonnegative(),
  sourcePrdVersionId: IdSchema,
  featureSplitId: IdSchema,
});

export type ConfirmedClusterSummary = z.infer<typeof ConfirmedClusterSummarySchema>;

export const UserStoryWorkspaceStateSchema = z.object({
  confirmedClusters: z.array(ConfirmedClusterSummarySchema),
  /** Null when none exists yet for this cluster. */
  corpus: UserStoryCorpusSchema.nullable(),
});

export type UserStoryWorkspaceState = z.infer<typeof UserStoryWorkspaceStateSchema>;

export const SaveUserStoryLineInputSchema = z.object({
  id: IdSchema.optional(),
  sortOrder: z.number().int().nonnegative(),
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(8000),
  archivedAt: z.coerce.date().nullable().optional(),
  draftMarker: z.string().max(128).nullable().optional(),
});

export const SaveUserStoryCorpusRequestSchema = z.object({
  featureSplitClusterId: IdSchema,
  /** When the corpus header already exists, client sends last-known server `updatedAt` (ISO). Omit for first save while creating corpus. */
  expectCorpusUpdatedAt: z.coerce.date().optional(),
  lines: z.array(SaveUserStoryLineInputSchema).max(500),
});

export type SaveUserStoryCorpusRequest = z.infer<typeof SaveUserStoryCorpusRequestSchema>;

export const GenerateUserStoriesRequestSchema = z.object({
  featureSplitClusterId: IdSchema,
  mode: z.enum(['template', 'assisted']),
});

export type GenerateUserStoriesRequest = z.infer<typeof GenerateUserStoriesRequestSchema>;

/** After generation: refreshed persisted corpus snapshot. */
export const GenerateUserStoriesResponseSchema = UserStoryCorpusSchema;

export const MarkUserStoriesReviewReadyRequestSchema = z.object({
  featureSplitClusterId: IdSchema,
});

export const GetUserStoriesQuerySchema = z.object({
  featureSplitClusterId: IdSchema,
});

/** GET /user-stories — corpus for cluster (null when none yet). */
export const GetUserStoryCorpusResponseSchema = z.object({
  corpus: UserStoryCorpusSchema.nullable(),
});

/** POST /review-ready — updated corpus snapshot. */
export const MarkUserStoriesReviewReadyResponseSchema = UserStoryCorpusSchema;
