import { describe, it, expect } from 'vitest'
import {
  MilestoneFeedbackSubmitRequestSchema,
  MilestoneFeedbackRowDTOSchema,
  OwnerMilestoneTypeSchema,
} from './submit'

describe('OwnerMilestoneTypeSchema', () => {
  it.each(['prd_created', 'prd_updated', 'prd_shared', 'prd_viewed'] as const)('accepts %s', (t) => {
    expect(OwnerMilestoneTypeSchema.safeParse(t).success).toBe(true)
  })

  it('rejects unknown', () => {
    expect(OwnerMilestoneTypeSchema.safeParse('other').success).toBe(false)
  })
})

describe('MilestoneFeedbackSubmitRequestSchema', () => {
  it('accepts minimal body', () => {
    const r = MilestoneFeedbackSubmitRequestSchema.safeParse({
      projectId: 'p1',
      milestoneType: 'prd_created',
    })
    expect(r.success).toBe(true)
  })

  it('requires projectId', () => {
    expect(
      MilestoneFeedbackSubmitRequestSchema.safeParse({ milestoneType: 'prd_created' }).success
    ).toBe(false)
  })
})

describe('MilestoneFeedbackRowDTOSchema', () => {
  it('parses row', () => {
    const r = MilestoneFeedbackRowDTOSchema.safeParse({
      id: 'a',
      userId: 'u',
      projectId: 'p',
      prdVersionId: null,
      milestoneType: 'prd_shared',
      ratingType: 'stars',
      ratingValue: 4,
      comment: null,
      createdAt: '2026-05-11T00:00:00.000Z',
    })
    expect(r.success).toBe(true)
  })

  it('allows legacy milestone strings', () => {
    expect(
      MilestoneFeedbackRowDTOSchema.safeParse({
        id: 'a',
        userId: 'u',
        projectId: 'p',
        prdVersionId: null,
        milestoneType: 'legacy_key',
        ratingType: 'stars',
        ratingValue: null,
        comment: null,
        createdAt: new Date(),
      }).success
    ).toBe(true)
  })
})
