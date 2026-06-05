import type { Decision, DecisionInsertDraft } from './decision';
import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';

export interface IDecisionGraphRepository {
  insertDecisionIfAbsent(
    draft: DecisionInsertDraft,
  ): Promise<Result<{ created: boolean; decisionId: string | null }, ApplicationError>>;

  findByProjectId(
    projectId: string,
    limit?: number,
  ): Promise<Result<Decision[], ApplicationError>>;

  findQuestionHistoryIdsAlreadyPersisted(
    projectId: string,
    candidateIds: string[],
  ): Promise<Result<Set<string>, ApplicationError>>;

  countBySectionForProject(
    projectId: string,
  ): Promise<Result<Record<string, number>, ApplicationError>>;
}
