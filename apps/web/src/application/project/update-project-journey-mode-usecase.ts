import { IProjectRepository } from '@domain/project/project-repository';
import { ProjectDomainService } from '@domain/project/project-service';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ErrorCode } from '@shared/errors/application-error';
import { ProjectDTO, type JourneyMode } from '@repo/contracts/project/project-contracts';
import { createLogger } from '@shared/observability/logger';
import { forwardErr } from '@shared/result/propagate';
import { toProjectDTO } from '@application/project/project-dto';

const logger = createLogger({ operation: 'UpdateProjectJourneyModeUseCase' });

export interface UpdateProjectJourneyModeInput {
  projectId: string;
  userId: string;
  journeyMode: JourneyMode;
}

export class UpdateProjectJourneyModeUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(input: UpdateProjectJourneyModeInput): Promise<Result<ProjectDTO, ApplicationError>> {
    try {
      const findResult = await this.projectRepository.findByIdAndUserId(input.projectId, input.userId);
      if (findResult.isErr()) {
        return forwardErr(findResult);
      }

      const existing = findResult.unwrap();
      const updated = ProjectDomainService.setJourneyMode(existing, input.journeyMode);

      const saveResult = await this.projectRepository.update(updated);
      if (saveResult.isErr()) {
        return forwardErr(saveResult);
      }

      const saved = saveResult.unwrap();
      logger.info('Project journey mode updated', {
        projectId: input.projectId,
        journeyMode: saved.journeyMode,
      });

      return ok(toProjectDTO(saved));
    } catch (error: unknown) {
      logger.error(
        'UpdateProjectJourneyMode unexpected error',
        error instanceof Error ? error : { error }
      );
      return err(
        new ApplicationError({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Unexpected error updating journey mode',
          statusCode: 500,
        })
      );
    }
  }
}
