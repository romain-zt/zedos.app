import { IProjectRepository } from '@domain/project/project-repository';
import { IPrdRepository } from '@domain/prd/prd-repository';
import { ProjectDomainService } from '@domain/project/project-service';
import { Result, ok } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { PhaseCheckResponse } from '@contracts/adr/adr-contracts';

export class CheckPhaseUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository: IPrdRepository
  ) {}

  async execute(projectId: string, userId: string): Promise<Result<PhaseCheckResponse, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) return projectResult as any;
    const project = projectResult.unwrap();

    const prdResult = await this.prdRepository.findLatestByProjectId(projectId);
    if (prdResult.isErr()) return prdResult as any;
    const latestPrd = prdResult.unwrap();

    const { isStable } = ProjectDomainService.checkPrdStability(
      latestPrd?.content as Record<string, unknown> | null
    );

    const { reason } = ProjectDomainService.canUnlockArchitecture(project, isStable);

    return ok({
      isStable,
      message: reason,
      currentPhase: project.phase,
    }) as any;
  }
}
