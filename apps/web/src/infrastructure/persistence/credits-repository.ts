/**
 * Drizzle Credits Repository Adapter
 *
 * Implements ICreditsRepository using Drizzle.
 * Handles atomic credit deduction with SELECT FOR UPDATE and transaction recording.
 */

import { ICreditsRepository } from '@domain/credits/credits-repository';
import { CreditBalance, CreditTransaction, OperationType } from '@domain/credits/credits';
import { CreditsDomainService } from '@domain/credits/credits-service';
import { UserId } from '@domain/user/user';
import { Result, ok, err } from '@repo/result';
import {
  ApplicationError,
  NotFoundError,
  DatabaseError,
  InsufficientCreditsError,
  ConflictError,
  ValidationError,
} from '@shared/errors/application-error';
import {
  db,
  users,
  creditTransactions,
  eq,
  desc,
  sql,
  and,
  type UserUpdate,
  type CreditTransactionInsert,
} from '@repo/db';
import { createLogger } from '@shared/observability/logger';
import { clampPersistedCreditBalanceNonNegative } from './credits-persisted-balance';

const logger = createLogger({ service: 'CreditsRepository' });

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

function balanceFromLockedRow(userId: string, creditBalanceRaw: number, graceUsed: boolean): CreditBalance {
  const amount = persistedCreditBalanceForDomain(creditBalanceRaw, userId);
  return new CreditBalance(new UserId(userId), amount, graceUsed);
}

function consumptionMatchesIdempotent(
  row: { type: string; amount: number; operationType: string | null },
  amount: number,
  operationType: OperationType
): boolean {
  return row.type === 'consumption' && row.amount === amount && (row.operationType ?? undefined) === operationType;
}

function grantMatchesIdempotent(row: { type: string; amount: number }, amount: number, type: string): boolean {
  return row.type === type && row.amount === amount;
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
   * Deducts credits with row-level locking (SELECT FOR UPDATE) to prevent race conditions.
   * This fixes the credit double-spend vulnerability (retro finding #24).
   */
  async deductCredits(
    userId: string,
    amount: number,
    operationType: OperationType,
    correlationId: string,
    metadata?: Record<string, unknown>
  ): Promise<Result<CreditBalance, ApplicationError>> {
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

        const [existing] = await tx
          .select()
          .from(creditTransactions)
          .where(and(eq(creditTransactions.userId, userId), eq(creditTransactions.correlationId, correlationId)))
          .limit(1);

        if (existing) {
          if (!consumptionMatchesIdempotent(existing, amount, operationType)) {
            return {
              error: new ConflictError('Correlation id already used with different deduction parameters', {
                correlationId,
              }),
            };
          }
          return { balance: balanceFromLockedRow(userId, user.credit_balance, user.grace_used) };
        }

        const effectiveBalance = persistedCreditBalanceForDomain(user.credit_balance, userId);
        const decision = CreditsDomainService.computeDeductionDecision(
          effectiveBalance,
          user.grace_used,
          amount
        );

        if (decision.kind === 'reject') {
          return {
            error: new InsufficientCreditsError(amount, decision.currentBalance),
          };
        }

        const newBalance = decision.newBalance;
        let nextGraceUsed = user.grace_used;
        const updateData: UserUpdate = { creditBalance: newBalance };

        if (decision.kind === 'proceed-with-grace') {
          nextGraceUsed = true;
          updateData.graceUsed = true;
        }

        await tx.update(users).set(updateData).where(eq(users.id, userId));

        const mergedMeta =
          metadata && Object.keys(metadata).length > 0 ? { ...metadata } : undefined;

        const txData: CreditTransactionInsert = {
          userId,
          type: 'consumption',
          amount,
          balanceAfter: newBalance,
          operationType,
          correlationId,
          metadata: mergedMeta,
        };
        await tx.insert(creditTransactions).values(txData);

        return {
          balance: balanceFromLockedRow(userId, newBalance, nextGraceUsed),
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
    correlationId: string,
    metadata?: Record<string, unknown>
  ): Promise<Result<CreditBalance, ApplicationError>> {
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

        const [existing] = await tx
          .select()
          .from(creditTransactions)
          .where(and(eq(creditTransactions.userId, userId), eq(creditTransactions.correlationId, correlationId)))
          .limit(1);

        if (existing) {
          if (!grantMatchesIdempotent(existing, amount, type)) {
            return {
              error: new ConflictError('Correlation id already used with different credit grant parameters', {
                correlationId,
              }),
            };
          }
          return { balance: balanceFromLockedRow(userId, user.credit_balance, user.grace_used) };
        }

        const effectiveBalance = persistedCreditBalanceForDomain(user.credit_balance, userId);
        const newBalance = effectiveBalance + amount;

        const updateData: UserUpdate = { creditBalance: newBalance };
        if (type === 'grant') {
          updateData.starterCreditsGranted = true;
        }
        await tx.update(users).set(updateData).where(eq(users.id, userId));

        const mergedMeta =
          metadata && Object.keys(metadata).length > 0 ? { ...metadata } : undefined;

        const txData: CreditTransactionInsert = {
          userId,
          type,
          amount,
          balanceAfter: newBalance,
          correlationId,
          metadata: mergedMeta,
        };
        await tx.insert(creditTransactions).values(txData);

        return {
          balance: balanceFromLockedRow(userId, newBalance, user.grace_used),
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
    originalDeductionCorrelationId: string,
    reversalCorrelationId: string,
    metadata?: Record<string, unknown>
  ): Promise<Result<CreditBalance, ApplicationError>> {
    try {
      const result = await db.transaction(async (tx) => {
        const lockedRows = await tx.execute(
          sql`SELECT id, credit_balance, grace_used FROM users WHERE id = ${userId} FOR UPDATE`
        );

        const rows = lockedRows as unknown as Array<{ id: string; credit_balance: number; grace_used: boolean }>;

        if (!rows || rows.length === 0) {
          return { error: new NotFoundError('User not found') };
        }

        const lockedUser = rows[0];

        const [replay] = await tx
          .select()
          .from(creditTransactions)
          .where(and(eq(creditTransactions.userId, userId), eq(creditTransactions.correlationId, reversalCorrelationId)))
          .limit(1);

        if (replay) {
          if (replay.type !== 'reversal') {
            return {
              error: new ConflictError('Correlation id already used for a non-reversal transaction', {
                correlationId: reversalCorrelationId,
              }),
            };
          }
          const meta = replay.metadata as Record<string, unknown> | null | undefined;
          const orig = meta?.originalDeductionCorrelationId;
          if (typeof orig === 'string' && orig !== originalDeductionCorrelationId) {
            return {
              error: new ConflictError('Reversal replay metadata mismatch', {
                correlationId: reversalCorrelationId,
              }),
            };
          }
          return { balance: balanceFromLockedRow(userId, lockedUser.credit_balance, lockedUser.grace_used) };
        }

        const [priorReversal] = await tx
          .select()
          .from(creditTransactions)
          .where(
            and(
              eq(creditTransactions.userId, userId),
              eq(creditTransactions.type, 'reversal'),
              sql`(${creditTransactions.metadata})::jsonb->>'originalDeductionCorrelationId' = ${originalDeductionCorrelationId}`
            )
          )
          .limit(1);

        if (priorReversal) {
          return {
            error: new ConflictError('Original deduction already reversed', {
              originalDeductionCorrelationId,
              existingReversalCorrelationId: priorReversal.correlationId,
            }),
          };
        }

        const [original] = await tx
          .select()
          .from(creditTransactions)
          .where(
            and(
              eq(creditTransactions.userId, userId),
              eq(creditTransactions.correlationId, originalDeductionCorrelationId),
              eq(creditTransactions.type, 'consumption')
            )
          )
          .limit(1);

        if (!original) {
          return {
            error: new ValidationError('No consumption transaction found for correlation id', {
              originalDeductionCorrelationId,
            }),
          };
        }

        const refundAmount = original.amount;
        const effectiveBalance = persistedCreditBalanceForDomain(lockedUser.credit_balance, userId);
        const newBalance = effectiveBalance + refundAmount;

        const updateData: UserUpdate = { creditBalance: newBalance };
        await tx.update(users).set(updateData).where(eq(users.id, userId));

        const reversalMeta: Record<string, unknown> = {
          originalDeductionCorrelationId,
          ...(metadata ?? {}),
        };

        const txData: CreditTransactionInsert = {
          userId,
          type: 'reversal',
          amount: refundAmount,
          balanceAfter: newBalance,
          correlationId: reversalCorrelationId,
          metadata: reversalMeta,
        };
        await tx.insert(creditTransactions).values(txData);

        return {
          balance: balanceFromLockedRow(userId, newBalance, lockedUser.grace_used),
        };
      });

      if ('error' in result) {
        return err(result.error);
      }

      logger.info('Credits reversed', { userId, originalDeductionCorrelationId, reversalCorrelationId });
      return ok(result.balance) as Result<CreditBalance, ApplicationError>;
    } catch (error) {
      logger.error('Failed to reverse credits', error);
      return err(new DatabaseError('Failed to reverse credits'));
    }
  }

  async recordTransaction(
    transaction: CreditTransaction
  ): Promise<Result<CreditTransaction, ApplicationError>> {
    try {
      const insertData: CreditTransactionInsert = {
        userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        balanceAfter: 0,
        operationType: transaction.operationType,
        metadata: transaction.metadata,
        correlationId: transaction.correlationId ?? null,
      };
      const [row] = await db
        .insert(creditTransactions)
        .values(insertData)
        .returning();

      const recorded: CreditTransaction = {
        id: row.id,
        userId: row.userId,
        type: row.type as CreditTransaction['type'],
        amount: row.amount,
        operationType: (row.operationType as OperationType) || undefined,
        metadata: row.metadata as CreditTransaction['metadata'],
        correlationId: row.correlationId ?? undefined,
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

      const result: CreditTransaction[] = transactions.map((t) => ({
        id: t.id,
        userId: t.userId,
        type: t.type as CreditTransaction['type'],
        amount: t.amount,
        operationType: (t.operationType || undefined) as OperationType | undefined,
        metadata: t.metadata as CreditTransaction['metadata'],
        correlationId: t.correlationId ?? undefined,
        createdAt: t.createdAt,
      }));

      return ok(result) as Result<CreditTransaction[], ApplicationError>;
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
      const balance = new CreditBalance(
        new UserId(updatedUser.id),
        amount,
        updatedUser.graceUsed
      );
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
