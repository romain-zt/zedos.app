/**
 * Generate user stories — request/response + validated AI draft list.
 */

import { z } from 'zod';
import { IdSchema } from '../shared/common';
import { UserStoryCorpusSchema } from './corpus';

export const GenerateUserStoriesRequestSchema = z.object({
  featureSplitClusterId: IdSchema,
  mode: z.enum(['template', 'ai']),
});

export type GenerateUserStoriesRequest = z.infer<typeof GenerateUserStoriesRequestSchema>;

export const UserStoryAiDraftItemSchema = z.object({
  title: z.string().min(1).max(2000),
  body: z.string().min(1).max(50_000),
  sortOrder: z.number().int().nonnegative().optional(),
});

export type UserStoryAiDraftItem = z.infer<typeof UserStoryAiDraftItemSchema>;

/** Raw AI output before persistence — validated in infrastructure before credit spend / writes. */
export const UserStoryAiDraftListSchema = z.object({
  stories: z.array(UserStoryAiDraftItemSchema).min(1).max(200),
});

export type UserStoryAiDraftList = z.infer<typeof UserStoryAiDraftListSchema>;

export const GenerateUserStoriesResponseSchema = z.object({
  corpus: UserStoryCorpusSchema,
});

export type GenerateUserStoriesResponse = z.infer<typeof GenerateUserStoriesResponseSchema>;
