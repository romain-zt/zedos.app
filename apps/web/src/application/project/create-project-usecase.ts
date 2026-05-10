import { IProjectRepository } from '@domain/project/project-repository';
import { ProjectDomainService } from '@domain/project/project-service';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ValidationError } from '@shared/errors/application-error';
import { ProjectDTO } from '@repo/contracts/project/project-contracts';
import { createLogger } from '@shared/observability/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger({ operation: 'CreateProjectUseCase' });

export interface CreateProjectInput {
  userId: string;
  name: string;
  description: string | null;
}

export class CreateProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<Result<ProjectDTO, ApplicationError>> {
    try {
      if (!input.name?.trim()) {
        return err(new ValidationError('Project name is required'));
      }

      const project = ProjectDomainService.createProject(
        uuidv4(),
        input.userId,
        input.name,
        input.description
      );

      const createResult = await this.projectRepository.create(project);
      if (createResult.isErr()) {
        return createResult as any;
      }

      const created = createResult.unwrap();
      logger.info('Project created', { projectId: created.id, userId: input.userId });

      return ok(created as ProjectDTO) as any;
    } catch (error: any) {
      logger.error('CreateProject unexpected error', error);
      return err(new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR' as any,
        message: 'Unexpected error creating project',
        statusCode: 500,
      }));
    }
  }
}
