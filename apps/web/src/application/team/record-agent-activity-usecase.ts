import { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { AgentActivityDTO, AgentActivityKind, AgentRole } from '@repo/contracts/team';
import type {
  IAgentActivityRepository,
} from '@domain/team/team-repository';
import { ACTIVITY_KIND_OWNER } from '@domain/team/agent-roster';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'RecordAgentActivityUseCase' });

export interface StartActivityInput {
  projectId: string;
  kind: AgentActivityKind;
  summary: string;
  /** Override the default owner of the activity kind. */
  agentRole?: AgentRole;
  payload?: Record<string, unknown>;
}

/**
 * Records agent activity rows for the Team feed.
 *
 * `startSafe` / `finishSafe` are fire-and-forget: activity recording must
 * never break the underlying product flow, so failures are logged only.
 */
export class RecordAgentActivityUseCase {
  constructor(private activityRepository: IAgentActivityRepository) {}

  async start(input: StartActivityInput): Promise<Result<AgentActivityDTO, ApplicationError>> {
    return this.activityRepository.start({
      projectId: input.projectId,
      agentRole: input.agentRole ?? ACTIVITY_KIND_OWNER[input.kind],
      kind: input.kind,
      summary: input.summary,
      payload: input.payload,
    });
  }

  async finish(
    activityId: string,
    status: 'completed' | 'failed',
    summary?: string,
  ): Promise<Result<void, ApplicationError>> {
    return this.activityRepository.finish({ activityId, status, summary });
  }

  /** Never throws, never fails the caller — returns activity id or null. */
  async startSafe(input: StartActivityInput): Promise<string | null> {
    try {
      const result = await this.start(input);
      if (result.isErr()) {
        logger.error('Agent activity start failed', { kind: input.kind });
        return null;
      }
      return result.unwrap().id;
    } catch (error) {
      logger.error('Agent activity start threw', error);
      return null;
    }
  }

  /** Never throws, never fails the caller. */
  async finishSafe(
    activityId: string | null,
    status: 'completed' | 'failed',
    summary?: string,
  ): Promise<void> {
    if (!activityId) return;
    try {
      const result = await this.finish(activityId, status, summary);
      if (result.isErr()) {
        logger.error('Agent activity finish failed', { activityId, status });
      }
    } catch (error) {
      logger.error('Agent activity finish threw', error);
    }
  }
}
