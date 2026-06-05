import type { IProjectRepository } from '@domain/project/project-repository';
import type {
  GithubConnection,
  IGithubConnectionRepository,
} from '@domain/github';
import { ConnectGithubRepoRequestSchema } from '@repo/contracts/github/connection';
import type { ConnectGithubRepoRequest } from '@repo/contracts/github/connection';
import { Result, err } from '@repo/result';
import {
  ApplicationError,
  ValidationError,
} from '@shared/errors/application-error';

export class ConnectGithubRepoUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly githubConnectionRepository: IGithubConnectionRepository,
  ) {}

  async execute(
    projectId: string,
    userId: string,
    rawRequest: unknown,
  ): Promise<Result<GithubConnection, ApplicationError>> {
    const parsed = ConnectGithubRepoRequestSchema.safeParse(rawRequest);
    if (!parsed.success) {
      return err(new ValidationError('Invalid GitHub connect request'));
    }
    const request: ConnectGithubRepoRequest = parsed.data;

    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      return err(projectResult.error);
    }
    const project = projectResult.unwrap();
    if (project.userId !== userId) {
      return err(new ValidationError('Only the project owner can connect GitHub'));
    }

    return this.githubConnectionRepository.upsertActive({
      projectId,
      connectedByUserId: userId,
      ownerLogin: request.ownerLogin,
      repoName: request.repoName,
      installationId: request.installationId ?? null,
    });
  }
}
