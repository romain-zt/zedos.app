import { IProjectRepository } from '@domain/project/project-repository';
import { IPrdRepository } from '@domain/prd/prd-repository';
import { ProjectDomainService } from '@domain/project/project-service';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ValidationError } from '@shared/errors/application-error';
import { PhaseUnlockResponse } from '@repo/contracts/adr/adr-contracts';
import { createLogger } from '@shared/observability/logger';
import { forwardErr } from '@shared/result/propagate';

const logger = createLogger({ operation: 'UnlockPhaseUseCase' });

export class UnlockPhaseUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository: IPrdRepository
  ) {}

  async execute(
    projectId: string,
    userId: string
  ): Promise<Result<PhaseUnlockResponse, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) return forwardErr(projectResult);
    const project = projectResult.unwrap();

    const prdResult = await this.prdRepository.findLatestByProjectId(projectId);
    if (prdResult.isErr()) return forwardErr(prdResult);
    const latestPrd = prdResult.unwrap();

    if (!latestPrd) {
      return err(new ValidationError('No PRD version found. Generate a PRD first.'));
    }

    const { isStable } = ProjectDomainService.checkPrdStability(
      latestPrd.content as Record<string, unknown> | null
    );
    const { canUnlock, reason } = ProjectDomainService.canUnlockArchitecture(project, isStable);

    if (!canUnlock) {
      return err(new ValidationError(reason));
    }

    const transitioned = ProjectDomainService.transitionToArchitecture(project);
    const updateResult = await this.projectRepository.update(transitioned);
    if (updateResult.isErr()) return forwardErr(updateResult);

    const saved = updateResult.unwrap();
    logger.info('Phase unlocked to architecture', { projectId });

    const response: PhaseUnlockResponse = {
      message: 'Project transitioned to ARCHITECTURE phase',
      phase: saved.phase,
      architectureStartedAt: saved.architectureStartedAt,
    };
    return ok(response);
  }
}
