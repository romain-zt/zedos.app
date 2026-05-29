import { IProjectRepository } from '@domain/project/project-repository';
import { IPrdRepository } from '@domain/prd/prd-repository';
import { ProjectDomainService } from '@domain/project/project-service';
import { Result, ok } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { PhaseCheckResponse } from '@repo/contracts/adr/adr-contracts';
import { forwardErr } from '@shared/result/propagate';

export class CheckPhaseUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository: IPrdRepository
  ) {}

  async execute(
    projectId: string,
    userId: string
  ): Promise<Result<PhaseCheckResponse, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) return forwardErr(projectResult);
    const project = projectResult.unwrap();

    const prdResult = await this.prdRepository.findLatestByProjectId(projectId);
    if (prdResult.isErr()) return forwardErr(prdResult);
    const latestPrd = prdResult.unwrap();

    const { isStable } = ProjectDomainService.checkPrdStability(
      latestPrd?.content as Record<string, unknown> | null
    );

    const { reason } = ProjectDomainService.canUnlockArchitecture(project, isStable);

    const response: PhaseCheckResponse = {
      isStable,
      message: reason,
      currentPhase: project.phase,
    };
    return ok(response);
  }
}
