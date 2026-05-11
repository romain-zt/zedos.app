/**
 * Owner milestone feedback — POST /api/feedback
 */

import { z } from 'zod'

/** Canonical milestone keys stored in milestone_feedback.milestone_type */
export const OwnerMilestoneTypeSchema = z.enum([
  'prd_created',
  'prd_updated_after_clarification',
  'prd_shared',
  'prd_reopened',
])

export type OwnerMilestoneType = z.infer<typeof OwnerMilestoneTypeSchema>

export const SubmitMilestoneFeedbackRequestSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  prdVersionId: z.string().min(1).nullable().optional(),
  milestoneType: OwnerMilestoneTypeSchema,
  ratingType: z.string().min(1).optional(),
  ratingValue: z.number().int().min(0).max(5).nullable().optional(),
  comment: z.string().max(8000).nullable().optional(),
})

export type SubmitMilestoneFeedbackRequest = z.infer<typeof SubmitMilestoneFeedbackRequestSchema>

export const MilestoneFeedbackRowSchema = z.object({
  id: z.string(),
  userId: z.string(),
  projectId: z.string(),
  prdVersionId: z.string().nullable(),
  milestoneType: z.string(),
  ratingType: z.string(),
  ratingValue: z.number().nullable(),
  comment: z.string().nullable(),
  createdAt: z.coerce.date(),
})

export type MilestoneFeedbackRow = z.infer<typeof MilestoneFeedbackRowSchema>

export const MilestoneFeedbackDuplicateResponseSchema = z.object({
  message: z.string(),
})

export const MilestoneFeedbackPostResponseSchema = z.union([
  MilestoneFeedbackRowSchema,
  MilestoneFeedbackDuplicateResponseSchema,
])
