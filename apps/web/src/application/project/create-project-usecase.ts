import { IProjectRepository } from '@domain/project/project-repository';
import { IPrdRepository } from '@domain/prd/prd-repository';
import { ProjectDomainService } from '@domain/project/project-service';
import { Result, ok, err } from '@repo/result';
import type { PrdVersionContent } from '@repo/contracts/prd';
import { ApplicationError, ErrorCode, ValidationError } from '@shared/errors/application-error';
import {
  ProjectDTO,
  type JourneyMode,
} from '@repo/contracts/project/project-contracts';
import type {
  TemplateJourneyHint,
  TemplateSlug,
} from '@repo/contracts/templates';
import type { ITemplateCatalogPort } from '@domain/templates/template-catalog-port';
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
  /**
   * When set, resolves the template via the injected `templateCatalog`,
   * overrides `journeyMode` with the template's mode, and uses the template's
   * content body as the first PRD version. Mutually exclusive with
   * `importedPrdContent`.
   */
  templateSlug?: TemplateSlug;
}

/** Maps the (optional) template journey hint into the project's strict journey mode. */
function journeyModeFromTemplateHint(hint: TemplateJourneyHint): JourneyMode {
  switch (hint) {
    case 'express':
      return 'express';
    case 'standard':
    case 'import':
      return 'standard';
  }
}

export class CreateProjectUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository?: IPrdRepository,
    private templateCatalog?: ITemplateCatalogPort
  ) {}

  async execute(input: CreateProjectInput): Promise<Result<ProjectDTO, ApplicationError>> {
    try {
      if (!input.name?.trim()) {
        return err(new ValidationError('Project name is required'));
      }

      if (input.templateSlug && input.importedPrdContent) {
        return err(
          new ValidationError(
            'Cannot combine importedPrdContent with templateSlug — pick one seeding source.'
          )
        );
      }

      let journeyMode: JourneyMode = input.journeyMode ?? 'standard';
      let seedContent: PrdVersionContent | null = input.importedPrdContent ?? null;
      let seededFromTemplate = false;

      if (input.templateSlug) {
        if (!this.templateCatalog) {
          return err(
            new ApplicationError({
              code: ErrorCode.INTERNAL_SERVER_ERROR,
              message: 'Template catalog is not configured',
              statusCode: 500,
            })
          );
        }
        if (!this.prdRepository) {
          return err(
            new ApplicationError({
              code: ErrorCode.INTERNAL_SERVER_ERROR,
              message: 'PRD repository is not configured for template seeding',
              statusCode: 500,
            })
          );
        }
        const templateResult = await this.templateCatalog.getBySlug(input.templateSlug);
        if (templateResult.isErr()) {
          return forwardErr(templateResult);
        }
        const template = templateResult.unwrap();
        journeyMode = journeyModeFromTemplateHint(template.journeyHint);
        seedContent = template.content;
        seededFromTemplate = true;
      }

      const project = ProjectDomainService.createProject(
        uuidv4(),
        input.userId,
        input.name,
        input.description,
        journeyMode
      );

      const createResult = await this.projectRepository.create(project);
      if (createResult.isErr()) {
        return forwardErr(createResult);
      }

      const created = createResult.unwrap();

      if (seedContent) {
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
          seedContent
        );
        if (prdResult.isErr()) {
          await this.projectRepository.delete(created.id);
          return forwardErr(prdResult);
        }
        logger.info('Project created with seeded PRD', {
          projectId: created.id,
          userId: input.userId,
          prdVersionId: prdResult.unwrap().version.id,
          seededFromTemplate,
          templateSlug: input.templateSlug ?? null,
        });
      } else {
        logger.info('Project created', { projectId: created.id, userId: input.userId });
      }

      return ok(toProjectDTO(created, input.templateSlug));
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
