/**
 * Prisma Credits Repository Adapter — concurrency-safe implementation.
 *
 * All balance mutations run inside prisma.$transaction with a SELECT FOR UPDATE row lock
 * to prevent the double-spend race documented in retro finding #24.
 * correlationId on deduct/add/reverse provides idempotency.
 */

import { ICreditsRepository } from '@domain/credits/credits-repository';
import { CreditBalance, CreditTransaction, OperationType } from '@domain/credits/credits';
import { CreditsDomainService } from '@domain/credits/credits-service';
import { UserId } from '@domain/user/user';
import { Result, ok, err } from '@shared/result/result';
import {
  ApplicationError,
  NotFoundError,
  DatabaseError,
  InsufficientCreditsError,
} from '@shared/errors/application-error';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '@shared/observability/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger({ service: 'CreditsRepository' });

type RowLockResult = { credit_balance: number; grace_used: boolean };

type DeductResult = CreditBalance & { graceActivated: boolean; idempotent?: boolean };

export class PrismaCreditsRepository implements ICreditsRepository {
  constructor(private prisma: PrismaClient) {}

  async getBalance(userId: string): Promise<Result<CreditBalance, ApplicationError>> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return err(new NotFoundError('User not found'));

      const balance = new CreditBalance(new UserId(user.id), user.creditBalance, user.graceUsed);
      return ok(balance) as any;
    } catch (e) {
      logger.error('Failed to get balance', e);
      return err(new DatabaseError('Failed to get balance'));
    }
  }

  async deductCredits(
    userId: string,
    amount: number,
    operationType: OperationType,
    correlationId?: string
  ): Promise<Result<DeductResult, ApplicationError>> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const lockedRows = await tx.$queryRawUnsafe(
          `SELECT credit_balance, grace_used FROM users WHERE id = $1 FOR UPDATE`,
          userId
        ) as RowLockResult[];
        const [locked] = lockedRows;
        if (!locked) return err(new NotFoundError('User not found'));

        const decision = CreditsDomainService.computeDeductionDecision(
          locked.credit_balance,
          locked.grace_used,
          amount
        );

        if (decision.kind === 'reject') {
          return err(
            new InsufficientCreditsError(amount, locked.credit_balance, { reason: decision.reason })
          );
        }

        if (correlationId) {
          const existing = await tx.creditTransaction.findFirst({
            where: { userId, correlationId },
          });
          if (existing) {
            const user = await tx.user.findUnique({ where: { id: userId } });
            const balance = new CreditBalance(new UserId(userId), user!.creditBalance, user!.graceUsed);
            return ok(Object.assign(balance, { graceActivated: false, idempotent: true })) as any;
          }
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            creditBalance: decision.newBalance,
            ...(decision.willActivateGrace ? { graceUsed: true } : {}),
          },
        });

        await tx.creditTransaction.create({
          data: {
            id: uuidv4(),
            userId,
            type: 'consumption',
            amount: -amount,
            balanceAfter: decision.newBalance,
            operationType,
            ...(correlationId ? { correlationId } : {}),
          } as any,
        });

        logger.info('Credits deducted', { userId, amount, operationType, correlationId });
        const balance = new CreditBalance(
          new UserId(updatedUser.id),
          updatedUser.creditBalance,
          updatedUser.graceUsed
        );
        return ok(
          Object.assign(balance, { graceActivated: decision.willActivateGrace })
        ) as any;
      });
    } catch (e) {
      logger.error('Failed to deduct credits', e);
      return err(new DatabaseError('Failed to deduct credits'));
    }
  }

  async addCredits(
    userId: string,
    amount: number,
    type: 'grant' | 'purchase' | 'auto_reload',
    correlationId?: string
  ): Promise<Result<CreditBalance, ApplicationError>> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const lockedRows2 = await tx.$queryRawUnsafe(
          `SELECT credit_balance, grace_used FROM users WHERE id = $1 FOR UPDATE`,
          userId
        ) as RowLockResult[];
        const [locked] = lockedRows2;
        if (!locked) return err(new NotFoundError('User not found'));

        if (correlationId) {
          const existing = await tx.creditTransaction.findFirst({
            where: { userId, correlationId },
          });
          if (existing) {
            const user = await tx.user.findUnique({ where: { id: userId } });
            const balance = new CreditBalance(new UserId(userId), user!.creditBalance, user!.graceUsed);
            return ok(balance) as any;
          }
        }

        const newBalance = locked.credit_balance + amount;
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            creditBalance: newBalance,
            ...(type === 'grant' ? { starterCreditsGranted: true } : {}),
          },
        });

        await tx.creditTransaction.create({
          data: {
            id: uuidv4(),
            userId,
            type,
            amount,
            balanceAfter: newBalance,
            ...(correlationId ? { correlationId } : {}),
          } as any,
        });

        logger.info('Credits added', { userId, amount, type, correlationId });
        const balance = new CreditBalance(
          new UserId(updatedUser.id),
          updatedUser.creditBalance,
          updatedUser.graceUsed
        );
        return ok(balance) as any;
      });
    } catch (e) {
      logger.error('Failed to add credits', e);
      return err(new DatabaseError('Failed to add credits'));
    }
  }

  async reverseCredits(
    userId: string,
    originalCorrelationId: string
  ): Promise<Result<CreditBalance, ApplicationError>> {
    const reversalCorrelationId = `${originalCorrelationId}--reverse`;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const lockedRows3 = await tx.$queryRawUnsafe(
          `SELECT credit_balance, grace_used FROM users WHERE id = $1 FOR UPDATE`,
          userId
        ) as RowLockResult[];
        const [locked] = lockedRows3;
        if (!locked) return err(new NotFoundError('User not found'));

        // Idempotency: already reversed?
        const alreadyReversed = await tx.creditTransaction.findFirst({
          where: { userId, correlationId: reversalCorrelationId },
        });
        if (alreadyReversed) {
          const user = await tx.user.findUnique({ where: { id: userId } });
          const balance = new CreditBalance(new UserId(userId), user!.creditBalance, user!.graceUsed);
          return ok(balance) as any;
        }

        // Find the original deduction to know how much to reverse.
        const original = await tx.creditTransaction.findFirst({
          where: { userId, correlationId: originalCorrelationId, type: 'consumption' },
        });
        if (!original) {
          // No original deduct — no-op, return current balance.
          const user = await tx.user.findUnique({ where: { id: userId } });
          const balance = new CreditBalance(new UserId(userId), user!.creditBalance, user!.graceUsed);
          return ok(balance) as any;
        }

        const deductedAmount = Math.abs(original.amount);
        const newBalance = locked.credit_balance + deductedAmount;

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { creditBalance: newBalance },
        });

        await tx.creditTransaction.create({
          data: {
            id: uuidv4(),
            userId,
            type: 'consumption',
            amount: deductedAmount,
            balanceAfter: newBalance,
            operationType: original.operationType ?? undefined,
            correlationId: reversalCorrelationId,
            metadata: { reversal: true, originalCorrelationId },
          } as any,
        });

        logger.info('Credits reversed', {
          userId,
          deductedAmount,
          originalCorrelationId,
          reversalCorrelationId,
        });
        const balance = new CreditBalance(
          new UserId(updatedUser.id),
          updatedUser.creditBalance,
          updatedUser.graceUsed
        );
        return ok(balance) as any;
      });
    } catch (e) {
      logger.error('Failed to reverse credits', e);
      return err(new DatabaseError('Failed to reverse credits'));
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
          balanceAfter: 0,
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
    } catch (e) {
      logger.error('Failed to record transaction', e);
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
    } catch (e) {
      logger.error('Failed to get transaction history', e);
      return err(new DatabaseError('Failed to get transaction history'));
    }
  }

  async useGracePeriod(userId: string): Promise<Result<CreditBalance, ApplicationError>> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return err(new NotFoundError('User not found'));

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
    } catch (e) {
      logger.error('Failed to use grace period', e);
      return err(new DatabaseError('Failed to use grace period'));
    }
  }
}
