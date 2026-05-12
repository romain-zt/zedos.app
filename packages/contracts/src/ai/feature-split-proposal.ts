/**
 * AI-validated payload for assisted feature-split proposals.
 */

import { z } from 'zod';
import { IdSchema } from '../shared/common';

/** One proposed cluster as returned by the model (no persisted id). */
export const FeatureSplitProposalClusterSchema = z.object({
  sortOrder: z.number().int().nonnegative(),
  label: z.string().min(1).max(500),
  valueLine: z.string().min(1).max(2000),
  boundaryCue: z.string().min(1).max(2000),
});

export type FeatureSplitProposalCluster = z.infer<typeof FeatureSplitProposalClusterSchema>;

export const FeatureSplitProposalSchema = z.object({
  clusters: z.array(FeatureSplitProposalClusterSchema).min(1).max(32),
});

export type FeatureSplitProposal = z.infer<typeof FeatureSplitProposalSchema>;

export const ProposeFeatureSplitRequestSchema = z.object({
  sourcePrdVersionId: IdSchema,
});

export type ProposeFeatureSplitRequest = z.infer<typeof ProposeFeatureSplitRequestSchema>;

export const ProposeFeatureSplitResponseSchema = z.object({
  proposal: FeatureSplitProposalSchema,
  creditsDeducted: z.number().int().nonnegative().optional(),
});

export type ProposeFeatureSplitResponse = z.infer<typeof ProposeFeatureSplitResponseSchema>;
