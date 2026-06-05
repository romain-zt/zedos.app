/**
 * Resolves the current plan tier for a user. Default 'free' when no row.
 *
 * Re-exports the reader for thin consumers; use cases needing more than the tier
 * should compose with `DrizzlePlanTierReader` directly.
 */

import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { DrizzlePlanTierReader, PlanTierSnapshot } from '@infrastructure/persistence/plan-tier-reader';

export class ResolvePlanTierUseCase {
  constructor(private reader: DrizzlePlanTierReader = new DrizzlePlanTierReader()) {}

  async execute(userId: string): Promise<Result<PlanTierSnapshot, ApplicationError>> {
    return this.reader.read(userId);
  }
}
