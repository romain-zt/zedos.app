import type { IProjectRepository } from '@domain/project/project-repository';
import type {
  GithubConnection,
  IGithubConnectionRepository,
} from '@domain/github';
import { Result, err } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';

export class GetGithubConnectionUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly githubConnectionRepository: IGithubConnectionRepository,
  ) {}

  async execute(
    projectId: string,
    userId: string,
  ): Promise<Result<GithubConnection | null, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      return err(projectResult.error);
    }
    return this.githubConnectionRepository.findByProjectId(projectId);
  }
}
