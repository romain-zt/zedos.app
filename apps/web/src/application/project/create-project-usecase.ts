import { IProjectRepository } from '@domain/project/project-repository';
import { IPrdRepository } from '@domain/prd/prd-repository';
import { ProjectDomainService } from '@domain/project/project-service';
import { Result, ok, err } from '@repo/result';
import type { PrdVersionContent } from '@repo/contracts/prd';
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
  /** When set, persists first PRD version atomically with project create (rollback on failure). */
  importedPrdContent?: PrdVersionContent | null;
}

export class CreateProjectUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository?: IPrdRepository
  ) {}

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

      if (input.importedPrdContent) {
        if (!this.prdRepository) {
          await this.projectRepository.delete(created.id);
          return err(
            new ApplicationError({
              code: ErrorCode.INTERNAL_SERVER_ERROR,
              message: 'PRD import is not configured',
              statusCode: 500,
            })
          );
        }

        const prdResult = await this.prdRepository.ensureFirstVersion(
          created.id,
          input.importedPrdContent
        );
        if (prdResult.isErr()) {
          await this.projectRepository.delete(created.id);
          return forwardErr(prdResult);
        }
        logger.info('Project created with imported PRD', {
          projectId: created.id,
          userId: input.userId,
          prdVersionId: prdResult.unwrap().version.id,
        });
      } else {
        logger.info('Project created', { projectId: created.id, userId: input.userId });
      }

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
