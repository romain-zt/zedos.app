import { z } from 'zod';

/**
 * Owner milestone prompt types — align with FA owner-milestone-feedback scope slice.
 * `prd_created` is accepted for backwards compatibility with older clients.
 */
export const OwnerMilestoneTypeSchema = z.enum([
  'first_prd_version_created',
  'prd_version_updated_after_clarification',
  'prd_shared',
  'prd_reopened_after_generation',
  'prd_created',
])

export type OwnerMilestoneType = z.infer<typeof OwnerMilestoneTypeSchema>

export const MilestoneFeedbackPostBodySchema = z.object({
  projectId: z.string().min(1),
  prdVersionId: z.string().min(1).nullable().optional(),
  milestoneType: OwnerMilestoneTypeSchema,
  ratingType: z.string().optional(),
  ratingValue: z.number().nullable().optional(),
  comment: z.string().nullable().optional(),
})

export type MilestoneFeedbackPostBody = z.infer<typeof MilestoneFeedbackPostBodySchema>
