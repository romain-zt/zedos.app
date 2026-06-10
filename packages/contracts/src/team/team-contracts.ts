import { z } from 'zod';

/**
 * The zedos AI engineering team — product personas that own pipeline stages.
 */
export const AGENT_ROLES = [
  'product_manager',
  'engineering_manager',
  'architect',
  'frontend_dev',
  'backend_dev',
  'talent_scout',
] as const;

export const AgentRoleSchema = z.enum(AGENT_ROLES);
export type AgentRole = z.infer<typeof AgentRoleSchema>;

export const AGENT_ACTIVITY_KINDS = [
  'clarification',
  'prd_generation',
  'prd_edit',
  'prd_refinement',
  'feature_split',
  'user_stories',
  'task_split',
  'red_team',
  'delivery_export',
  'tickets_generation',
  'plan_generation',
  'team_plan',
] as const;

export const AgentActivityKindSchema = z.enum(AGENT_ACTIVITY_KINDS);
export type AgentActivityKind = z.infer<typeof AgentActivityKindSchema>;

export const AgentActivityStatusSchema = z.enum(['running', 'completed', 'failed']);
export type AgentActivityStatus = z.infer<typeof AgentActivityStatusSchema>;

export const AgentActivityDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  agentRole: AgentRoleSchema,
  kind: AgentActivityKindSchema,
  status: AgentActivityStatusSchema,
  summary: z.string(),
  createdAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable(),
});

export type AgentActivityDTO = z.infer<typeof AgentActivityDTOSchema>;

export const AgentActivityListResponseSchema = z.object({
  activities: z.array(AgentActivityDTOSchema),
});

export type AgentActivityListResponse = z.infer<typeof AgentActivityListResponseSchema>;

/** Scout (talent scout / "HR") output: the team & skills the project needs. */
export const TeamPlanRoleSchema = z.object({
  role: z.string().min(1),
  agentRole: AgentRoleSchema.nullable(),
  mission: z.string(),
  skills: z.array(z.string()),
});

export const TeamPlanSchema = z.object({
  summary: z.string(),
  roles: z.array(TeamPlanRoleSchema).min(1),
  recommendedSkills: z.array(z.string()),
  recommendedAgents: z.array(
    z.object({
      name: z.string().min(1),
      purpose: z.string(),
    })
  ),
  recommendedRules: z.array(
    z.object({
      name: z.string().min(1),
      rationale: z.string(),
    })
  ),
});

export type TeamPlan = z.infer<typeof TeamPlanSchema>;

export const TeamPlanDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  plan: TeamPlanSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TeamPlanDTO = z.infer<typeof TeamPlanDTOSchema>;

/** AI response schema for Scout's team plan generation. */
export const TeamPlanAiResponseSchema = TeamPlanSchema;
export type TeamPlanAiResponse = z.infer<typeof TeamPlanAiResponseSchema>;
