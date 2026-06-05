/**
 * Builds the team data-room zip:
 *   1. Verify project ownership + Team plan tier
 *   2. Load PRD, decisions, ADRs, user-story corpus, share-link index
 *   3. Hand to the assembler
 *   4. Persist an audit row with the manifest
 *
 * Gating:
 *   - Plan tier must be `team` (parent slice §Gate).
 *   - Pricing/marketing remain blocked on B-TEAM-PRICE-001 — the route is operator-gated.
 */

import { Result, ok, err } from '@repo/result';
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
} from '@shared/errors/application-error';
import { IProjectRepository } from '@domain/project/project-repository';
import { IPrdRepository } from '@domain/prd/prd-repository';
import { IAdrRepository } from '@domain/adr/adr-repository';
import { IDecisionGraphRepository } from '@domain/decision-graph/decision-graph-repository';
import {
  IDataRoomRepository,
  IDataRoomAssembler,
  type DataRoomBundleSources,
} from '@domain/data-room';
import type { DataRoomBundle } from '@domain/data-room';
import { DrizzlePlanTierReader } from '@infrastructure/persistence/plan-tier-reader';
import { planTierMeets } from '@domain/subscription/subscription';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'BuildDataRoomBundleUseCase' });

export interface BuildDataRoomBundleInput {
  projectId: string;
  userId: string;
}

export interface BuildDataRoomBundleOutput {
  zipBuffer: Buffer;
  filename: string;
  bundle: DataRoomBundle;
}

export interface DataRoomShareLinkReader {
  listForProject(projectId: string): Promise<
    Result<
      Array<{
        id: string;
        enabled: boolean;
        createdAt: Date;
        expiresAt: Date | null;
        disabledAt: Date | null;
        prdVersionNumber: number;
      }>,
      ApplicationError
    >
  >;
}

export interface DataRoomUserStoryReader {
  listTitlesForProject(projectId: string): Promise<
    Result<
      Array<{ corpusId: string; clusterLabel: string; title: string; sortOrder: number }>,
      ApplicationError
    >
  >;
}

export class BuildDataRoomBundleUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository: IPrdRepository,
    private adrRepository: IAdrRepository,
    private decisionGraphRepository: IDecisionGraphRepository,
    private shareLinkReader: DataRoomShareLinkReader,
    private userStoryReader: DataRoomUserStoryReader,
    private dataRoomRepository: IDataRoomRepository,
    private assembler: IDataRoomAssembler,
    private planTierReader: DrizzlePlanTierReader = new DrizzlePlanTierReader(),
  ) {}

  async execute(
    input: BuildDataRoomBundleInput,
  ): Promise<Result<BuildDataRoomBundleOutput, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(
      input.projectId,
      input.userId,
    );
    if (projectResult.isErr()) {
      return err(projectResult.error);
    }
    const project = projectResult.unwrap();

    const tierResult = await this.planTierReader.read(input.userId);
    if (tierResult.isErr()) return err(tierResult.error);
    const tier = tierResult.unwrap();
    if (!planTierMeets(tier.planTier, 'team')) {
      return err(new ForbiddenError('Data room bundle requires Team plan'));
    }

    const prdResult = await this.prdRepository.findLatestByProjectId(input.projectId);
    if (prdResult.isErr()) return err(prdResult.error);
    const prd = prdResult.unwrap();

    const adrsResult = await this.adrRepository.findByProjectId(input.projectId);
    if (adrsResult.isErr()) return err(adrsResult.error);
    const adrs = adrsResult.unwrap();

    const decisionsResult = await this.decisionGraphRepository.findByProjectId(input.projectId);
    if (decisionsResult.isErr()) return err(decisionsResult.error);
    const decisions = decisionsResult.unwrap();

    const storiesResult = await this.userStoryReader.listTitlesForProject(input.projectId);
    if (storiesResult.isErr()) return err(storiesResult.error);
    const stories = storiesResult.unwrap();

    const shareResult = await this.shareLinkReader.listForProject(input.projectId);
    if (shareResult.isErr()) return err(shareResult.error);
    const shareLinks = shareResult.unwrap();

    if (prd === null && adrs.length === 0 && decisions.length === 0 && stories.length === 0) {
      return err(new NotFoundError('Project has no artifacts to export for data room'));
    }

    const sources: DataRoomBundleSources = {
      projectId: project.id,
      projectName: project.name,
      prdVersion: prd,
      adrs,
      decisions,
      userStoryTitles: stories,
      shareLinks,
      expressFlags: this.collectExpressFlags(prd),
    };

    const artifact = await this.assembler.assemble(sources);

    const recordResult = await this.dataRoomRepository.recordBundle({
      projectId: input.projectId,
      generatedByUserId: input.userId,
      manifest: artifact.manifest,
    });
    if (recordResult.isErr()) {
      logger.warn('Bundle generated but audit row failed', {
        projectId: input.projectId,
        userId: input.userId,
        statusCode: recordResult.error.statusCode,
      });
      return err(recordResult.error);
    }

    return ok({
      zipBuffer: artifact.zipBuffer,
      filename: artifact.filename,
      bundle: recordResult.unwrap(),
    });
  }

  private collectExpressFlags(
    prd: { deliverableKind?: string } | null,
  ): Array<{ sectionId: string; reason: string }> {
    if (prd === null) return [];
    if (prd.deliverableKind !== 'express') return [];
    return [
      {
        sectionId: '*',
        reason: 'PRD generated in Express mode — sections may lack full clarification depth.',
      },
    ];
  }
}
