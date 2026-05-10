import { IProjectRepository } from '@domain/project/project-repository';
import { Result, ok, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { ProjectDTO } from '@contracts/project/project-contracts';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'UpdateProjectUseCase' });

export interface UpdateProjectInput {
  projectId: string;
  userId: string;
  name?: string;
  description?: string | null;
}

export class UpdateProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(input: UpdateProjectInput): Promise<Result<ProjectDTO, ApplicationError>> {
    const findResult = await this.projectRepository.findByIdAndUserId(input.projectId, input.userId);
    if (findResult.isErr()) {
      return findResult as any;
    }

    const existing = findResult.unwrap();
    const updated = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() ?? null } : {}),
      updatedAt: new Date(),
    };

    const updateResult = await this.projectRepository.update(updated);
    if (updateResult.isErr()) {
      return updateResult as any;
    }

    const saved = updateResult.unwrap();
    logger.info('Project updated', { projectId: input.projectId });
    return ok(saved as ProjectDTO) as any;
  }
}
