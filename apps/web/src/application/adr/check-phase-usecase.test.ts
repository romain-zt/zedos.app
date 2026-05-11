import { describe, it, expect, vi } from 'vitest';
import { CheckPhaseUseCase } from './check-phase-usecase';
import { ok, err } from '@repo/result';
import { NotFoundError } from '@shared/errors/application-error';

const makeProjectRepo = (project: any = null) => ({
  findById: vi.fn(),
  findByIdAndUserId: vi.fn().mockResolvedValue(
    project ? ok(project) : err(new NotFoundError('Not found'))
  ),
  findAllByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const makePrdRepo = (prd: any = null) => ({
  findByProjectId: vi.fn(),
  findLatestByProjectId: vi.fn().mockResolvedValue(ok(prd)),
});

const fullContent = {
  vision: 'x', target_users: 'x', core_features: 'x', user_journeys: 'x',
  technical: 'x', success_metrics: 'x', out_of_scope: 'x', risks: 'x',
};

describe('CheckPhaseUseCase', () => {
  it('returns stable when all PRD sections filled', async () => {
    const projectRepo = makeProjectRepo({ id: 'p1', userId: 'u1', phase: 'intake' });
    const prdRepo = makePrdRepo({ content: fullContent });

    const uc = new CheckPhaseUseCase(projectRepo as any, prdRepo as any);
    const result = await uc.execute('p1', 'u1');
    expect(result.isOk()).toBe(true);
    const data = result.unwrap();
    expect(data.isStable).toBe(true);
  });

  it('returns unstable when no PRD', async () => {
    const projectRepo = makeProjectRepo({ id: 'p1', userId: 'u1', phase: 'intake' });
    const prdRepo = makePrdRepo(null);

    const uc = new CheckPhaseUseCase(projectRepo as any, prdRepo as any);
    const result = await uc.execute('p1', 'u1');
    expect(result.isOk()).toBe(true);
    const data = result.unwrap();
    expect(data.isStable).toBe(false);
  });

  it('returns error when project not found', async () => {
    const projectRepo = makeProjectRepo();
    const prdRepo = makePrdRepo();

    const uc = new CheckPhaseUseCase(projectRepo as any, prdRepo as any);
    const result = await uc.execute('p1', 'u1');
    expect(result.isErr()).toBe(true);
  });
});
