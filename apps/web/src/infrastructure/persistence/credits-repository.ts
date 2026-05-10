/**
 * Prisma Credits Repository Adapter
 *
 * Implements ICreditsRepository using Prisma.
 * Handles atomic credit deduction and transaction recording.
 */

import { ICreditsRepository } from '@domain/credits/credits-repository';
import { CreditBalance, CreditTransaction, OperationType } from '@domain/credits/credits';
import { UserId } from '@domain/user/user';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, NotFoundError, DatabaseError } from '@shared/errors/application-error';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '@shared/observability/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger({ service: 'CreditsRepository' });

export class PrismaCreditsRepository implements ICreditsRepository {
  constructor(private prisma: PrismaClient) {}

  async getBalance(userId: string): Promise<Result<CreditBalance, ApplicationError>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return err(new NotFoundError('User not found'));
      }

      const balance = new CreditBalance(
        new UserId(user.id),
        user.creditBalance,
        user.graceUsed
      );
      return ok(balance) as any;
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
      // 1. Get current balance
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return err(new NotFoundError('User not found'));
      }

      if (user.creditBalance < amount) {
        return err(new ApplicationError({
          code: 'INSUFFICIENT_CREDITS' as any,
          message: `Insufficient credits. Required: ${amount}, Available: ${user.creditBalance}`,
          statusCode: 402,
          details: { required: amount, available: user.creditBalance },
        }));
      }

      // 2. Atomically deduct and record transaction
      const newBalance = user.creditBalance - amount;
      const [updatedUser] = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: {
            creditBalance: newBalance,
          },
        }),
        this.prisma.creditTransaction.create({
          data: {
            id: uuidv4(),
            userId,
            type: 'consumption',
            amount,
            balanceAfter: newBalance,
            operationType,
          } as any,
        }),
      ]);

      const balance = new CreditBalance(
        new UserId(updatedUser.id),
        updatedUser.creditBalance,
        updatedUser.graceUsed
      );
      logger.info('Credits deducted', { userId, amount, operationType });
      return ok(balance) as any;
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
      // 1. Get current balance for validation
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return err(new NotFoundError('User not found'));
      }

      // 2. Atomically add and record transaction
      const newBalance = user.creditBalance + amount;
      const [updatedUser] = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: {
            creditBalance: newBalance,
            ...(type === 'grant' && { starterCreditsGranted: true }),
          },
        }),
        this.prisma.creditTransaction.create({
          data: {
            id: uuidv4(),
            userId,
            type,
            amount,
            balanceAfter: newBalance,
          } as any,
        }),
      ]);

      const balance = new CreditBalance(
        new UserId(updatedUser.id),
        updatedUser.creditBalance,
        updatedUser.graceUsed
      );
      logger.info('Credits added', { userId, amount, type });
      return ok(balance) as any;
    } catch (error) {
      logger.error('Failed to add credits', error);
      return err(new DatabaseError('Failed to add credits'));
    }
  }

  async recordTransaction(
    transaction: CreditTransaction
  ): Promise<Result<CreditTransaction, ApplicationError>> {
    try {
      const prismaTransaction = await this.prisma.creditTransaction.create({
        data: {
          id: transaction.id,
          userId: transaction.userId,
          type: transaction.type,
          amount: transaction.amount,
          balanceAfter: 0, // Placeholder
          operationType: transaction.operationType,
          metadata: transaction.metadata as any,
        } as any,
      });

      const recorded: CreditTransaction = {
        id: prismaTransaction.id,
        userId: prismaTransaction.userId,
        type: prismaTransaction.type as any,
        amount: prismaTransaction.amount,
        operationType: (prismaTransaction.operationType as any) || undefined,
        metadata: prismaTransaction.metadata as any,
        createdAt: prismaTransaction.createdAt,
      };

      return ok(recorded) as any;
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
      const transactions = await this.prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const result: CreditTransaction[] = transactions.map((t) => ({
        id: t.id,
        userId: t.userId,
        type: t.type as any,
        amount: t.amount,
        operationType: (t.operationType || undefined) as any,
        metadata: t.metadata as any,
        createdAt: t.createdAt,
      }));

      return ok(result) as any;
    } catch (error) {
      logger.error('Failed to get transaction history', error);
      return err(new DatabaseError('Failed to get transaction history'));
    }
  }

  async useGracePeriod(userId: string): Promise<Result<CreditBalance, ApplicationError>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return err(new NotFoundError('User not found'));
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { graceUsed: true },
      });

      const balance = new CreditBalance(
        new UserId(updatedUser.id),
        updatedUser.creditBalance,
        updatedUser.graceUsed
      );
      logger.info('Grace period used', { userId });
      return ok(balance) as any;
    } catch (error) {
      logger.error('Failed to use grace period', error);
      return err(new DatabaseError('Failed to use grace period'));
    }
  }
}
