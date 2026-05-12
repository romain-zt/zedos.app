import { describe, expect, it } from 'vitest'
import { OwnerMilestoneDetectedPayloadSchema } from './milestone-prompt'

describe('OwnerMilestoneDetectedPayloadSchema', () => {
  it('accepts minimal valid payload', () => {
    const r = OwnerMilestoneDetectedPayloadSchema.safeParse({
      projectId: 'proj_01',
      milestoneType: 'prd_shared',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.prdVersionId).toBeUndefined()
  })

  it('accepts payload with prdVersionId', () => {
    const r = OwnerMilestoneDetectedPayloadSchema.safeParse({
      projectId: 'proj_01',
      milestoneType: 'prd_created',
      prdVersionId: 'pv_01',
    })
    expect(r.success).toBe(true)
  })

  it('rejects invalid milestone key', () => {
    const r = OwnerMilestoneDetectedPayloadSchema.safeParse({
      projectId: 'proj_01',
      milestoneType: 'unknown',
    })
    expect(r.success).toBe(false)
  })
})
