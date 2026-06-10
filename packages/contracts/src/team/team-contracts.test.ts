import { describe, it, expect } from 'vitest';
import {
  AgentActivityDTOSchema,
  AgentRoleSchema,
  TeamPlanSchema,
} from './team-contracts';

describe('team contracts', () => {
  it('accepts all roster roles', () => {
    for (const role of [
      'product_manager',
      'engineering_manager',
      'architect',
      'frontend_dev',
      'backend_dev',
      'talent_scout',
    ]) {
      expect(AgentRoleSchema.safeParse(role).success).toBe(true);
    }
    expect(AgentRoleSchema.safeParse('designer').success).toBe(false);
  });

  it('validates an activity DTO and coerces dates', () => {
    const parsed = AgentActivityDTOSchema.safeParse({
      id: 'a1',
      projectId: 'p1',
      agentRole: 'product_manager',
      kind: 'prd_generation',
      status: 'running',
      summary: 'Nova is drafting the PRD',
      createdAt: '2026-06-10T10:00:00.000Z',
      completedAt: null,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.createdAt).toBeInstanceOf(Date);
    }
  });

  it('rejects a team plan with no roles', () => {
    const parsed = TeamPlanSchema.safeParse({
      summary: 'A team',
      roles: [],
      recommendedSkills: [],
      recommendedAgents: [],
      recommendedRules: [],
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts a complete team plan', () => {
    const parsed = TeamPlanSchema.safeParse({
      summary: 'Lean squad',
      roles: [
        {
          role: 'Product manager',
          agentRole: 'product_manager',
          mission: 'Owns the PRD',
          skills: ['Discovery'],
        },
      ],
      recommendedSkills: ['MVP scoping'],
      recommendedAgents: [{ name: 'Reviewer', purpose: 'Reviews PRs' }],
      recommendedRules: [{ name: 'Specs first', rationale: 'Traceability' }],
    });
    expect(parsed.success).toBe(true);
  });
});
