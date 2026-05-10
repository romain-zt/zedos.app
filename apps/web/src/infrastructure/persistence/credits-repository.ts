/**
 * Drizzle Credits Repository Adapter
 *
 * Implements ICreditsRepository using Drizzle ORM.
 * Handles atomic credit deduction with SELECT FOR UPDATE and transaction recording.
 */

import { ICreditsRepository } from '@domain/credits/credits-repository';
import { CreditBalance, CreditTransaction, OperationType } from '@domain/credits/credits';
import { UserId } from '@domain/user/user';
import { Result, ok, err } from '@shared/result/result';
import { ApplicationError, NotFoundError, DatabaseError } from '@shared/errors/application-error';
import { db, eq, desc, sql, users, creditTransactions, type DrizzleDb } from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'CreditsRepository' });


export class DrizzleCreditsRepository implements ICreditsRepository {
  constructor(private database: DrizzleDb = db) {}

  async getBalance(userId: string): Promise<Result<CreditBalance, ApplicationError>> {
    try {
      const result = await this.database
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (result.length === 0) {
        return err(new NotFoundError('User not found'));
      }

      const user = result[0];
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

  async deductCredits(
    userId: string,
    amount: number,
    operationType: OperationType
  ): Promise<Result<CreditBalance, ApplicationError>> {
    try {
      return await this.database.transaction(async (tx) => {
        const lockedUsers = await tx.execute(
          sql`SELECT id, credit_balance, grace_used FROM users WHERE id = ${userId} FOR UPDATE`
        );

        const userRows = lockedUsers as unknown as Array<{
          id: string;
          credit_balance: number;
          grace_used: boolean;
        }>;

        if (!userRows || userRows.length === 0) {
          return err(new NotFoundError('User not found'));
        }

        const user = userRows[0];

        if (user.credit_balance < amount) {
          return err(new ApplicationError({
            code: 'INSUFFICIENT_CREDITS' as any,
            message: `Insufficient credits. Required: ${amount}, Available: ${user.credit_balance}`,
            statusCode: 402,
            details: { required: amount, available: user.credit_balance },
          }));
        }

        const newBalance = user.credit_balance - amount;

        await tx.execute(
          sql`UPDATE users SET credit_balance = ${newBalance} WHERE id = ${userId}`
        );

        await tx.insert(creditTransactions).values({
          userId,
          type: 'consumption',
          amount,
          balanceAfter: newBalance,
          operationType: operationType as string,
        } as typeof creditTransactions.$inferInsert);

        const balance = new CreditBalance(
          new UserId(userId),
          newBalance,
          user.grace_used
        );
        logger.info('Credits deducted', { userId, amount, operationType });
        return ok(balance) as Result<CreditBalance, ApplicationError>;
      });
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
      return await this.database.transaction(async (tx) => {
        const userResult = await tx
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (userResult.length === 0) {
          return err(new NotFoundError('User not found'));
        }

        const user = userResult[0];
        const newBalance = user.creditBalance + amount;

        if (type === 'grant') {
          await tx.execute(
            sql`UPDATE users SET credit_balance = ${newBalance}, starter_credits_granted = true WHERE id = ${userId}`
          );
        } else {
          await tx.execute(
            sql`UPDATE users SET credit_balance = ${newBalance} WHERE id = ${userId}`
          );
        }

        await tx.insert(creditTransactions).values({
          userId,
          type,
          amount,
          balanceAfter: newBalance,
        } as typeof creditTransactions.$inferInsert);

        const balance = new CreditBalance(
          new UserId(userId),
          newBalance,
          user.graceUsed
        );
        logger.info('Credits added', { userId, amount, type });
        return ok(balance) as Result<CreditBalance, ApplicationError>;
      });
    } catch (error) {
      logger.error('Failed to add credits', error);
      return err(new DatabaseError('Failed to add credits'));
    }
  }

  async recordTransaction(
    transaction: CreditTransaction
  ): Promise<Result<CreditTransaction, ApplicationError>> {
    try {
      const result = await this.database
        .insert(creditTransactions)
        .values({
          userId: transaction.userId,
          type: transaction.type as string,
          amount: transaction.amount,
          balanceAfter: 0,
          operationType: transaction.operationType as string | undefined,
          metadata: transaction.metadata as Record<string, unknown> | undefined,
        } as typeof creditTransactions.$inferInsert)
        .returning();

      const recorded: CreditTransaction = {
        id: result[0].id,
        userId: result[0].userId,
        type: result[0].type as CreditTransaction['type'],
        amount: result[0].amount,
        operationType: (result[0].operationType || undefined) as OperationType | undefined,
        metadata: result[0].metadata as Record<string, unknown> | undefined,
        createdAt: result[0].createdAt,
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
      const transactions = await this.database
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
        metadata: t.metadata as Record<string, unknown> | undefined,
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
      const userResult = await this.database
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length === 0) {
        return err(new NotFoundError('User not found'));
      }

      await this.database.execute(
        sql`UPDATE users SET grace_used = true WHERE id = ${userId}`
      );

      const user = userResult[0];
      const balance = new CreditBalance(
        new UserId(user.id),
        user.creditBalance,
        true
      );
      logger.info('Grace period used', { userId });
      return ok(balance) as Result<CreditBalance, ApplicationError>;
    } catch (error) {
      logger.error('Failed to use grace period', error);
      return err(new DatabaseError('Failed to use grace period'));
    }
  }
}

export { DrizzleCreditsRepository as PrismaCreditsRepository };
