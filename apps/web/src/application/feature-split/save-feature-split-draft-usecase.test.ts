import { describe, it, expect, vi } from 'vitest';
import { SaveFeatureSplitDraftUseCase } from './save-feature-split-draft-usecase';
import { ok, err } from '@repo/result';
import { NotFoundError, DatabaseError } from '@shared/errors/application-error';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IPrdRepository } from '@domain/prd/prd-repository';
import type { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';

const project = {
  id: 'prj_1',
  userId: 'usr_1',
  name: 'Test',
  description: null,
  phase: 'intake' as const,
  journeyMode: 'standard' as const,
  architectureStartedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSplit = {
  id: 'fs_1',
  projectId: 'prj_1',
  sourcePrdVersionId: 'prdver_1',
  status: 'draft' as const,
  clusters: [
    {
      id: 'clu_1',
      featureSplitId: 'fs_1',
      sortOrder: 0,
      label: 'Payments',
      valueLine: 'Take money',
      boundaryCue: 'No refunds',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeMockProjectRepo = (): IProjectRepository => ({
  findById: vi.fn(),
  findByIdAndUserId: vi.fn(),
  findAllByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const prdVersion = {
  id: 'prdver_1',
  projectId: 'prj_1',
  versionNumber: 1,
  content: { sections: [] },
  status: 'generated' as const,
  deliverableKind: 'standard' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeMockPrdRepo = (): IPrdRepository => ({
  findByProjectId: vi.fn(),
  findLatestByProjectId: vi.fn(),
  ensureFirstVersion: vi.fn(),
  mintReadOnlyShareLink: vi.fn(),
  getShareLinkGateByToken: vi.fn(),
  verifyShareLinkPassword: vi.fn(),
  revokeReadOnlyShareLink: vi.fn(),
  getAnonymousPrdVersionByShareToken: vi.fn(),
  findVersionByIdForOwner: vi.fn(),
  insertNextVersion: vi.fn(),
});

const makeMockSplitRepo = (): IFeatureSplitRepository => ({
  findByProjectId: vi.fn(),
  findByProjectAndPrdVersion: vi.fn(),
  findById: vi.fn(),
  saveDraft: vi.fn(),
  confirm: vi.fn(),
});

describe('SaveFeatureSplitDraftUseCase', () => {
  it('saves draft when project is owned by user', async () => {
    const projectRepo = makeMockProjectRepo();
    const prdRepo = makeMockPrdRepo();
    const splitRepo = makeMockSplitRepo();
    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(project));
    vi.mocked(prdRepo.findVersionByIdForOwner).mockResolvedValue(ok(prdVersion));
    vi.mocked(splitRepo.saveDraft).mockResolvedValue(ok(mockSplit));

    const uc = new SaveFeatureSplitDraftUseCase(projectRepo, prdRepo, splitRepo);
    const result = await uc.execute({
      projectId: 'prj_1',
      userId: 'usr_1',
      sourcePrdVersionId: 'prdver_1',
      clusters: [{ sortOrder: 0, label: 'Payments', valueLine: 'Take money', boundaryCue: 'No refunds' }],
    });

    expect(result.isOk()).toBe(true);
    expect(splitRepo.saveDraft).toHaveBeenCalledWith('prj_1', 'prdver_1', expect.any(Array));
  });

  it('returns error when PRD version does not belong to project', async () => {
    const projectRepo = makeMockProjectRepo();
    const prdRepo = makeMockPrdRepo();
    const splitRepo = makeMockSplitRepo();
    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(project));
    vi.mocked(prdRepo.findVersionByIdForOwner).mockResolvedValue(
      ok({ ...prdVersion, projectId: 'other_project' })
    );

    const uc = new SaveFeatureSplitDraftUseCase(projectRepo, prdRepo, splitRepo);
    const result = await uc.execute({
      projectId: 'prj_1',
      userId: 'usr_1',
      sourcePrdVersionId: 'prdver_1',
      clusters: [{ sortOrder: 0, label: 'A', valueLine: 'B', boundaryCue: 'C' }],
    });

    expect(result.isErr()).toBe(true);
    expect(splitRepo.saveDraft).not.toHaveBeenCalled();
  });

  it('returns error when project not found', async () => {
    const projectRepo = makeMockProjectRepo();
    const prdRepo = makeMockPrdRepo();
    const splitRepo = makeMockSplitRepo();
    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(
      err(new NotFoundError('Project not found'))
    );

    const uc = new SaveFeatureSplitDraftUseCase(projectRepo, prdRepo, splitRepo);
    const result = await uc.execute({
      projectId: 'prj_missing',
      userId: 'usr_1',
      sourcePrdVersionId: 'prdver_1',
      clusters: [{ sortOrder: 0, label: 'A', valueLine: 'B', boundaryCue: 'C' }],
    });

    expect(result.isErr()).toBe(true);
    expect(splitRepo.saveDraft).not.toHaveBeenCalled();
  });

  it('propagates repository error on save', async () => {
    const projectRepo = makeMockProjectRepo();
    const prdRepo = makeMockPrdRepo();
    const splitRepo = makeMockSplitRepo();
    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(project));
    vi.mocked(prdRepo.findVersionByIdForOwner).mockResolvedValue(ok(prdVersion));
    vi.mocked(splitRepo.saveDraft).mockResolvedValue(err(new DatabaseError('DB error')));

    const uc = new SaveFeatureSplitDraftUseCase(projectRepo, prdRepo, splitRepo);
    const result = await uc.execute({
      projectId: 'prj_1',
      userId: 'usr_1',
      sourcePrdVersionId: 'prdver_1',
      clusters: [{ sortOrder: 0, label: 'A', valueLine: 'B', boundaryCue: 'C' }],
    });

    expect(result.isErr()).toBe(true);
  });
});
