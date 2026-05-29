import { IProjectRepository } from '@domain/project/project-repository';
import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { forwardErr } from '@shared/result/propagate';

export class DeleteProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(projectId: string, userId: string): Promise<Result<void, ApplicationError>> {
    const findResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (findResult.isErr()) {
      return forwardErr(findResult);
    }

    return this.projectRepository.delete(projectId);
  }
}
