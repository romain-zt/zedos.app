import { IProjectRepository, ProjectWithCounts } from '@domain/project/project-repository';
import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';

export class ListProjectsUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(userId: string): Promise<Result<ProjectWithCounts[], ApplicationError>> {
    return this.projectRepository.findAllByUserId(userId);
  }
}
