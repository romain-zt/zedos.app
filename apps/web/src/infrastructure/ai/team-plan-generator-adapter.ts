/**
 * Scout's team & skills plan generator.
 *
 * Calls the AI provider and validates against TeamPlanSchema. When the AI is
 * unavailable or returns an invalid payload, falls back to a deterministic
 * plan derived from the feature-split cluster labels — the customer always
 * leaves with a team plan.
 */

import { TeamPlanSchema, type TeamPlan } from '@repo/contracts/team';
import { Result, ok } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { ITeamPlanGenerator } from '@domain/team/team-repository';
import { callAI } from '@/lib/ai-service';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'TeamPlanGeneratorAI' });

const SYSTEM_PROMPT = `You are Scout, the talent scout of an AI product engineering team.
Given a product PRD and its feature clusters, recommend the team a customer needs to build it.

Output strictly valid JSON:
{
  "summary": "2-3 sentences describing the recommended team setup",
  "roles": [
    {
      "role": "Human-readable role title (e.g. 'Frontend developer')",
      "agentRole": "one of: product_manager | engineering_manager | architect | frontend_dev | backend_dev | talent_scout, or null",
      "mission": "What this role owns on this specific product",
      "skills": ["concrete skill", "..."]
    }
  ],
  "recommendedSkills": ["cross-team skills relevant to this product"],
  "recommendedAgents": [{ "name": "agent or tool name", "purpose": "why it helps here" }],
  "recommendedRules": [{ "name": "engineering rule/practice", "rationale": "why it matters here" }]
}

Rules:
- 3 to 6 roles, tailored to the actual product (not generic).
- Map roles to agentRole when one of the team personas fits, else null.
- Output only the JSON object.`;

function buildFallbackPlan(input: {
  projectName: string;
  clusterLabels: string[];
}): TeamPlan {
  const clusterSkills = input.clusterLabels.slice(0, 6);
  return {
    summary: `A lean product squad for ${input.projectName}: product direction, delivery management, and full-stack implementation, scaled to the confirmed feature areas.`,
    roles: [
      {
        role: 'Product manager',
        agentRole: 'product_manager',
        mission: 'Owns the PRD, clarifies scope, and arbitrates trade-offs.',
        skills: ['Product discovery', 'Spec writing', 'Prioritization'],
      },
      {
        role: 'Engineering manager',
        agentRole: 'engineering_manager',
        mission: 'Splits work into tickets, plans milestones, and keeps delivery on track.',
        skills: ['Delivery planning', 'Estimation', 'Risk management'],
      },
      {
        role: 'Architect',
        agentRole: 'architect',
        mission: 'Owns system design, data model, and the hard technical decisions.',
        skills: ['System design', 'API design', 'Security review'],
      },
      {
        role: 'Frontend developer',
        agentRole: 'frontend_dev',
        mission: 'Builds the user-facing product with a mobile-first mindset.',
        skills: ['React/Next.js', 'Responsive UI', 'Accessibility'],
      },
      {
        role: 'Backend developer',
        agentRole: 'backend_dev',
        mission: 'Implements services, persistence, and integrations.',
        skills: ['API development', 'Databases', 'Background jobs'],
      },
    ],
    recommendedSkills: clusterSkills.length > 0 ? clusterSkills : ['MVP scoping', 'Iterative delivery'],
    recommendedAgents: [
      { name: 'Code review agent', purpose: 'Keeps quality high on every pull request.' },
      { name: 'Test runner agent', purpose: 'Guards regressions as the ticket board moves.' },
    ],
    recommendedRules: [
      { name: 'Ship one vertical slice at a time', rationale: 'Each milestone delivers user-visible value.' },
      { name: 'Specs before code', rationale: 'Tickets link back to PRD sections and user stories.' },
    ],
  };
}

export class TeamPlanGeneratorAdapter implements ITeamPlanGenerator {
  async generate(input: {
    projectName: string;
    projectDescription: string | null;
    prdText: string;
    clusterLabels: string[];
  }): Promise<Result<TeamPlan, ApplicationError>> {
    try {
      const aiResponse = await callAI({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Project: ${input.projectName}\nDescription: ${input.projectDescription ?? 'n/a'}\nFeature clusters: ${input.clusterLabels.join(', ') || 'none yet'}\n\nPRD:\n${input.prdText || 'No PRD yet — base the plan on the project name and description.'}`,
          },
        ],
        responseFormat: { type: 'json_object' },
        maxTokens: 3000,
        temperature: 0.4,
      });

      const raw = await aiResponse.json();
      const text: string = raw?.choices?.[0]?.message?.content ?? '{}';
      const validated = TeamPlanSchema.safeParse(JSON.parse(text));
      if (validated.success) {
        return ok(validated.data);
      }
      logger.warn?.('Team plan AI response failed validation — using fallback plan');
      return ok(buildFallbackPlan(input));
    } catch (error) {
      logger.error('Team plan AI call failed — using fallback plan', error);
      return ok(buildFallbackPlan(input));
    }
  }
}

export const teamPlanGenerator = new TeamPlanGeneratorAdapter();
