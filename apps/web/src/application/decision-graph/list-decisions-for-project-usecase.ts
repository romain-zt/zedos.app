import type { IDecisionGraphRepository } from '@domain/decision-graph/decision-graph-repository';
import type { Decision } from '@domain/decision-graph/decision';
import { IProjectRepository } from '@domain/project/project-repository';
import type { PrdSection } from '@repo/contracts/questions/history';
import { Result, err, ok } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';

export class ListDecisionsForProjectUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly decisionGraphRepository: IDecisionGraphRepository,
  ) {}

  async execute(
    projectId: string,
    userId: string,
    sectionFilter?: PrdSection,
  ): Promise<Result<Decision[], ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      return err(projectResult.error);
    }

    const listResult = await this.decisionGraphRepository.findByProjectId(projectId);
    if (listResult.isErr()) {
      return err(listResult.error);
    }

    const decisions = listResult.unwrap();
    if (!sectionFilter) {
      return ok(decisions);
    }

    return ok(decisions.filter((d) => d.sectionIds.includes(sectionFilter)));
  }
}
