import { describe, it, expect, vi, type Mocked } from 'vitest';
import { UpdateProjectJourneyModeUseCase } from './update-project-journey-mode-usecase';
import { ok, err } from '@repo/result';
import { NotFoundError, DatabaseError } from '@shared/errors/application-error';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { Project } from '@domain/project/project';

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'p1',
  userId: 'u1',
  name: 'Test',
  description: null,
  phase: 'intake',
  journeyMode: 'standard',
  architectureStartedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeMockRepo = (): Mocked<IProjectRepository> => ({
  findById: vi.fn(),
  findByIdAndUserId: vi.fn(),
  findAllByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe('UpdateProjectJourneyModeUseCase', () => {
  it('updates journey mode successfully', async () => {
    const repo = makeMockRepo();
    const existing = makeProject();
    repo.findByIdAndUserId.mockResolvedValue(ok(existing));
    repo.update.mockResolvedValue(ok(makeProject({ journeyMode: 'express' })));

    const uc = new UpdateProjectJourneyModeUseCase(repo);
    const result = await uc.execute({ projectId: 'p1', userId: 'u1', journeyMode: 'express' });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.unwrap().journeyMode).toBe('express');
    expect(repo.update).toHaveBeenCalledOnce();
  });

  it('propagates not-found', async () => {
    const repo = makeMockRepo();
    repo.findByIdAndUserId.mockResolvedValue(err(new NotFoundError('Project not found')));

    const uc = new UpdateProjectJourneyModeUseCase(repo);
    const result = await uc.execute({ projectId: 'missing', userId: 'u1', journeyMode: 'express' });
    expect(result.isErr()).toBe(true);
  });

  it('propagates repo update error', async () => {
    const repo = makeMockRepo();
    repo.findByIdAndUserId.mockResolvedValue(ok(makeProject()));
    repo.update.mockResolvedValue(err(new DatabaseError('fail')));

    const uc = new UpdateProjectJourneyModeUseCase(repo);
    const result = await uc.execute({ projectId: 'p1', userId: 'u1', journeyMode: 'express' });
    expect(result.isErr()).toBe(true);
  });
});
