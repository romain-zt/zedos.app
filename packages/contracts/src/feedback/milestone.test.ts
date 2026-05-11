import { describe, expect, it } from 'vitest'
import {
  OwnerMilestoneTypeSchema,
  SubmitMilestoneFeedbackRequestSchema,
  MilestoneFeedbackRowSchema,
  MilestoneFeedbackDuplicateResponseSchema,
} from './milestone'

describe('SubmitMilestoneFeedbackRequestSchema', () => {
  it('accepts a valid payload', () => {
    const r = SubmitMilestoneFeedbackRequestSchema.safeParse({
      projectId: 'p1',
      prdVersionId: null,
      milestoneType: 'prd_shared',
      ratingType: 'stars',
      ratingValue: 4,
      comment: 'ok',
    })
    expect(r.success).toBe(true)
  })

  it('rejects unknown milestone', () => {
    const r = SubmitMilestoneFeedbackRequestSchema.safeParse({
      projectId: 'p1',
      milestoneType: 'nope',
      ratingValue: 3,
    })
    expect(r.success).toBe(false)
  })

  it('rejects missing projectId', () => {
    const r = SubmitMilestoneFeedbackRequestSchema.safeParse({
      milestoneType: 'prd_created',
    })
    expect(r.success).toBe(false)
  })
})

describe('OwnerMilestoneTypeSchema', () => {
  it('parses all four owner milestones', () => {
    for (const v of [
      'prd_created',
      'prd_updated_after_clarification',
      'prd_shared',
      'prd_reopened',
    ] as const) {
      expect(OwnerMilestoneTypeSchema.safeParse(v).success).toBe(true)
    }
  })
})

describe('MilestoneFeedbackRowSchema', () => {
  it('coerces createdAt', () => {
    const r = MilestoneFeedbackRowSchema.safeParse({
      id: '1',
      userId: 'u',
      projectId: 'p',
      prdVersionId: null,
      milestoneType: 'prd_created',
      ratingType: 'stars',
      ratingValue: 5,
      comment: null,
      createdAt: '2026-05-11T12:00:00.000Z',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.createdAt).toBeInstanceOf(Date)
  })
})

describe('MilestoneFeedbackDuplicateResponseSchema', () => {
  it('parses duplicate message', () => {
    const r = MilestoneFeedbackDuplicateResponseSchema.safeParse({
      message: 'Feedback already submitted',
    })
    expect(r.success).toBe(true)
  })
})
