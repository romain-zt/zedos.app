/**
 * User story corpus HTTP DTOs — persisted lines + save payload.
 */

import { z } from 'zod';
import { IdSchema } from '../shared/common';

export const UserStoryLineSchema = z.object({
  id: IdSchema,
  sortOrder: z.number().int().nonnegative(),
  title: z.string().min(1).max(2000),
  body: z.string().min(1).max(50_000),
  archivedAt: z.coerce.date().nullable(),
  draftMarker: z.string().max(200).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type UserStoryLineDTO = z.infer<typeof UserStoryLineSchema>;

export const UserStoryCorpusSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  featureSplitClusterId: IdSchema,
  reviewReadyAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lines: z.array(UserStoryLineSchema),
});

export type UserStoryCorpusDTO = z.infer<typeof UserStoryCorpusSchema>;

export const GetUserStoryCorpusResponseSchema = z.object({
  corpus: UserStoryCorpusSchema.nullable(),
});

export type GetUserStoryCorpusResponse = z.infer<typeof GetUserStoryCorpusResponseSchema>;

/** Line row for PUT — id omitted when creating a new line server-side. */
export const UserStoryLineSaveInputSchema = z.object({
  id: IdSchema.optional(),
  sortOrder: z.number().int().nonnegative(),
  title: z.string().min(1).max(2000),
  body: z.string().min(1).max(50_000),
  archivedAt: z.coerce.date().nullable().optional(),
  draftMarker: z.string().max(200).nullable().optional(),
});

export type UserStoryLineSaveInput = z.infer<typeof UserStoryLineSaveInputSchema>;

export const SaveUserStoryCorpusRequestSchema = z.object({
  featureSplitClusterId: IdSchema,
  lines: z.array(UserStoryLineSaveInputSchema).min(1).max(200),
});

export type SaveUserStoryCorpusRequest = z.infer<typeof SaveUserStoryCorpusRequestSchema>;

export const GetUserStoryCorpusQuerySchema = z.object({
  featureSplitClusterId: IdSchema,
});

export type GetUserStoryCorpusQuery = z.infer<typeof GetUserStoryCorpusQuerySchema>;

export const MarkUserStoriesReviewReadyRequestSchema = z.object({
  featureSplitClusterId: IdSchema,
});

export type MarkUserStoriesReviewReadyRequest = z.infer<
  typeof MarkUserStoriesReviewReadyRequestSchema
>;
