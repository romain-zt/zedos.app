/**
 * Adversarial PRD red-team review contracts.
 *
 * Mirrors `docs/product/ai-red-team-prd-spec.md` finding schema. Sync v0: the API responds
 * with the full report once the AI call resolves (no async job).
 */

import { z } from 'zod';
import { IdSchema } from '../shared/common';

export const RedTeamCategorySchema = z.enum([
  'hype',
  'gap',
  'risk',
  'evidence',
  'metric',
  'compliance',
  'other',
]);
export type RedTeamCategory = z.infer<typeof RedTeamCategorySchema>;

export const RedTeamSeveritySchema = z.enum(['critical', 'major', 'minor', 'info']);
export type RedTeamSeverity = z.infer<typeof RedTeamSeveritySchema>;

export const RedTeamReportStatusSchema = z.enum(['pending', 'completed', 'failed', 'empty']);
export type RedTeamReportStatus = z.infer<typeof RedTeamReportStatusSchema>;

export const RedTeamFindingSchema = z.object({
  id: IdSchema,
  sortOrder: z.number().int().nonnegative(),
  category: RedTeamCategorySchema,
  severity: RedTeamSeveritySchema,
  /** Stable section anchor in the PRD; null when finding is structural. */
  sectionId: z.string().nullable(),
  title: z.string().min(1).max(300),
  evidence: z.string().min(1),
  suggestion: z.string().min(1),
});
export type RedTeamFinding = z.infer<typeof RedTeamFindingSchema>;

/** Generator (AI adapter) output — pre-persist shape; ids assigned by persistence layer. */
export const RedTeamGeneratorFindingSchema = RedTeamFindingSchema.omit({ id: true });
export type RedTeamGeneratorFinding = z.infer<typeof RedTeamGeneratorFindingSchema>;

export const RedTeamGeneratorOutputSchema = z.object({
  findings: z.array(RedTeamGeneratorFindingSchema).max(50),
});
export type RedTeamGeneratorOutput = z.infer<typeof RedTeamGeneratorOutputSchema>;

export const CreateRedTeamReportRequestSchema = z.object({
  prdVersionId: IdSchema,
});
export type CreateRedTeamReportRequest = z.infer<typeof CreateRedTeamReportRequestSchema>;

export const RedTeamReportSummarySchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  prdVersionId: IdSchema,
  status: RedTeamReportStatusSchema,
  creditCost: z.number().int().nonnegative(),
  findingCount: z.number().int().nonnegative(),
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});
export type RedTeamReportSummary = z.infer<typeof RedTeamReportSummarySchema>;

export const RedTeamReportDetailSchema = RedTeamReportSummarySchema.extend({
  findings: z.array(RedTeamFindingSchema),
});
export type RedTeamReportDetail = z.infer<typeof RedTeamReportDetailSchema>;

export const RedTeamReportListResponseSchema = z.object({
  reports: z.array(RedTeamReportSummarySchema),
});
export type RedTeamReportListResponse = z.infer<typeof RedTeamReportListResponseSchema>;
