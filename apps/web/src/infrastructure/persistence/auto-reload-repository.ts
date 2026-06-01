import {
  autoReloadPreferences,
  db,
  eq,
  sql,
  type AutoReloadPreference as AutoReloadRow,
} from '@repo/db';
import type { IAutoReloadRepository } from '@domain/auto-reload/auto-reload-repository';
import type {
  AutoReloadPackSize,
  AutoReloadPreference,
} from '@domain/auto-reload/auto-reload-preference';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'AutoReloadRepository' });

const DEFAULT_PACK_SIZE: AutoReloadPackSize = 100;
const DEFAULT_THRESHOLD = 5;

function rowToDomain(row: AutoReloadRow): AutoReloadPreference {
  const packSize = row.packSize as AutoReloadPackSize;
  return {
    userId: row.userId,
    enabled: row.enabled,
    packSize: packSize === 200 || packSize === 1000 ? packSize : 100,
    thresholdCredits: row.thresholdCredits,
    stripeCustomerId: row.stripeCustomerId,
    stripePaymentMethodId: row.stripePaymentMethodId,
  };
}

function defaultPreference(userId: string): AutoReloadPreference {
  return {
    userId,
    enabled: false,
    packSize: DEFAULT_PACK_SIZE,
    thresholdCredits: DEFAULT_THRESHOLD,
    stripeCustomerId: null,
    stripePaymentMethodId: null,
  };
}

export class DrizzleAutoReloadRepository implements IAutoReloadRepository {
  async getByUserId(userId: string): Promise<Result<AutoReloadPreference, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(autoReloadPreferences)
        .where(eq(autoReloadPreferences.userId, userId))
        .limit(1);
      if (!row) {
        return ok(defaultPreference(userId));
      }
      return ok(rowToDomain(row));
    } catch (error) {
      logger.error('Failed to load auto-reload preference', error);
      return err(new DatabaseError('Failed to load auto-reload preference'));
    }
  }

  async upsertPreference(
    userId: string,
    input: { enabled: boolean; packSize?: AutoReloadPackSize }
  ): Promise<Result<AutoReloadPreference, ApplicationError>> {
    try {
      const existing = await this.getByUserId(userId);
      if (existing.isErr()) {
        return existing;
      }
      const current = existing.unwrap();
      const packSize = input.packSize ?? current.packSize;

      const [existingRow] = await db
        .select({ id: autoReloadPreferences.id })
        .from(autoReloadPreferences)
        .where(eq(autoReloadPreferences.userId, userId))
        .limit(1);

      if (existingRow) {
        await db.execute(sql`
          UPDATE auto_reload_preferences
          SET enabled = ${input.enabled},
              pack_size = ${packSize},
              updated_at = NOW()
          WHERE user_id = ${userId}
        `);
      } else {
        await db.execute(sql`
          INSERT INTO auto_reload_preferences (
            id, user_id, enabled, pack_size, threshold_credits,
            stripe_customer_id, stripe_payment_method_id, created_at, updated_at
          ) VALUES (
            gen_random_uuid()::text, ${userId}, ${input.enabled}, ${packSize}, ${DEFAULT_THRESHOLD},
            ${current.stripeCustomerId}, ${current.stripePaymentMethodId}, NOW(), NOW()
          )
        `);
      }

      return this.getByUserId(userId);
    } catch (error) {
      logger.error('Failed to upsert auto-reload preference', error);
      return err(new DatabaseError('Failed to update auto-reload preference'));
    }
  }

  async saveStripePaymentMethod(
    userId: string,
    stripeCustomerId: string,
    stripePaymentMethodId: string
  ): Promise<Result<AutoReloadPreference, ApplicationError>> {
    try {
      const [existingRow] = await db
        .select({ id: autoReloadPreferences.id })
        .from(autoReloadPreferences)
        .where(eq(autoReloadPreferences.userId, userId))
        .limit(1);

      if (existingRow) {
        await db.execute(sql`
          UPDATE auto_reload_preferences
          SET stripe_customer_id = ${stripeCustomerId},
              stripe_payment_method_id = ${stripePaymentMethodId},
              updated_at = NOW()
          WHERE user_id = ${userId}
        `);
      } else {
        await db.execute(sql`
          INSERT INTO auto_reload_preferences (
            id, user_id, enabled, pack_size, threshold_credits,
            stripe_customer_id, stripe_payment_method_id, created_at, updated_at
          ) VALUES (
            gen_random_uuid()::text, ${userId}, false, ${DEFAULT_PACK_SIZE}, ${DEFAULT_THRESHOLD},
            ${stripeCustomerId}, ${stripePaymentMethodId}, NOW(), NOW()
          )
        `);
      }

      return this.getByUserId(userId);
    } catch (error) {
      logger.error('Failed to save Stripe payment method for auto-reload', error);
      return err(new DatabaseError('Failed to save payment method'));
    }
  }
}
