import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type {
  AgentActivityDTO,
  AgentActivityKind,
  AgentRole,
  TeamPlan,
  TeamPlanDTO,
} from '@repo/contracts/team';

export interface StartAgentActivityInput {
  projectId: string;
  agentRole: AgentRole;
  kind: AgentActivityKind;
  summary: string;
  payload?: Record<string, unknown>;
}

export interface CompleteAgentActivityInput {
  activityId: string;
  status: 'completed' | 'failed';
  summary?: string;
}

export interface IAgentActivityRepository {
  start(input: StartAgentActivityInput): Promise<Result<AgentActivityDTO, ApplicationError>>;
  finish(input: CompleteAgentActivityInput): Promise<Result<void, ApplicationError>>;
  listByProject(
    projectId: string,
    limit?: number,
  ): Promise<Result<AgentActivityDTO[], ApplicationError>>;
}

export interface ITeamPlanRepository {
  upsert(projectId: string, plan: TeamPlan): Promise<Result<TeamPlanDTO, ApplicationError>>;
  findByProject(projectId: string): Promise<Result<TeamPlanDTO | null, ApplicationError>>;
}

export interface ITeamPlanGenerator {
  generate(input: {
    projectName: string;
    projectDescription: string | null;
    prdText: string;
    clusterLabels: string[];
  }): Promise<Result<TeamPlan, ApplicationError>>;
}
