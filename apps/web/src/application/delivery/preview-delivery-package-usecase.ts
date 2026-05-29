import { IProjectRepository } from '@domain/project/project-repository';
import { IDeliveryExportRepository } from '@domain/delivery/delivery-export-repository';
import { excerptPrompt } from '@domain/delivery/export-bundle';
import type { DeliveryPreviewResponse } from '@repo/contracts/delivery';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, NotFoundError, ValidationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { forwardErr } from '@shared/result/propagate';
import { MAX_BUNDLES_PER_EXPORT } from './delivery-limits';

const logger = createLogger({ operation: 'PreviewDeliveryPackageUseCase' });

export class PreviewDeliveryPackageUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private deliveryExportRepository: IDeliveryExportRepository
  ) {}

  async execute(
    projectId: string,
    userId: string,
    bundleIds: string[]
  ): Promise<Result<DeliveryPreviewResponse, ApplicationError>> {
    if (bundleIds.length < 1) {
      return err(new ValidationError('Select at least one bundle to preview'));
    }
    if (bundleIds.length > MAX_BUNDLES_PER_EXPORT) {
      return err(new ValidationError(`At most ${MAX_BUNDLES_PER_EXPORT} bundles per preview`));
    }

    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(projectResult.error);
    }

    const bundlesResult = await this.deliveryExportRepository.findLockedBundlesByIds(
      projectId,
      bundleIds
    );
    if (bundlesResult.isErr()) return forwardErr(bundlesResult);

    const bundles = bundlesResult.unwrap();
    const foundIds = new Set(bundles.map((b) => b.id));
    const missing = bundleIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      return err(
        new NotFoundError(
          'One or more bundles are not export-ready or do not belong to this project'
        )
      );
    }

    const ordered = bundleIds
      .map((id) => bundles.find((b) => b.id === id))
      .filter((b): b is NonNullable<typeof b> => b !== undefined);

    const response: DeliveryPreviewResponse = {
      stories: ordered.map((bundle) => ({
        bundleId: bundle.id,
        storyTitle: bundle.storyTitle,
        tasks: bundle.tasks.map((task) => ({
          id: task.id,
          sortOrder: task.sortOrder,
          title: task.title,
          promptExcerpt: excerptPrompt(task.promptBody),
        })),
      })),
    };

    return ok(response);
  }
}
