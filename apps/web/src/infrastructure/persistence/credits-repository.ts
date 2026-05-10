/**
 * Drizzle Credits Repository Adapter
 *
 * Implements ICreditsRepository using Drizzle.
 * Handles atomic credit deduction with SELECT FOR UPDATE and transaction recording.
 */

import { ICreditsRepository } from '@domain/credits/credits-repository';
import { CreditBalance, CreditTransaction, OperationType } from '@domain/credits/credits';
import { UserId } from '@domain/user/user';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, NotFoundError, DatabaseError } from '@shared/errors/application-error';
import { db, users, creditTransactions, eq, desc, sql, type UserUpdate, type CreditTransactionInsert } from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'CreditsRepository' });

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

      const balance = new CreditBalance(
        new UserId(user.id),
        user.creditBalance,
        user.graceUsed
      );
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
    operationType: OperationType
  ): Promise<Result<CreditBalance, ApplicationError>> {
    try {
      const result = await db.transaction(async (tx) => {
        // 1. Lock the user row with SELECT FOR UPDATE to prevent concurrent modifications
        const lockedRows = await tx.execute(
          sql`SELECT id, credit_balance, grace_used FROM users WHERE id = ${userId} FOR UPDATE`
        );

        const rows = lockedRows as unknown as Array<{ id: string; credit_balance: number; grace_used: boolean }>;
        
        if (!rows || rows.length === 0) {
          return { error: new NotFoundError('User not found') };
        }

        const user = rows[0];

        if (user.credit_balance < amount) {
          return {
            error: new ApplicationError({
              code: 'INSUFFICIENT_CREDITS' as any,
              message: `Insufficient credits. Required: ${amount}, Available: ${user.credit_balance}`,
              statusCode: 402,
              details: { required: amount, available: user.credit_balance },
            }),
          };
        }

        // 2. Deduct credits
        const newBalance = user.credit_balance - amount;
        const updateData: UserUpdate = { creditBalance: newBalance };
        await tx
          .update(users)
          .set(updateData)
          .where(eq(users.id, userId));

        // 3. Record transaction
        const txData: CreditTransactionInsert = {
          userId,
          type: 'consumption',
          amount,
          balanceAfter: newBalance,
          operationType,
        };
        await tx.insert(creditTransactions).values(txData);

        return {
          balance: new CreditBalance(
            new UserId(userId),
            newBalance,
            user.grace_used
          ),
        };
      });

      if ('error' in result) {
        return err(result.error);
      }

      logger.info('Credits deducted', { userId, amount, operationType });
      return ok(result.balance) as Result<CreditBalance, ApplicationError>;
    } catch (error) {
      logger.error('Failed to deduct credits', error);
      return err(new DatabaseError('Failed to deduct credits'));
    }
  }

  async addCredits(
    userId: string,
    amount: number,
    type: 'grant' | 'purchase' | 'auto_reload'
  ): Promise<Result<CreditBalance, ApplicationError>> {
    try {
      const result = await db.transaction(async (tx) => {
        // 1. Lock the user row with SELECT FOR UPDATE
        const lockedRows = await tx.execute(
          sql`SELECT id, credit_balance, grace_used FROM users WHERE id = ${userId} FOR UPDATE`
        );

        const rows = lockedRows as unknown as Array<{ id: string; credit_balance: number; grace_used: boolean }>;
        
        if (!rows || rows.length === 0) {
          return { error: new NotFoundError('User not found') };
        }

        const user = rows[0];

        // 2. Add credits
        const newBalance = user.credit_balance + amount;
        
        const updateData: UserUpdate = { creditBalance: newBalance };
        if (type === 'grant') {
          updateData.starterCreditsGranted = true;
        }
        await tx
          .update(users)
          .set(updateData)
          .where(eq(users.id, userId));

        // 3. Record transaction
        const txData: CreditTransactionInsert = {
          userId,
          type,
          amount,
          balanceAfter: newBalance,
        };
        await tx.insert(creditTransactions).values(txData);

        return {
          balance: new CreditBalance(
            new UserId(userId),
            newBalance,
            user.grace_used
          ),
        };
      });

      if ('error' in result) {
        return err(result.error);
      }

      logger.info('Credits added', { userId, amount, type });
      return ok(result.balance) as Result<CreditBalance, ApplicationError>;
    } catch (error) {
      logger.error('Failed to add credits', error);
      return err(new DatabaseError('Failed to add credits'));
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

      const balance = new CreditBalance(
        new UserId(updatedUser.id),
        updatedUser.creditBalance,
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
