import { z } from 'zod'
import { IdSchema } from '../shared/common'

/** Canonical milestone keys for signed-in owner feedback prompts */
export const OwnerMilestoneTypeSchema = z.enum([
  'prd_created',
  'prd_updated',
  'prd_shared',
  'prd_viewed',
])

export type OwnerMilestoneType = z.infer<typeof OwnerMilestoneTypeSchema>

export const RatingTypeSchema = z.enum(['stars', 'outcome'])

export type RatingType = z.infer<typeof RatingTypeSchema>

/** O1 share outcome — `prd_shared` milestone */
export const ShareOutcomeValueSchema = z.enum(['yes', 'not_yet', 'no'])

export type ShareOutcomeValue = z.infer<typeof ShareOutcomeValueSchema>

export const MilestoneFeedbackSubmitRequestSchema = z.object({
  projectId: IdSchema,
  prdVersionId: IdSchema.nullable().optional(),
  milestoneType: OwnerMilestoneTypeSchema,
  ratingType: RatingTypeSchema.optional().default('stars'),
  ratingValue: z.number().int().min(0).max(5).nullable().optional(),
  outcomeValue: ShareOutcomeValueSchema.optional(),
  comment: z.string().max(8000).nullable().optional(),
})

export type MilestoneFeedbackSubmitRequest = z.infer<typeof MilestoneFeedbackSubmitRequestSchema>

export const MilestoneFeedbackDuplicateResponseSchema = z.object({
  message: z.string(),
})

export const MilestoneFeedbackRowDTOSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  projectId: IdSchema,
  prdVersionId: IdSchema.nullable(),
  /** DB column is unconstrained text; response allows historical values */
  milestoneType: z.string().min(1),
  ratingType: z.string(),
  ratingValue: z.number().nullable(),
  comment: z.string().nullable(),
  createdAt: z.union([z.string(), z.coerce.date()]),
})

export type MilestoneFeedbackRowDTO = z.infer<typeof MilestoneFeedbackRowDTOSchema>
