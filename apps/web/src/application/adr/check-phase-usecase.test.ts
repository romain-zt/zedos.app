import { describe, it, expect, vi } from 'vitest';
import { CheckPhaseUseCase } from './check-phase-usecase';
import { ok, err } from '@repo/result';
import { NotFoundError } from '@shared/errors/application-error';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IPrdRepository } from '@domain/prd/prd-repository';
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
  journeyMode: 'standard',
  architectureStartedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const basePrd = (content: Record<string, string> | null): PrdVersion => ({
  id: 'prd-1',
  projectId: 'p1',
  versionNumber: 1,
  content,
  status: 'draft',
  deliverableKind: 'standard',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeProjectRepo = (project: Project | null = null): IProjectRepository => ({
  findById: vi.fn(),
  findByIdAndUserId: vi.fn().mockResolvedValue(
    project ? ok(project) : err(new NotFoundError('Not found')),
  ),
  findAllByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const makePrdRepo = (prd: PrdVersion | null = null): IPrdRepository => ({
  findByProjectId: vi.fn(),
  findLatestByProjectId: vi.fn().mockResolvedValue(ok(prd)),
  ensureFirstVersion: vi.fn(),
  mintReadOnlyShareLink: vi.fn(),
  revokeReadOnlyShareLink: vi.fn(),
  getAnonymousPrdVersionByShareToken: vi.fn(),
  getShareLinkGateByToken: vi.fn(),
  verifyShareLinkPassword: vi.fn(),
  findVersionByIdForOwner: vi.fn(),
});

describe('CheckPhaseUseCase', () => {
  it('returns stable when all PRD sections filled', async () => {
    const uc = new CheckPhaseUseCase(
      makeProjectRepo(baseProject({ id: 'p1', userId: 'u1', phase: 'intake' })),
      makePrdRepo(basePrd(fullContent)),
    );
    const result = await uc.execute('p1', 'u1');
    expect(result.isOk()).toBe(true);
    const data = result.unwrap();
    expect(data.isStable).toBe(true);
  });

  it('returns unstable when no PRD', async () => {
    const uc = new CheckPhaseUseCase(
      makeProjectRepo(baseProject({ id: 'p1', userId: 'u1', phase: 'intake' })),
      makePrdRepo(null),
    );
    const result = await uc.execute('p1', 'u1');
    expect(result.isOk()).toBe(true);
    const data = result.unwrap();
    expect(data.isStable).toBe(false);
  });

  it('returns error when project not found', async () => {
    const uc = new CheckPhaseUseCase(makeProjectRepo(), makePrdRepo());
    const result = await uc.execute('p1', 'u1');
    expect(result.isErr()).toBe(true);
  });
});
