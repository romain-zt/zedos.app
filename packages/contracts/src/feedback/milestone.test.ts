import { describe, expect, it } from 'vitest';
import {
  MilestoneFeedbackPostBodySchema,
  OwnerMilestoneTypeSchema,
} from './milestone';

describe('OwnerMilestoneTypeSchema', () => {
  it.each([
    'first_prd_version_created',
    'prd_version_updated_after_clarification',
    'prd_shared',
    'prd_reopened_after_generation',
    'prd_created',
  ] as const)('allows %s', (v) => {
    expect(OwnerMilestoneTypeSchema.safeParse(v).success).toBe(true);
  });
});

describe('MilestoneFeedbackPostBodySchema', () => {
  it('accepts minimal valid body', () => {
    const r = MilestoneFeedbackPostBodySchema.safeParse({
      projectId: 'p1',
      milestoneType: 'first_prd_version_created',
    });
    expect(r.success).toBe(true);
  });

  it('accepts nullable prdVersionId', () => {
    const r = MilestoneFeedbackPostBodySchema.safeParse({
      projectId: 'p1',
      prdVersionId: null,
      milestoneType: 'prd_shared',
    });
    expect(r.success).toBe(true);
  });

  it('rejects unknown milestone type', () => {
    const r = MilestoneFeedbackPostBodySchema.safeParse({
      projectId: 'p1',
      milestoneType: 'not_a_milestone',
    });
    expect(r.success).toBe(false);
  });
});
