import { IProjectRepository } from '@domain/project/project-repository';
import { IPrdRepository } from '@domain/prd/prd-repository';
import { IAdrRepository } from '@domain/adr/adr-repository';
import { ProjectDomainService } from '@domain/project/project-service';
import { AdrDomainService } from '@domain/adr/adr-service';
import { Result, ok } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { ReadinessScoreResponse } from '@repo/contracts/adr/adr-contracts';

export class ReadinessScoreUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository: IPrdRepository,
    private adrRepository: IAdrRepository
  ) {}

  async execute(projectId: string, userId: string): Promise<Result<ReadinessScoreResponse, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) return projectResult as any;
    const project = projectResult.unwrap();

    // PRD stability
    const prdResult = await this.prdRepository.findLatestByProjectId(projectId);
    if (prdResult.isErr()) return prdResult as any;
    const latestPrd = prdResult.unwrap();

    const { filledCount, totalRequired } = ProjectDomainService.checkPrdStability(
      latestPrd?.content as Record<string, unknown> | null
    );

    // ADR completion
    const adrResult = await this.adrRepository.countCompleteCore(projectId);
    if (adrResult.isErr()) return adrResult as any;
    const { total: adrCount, complete: completeAdrs } = adrResult.unwrap();

    const score = AdrDomainService.calculateReadinessScore(filledCount, totalRequired, completeAdrs);

    return ok({
      ...score,
      phase: project.phase,
      prdVersion: latestPrd?.versionNumber || 0,
      adrCount,
    }) as any;
  }
}
