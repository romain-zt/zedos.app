/**
 * Plan-tier reader: returns the current `users.planTier` (default 'free').
 *
 * Shared by:
 *   - delivery conversion gate
 *   - red-team review eligibility
 *   - team data room bundle gate
 *
 * Kept as a focused read adapter rather than going through the user repository,
 * because callers do not need the full domain `User` and we want a lean SQL hit.
 */

import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import { db, users, eq, type UserUpdate } from '@repo/db';
import type { PlanTier } from '@repo/contracts/payments';
import { PlanTierSchema } from '@repo/contracts/payments';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'PlanTierReader' });

export interface PlanTierSnapshot {
  planTier: PlanTier;
  hasAttemptedExport: boolean;
}

export class DrizzlePlanTierReader {
  async read(userId: string): Promise<Result<PlanTierSnapshot, ApplicationError>> {
    try {
      const [row] = await db
        .select({
          planTier: users.planTier,
          hasAttemptedExport: users.hasAttemptedExport,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (row === undefined) {
        return ok({ planTier: 'free', hasAttemptedExport: false });
      }

      const parsedTier = PlanTierSchema.safeParse(row.planTier);
      const planTier: PlanTier = parsedTier.success ? parsedTier.data : 'free';
      return ok({ planTier, hasAttemptedExport: row.hasAttemptedExport });
    } catch (error) {
      logger.error('plan tier read failed', error);
      return err(new DatabaseError('Failed to read plan tier'));
    }
  }

  async markExportAttempted(userId: string): Promise<Result<void, ApplicationError>> {
    try {
      const patch: UserUpdate = { hasAttemptedExport: true };
      await db.update(users).set(patch).where(eq(users.id, userId));
      return ok(undefined);
    } catch (error) {
      logger.error('mark export attempted failed', error);
      return err(new DatabaseError('Failed to record export attempt'));
    }
  }
}
