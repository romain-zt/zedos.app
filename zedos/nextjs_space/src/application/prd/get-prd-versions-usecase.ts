import { IPrdRepository } from '@domain/prd/prd-repository';
import { PrdVersionWithRelations } from '@domain/prd/prd';
import { IProjectRepository } from '@domain/project/project-repository';
import { Result, err } from '@shared/result/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'GetPrdVersionsUseCase' });

export class GetPrdVersionsUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository: IPrdRepository
  ) {}

  async execute(projectId: string, userId: string): Promise<Result<PrdVersionWithRelations[], ApplicationError>> {
    // Verify ownership
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      return projectResult as any;
    }

    return this.prdRepository.findByProjectId(projectId);
  }
}
