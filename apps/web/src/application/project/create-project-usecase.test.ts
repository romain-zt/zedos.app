import { describe, it, expect, vi } from 'vitest';
import { CreateProjectUseCase } from './create-project-usecase';
import { ok, err } from '@repo/result';
import { DatabaseError, ValidationError } from '@shared/errors/application-error';

const makeMockRepo = () => ({
  findById: vi.fn(),
  findByIdAndUserId: vi.fn(),
  findAllByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe('CreateProjectUseCase', () => {
  it('creates a project successfully', async () => {
    const repo = makeMockRepo();
    repo.create.mockResolvedValue(ok({
      id: 'p1',
      userId: 'u1',
      name: 'Test',
      description: null,
      phase: 'intake',
      architectureStartedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const uc = new CreateProjectUseCase(repo as any);
    const result = await uc.execute({ userId: 'u1', name: 'Test', description: null });
    expect(result.isOk()).toBe(true);
    expect(repo.create).toHaveBeenCalledOnce();
  });

  it('returns validation error for empty name', async () => {
    const repo = makeMockRepo();
    const uc = new CreateProjectUseCase(repo as any);
    const result = await uc.execute({ userId: 'u1', name: '   ', description: null });
    expect(result.isErr()).toBe(true);
  });

  it('propagates repo error', async () => {
    const repo = makeMockRepo();
    repo.create.mockResolvedValue(err(new DatabaseError('fail')));

    const uc = new CreateProjectUseCase(repo as any);
    const result = await uc.execute({ userId: 'u1', name: 'Valid', description: null });
    expect(result.isErr()).toBe(true);
  });
});
