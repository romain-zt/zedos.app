import { IPrdRepository } from '@domain/prd/prd-repository';
import { PrdVersionWithRelations } from '@domain/prd/prd';
import { IProjectRepository } from '@domain/project/project-repository';
import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { forwardErr } from '@shared/result/propagate';

export class GetPrdVersionsUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository: IPrdRepository
  ) {}

  async execute(
    projectId: string,
    userId: string
  ): Promise<Result<PrdVersionWithRelations[], ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      return forwardErr(projectResult);
    }

    return this.prdRepository.findByProjectId(projectId);
  }
}
