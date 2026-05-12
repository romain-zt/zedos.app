import { describe, it, expect, vi } from 'vitest';
import { ConfirmFeatureSplitUseCase } from './confirm-feature-split-usecase';
import { ok, err } from '@repo/result';
import { NotFoundError, ValidationError } from '@shared/errors/application-error';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import type { FeatureSplitDomain } from '@domain/feature-split/feature-split';

const project = {
  id: 'prj_1',
  userId: 'usr_1',
  name: 'Test',
  description: null,
  phase: 'intake' as const,
  architectureStartedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeSplit = (overrides: Partial<FeatureSplitDomain> = {}): FeatureSplitDomain => ({
  id: 'fs_1',
  projectId: 'prj_1',
  sourcePrdVersionId: 'prdver_1',
  status: 'draft',
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
  ...overrides,
});

const makeMockProjectRepo = (): IProjectRepository => ({
  findById: vi.fn(),
  findByIdAndUserId: vi.fn(),
  findAllByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const makeMockSplitRepo = (): IFeatureSplitRepository => ({
  findByProjectId: vi.fn(),
  findByProjectAndPrdVersion: vi.fn(),
  findById: vi.fn(),
  saveDraft: vi.fn(),
  confirm: vi.fn(),
});

describe('ConfirmFeatureSplitUseCase', () => {
  it('confirms a draft split', async () => {
    const projectRepo = makeMockProjectRepo();
    const splitRepo = makeMockSplitRepo();
    const draftSplit = makeSplit({ status: 'draft' });
    const confirmedSplit = makeSplit({ status: 'confirmed' });

    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(project));
    vi.mocked(splitRepo.findById).mockResolvedValue(ok(draftSplit));
    vi.mocked(splitRepo.confirm).mockResolvedValue(ok(confirmedSplit));

    const uc = new ConfirmFeatureSplitUseCase(projectRepo, splitRepo);
    const result = await uc.execute('fs_1', 'prj_1', 'usr_1');

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().status).toBe('confirmed');
    expect(splitRepo.confirm).toHaveBeenCalledWith('fs_1');
  });

  it('returns already-confirmed split idempotently without calling confirm again', async () => {
    const projectRepo = makeMockProjectRepo();
    const splitRepo = makeMockSplitRepo();
    const confirmedSplit = makeSplit({ status: 'confirmed' });

    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(project));
    vi.mocked(splitRepo.findById).mockResolvedValue(ok(confirmedSplit));

    const uc = new ConfirmFeatureSplitUseCase(projectRepo, splitRepo);
    const result = await uc.execute('fs_1', 'prj_1', 'usr_1');

    expect(result.isOk()).toBe(true);
    expect(splitRepo.confirm).not.toHaveBeenCalled();
  });

  it('rejects confirm when no clusters', async () => {
    const projectRepo = makeMockProjectRepo();
    const splitRepo = makeMockSplitRepo();
    const emptySplit = makeSplit({ clusters: [] });

    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(project));
    vi.mocked(splitRepo.findById).mockResolvedValue(ok(emptySplit));

    const uc = new ConfirmFeatureSplitUseCase(projectRepo, splitRepo);
    const result = await uc.execute('fs_1', 'prj_1', 'usr_1');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toBeInstanceOf(ValidationError);
  });

  it('returns error when project not found', async () => {
    const projectRepo = makeMockProjectRepo();
    const splitRepo = makeMockSplitRepo();
    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(
      err(new NotFoundError('Project not found'))
    );

    const uc = new ConfirmFeatureSplitUseCase(projectRepo, splitRepo);
    const result = await uc.execute('fs_1', 'prj_1', 'usr_1');

    expect(result.isErr()).toBe(true);
    expect(splitRepo.findById).not.toHaveBeenCalled();
  });

  it('returns error when split belongs to different project', async () => {
    const projectRepo = makeMockProjectRepo();
    const splitRepo = makeMockSplitRepo();
    const wrongSplit = makeSplit({ projectId: 'prj_other' });

    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(project));
    vi.mocked(splitRepo.findById).mockResolvedValue(ok(wrongSplit));

    const uc = new ConfirmFeatureSplitUseCase(projectRepo, splitRepo);
    const result = await uc.execute('fs_1', 'prj_1', 'usr_1');

    expect(result.isErr()).toBe(true);
    expect(result.error).toBeInstanceOf(NotFoundError);
  });
});
