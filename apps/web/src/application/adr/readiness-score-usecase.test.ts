import { describe, it, expect, vi } from 'vitest';
import { ReadinessScoreUseCase } from './readiness-score-usecase';
import { ok } from '@repo/result';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IPrdRepository } from '@domain/prd/prd-repository';
import type { IAdrRepository } from '@domain/adr/adr-repository';
import type { Project } from '@domain/project/project';
import type { PrdVersion } from '@domain/prd/prd';

const fullContent: Record<string, string> = {
  vision: 'x',
  target_users: 'x',
  core_features: 'x',
  user_journeys: 'x',
  technical: 'x',
  success_metrics: 'x',
  out_of_scope: 'x',
  risks: 'x',
};

const baseProject = (overrides: Partial<Project>): Project => ({
  id: 'p1',
  userId: 'u1',
  name: 'Test',
  description: null,
  phase: 'intake',
  architectureStartedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const basePrd = (content: Record<string, string> | null, versionNumber: number): PrdVersion => ({
  id: 'prd-1',
  projectId: 'p1',
  versionNumber,
  content,
  status: 'draft',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeProjectRepo = (project: Project): IProjectRepository => ({
  findById: vi.fn(),
  findByIdAndUserId: vi.fn().mockResolvedValue(ok(project)),
  findAllByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const makePrdRepo = (prd: PrdVersion | null): IPrdRepository => ({
  findByProjectId: vi.fn(),
  findLatestByProjectId: vi.fn().mockResolvedValue(ok(prd)),
  ensureFirstVersion: vi.fn(),
  mintReadOnlyShareLink: vi.fn(),
  revokeReadOnlyShareLink: vi.fn(),
  getAnonymousPrdVersionByShareToken: vi.fn(),
  findVersionByIdForOwner: vi.fn(),
});

const makeAdrRepo = (counts: { total: number; complete: number }): IAdrRepository => ({
  findByProjectId: vi.fn(),
  findByProjectIdAndNumber: vi.fn(),
  update: vi.fn(),
  countCompleteCore: vi.fn().mockResolvedValue(ok(counts)),
});

describe('ReadinessScoreUseCase', () => {
  it('returns 100% for fully filled PRD and all core ADRs complete', async () => {
    const uc = new ReadinessScoreUseCase(
      makeProjectRepo(baseProject({ id: 'p1', userId: 'u1', phase: 'architecture' })),
      makePrdRepo(basePrd(fullContent, 2)),
      makeAdrRepo({ total: 8, complete: 8 }),
    );

    const result = await uc.execute('p1', 'u1');
    expect(result.isOk()).toBe(true);
    const data = result.unwrap();
    expect(data.total.percentage).toBe(100);
    expect(data.prdVersion).toBe(2);
  });

  it('returns 0% for no PRD and no ADRs', async () => {
    const uc = new ReadinessScoreUseCase(
      makeProjectRepo(baseProject({ id: 'p1', userId: 'u1', phase: 'intake' })),
      makePrdRepo(null),
      makeAdrRepo({ total: 0, complete: 0 }),
    );

    const result = await uc.execute('p1', 'u1');
    expect(result.isOk()).toBe(true);
    const data = result.unwrap();
    expect(data.total.percentage).toBe(0);
  });
});
