import { describe, it, expect, vi } from 'vitest';
import { ReadinessScoreUseCase } from './readiness-score-usecase';
import { ok } from '@shared/result/result';

const fullContent = {
  overview: 'x', problem: 'x', users: 'x', journeys: 'x',
  objects: 'x', scope: 'x', risks: 'x', metrics: 'x',
};

const makeProjectRepo = (project: any) => ({
  findById: vi.fn(),
  findByIdAndUserId: vi.fn().mockResolvedValue(ok(project)),
  findAllByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const makePrdRepo = (prd: any) => ({
  findByProjectId: vi.fn(),
  findLatestByProjectId: vi.fn().mockResolvedValue(ok(prd)),
});

const makeAdrRepo = (counts: { total: number; complete: number }) => ({
  findByProjectId: vi.fn(),
  findByProjectIdAndNumber: vi.fn(),
  update: vi.fn(),
  countCompleteCore: vi.fn().mockResolvedValue(ok(counts)),
});

describe('ReadinessScoreUseCase', () => {
  it('returns 100% for fully filled PRD and all core ADRs complete', async () => {
    const uc = new ReadinessScoreUseCase(
      makeProjectRepo({ id: 'p1', userId: 'u1', phase: 'architecture' }) as any,
      makePrdRepo({ content: fullContent, versionNumber: 2 }) as any,
      makeAdrRepo({ total: 8, complete: 8 }) as any
    );

    const result = await uc.execute('p1', 'u1');
    expect(result.isOk()).toBe(true);
    const data = result.unwrap();
    expect(data.total.percentage).toBe(100);
    expect(data.prdVersion).toBe(2);
  });

  it('returns 0% for no PRD and no ADRs', async () => {
    const uc = new ReadinessScoreUseCase(
      makeProjectRepo({ id: 'p1', userId: 'u1', phase: 'intake' }) as any,
      makePrdRepo(null) as any,
      makeAdrRepo({ total: 0, complete: 0 }) as any
    );

    const result = await uc.execute('p1', 'u1');
    expect(result.isOk()).toBe(true);
    const data = result.unwrap();
    expect(data.total.percentage).toBe(0);
  });
});
