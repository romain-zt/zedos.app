import { describe, it, expect, vi, type Mocked } from 'vitest';
import { CreateProjectUseCase } from './create-project-usecase';
import { ok, err } from '@repo/result';
import { DatabaseError } from '@shared/errors/application-error';
import type { IProjectRepository } from '@domain/project/project-repository';

const makeMockRepo = (): Mocked<IProjectRepository> => ({
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
      journeyMode: 'standard',
      architectureStartedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const uc = new CreateProjectUseCase(repo);
    const result = await uc.execute({ userId: 'u1', name: 'Test', description: null });
    expect(result.isOk()).toBe(true);
    expect(repo.create).toHaveBeenCalledOnce();
  });

  it('creates a project with express journey mode', async () => {
    const repo = makeMockRepo();
    repo.create.mockResolvedValue(ok({
      id: 'p1',
      userId: 'u1',
      name: 'Express',
      description: null,
      phase: 'intake',
      journeyMode: 'express',
      architectureStartedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const uc = new CreateProjectUseCase(repo);
    const result = await uc.execute({
      userId: 'u1',
      name: 'Express',
      description: null,
      journeyMode: 'express',
    });
    expect(result.isOk()).toBe(true);
    expect(repo.create).toHaveBeenCalledOnce();
    const createdArg = repo.create.mock.calls[0]?.[0];
    expect(createdArg?.journeyMode).toBe('express');
  });

  it('returns validation error for empty name', async () => {
    const repo = makeMockRepo();
    const uc = new CreateProjectUseCase(repo);
    const result = await uc.execute({ userId: 'u1', name: '   ', description: null });
    expect(result.isErr()).toBe(true);
  });

  it('propagates repo error', async () => {
    const repo = makeMockRepo();
    repo.create.mockResolvedValue(err(new DatabaseError('fail')));

    const uc = new CreateProjectUseCase(repo);
    const result = await uc.execute({ userId: 'u1', name: 'Valid', description: null });
    expect(result.isErr()).toBe(true);
  });
});
