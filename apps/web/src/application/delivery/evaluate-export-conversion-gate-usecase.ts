/**
 * Reads the plan tier + attempt flag and runs the pure gate evaluator.
 *
 * Idempotent. Does NOT mark the export as attempted — that is the responsibility of
 * the export route after a successful zip build. This use case is read-only.
 */

import { Result, ok, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import {
  evaluateExportConversionGate,
  type ConversionGateResult,
} from '@domain/delivery/conversion-gate';
import { DrizzlePlanTierReader } from '@infrastructure/persistence/plan-tier-reader';

export class EvaluateExportConversionGateUseCase {
  constructor(private reader: DrizzlePlanTierReader = new DrizzlePlanTierReader()) {}

  async execute(userId: string): Promise<Result<ConversionGateResult, ApplicationError>> {
    const tierResult = await this.reader.read(userId);
    if (tierResult.isErr()) {
      return err(tierResult.error);
    }
    const tier = tierResult.unwrap();
    return ok(
      evaluateExportConversionGate({
        planTier: tier.planTier,
        hasAttemptedExport: tier.hasAttemptedExport,
      }),
    );
  }
}
