/**
 * Generate user stories — request/response + validated AI draft list.
 */

import { z } from 'zod';
import { IdSchema } from '../shared/common';
import { UserStoryCorpusSchema } from './corpus';

export const UserStoryAiDraftItemSchema = z.object({
  title: z.string().min(1).max(2000),
  body: z.string().min(1).max(50_000),
  sortOrder: z.number().int().nonnegative().optional(),
});

export type UserStoryAiDraftItem = z.infer<typeof UserStoryAiDraftItemSchema>;

/** Phase 1 — distinct behavior titles only (one AI call). */
export const UserStoryAiOutlineItemSchema = z.object({
  title: z.string().min(1).max(2000),
});

export type UserStoryAiOutlineItem = z.infer<typeof UserStoryAiOutlineItemSchema>;

export const UserStoryAiOutlineListSchema = z.object({
  outlines: z.array(UserStoryAiOutlineItemSchema).min(1).max(32),
});

export type UserStoryAiOutlineList = z.infer<typeof UserStoryAiOutlineListSchema>;

/** Phase 2 — one fully expanded story (one AI call per outline). */
export const UserStoryAiSingleDraftSchema = z.object({
  story: UserStoryAiDraftItemSchema,
});

export type UserStoryAiSingleDraft = z.infer<typeof UserStoryAiSingleDraftSchema>;

/** Raw AI output before persistence — validated in infrastructure before credit spend / writes. */
export const UserStoryAiDraftListSchema = z.object({
  stories: z.array(UserStoryAiDraftItemSchema).min(1).max(200),
});

export type UserStoryAiDraftList = z.infer<typeof UserStoryAiDraftListSchema>;

const featureSplitClusterIdField = { featureSplitClusterId: IdSchema };

export const GenerateUserStoriesTemplateRequestSchema = z.object({
  ...featureSplitClusterIdField,
  mode: z.literal('template'),
});

export const GenerateUserStoriesAiOutlineRequestSchema = z.object({
  ...featureSplitClusterIdField,
  mode: z.literal('ai'),
  aiStep: z.literal('outline'),
});

export const GenerateUserStoriesAiStoryRequestSchema = z.object({
  ...featureSplitClusterIdField,
  mode: z.literal('ai'),
  aiStep: z.literal('story'),
  outlines: z.array(UserStoryAiOutlineItemSchema).min(1).max(32),
  outlineIndex: z.number().int().nonnegative(),
  /** Lines already generated in this run (client accumulates between story calls). */
  existingLines: z
    .array(
      z.object({
        sortOrder: z.number().int().nonnegative(),
        title: z.string().min(1).max(2000),
        body: z.string().min(1).max(50_000),
      })
    )
    .optional(),
});

export const GenerateUserStoriesRequestSchema = z.union([
  GenerateUserStoriesTemplateRequestSchema,
  GenerateUserStoriesAiOutlineRequestSchema,
  GenerateUserStoriesAiStoryRequestSchema,
]);

export type GenerateUserStoriesRequest = z.infer<typeof GenerateUserStoriesRequestSchema>;

export const GenerateUserStoriesCorpusResponseSchema = z.object({
  kind: z.literal('corpus'),
  corpus: UserStoryCorpusSchema,
});

export const GenerateUserStoriesOutlineResponseSchema = z.object({
  kind: z.literal('outline'),
  outlines: z.array(UserStoryAiOutlineItemSchema).min(1).max(32),
  total: z.number().int().positive(),
});

export const GenerateUserStoriesStoryProgressResponseSchema = z.object({
  kind: z.literal('story'),
  corpus: UserStoryCorpusSchema,
  progress: z.object({
    current: z.number().int().positive(),
    total: z.number().int().positive(),
    done: z.boolean(),
  }),
});

export const GenerateUserStoriesResponseSchema = z.discriminatedUnion('kind', [
  GenerateUserStoriesCorpusResponseSchema,
  GenerateUserStoriesOutlineResponseSchema,
  GenerateUserStoriesStoryProgressResponseSchema,
]);

export type GenerateUserStoriesResponse = z.infer<typeof GenerateUserStoriesResponseSchema>;
