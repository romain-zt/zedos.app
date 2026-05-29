import { IProjectRepository } from '@domain/project/project-repository';
import { IPrdRepository } from '@domain/prd/prd-repository';
import { IAdrRepository } from '@domain/adr/adr-repository';
import { ProjectDomainService } from '@domain/project/project-service';
import { AdrDomainService } from '@domain/adr/adr-service';
import { Result, ok } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { ReadinessScoreResponse } from '@repo/contracts/adr/adr-contracts';
import { forwardErr } from '@shared/result/propagate';

export class ReadinessScoreUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository: IPrdRepository,
    private adrRepository: IAdrRepository
  ) {}

  async execute(
    projectId: string,
    userId: string
  ): Promise<Result<ReadinessScoreResponse, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) return forwardErr(projectResult);
    const project = projectResult.unwrap();

    const prdResult = await this.prdRepository.findLatestByProjectId(projectId);
    if (prdResult.isErr()) return forwardErr(prdResult);
    const latestPrd = prdResult.unwrap();

    const { filledCount, totalRequired } = ProjectDomainService.checkPrdStability(
      latestPrd?.content as Record<string, unknown> | null
    );

    const adrResult = await this.adrRepository.countCompleteCore(projectId);
    if (adrResult.isErr()) return forwardErr(adrResult);
    const { total: adrCount, complete: completeAdrs } = adrResult.unwrap();

    const score = AdrDomainService.calculateReadinessScore(
      filledCount,
      totalRequired,
      completeAdrs
    );

    const response: ReadinessScoreResponse = {
      ...score,
      phase: project.phase,
      prdVersion: latestPrd?.versionNumber ?? 0,
      adrCount,
    };
    return ok(response);
  }
}
