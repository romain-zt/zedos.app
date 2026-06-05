/**
 * Orchestrator: PRD red-team review.
 *
 * Sequence:
 *   1. Verify project ownership
 *   2. Verify plan-tier eligibility (Builder/Pro/Team — slice §Gated states)
 *   3. Verify PRD version exists for project
 *   4. Deduct credits (`prd_challenge` operation, default 15)
 *   5. Persist pending report
 *   6. Call AI generator
 *   7. On success: persist findings + mark completed
 *   8. On failure: refund credits + mark failed
 *
 * Per `73-result-rop.mdc`: no `throw` across boundaries; all paths return Result.
 *
 * Failure-path refund is best-effort — if the refund itself fails we log and surface
 * the original AI failure as the user-facing error.
 */

import { Result, ok, err } from '@repo/result';
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
} from '@shared/errors/application-error';
import { IProjectRepository } from '@domain/project/project-repository';
import { IPrdRepository } from '@domain/prd/prd-repository';
import {
  IRedTeamReportRepository,
} from '@domain/red-team/red-team-report-repository';
import { IRedTeamGenerator } from '@domain/red-team/red-team-generator-port';
import type { RedTeamReportWithFindings } from '@domain/red-team/red-team-report';
import { ICreditsRepository } from '@domain/credits/credits-repository';
import { DeductCreditsUseCase } from '@application/credits/deduct-credits-usecase';
import { AddCreditsUseCase } from '@application/credits/add-credits-usecase';
import { DrizzlePlanTierReader } from '@infrastructure/persistence/plan-tier-reader';
import { planTierMeets } from '@domain/subscription/subscription';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'GenerateRedTeamReportUseCase' });

export interface GenerateRedTeamReportInput {
  projectId: string;
  prdVersionId: string;
  userId: string;
}

export class GenerateRedTeamReportUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository: IPrdRepository,
    private redTeamRepository: IRedTeamReportRepository,
    private generator: IRedTeamGenerator,
    private creditsRepository: ICreditsRepository,
    private planTierReader: DrizzlePlanTierReader = new DrizzlePlanTierReader(),
  ) {}

  async execute(
    input: GenerateRedTeamReportInput,
  ): Promise<Result<RedTeamReportWithFindings, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(
      input.projectId,
      input.userId,
    );
    if (projectResult.isErr()) return err(projectResult.error);
    const project = projectResult.unwrap();

    const tierResult = await this.planTierReader.read(input.userId);
    if (tierResult.isErr()) return err(tierResult.error);
    if (!planTierMeets(tierResult.unwrap().planTier, 'builder')) {
      return err(new ForbiddenError('Red team review requires Builder, Pro or Team plan'));
    }

    const prdResult = await this.prdRepository.findVersionByIdForOwner(
      input.prdVersionId,
      input.userId,
    );
    if (prdResult.isErr()) return err(prdResult.error);
    const prd = prdResult.unwrap();
    if (prd === null || prd.projectId !== input.projectId) {
      return err(new NotFoundError('PRD version not found'));
    }

    const creditCost = this.resolveCreditCost();
    const deductResult = await new DeductCreditsUseCase(this.creditsRepository).execute({
      userId: input.userId,
      amount: creditCost,
      operationType: 'prd_challenge',
      metadata: { surface: 'red_team_review' },
    });
    if (deductResult.isErr()) return err(deductResult.error);

    const createPending = await this.redTeamRepository.createPending({
      projectId: input.projectId,
      prdVersionId: input.prdVersionId,
      requestedByUserId: input.userId,
      creditCost,
    });
    if (createPending.isErr()) {
      await this.refundOnFailure(input.userId, creditCost, 'persist_pending_failed');
      return err(createPending.error);
    }
    const pending = createPending.unwrap();

    const aiResult = await this.generator.generate({
      prd,
      projectName: project.name,
    });

    if (aiResult.isErr()) {
      await this.refundOnFailure(input.userId, creditCost, 'ai_generation_failed');
      const failResult = await this.redTeamRepository.fail({
        reportId: pending.id,
        errorMessage: aiResult.error.message,
      });
      if (failResult.isErr()) {
        logger.error('Failed to mark red-team report failed', failResult.error);
      }
      return err(aiResult.error);
    }

    const completeResult = await this.redTeamRepository.complete({
      reportId: pending.id,
      findings: aiResult.unwrap(),
    });
    if (completeResult.isErr()) {
      await this.refundOnFailure(input.userId, creditCost, 'persist_findings_failed');
      return err(completeResult.error);
    }

    return ok(completeResult.unwrap());
  }

  private resolveCreditCost(): number {
    const raw = process.env.CREDIT_COST_PRD_CHALLENGE?.trim();
    if (raw === undefined || raw.length === 0) return 15;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 15;
  }

  private async refundOnFailure(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    const refund = await new AddCreditsUseCase(this.creditsRepository).execute({
      userId,
      amount,
      type: 'grant',
      metadata: { surface: 'red_team_review_refund', reason },
    });
    if (refund.isErr()) {
      logger.error('Red-team credit refund failed', {
        userId,
        amount,
        reason,
        statusCode: refund.error.statusCode,
      });
    }
  }
}
