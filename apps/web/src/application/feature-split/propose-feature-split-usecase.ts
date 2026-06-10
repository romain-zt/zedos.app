import { IProjectRepository } from '@domain/project/project-repository';
import { IPrdRepository } from '@domain/prd/prd-repository';
import { FeatureSplitProposal } from '@repo/contracts/ai/feature-split-proposal';
import { Result, err } from '@repo/result';
import { ApplicationError, NotFoundError, ValidationError } from '@shared/errors/application-error';
import { assessPrdSplitReadiness } from '@/lib/prd-content-for-ai';
import { proposeFeatureSplit } from '@infrastructure/ai/feature-split-proposal';
import { RecordAgentActivityUseCase } from '@application/team/record-agent-activity-usecase';
import { agentActivityRepository } from '@infrastructure/persistence/agent-activity-repository';
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

    const versionResult = await this.prdRepository.findVersionByIdForOwner(sourcePrdVersionId, userId);
    if (versionResult.isErr()) return err(versionResult.error);
    const version = versionResult.unwrap();
    if (!version) return err(new NotFoundError('PRD version not found'));
    if (version.projectId !== projectId) return err(new NotFoundError('PRD version not found'));
    if (!version.content) return err(new NotFoundError('PRD version has no content to split'));

    const readiness = assessPrdSplitReadiness(version.content);
    if (!readiness.isReadyForAiSplit) {
      return err(new ValidationError(readiness.message));
    }

    const activity = new RecordAgentActivityUseCase(agentActivityRepository);
    const activityId = await activity.startSafe({
      projectId,
      kind: 'feature_split',
      summary: 'Milo is splitting the PRD into feature clusters',
    });

    const proposal = await proposeFeatureSplit(version.content);
    if (proposal.isErr()) {
      await activity.finishSafe(activityId, 'failed', 'Feature split proposal failed');
    } else {
      const clusterCount = proposal.unwrap().clusters.length;
      await activity.finishSafe(
        activityId,
        'completed',
        `Milo proposed ${clusterCount} feature cluster${clusterCount === 1 ? '' : 's'}`,
      );
    }
    return proposal;
  }
}
