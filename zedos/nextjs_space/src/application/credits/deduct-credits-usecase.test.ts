import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeductCreditsUseCase } from './deduct-credits-usecase';
import { CreditBalance } from '@domain/credits/credits';
import { UserId } from '@domain/user/user';
import { ok, err } from '@shared/result/result';
import {
  InsufficientCreditsError,
  DatabaseError,
} from '@shared/errors/application-error';

const makeMockBalance = (amount: number, graceUsed = false) =>
  Object.assign(new CreditBalance(new UserId('u1'), amount, graceUsed), {
    graceActivated: false,
  });

describe('DeductCreditsUseCase (T-3)', () => {
  let repo: any;
  let useCase: DeductCreditsUseCase;

  beforeEach(() => {
    repo = {
      deductCredits: vi.fn(),
    };
    useCase = new DeductCreditsUseCase(repo);
  });

  it('returns Ok with new balance when deduct succeeds', async () => {
    repo.deductCredits.mockResolvedValue(ok(makeMockBalance(90)));
    const result = await useCase.execute({
      userId: 'u1',
      amount: 10,
      operationType: 'clarification',
      correlationId: 'corr-001',
    });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.unwrap().newBalance).toBe(90);
      expect(result.unwrap().graceActivated).toBe(false);
    }
  });

  it('returns Ok with graceActivated=true when grace was used', async () => {
    repo.deductCredits.mockResolvedValue(
      ok(Object.assign(makeMockBalance(-5, true), { graceActivated: true }))
    );
    const result = await useCase.execute({
      userId: 'u1',
      amount: 15,
      operationType: 'clarification',
    });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.unwrap().graceActivated).toBe(true);
    }
  });

  it('returns Err(InsufficientCreditsError) when repo rejects due to insufficient credits', async () => {
    repo.deductCredits.mockResolvedValue(err(new InsufficientCreditsError(10, 3)));
    const result = await useCase.execute({
      userId: 'u1',
      amount: 10,
      operationType: 'clarification',
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(InsufficientCreditsError);
    }
  });

  it('returns Err(DatabaseError) when repo throws database error', async () => {
    repo.deductCredits.mockResolvedValue(err(new DatabaseError('connection failed')));
    const result = await useCase.execute({
      userId: 'u1',
      amount: 10,
      operationType: 'prd_generation',
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(DatabaseError);
    }
  });

  it('returns Ok with idempotent=true on duplicate correlationId', async () => {
    repo.deductCredits.mockResolvedValue(
      ok(Object.assign(makeMockBalance(90), { idempotent: true }))
    );
    const result = await useCase.execute({
      userId: 'u1',
      amount: 10,
      operationType: 'clarification',
      correlationId: 'corr-001',
    });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.unwrap().idempotent).toBe(true);
    }
  });
});
