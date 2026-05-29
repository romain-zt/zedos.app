import { IAdrRepository } from '@domain/adr/adr-repository';
import { IProjectRepository } from '@domain/project/project-repository';
import { Adr } from '@domain/adr/adr';
import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { forwardErr } from '@shared/result/propagate';

export class ListAdrsUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private adrRepository: IAdrRepository
  ) {}

  async execute(projectId: string, userId: string): Promise<Result<Adr[], ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) return forwardErr(projectResult);

    return this.adrRepository.findByProjectId(projectId);
  }
}
