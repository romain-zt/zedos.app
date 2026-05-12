import { IProjectRepository } from '@domain/project/project-repository';
import { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import { IUserStoryCorpusRepository } from '@domain/user-stories/user-story-corpus-repository';
import type { FeatureClusterDomain } from '@domain/feature-split/feature-split';
import type { SaveUserStoryLineInput, UserStoryCorpusDomain } from '@domain/user-stories/user-story-corpus';
import type { GenerateUserStoriesRequest } from '@repo/contracts/user-stories/generate';
import { draftUserStoriesWithAi } from '@infrastructure/ai/user-story-draft';
import { type Result, ok, err } from '@repo/result';
import { ApplicationError, InsufficientCreditsError, NotFoundError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { CheckCreditsUseCase } from '@application/credits/check-credits-usecase';
import { DeductCreditsUseCase } from '@application/credits/deduct-credits-usecase';

const logger = createLogger({ operation: 'GenerateUserStoryDraftUseCase' });

function userStoryAiCost(): number {
  return parseInt(process.env.CREDIT_COST_USER_STORY_GENERATION ?? '5', 10);
}

function resolveConfirmedCluster(
  projectId: string,
  featureSplitClusterId: string,
  splits: Awaited<ReturnType<IFeatureSplitRepository['findByProjectId']>>
): { cluster: FeatureClusterDomain } | null {
  if (splits.isErr()) return null;
  const list = splits.unwrap();
  for (const split of list) {
    if (split.projectId !== projectId) continue;
    if (split.status !== 'confirmed') continue;
    const cluster = split.clusters.find((c) => c.id === featureSplitClusterId);
    if (cluster) return { cluster };
  }
  return null;
}

function templateLinesForCluster(cluster: FeatureClusterDomain): SaveUserStoryLineInput[] {
  const cue = cluster.boundaryCue.trim() || '(no boundary cue)';
  return [
    {
      sortOrder: 0,
      title: `${cluster.label} — happy path`,
      body:
        `As a user, I can complete the core flow for "${cluster.valueLine.trim()}" so that ` +
        `the promised value lands. Acceptance: primary path passes with ${cue} respected.`,
      draftMarker: 'template',
    },
    {
      sortOrder: 1,
      title: `${cluster.label} — guardrails`,
      body:
        `As a user, I see predictable behavior when inputs are invalid or edge paths appear, still ` +
        `respecting boundary: ${cue}. Acceptance: validated errors, no leakage outside boundary.`,
      draftMarker: 'template',
    },
    {
      sortOrder: 2,
      title: `${cluster.label} — observability`,
      body:
        `As an operator, I can tell when this slice misbehaves (logging/metrics surfaced to team norms) ` +
        `within ${cue}. Acceptance: actionable signal on failure.`,
      draftMarker: 'template',
    },
  ];
}

export class GenerateUserStoryDraftUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private featureSplitRepository: IFeatureSplitRepository,
    private userStoryCorpusRepository: IUserStoryCorpusRepository,
    private checkCreditsUseCase: CheckCreditsUseCase,
    private deductCreditsUseCase: DeductCreditsUseCase
  ) {}

  async execute(
    projectId: string,
    userId: string,
    payload: GenerateUserStoriesRequest
  ): Promise<Result<UserStoryCorpusDomain, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(projectResult.error);
    }

    const splitsResult = await this.featureSplitRepository.findByProjectId(projectId);
    const resolved = resolveConfirmedCluster(projectId, payload.featureSplitClusterId, splitsResult);

    if (!resolved) {
      return err(new NotFoundError('Confirmed feature split cluster not found for this project'));
    }

    const { cluster } = resolved;

    if (payload.mode === 'template') {
      const lines = templateLinesForCluster(cluster);
      return this.userStoryCorpusRepository.save(projectId, payload.featureSplitClusterId, lines);
    }

    const cost = userStoryAiCost();
    const creditCheck = await this.checkCreditsUseCase.execute({
      userId,
      operationType: 'user_story_generation',
      operationCost: cost,
    });
    if (creditCheck.isErr()) {
      return creditCheck as unknown as Result<UserStoryCorpusDomain, ApplicationError>;
    }
    const check = creditCheck.unwrap();
    if (!check.canProceed) {
      return err(new InsufficientCreditsError(cost, check.currentBalance));
    }

    const draftResult = await draftUserStoriesWithAi({
      label: cluster.label,
      valueLine: cluster.valueLine,
      boundaryCue: cluster.boundaryCue,
    });
    if (draftResult.isErr()) {
      return draftResult as unknown as Result<UserStoryCorpusDomain, ApplicationError>;
    }

    const stories = draftResult.unwrap().stories;
    const lines: SaveUserStoryLineInput[] = stories.map((s, idx) => ({
      sortOrder: s.sortOrder ?? idx,
      title: s.title,
      body: s.body,
      draftMarker: 'ai-draft',
    }));

    const deductResult = await this.deductCreditsUseCase.execute({
      userId,
      amount: cost,
      operationType: 'user_story_generation',
    });
    if (deductResult.isErr()) {
      return deductResult as unknown as Result<UserStoryCorpusDomain, ApplicationError>;
    }

    return this.userStoryCorpusRepository.save(projectId, payload.featureSplitClusterId, lines);
  }
}
