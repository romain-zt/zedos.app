import { IProjectRepository } from '@domain/project/project-repository';
import { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import {
  IUserStoryCorpusRepository,
} from '@domain/user-stories/user-story-corpus-repository';
import type { SaveUserStoryLineInput, UserStoryCorpusDomain } from '@domain/user-stories/user-story-corpus';
import type { SaveUserStoryCorpusRequest } from '@repo/contracts/user-stories/corpus';
import { Result, ok, err } from '@repo/result';
import {
  ApplicationError,
  NotFoundError,
  ValidationError,
} from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'SaveUserStoryCorpusUseCase' });

function resolveConfirmedCluster(
  projectId: string,
  featureSplitClusterId: string,
  splits: Awaited<ReturnType<IFeatureSplitRepository['findByProjectId']>>
): { cluster: import('@domain/feature-split/feature-split').FeatureClusterDomain } | null {
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

export class SaveUserStoryCorpusUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private featureSplitRepository: IFeatureSplitRepository,
    private userStoryCorpusRepository: IUserStoryCorpusRepository
  ) {}

  async execute(
    projectId: string,
    userId: string,
    payload: SaveUserStoryCorpusRequest
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

    const lines: SaveUserStoryLineInput[] = payload.lines.map((line, index) => ({
      id: line.id,
      sortOrder: line.sortOrder ?? index,
      title: line.title,
      body: line.body,
      archivedAt: line.archivedAt,
      draftMarker: line.draftMarker,
    }));

    const seenIds = new Set<string>();
    for (const row of lines) {
      if (row.id !== undefined) {
        if (seenIds.has(row.id)) {
          return err(new ValidationError('Duplicate line id in save payload'));
        }
        seenIds.add(row.id);
      }
    }

    return this.userStoryCorpusRepository.save(projectId, payload.featureSplitClusterId, lines);
  }
}
