import { z } from 'zod'
import { IdSchema } from '../shared/common'
import { OwnerMilestoneTypeSchema } from './submit'

/**
 * Payload crossing server actions / layout props → client milestone prompt.
 * Reuses canonical milestone enum from feedback submission contracts.
 */
export const OwnerMilestoneDetectedPayloadSchema = z.object({
  projectId: IdSchema,
  milestoneType: OwnerMilestoneTypeSchema,
  /** Present when milestone ties to a specific PRD version */
  prdVersionId: IdSchema.optional(),
})

export type OwnerMilestoneDetectedPayload = z.infer<typeof OwnerMilestoneDetectedPayloadSchema>
