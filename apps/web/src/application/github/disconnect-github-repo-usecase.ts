import type { IProjectRepository } from '@domain/project/project-repository';
import type { IGithubConnectionRepository } from '@domain/github';
import { Result, err } from '@repo/result';
import { ApplicationError, ForbiddenError } from '@shared/errors/application-error';

export class DisconnectGithubRepoUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly githubConnectionRepository: IGithubConnectionRepository,
  ) {}

  async execute(projectId: string, userId: string): Promise<Result<void, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      return err(projectResult.error);
    }
    const project = projectResult.unwrap();
    if (project.userId !== userId) {
      return err(new ForbiddenError('Only the project owner can disconnect GitHub'));
    }
    return this.githubConnectionRepository.disconnect(projectId);
  }
}
