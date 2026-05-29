import { describe, it, expect, beforeEach } from 'vitest';
import { DrizzleCreditsRepository } from './credits-repository';
import {
  truncateCreditTables,
  seedIntegrationUser,
  countCreditTransactionsForUser,
} from '@/src/test-helpers/setup-test-db';
import { InsufficientCreditsError, ValidationError } from '@shared/errors/application-error';

describe('DrizzleCreditsRepository (integration)', () => {
  const repo = new DrizzleCreditsRepository();

  beforeEach(async () => {
    await truncateCreditTables();
  });

  it('deducts credits atomically and records a consumption transaction', async () => {
    const user = await seedIntegrationUser({ creditBalance: 40 });

    const result = await repo.deductCredits(user.id, 10, 'clarification');

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    expect(result.value.amount).toBe(30);

    const balance = await repo.getBalance(user.id);
    expect(balance.isOk()).toBe(true);
    if (balance.isOk()) {
      expect(balance.value.amount).toBe(30);
    }

    expect(await countCreditTransactionsForUser(user.id)).toBe(1);
  });

  it('rejects deduction when balance and grace are insufficient', async () => {
    const user = await seedIntegrationUser({ creditBalance: 5, graceUsed: true });

    const result = await repo.deductCredits(user.id, 30, 'prd_generation');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(InsufficientCreditsError);
    }

    const balance = await repo.getBalance(user.id);
    expect(balance.isOk()).toBe(true);
    if (balance.isOk()) {
      expect(balance.value.amount).toBe(5);
    }
    expect(await countCreditTransactionsForUser(user.id)).toBe(0);
  });

  it('replays deductCredits idempotently when correlationId matches', async () => {
    const user = await seedIntegrationUser({ creditBalance: 25 });
    const correlationId = 'corr-deduct-once';

    const first = await repo.deductCredits(user.id, 5, 'clarification', { correlationId });
    const second = await repo.deductCredits(user.id, 5, 'clarification', { correlationId });

    expect(first.isOk()).toBe(true);
    expect(second.isOk()).toBe(true);
    if (first.isOk() && second.isOk()) {
      expect(first.value.amount).toBe(20);
      expect(second.value.amount).toBe(20);
    }
    expect(await countCreditTransactionsForUser(user.id)).toBe(1);
  });

  it('rejects correlationId reuse with different deduction parameters', async () => {
    const user = await seedIntegrationUser({ creditBalance: 30 });
    const correlationId = 'corr-conflict';

    const first = await repo.deductCredits(user.id, 5, 'clarification', { correlationId });
    const second = await repo.deductCredits(user.id, 8, 'clarification', { correlationId });

    expect(first.isOk()).toBe(true);
    expect(second.isErr()).toBe(true);
    if (second.isErr()) {
      expect(second.error).toBeInstanceOf(ValidationError);
    }
    expect(await countCreditTransactionsForUser(user.id)).toBe(1);
  });

  it('adds purchase credits idempotently via correlationId', async () => {
    const user = await seedIntegrationUser({ creditBalance: 0 });
    const correlationId = 'purchase:pack-100';

    const first = await repo.addCredits(user.id, 100, 'purchase', { correlationId });
    const second = await repo.addCredits(user.id, 100, 'purchase', { correlationId });

    expect(first.isOk()).toBe(true);
    expect(second.isOk()).toBe(true);
    if (first.isOk() && second.isOk()) {
      expect(first.value.amount).toBe(100);
      expect(second.value.amount).toBe(100);
    }
    expect(await countCreditTransactionsForUser(user.id)).toBe(1);
  });

  it('handles concurrent deductCredits with the same correlationId', async () => {
    const user = await seedIntegrationUser({ creditBalance: 50 });
    const correlationId = 'corr-concurrent-deduct';

    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        repo.deductCredits(user.id, 7, 'mini_form', { correlationId }),
      ),
    );

    expect(results.every((r) => r.isOk())).toBe(true);
    const balances = results.filter((r) => r.isOk()).map((r) => r.value.amount);
    expect(new Set(balances)).toEqual(new Set([43]));
    expect(await countCreditTransactionsForUser(user.id)).toBe(1);
  });

  it('reverses a prior consumption once and is idempotent on replay', async () => {
    const user = await seedIntegrationUser({ creditBalance: 20 });
    const consumptionCorrelation = 'corr-consumption-for-reversal';

    const deducted = await repo.deductCredits(user.id, 6, 'decision', {
      correlationId: consumptionCorrelation,
    });
    expect(deducted.isOk()).toBe(true);

    const reversed = await repo.reverseCredits(user.id, consumptionCorrelation);
    const reversedAgain = await repo.reverseCredits(user.id, consumptionCorrelation);

    expect(reversed.isOk()).toBe(true);
    expect(reversedAgain.isOk()).toBe(true);
    if (reversed.isOk() && reversedAgain.isOk()) {
      expect(reversed.value.amount).toBe(20);
      expect(reversedAgain.value.amount).toBe(20);
    }
    expect(await countCreditTransactionsForUser(user.id)).toBe(2);
  });
});
