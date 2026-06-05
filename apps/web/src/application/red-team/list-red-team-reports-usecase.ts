import { Result, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { IProjectRepository } from '@domain/project/project-repository';
import { IRedTeamReportRepository } from '@domain/red-team/red-team-report-repository';
import type { RedTeamReport } from '@domain/red-team/red-team-report';

export class ListRedTeamReportsUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private redTeamRepository: IRedTeamReportRepository,
  ) {}

  async execute(
    projectId: string,
    userId: string,
  ): Promise<Result<RedTeamReport[], ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) return err(projectResult.error);
    return this.redTeamRepository.listByProject(projectId, userId);
  }
}
