/**
 * Drizzle Subscription Repository Adapter
 *
 * Upserts mirror Stripe subscription state. On every entitling mutation, we also
 * patch `users.planTier` in the same transaction so downstream readers (delivery
 * gate, red-team gate, data-room gate) read a consistent value.
 */

import {
  ISubscriptionRepository,
  UpsertSubscriptionInput,
} from '@domain/subscription/subscription-repository';
import type {
  PlanTier,
  SubscriptionStatus,
} from '@repo/contracts/payments';
import { Subscription, isSubscriptionEntitling } from '@domain/subscription/subscription';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import {
  db,
  subscriptions,
  users,
  eq,
  desc,
  type NewSubscriptionRow,
  type SubscriptionUpdate,
  type UserUpdate,
} from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'SubscriptionRepository' });

function mapRow(row: typeof subscriptions.$inferSelect): Subscription {
  return {
    id: row.id,
    userId: row.userId,
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId,
    stripePriceId: row.stripePriceId,
    planTier: row.planTier as PlanTier,
    status: row.status as SubscriptionStatus,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    currentPeriodEnd: row.currentPeriodEnd,
    endedAt: row.endedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSubscriptionRepository implements ISubscriptionRepository {
  async upsertFromWebhook(
    input: UpsertSubscriptionInput,
  ): Promise<Result<Subscription, ApplicationError>> {
    try {
      const result = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, input.stripeSubscriptionId))
          .limit(1);

        let row: typeof subscriptions.$inferSelect | undefined;

        if (existing !== undefined) {
          const patch: SubscriptionUpdate = {
            stripePriceId: input.stripePriceId,
            planTier: input.planTier,
            status: input.status,
            cancelAtPeriodEnd: input.cancelAtPeriodEnd,
            currentPeriodEnd: input.currentPeriodEnd,
            endedAt: input.endedAt,
            updatedAt: new Date(),
          };
          const [updated] = await tx
            .update(subscriptions)
            .set(patch)
            .where(eq(subscriptions.id, existing.id))
            .returning();
          row = updated;
        } else {
          const insertData: NewSubscriptionRow = {
            userId: input.userId,
            stripeCustomerId: input.stripeCustomerId,
            stripeSubscriptionId: input.stripeSubscriptionId,
            stripePriceId: input.stripePriceId,
            planTier: input.planTier,
            status: input.status,
            cancelAtPeriodEnd: input.cancelAtPeriodEnd,
            currentPeriodEnd: input.currentPeriodEnd,
            endedAt: input.endedAt,
          };
          const [inserted] = await tx.insert(subscriptions).values(insertData).returning();
          row = inserted;
        }

        if (row === undefined) {
          throw new Error('upsertFromWebhook: no row returned');
        }

        const sub = mapRow(row);
        // Sync user plan tier. If subscription is no longer entitling AND it was the most recent
        // sub, drop the user back to free. We keep this conservative: only flip down when the
        // current sub explicitly ended or canceled with no cancel_at_period_end grace.
        const userPatch: UserUpdate = isSubscriptionEntitling(sub)
          ? { planTier: sub.planTier }
          : sub.endedAt !== null
            ? { planTier: 'free' }
            : {};
        if (Object.keys(userPatch).length > 0) {
          await tx.update(users).set(userPatch).where(eq(users.id, input.userId));
        }

        return sub;
      });

      return ok(result);
    } catch (error) {
      logger.error('upsertFromWebhook failed', error);
      return err(new DatabaseError('Failed to upsert subscription'));
    }
  }

  async findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<Result<Subscription | null, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
        .limit(1);
      return ok(row !== undefined ? mapRow(row) : null);
    } catch (error) {
      logger.error('findByStripeSubscriptionId failed', error);
      return err(new DatabaseError('Failed to load subscription'));
    }
  }

  async findActiveByUserId(
    userId: string,
  ): Promise<Result<Subscription | null, ApplicationError>> {
    try {
      const rows = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.updatedAt))
        .limit(5);

      const entitling = rows.find((r) => {
        const candidate = mapRow(r);
        return isSubscriptionEntitling(candidate);
      });

      return ok(entitling !== undefined ? mapRow(entitling) : null);
    } catch (error) {
      logger.error('findActiveByUserId failed', error);
      return err(new DatabaseError('Failed to load active subscription'));
    }
  }
}
