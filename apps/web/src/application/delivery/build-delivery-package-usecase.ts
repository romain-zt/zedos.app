import { IProjectRepository } from '@domain/project/project-repository';
import { IDeliveryExportRepository } from '@domain/delivery/delivery-export-repository';
import type { ExportEligibleBundle } from '@domain/delivery/export-bundle';
import type { ICursorPackageAssembler } from '@domain/delivery/cursor-package-assembler-port';
import type { IDecisionGraphRepository } from '@domain/decision-graph/decision-graph-repository';
import { buildDecisionsExportJson } from '@application/decision-graph/build-decisions-export-json';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, NotFoundError, ValidationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { forwardErr } from '@shared/result/propagate';
import { MAX_BUNDLES_PER_EXPORT, MAX_TOTAL_PROMPT_BYTES } from './delivery-limits';

const logger = createLogger({ operation: 'BuildDeliveryPackageUseCase' });

export type DeliveryPackageBuild = {
  zipBuffer: Buffer;
  filename: string;
  bundleCount: number;
};

function totalPromptBytes(bundles: ExportEligibleBundle[]): number {
  let total = 0;
  for (const bundle of bundles) {
    for (const task of bundle.tasks) {
      total += Buffer.byteLength(task.promptBody, 'utf8');
    }
  }
  return total;
}

export class BuildDeliveryPackageUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private deliveryExportRepository: IDeliveryExportRepository,
    private packageAssembler: ICursorPackageAssembler,
    private decisionGraphRepository?: IDecisionGraphRepository,
  ) {}

  async execute(
    projectId: string,
    userId: string,
    bundleIds: string[]
  ): Promise<Result<DeliveryPackageBuild, ApplicationError>> {
    if (bundleIds.length < 1) {
      return err(new ValidationError('Select at least one bundle to export'));
    }
    if (bundleIds.length > MAX_BUNDLES_PER_EXPORT) {
      return err(new ValidationError(`At most ${MAX_BUNDLES_PER_EXPORT} bundles per export`));
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
      .filter((b): b is ExportEligibleBundle => b !== undefined);

    const promptBytes = totalPromptBytes(ordered);
    if (promptBytes > MAX_TOTAL_PROMPT_BYTES) {
      return err(
        new ValidationError('Export exceeds maximum prompt size; select fewer bundles or tasks')
      );
    }

    let decisionsExport;
    if (this.decisionGraphRepository) {
      const decisionsResult = await this.decisionGraphRepository.findByProjectId(projectId);
      if (decisionsResult.isOk()) {
        decisionsExport = buildDecisionsExportJson(projectId, decisionsResult.unwrap());
      }
    }

    const zipBuffer = await this.packageAssembler.assembleZip(ordered, decisionsExport);
    const filename = `zedos-delivery-${projectId.slice(0, 8)}.zip`;

    return ok({
      zipBuffer,
      filename,
      bundleCount: ordered.length,
    });
  }
}
