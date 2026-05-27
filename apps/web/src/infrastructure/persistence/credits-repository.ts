/**
 * Drizzle Credits Repository Adapter
 *
 * Implements ICreditsRepository using Drizzle.
 * Handles atomic credit deduction with SELECT FOR UPDATE,
 * domain `computeDeductionDecision`, correlation idempotency,
 * and deterministic reversals.
 */

import type { CreditsLedgerMutationOptions } from '@domain/credits/credits-repository';
import { ICreditsRepository } from '@domain/credits/credits-repository';
import {
  CreditBalance,
  CreditTransaction,
  OperationType,
  DEFAULT_GRACE_CREDIT_CEILING,
} from '@domain/credits/credits';
import { CreditsDomainService } from '@domain/credits/credits-service';
import { UserId } from '@domain/user/user';
import { Result, ok, err } from '@repo/result';
import {
  ApplicationError,
  NotFoundError,
  DatabaseError,
  InsufficientCreditsError,
  ValidationError,
} from '@shared/errors/application-error';
import {
  db,
  users,
  creditTransactions,
  eq,
  and,
  desc,
  sql,
  type UserUpdate,
  type CreditTransactionInsert,
} from '@repo/db';
import { createLogger } from '@shared/observability/logger';
import { clampPersistedCreditBalanceNonNegative } from './credits-persisted-balance';

const logger = createLogger({ service: 'CreditsRepository' });

function graceCeilingPersisted(): number {
  const n = parseInt(process.env.GRACE_CREDIT_CEILING ?? `${DEFAULT_GRACE_CREDIT_CEILING}`, 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_GRACE_CREDIT_CEILING;
}

function persistedCreditBalanceForDomain(raw: number, userId: string): number {
  const coerced = clampPersistedCreditBalanceNonNegative(raw);
  if (coerced !== raw) {
    logger.error('Persisted credit_balance is negative; treating as 0 for ledger operations', {
      userId,
      rawCreditBalance: raw,
    });
  }
  return coerced;
}

function stripCorrelationFromMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!metadata) return metadata;
  const { correlationId: _omit, ...rest } = metadata as Record<string, unknown>;
  return Object.keys(rest).length > 0 ? rest : {};
}

export class DrizzleCreditsRepository implements ICreditsRepository {
  // Constructor kept for API compatibility - argument is ignored since we use the singleton db
  constructor(_db?: unknown) {}

  async getBalance(userId: string): Promise<Result<CreditBalance, ApplicationError>> {
    try {
      const [user] = await db
        .select({
          id: users.id,
          creditBalance: users.creditBalance,
          graceUsed: users.graceUsed,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return err(new NotFoundError('User not found'));
      }

      const amount = persistedCreditBalanceForDomain(user.creditBalance, user.id);
      const balance = new CreditBalance(new UserId(user.id), amount, user.graceUsed);
      return ok(balance) as Result<CreditBalance, ApplicationError>;
    } catch (error) {
      logger.error('Failed to get balance', error);
      return err(new DatabaseError('Failed to get balance'));
    }
  }

  /**
   * Deducts credits with row-level locking and domain-derived grace verdict.
   * Optional correlationId enables idempotent replays keyed to `credit_transactions`.
   */
  async deductCredits(
    userId: string,
    amount: number,
    operationType: OperationType,
    options?: CreditsLedgerMutationOptions
  ): Promise<Result<CreditBalance, ApplicationError>> {
    const correlationId = options?.correlationId ?? undefined;
    const mergedMetadata =
      stripCorrelationFromMetadata(options?.metadata) ??
      (options?.metadata as Record<string, unknown> | undefined);

    try {
      const ceiling = graceCeilingPersisted();
      const result = await db.transaction(async (tx) => {
        const lockedRows = await tx.execute(
          sql`SELECT id, credit_balance, grace_used FROM users WHERE id = ${userId} FOR UPDATE`
        );

        const rows = lockedRows as unknown as Array<{
          id: string;
          credit_balance: number;
          grace_used: boolean;
        }>;

        if (!rows || rows.length === 0) {
          return { error: new NotFoundError('User not found') };
        }

        const user = rows[0];
        const effectiveBalance = persistedCreditBalanceForDomain(user.credit_balance, userId);

        if (correlationId != null && correlationId !== '') {
          const [existing] = await tx
            .select()
            .from(creditTransactions)
            .where(
              and(eq(creditTransactions.userId, userId), eq(creditTransactions.correlationId, correlationId))
            )
            .limit(1);

          if (existing) {
            if (
              existing.type !== 'consumption' ||
              existing.operationType !== operationType ||
              existing.amount !== amount
            ) {
              return {
                error: new ValidationError('correlationId already consumed with different parameters', {
                  correlationId,
                }),
              };
            }
            const current = persistedCreditBalanceForDomain(user.credit_balance, userId);
            return {
              balance: new CreditBalance(new UserId(userId), current, user.grace_used),
            };
          }
        }

        const decision = CreditsDomainService.computeDeductionDecision(
          effectiveBalance,
          user.grace_used,
          amount,
          ceiling
        );

        if (decision.kind === 'reject') {
          return {
            error: new InsufficientCreditsError(amount, decision.currentBalance, {
              operationType,
            }),
          };
        }

        const newBalance = decision.newBalance;
        const updateData: UserUpdate = {
          creditBalance: newBalance,
          ...(decision.kind === 'proceed-with-grace' ? { graceUsed: true } : {}),
        };
        await tx.update(users).set(updateData).where(eq(users.id, userId));

        const txMeta: Record<string, unknown> = {
          ...(mergedMetadata ?? {}),
          graceApplied: decision.kind === 'proceed-with-grace',
        };

        const txData: CreditTransactionInsert = {
          userId,
          type: 'consumption',
          amount,
          balanceAfter: newBalance,
          operationType,
          metadata: txMeta,
          correlationId: correlationId ?? undefined,
        };
        await tx.insert(creditTransactions).values(txData);

        return {
          balance: new CreditBalance(new UserId(userId), newBalance, user.grace_used || decision.willActivateGrace),
        };
      });

      if ('error' in result) {
        return err(result.error);
      }

      logger.info('Credits deducted', { userId, amount, operationType, correlationId });
      return ok(result.balance) as Result<CreditBalance, ApplicationError>;
    } catch (error) {
      logger.error('Failed to deduct credits', error);
      return err(new DatabaseError('Failed to deduct credits'));
    }
  }

  async addCredits(
    userId: string,
    amount: number,
    type: 'grant' | 'purchase' | 'auto_reload',
    options?: CreditsLedgerMutationOptions
  ): Promise<Result<CreditBalance, ApplicationError>> {
    const correlationId = options?.correlationId ?? undefined;
    const mergedMetadata = stripCorrelationFromMetadata(options?.metadata);

    try {
      const result = await db.transaction(async (tx) => {
        const lockedRows = await tx.execute(
          sql`SELECT id, credit_balance, grace_used FROM users WHERE id = ${userId} FOR UPDATE`
        );

        const rows = lockedRows as unknown as Array<{ id: string; credit_balance: number; grace_used: boolean }>;

        if (!rows || rows.length === 0) {
          return { error: new NotFoundError('User not found') };
        }

        const user = rows[0];

        if (correlationId != null && correlationId !== '') {
          const [existing] = await tx
            .select()
            .from(creditTransactions)
            .where(
              and(eq(creditTransactions.userId, userId), eq(creditTransactions.correlationId, correlationId))
            )
            .limit(1);

          if (existing) {
            if (existing.type !== type || existing.amount !== amount) {
              return {
                error: new ValidationError('correlationId already used for credit grant with different parameters', {
                  correlationId,
                }),
              };
            }
            const current = persistedCreditBalanceForDomain(user.credit_balance, userId);
            return {
              balance: new CreditBalance(new UserId(userId), current, user.grace_used),
            };
          }
        }

        const effectiveBalance = persistedCreditBalanceForDomain(user.credit_balance, userId);

        const newBalance = effectiveBalance + amount;

        const updateData: UserUpdate = { creditBalance: newBalance };
        if (type === 'grant') {
          updateData.starterCreditsGranted = true;
        }
        await tx.update(users).set(updateData).where(eq(users.id, userId));

        const txData: CreditTransactionInsert = {
          userId,
          type,
          amount,
          balanceAfter: newBalance,
          metadata: mergedMetadata ?? {},
          correlationId: correlationId ?? undefined,
        };
        await tx.insert(creditTransactions).values(txData);

        return {
          balance: new CreditBalance(new UserId(userId), newBalance, user.grace_used),
        };
      });

      if ('error' in result) {
        return err(result.error);
      }

      logger.info('Credits added', { userId, amount, type, correlationId });
      return ok(result.balance) as Result<CreditBalance, ApplicationError>;
    } catch (error) {
      logger.error('Failed to add credits', error);
      return err(new DatabaseError('Failed to add credits'));
    }
  }

  async reverseCredits(
    userId: string,
    originalConsumptionCorrelationId: string,
    options?: CreditsLedgerMutationOptions
  ): Promise<Result<CreditBalance, ApplicationError>> {
    const reversalCorrelation =
      options?.correlationId && options.correlationId.length > 0
        ? options.correlationId
        : `reverse:${originalConsumptionCorrelationId}`;
    const mergedMetadata =
      stripCorrelationFromMetadata(options?.metadata) ??
      (options?.metadata as Record<string, unknown> | undefined);

    try {
      const result = await db.transaction(async (tx) => {
        const lockedRows = await tx.execute(
          sql`SELECT id, credit_balance, grace_used FROM users WHERE id = ${userId} FOR UPDATE`
        );

        const rows = lockedRows as unknown as Array<{ id: string; credit_balance: number; grace_used: boolean }>;

        if (!rows || rows.length === 0) {
          return { error: new NotFoundError('User not found') };
        }

        const user = rows[0];

        const [existingReversal] = await tx
          .select()
          .from(creditTransactions)
          .where(and(eq(creditTransactions.userId, userId), eq(creditTransactions.correlationId, reversalCorrelation)))
          .limit(1);

        if (existingReversal) {
          const current = persistedCreditBalanceForDomain(user.credit_balance, userId);
          return {
            balance: new CreditBalance(new UserId(userId), current, user.grace_used),
          };
        }

        const [consumption] = await tx
          .select()
          .from(creditTransactions)
          .where(
            and(
              eq(creditTransactions.userId, userId),
              eq(creditTransactions.correlationId, originalConsumptionCorrelationId),
              eq(creditTransactions.type, 'consumption')
            )
          )
          .limit(1);

        if (!consumption) {
          return {
            error: new NotFoundError('Consumption row not found for reversal'),
          };
        }

        const refundAmount = consumption.amount;

        const effectiveBalance = persistedCreditBalanceForDomain(user.credit_balance, userId);
        const newBalance = effectiveBalance + refundAmount;

        const reversalUserUpdate: UserUpdate = { creditBalance: newBalance };
        await tx.update(users).set(reversalUserUpdate).where(eq(users.id, userId));

        const reversalTxData: CreditTransactionInsert = {
          userId,
          type: 'auto_reload',
          amount: refundAmount,
          balanceAfter: newBalance,
          metadata: {
            ...(mergedMetadata ?? {}),
            reversalOf: originalConsumptionCorrelationId,
          },
          correlationId: reversalCorrelation,
        };
        await tx.insert(creditTransactions).values(reversalTxData);

        return {
          balance: new CreditBalance(new UserId(userId), newBalance, user.grace_used),
        };
      });

      if ('error' in result) {
        return err(result.error);
      }

      logger.info('Credits reversal applied', {
        userId,
        originalConsumptionCorrelationId,
        reversalCorrelation,
      });

      return ok(result.balance) as Result<CreditBalance, ApplicationError>;
    } catch (error) {
      logger.error('Failed to reverse credits', error);
      return err(new DatabaseError('Failed to reverse credits'));
    }
  }

  async recordTransaction(transaction: CreditTransaction): Promise<Result<CreditTransaction, ApplicationError>> {
    try {
      const insertData: CreditTransactionInsert = {
        userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        balanceAfter: 0,
        operationType: transaction.operationType,
        metadata: transaction.metadata,
      };
      const [row] = await db.insert(creditTransactions).values(insertData).returning();

      const recorded: CreditTransaction = {
        id: row.id,
        userId: row.userId,
        type: row.type as CreditTransaction['type'],
        amount: row.amount,
        balanceAfter: row.balanceAfter ?? undefined,
        operationType: (row.operationType as OperationType) || undefined,
        metadata: row.metadata as CreditTransaction['metadata'],
        createdAt: row.createdAt,
      };

      return ok(recorded) as Result<CreditTransaction, ApplicationError>;
    } catch (error) {
      logger.error('Failed to record transaction', error);
      return err(new DatabaseError('Failed to record transaction'));
    }
  }

  async getTransactionHistory(
    userId: string,
    limit: number = 50
  ): Promise<Result<CreditTransaction[], ApplicationError>> {
    try {
      const transactions = await db
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, userId))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(limit);

      const mapped: CreditTransaction[] = transactions.map((t) => ({
        id: t.id,
        userId: t.userId,
        type: t.type as CreditTransaction['type'],
        amount: t.amount,
        balanceAfter: t.balanceAfter ?? undefined,
        operationType: (t.operationType || undefined) as OperationType | undefined,
        metadata: t.metadata as CreditTransaction['metadata'],
        createdAt: t.createdAt,
      }));

      return ok(mapped) as Result<CreditTransaction[], ApplicationError>;
    } catch (error) {
      logger.error('Failed to get transaction history', error);
      return err(new DatabaseError('Failed to get transaction history'));
    }
  }

  async useGracePeriod(userId: string): Promise<Result<CreditBalance, ApplicationError>> {
    try {
      const [user] = await db
        .select({
          id: users.id,
          creditBalance: users.creditBalance,
          graceUsed: users.graceUsed,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return err(new NotFoundError('User not found'));
      }

      const graceUpdateData: UserUpdate = { graceUsed: true };
      const [updatedUser] = await db
        .update(users)
        .set(graceUpdateData)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          creditBalance: users.creditBalance,
          graceUsed: users.graceUsed,
        });

      const amount = persistedCreditBalanceForDomain(updatedUser.creditBalance, updatedUser.id);
      const balance = new CreditBalance(new UserId(updatedUser.id), amount, updatedUser.graceUsed);
      logger.info('Grace period used', { userId });
      return ok(balance) as Result<CreditBalance, ApplicationError>;
    } catch (error) {
      logger.error('Failed to use grace period', error);
      return err(new DatabaseError('Failed to use grace period'));
    }
  }
}

// Export for backwards compatibility
export { DrizzleCreditsRepository as PrismaCreditsRepository };
