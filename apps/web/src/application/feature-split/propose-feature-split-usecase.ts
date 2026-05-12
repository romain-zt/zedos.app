import { IProjectRepository } from '@domain/project/project-repository';
import { IPrdRepository } from '@domain/prd/prd-repository';
import { FeatureSplitProposal } from '@repo/contracts/ai/feature-split-proposal';
import { Result, err } from '@repo/result';
import { ApplicationError, NotFoundError } from '@shared/errors/application-error';
import { proposeFeatureSplit } from '@infrastructure/ai/feature-split-proposal';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'ProposeFeatureSplitUseCase' });

export class ProposeFeatureSplitUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository: IPrdRepository
  ) {}

  async execute(
    projectId: string,
    userId: string,
    sourcePrdVersionId: string
  ): Promise<Result<FeatureSplitProposal, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(projectResult.error);
    }

    const prdVersionsResult = await this.prdRepository.findByProjectId(projectId);
    if (prdVersionsResult.isErr()) return err(prdVersionsResult.error);

    const versions = prdVersionsResult.unwrap();
    const version = versions.find((v) => v.id === sourcePrdVersionId);
    if (!version) return err(new NotFoundError('PRD version not found'));
    if (!version.content) return err(new NotFoundError('PRD version has no content to split'));

    return proposeFeatureSplit(version.content);
  }
}
