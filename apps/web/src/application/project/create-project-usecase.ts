import { IProjectRepository } from '@domain/project/project-repository';
import { ProjectDomainService } from '@domain/project/project-service';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ErrorCode, ValidationError } from '@shared/errors/application-error';
import { ProjectDTO, type JourneyMode } from '@repo/contracts/project/project-contracts';
import { createLogger } from '@shared/observability/logger';
import { forwardErr } from '@shared/result/propagate';
import { toProjectDTO } from '@application/project/project-dto';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger({ operation: 'CreateProjectUseCase' });

export interface CreateProjectInput {
  userId: string;
  name: string;
  description: string | null;
  journeyMode?: JourneyMode;
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
        input.description,
        input.journeyMode ?? 'standard'
      );

      const createResult = await this.projectRepository.create(project);
      if (createResult.isErr()) {
        return forwardErr(createResult);
      }

      const created = createResult.unwrap();
      logger.info('Project created', { projectId: created.id, userId: input.userId });

      return ok(toProjectDTO(created));
    } catch (error: unknown) {
      logger.error('CreateProject unexpected error', error instanceof Error ? error : { error });
      return err(
        new ApplicationError({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Unexpected error creating project',
          statusCode: 500,
        })
      );
    }
  }
}
