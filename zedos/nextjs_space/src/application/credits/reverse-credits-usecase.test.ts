import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReverseCreditsUseCase } from './reverse-credits-usecase';
import { CreditBalance } from '@domain/credits/credits';
import { UserId } from '@domain/user/user';
import { ok, err } from '@shared/result/result';
import { DatabaseError, NotFoundError } from '@shared/errors/application-error';

const makeMockBalance = (amount: number) =>
  new CreditBalance(new UserId('u1'), amount, false);

describe('ReverseCreditsUseCase (T-4)', () => {
  let repo: any;
  let useCase: ReverseCreditsUseCase;

  beforeEach(() => {
    repo = { reverseCredits: vi.fn() };
    useCase = new ReverseCreditsUseCase(repo);
  });

  it('returns Ok with restored balance after reversal', async () => {
    repo.reverseCredits.mockResolvedValue(ok(makeMockBalance(100)));
    const result = await useCase.execute({
      userId: 'u1',
      originalCorrelationId: 'corr-001',
    });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.unwrap().newBalance).toBe(100);
      expect(result.unwrap().reversed).toBe(true);
    }
  });

  it('is idempotent — second reversal call returns Ok (no-op in repo)', async () => {
    repo.reverseCredits.mockResolvedValue(ok(makeMockBalance(100)));
    const result1 = await useCase.execute({ userId: 'u1', originalCorrelationId: 'corr-001' });
    const result2 = await useCase.execute({ userId: 'u1', originalCorrelationId: 'corr-001' });
    expect(result1.isOk()).toBe(true);
    expect(result2.isOk()).toBe(true);
    expect(repo.reverseCredits).toHaveBeenCalledTimes(2);
  });

  it('returns Ok even when no original deduct existed (repo is no-op)', async () => {
    repo.reverseCredits.mockResolvedValue(ok(makeMockBalance(50)));
    const result = await useCase.execute({
      userId: 'u1',
      originalCorrelationId: 'never-deducted-corr',
    });
    expect(result.isOk()).toBe(true);
  });

  it('returns Err when repo fails with DatabaseError', async () => {
    repo.reverseCredits.mockResolvedValue(err(new DatabaseError('connection refused')));
    const result = await useCase.execute({
      userId: 'u1',
      originalCorrelationId: 'corr-001',
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(DatabaseError);
    }
  });
});
