import { ICreditsRepository } from '@domain/credits/credits-repository';
import { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import { IProjectRepository } from '@domain/project/project-repository';
import { IUserStoryCorpusRepository } from '@domain/user-stories/user-story-corpus-repository';
import type { SaveUserStoryLineInput } from '@domain/user-stories/user-story-corpus';
import type { UserStoryCorpusDomain } from '@domain/user-stories/user-story-corpus';
import type { GenerateUserStoriesRequest } from '@repo/contracts/user-stories/generate';
import type { UserStoryAiDraftList } from '@repo/contracts/user-stories/generate';
import { Result, ok, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

import { findConfirmedClusterForProject } from './find-confirmed-cluster';

const logger = createLogger({ operation: 'GenerateUserStoryDraftUseCase' });

export type DraftUserStoriesFromClusterFn = (ctx: {
  label: string;
  valueLine: string;
  boundaryCue: string;
}) => Promise<Result<UserStoryAiDraftList, ApplicationError>>;

export class GenerateUserStoryDraftUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private featureSplitRepository: IFeatureSplitRepository,
    private userStoryCorpusRepository: IUserStoryCorpusRepository,
    private creditsRepository: ICreditsRepository,
    private draftUserStoriesFromCluster: DraftUserStoriesFromClusterFn,
    private storyGenerationCreditCost: number
  ) {}

  async execute(
    projectId: string,
    userId: string,
    input: GenerateUserStoriesRequest
  ): Promise<Result<UserStoryCorpusDomain, ApplicationError>> {
    const access = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (access.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(access.error);
    }

    const clusterResult = await findConfirmedClusterForProject(
      this.featureSplitRepository,
      projectId,
      input.featureSplitClusterId
    );
    if (clusterResult.isErr()) {
      return err(clusterResult.error);
    }
    const cluster = clusterResult.unwrap();

    let lines: SaveUserStoryLineInput[];

    if (input.mode === 'template') {
      lines = buildTemplateLines(cluster.label, cluster.valueLine, cluster.boundaryCue);
    } else {
      const draftResult = await this.draftUserStoriesFromCluster({
        label: cluster.label,
        valueLine: cluster.valueLine,
        boundaryCue: cluster.boundaryCue,
      });
      if (draftResult.isErr()) {
        return err(draftResult.error);
      }
      const drafts = draftResult.unwrap().stories;
      lines = drafts
        .map((story, index) => ({
          sortOrder: story.sortOrder ?? index,
          title: story.title,
          body: story.body,
          draftMarker: 'ai-draft',
          archivedAt: null as Date | null,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((line, index) => ({
          ...line,
          sortOrder: index,
        }));

      const deductResult = await this.creditsRepository.deductCredits(
        userId,
        this.storyGenerationCreditCost,
        'story_generation'
      );
      if (deductResult.isErr()) {
        return err(deductResult.error);
      }
    }

    return this.userStoryCorpusRepository.save(projectId, input.featureSplitClusterId, lines);
  }
}

function buildTemplateLines(
  label: string,
  valueLine: string,
  boundaryCue: string
): SaveUserStoryLineInput[] {
  return [
    {
      sortOrder: 0,
      title: `Deliver core value for “${label}”`,
      body: `As a user, I receive the outcome described below.\n\nValue:\n${valueLine}\n\nExplicitly out of scope:\n${boundaryCue}`,
      draftMarker: 'template',
      archivedAt: null,
    },
    {
      sortOrder: 1,
      title: `Validate “${label}” against boundaries`,
      body: `As a reviewer, I can verify this cluster stays within:\n${boundaryCue}\n\nSo we avoid scope creep while shipping:\n${valueLine}`,
      draftMarker: 'template',
      archivedAt: null,
    },
    {
      sortOrder: 2,
      title: `Operational readiness for “${label}”`,
      body: `As an operator, I have enough clarity to implement and test work aligned with:\n${valueLine}`,
      draftMarker: 'template',
      archivedAt: null,
    },
  ];
}
