import { IProjectRepository } from '@domain/project/project-repository';
import { IDeliveryExportRepository } from '@domain/delivery/delivery-export-repository';
import type { ExportEligibleBundle } from '@domain/delivery/export-bundle';
import { Result, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { forwardErr } from '@shared/result/propagate';

const logger = createLogger({ operation: 'ListExportEligibleBundlesUseCase' });

export class ListExportEligibleBundlesUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private deliveryExportRepository: IDeliveryExportRepository
  ) {}

  async execute(
    projectId: string,
    userId: string
  ): Promise<Result<ExportEligibleBundle[], ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(projectResult.error);
    }

    const bundlesResult = await this.deliveryExportRepository.listLockedBundlesByProject(projectId);
    if (bundlesResult.isErr()) return forwardErr(bundlesResult);

    return bundlesResult;
  }
}
