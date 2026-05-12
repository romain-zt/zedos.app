import { IProjectRepository } from '@domain/project/project-repository';
import { IUserStoryCorpusRepository } from '@domain/user-stories/user-story-corpus-repository';
import type { SaveUserStoryLineInput } from '@domain/user-stories/user-story-corpus';
import type { UserStoryCorpusDomain } from '@domain/user-stories/user-story-corpus';
import type { SaveUserStoryCorpusRequest } from '@repo/contracts/user-stories/corpus';
import { Result, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'SaveUserStoryCorpusUseCase' });

export class SaveUserStoryCorpusUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private userStoryCorpusRepository: IUserStoryCorpusRepository
  ) {}

  async execute(
    projectId: string,
    userId: string,
    body: SaveUserStoryCorpusRequest
  ): Promise<Result<UserStoryCorpusDomain, ApplicationError>> {
    const access = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (access.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(access.error);
    }

    const lines: SaveUserStoryLineInput[] = body.lines.map((line) => ({
      id: line.id,
      sortOrder: line.sortOrder,
      title: line.title,
      body: line.body,
      archivedAt: line.archivedAt ?? null,
      draftMarker: line.draftMarker ?? null,
    }));

    return this.userStoryCorpusRepository.save(projectId, body.featureSplitClusterId, lines);
  }
}
