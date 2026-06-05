import { Result, ok, err } from '@repo/result';
import { ApplicationError, NotFoundError } from '@shared/errors/application-error';
import { IProjectRepository } from '@domain/project/project-repository';
import { IRedTeamReportRepository } from '@domain/red-team/red-team-report-repository';
import type { RedTeamReportWithFindings } from '@domain/red-team/red-team-report';

export class GetRedTeamReportUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private redTeamRepository: IRedTeamReportRepository,
  ) {}

  async execute(
    projectId: string,
    reportId: string,
    userId: string,
  ): Promise<Result<RedTeamReportWithFindings, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) return err(projectResult.error);

    const reportResult = await this.redTeamRepository.findByIdForOwner(reportId, userId);
    if (reportResult.isErr()) return err(reportResult.error);

    const report = reportResult.unwrap();
    if (report === null || report.projectId !== projectId) {
      return err(new NotFoundError('Red team report not found'));
    }
    return ok(report);
  }
}
