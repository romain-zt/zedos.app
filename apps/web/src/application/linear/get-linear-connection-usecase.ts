import type { IProjectRepository } from '@domain/project/project-repository';
import type {
  ILinearConnectionRepository,
  LinearConnection,
} from '@domain/linear';
import { Result, err } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';

export class GetLinearConnectionUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly linearConnectionRepository: ILinearConnectionRepository,
  ) {}

  async execute(
    projectId: string,
    userId: string,
  ): Promise<Result<LinearConnection | null, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      return err(projectResult.error);
    }
    return this.linearConnectionRepository.findByProjectId(projectId);
  }
}
