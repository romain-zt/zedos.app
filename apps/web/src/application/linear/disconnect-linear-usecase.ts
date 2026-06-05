import type { IProjectRepository } from '@domain/project/project-repository';
import type { ILinearConnectionRepository } from '@domain/linear';
import { Result, err } from '@repo/result';
import { ApplicationError, ForbiddenError } from '@shared/errors/application-error';

export class DisconnectLinearUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly linearConnectionRepository: ILinearConnectionRepository,
  ) {}

  async execute(projectId: string, userId: string): Promise<Result<void, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      return err(projectResult.error);
    }
    const project = projectResult.unwrap();
    if (project.userId !== userId) {
      return err(new ForbiddenError('Only the project owner can disconnect Linear'));
    }
    return this.linearConnectionRepository.disconnect(projectId);
  }
}
