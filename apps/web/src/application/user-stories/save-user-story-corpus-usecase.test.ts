import { describe, it, expect, vi } from 'vitest';
import { SaveUserStoryCorpusUseCase } from './save-user-story-corpus-usecase';
import { ok, err } from '@repo/result';
import { NotFoundError } from '@shared/errors/application-error';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import type { IUserStoryCorpusRepository } from '@domain/user-stories/user-story-corpus-repository';
import type { UserStoryCorpusDomain } from '@domain/user-stories/user-story-corpus';

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

const confirmedSplit = {
  id: 'fs_1',
  projectId: 'prj_1',
  sourcePrdVersionId: 'prdver_1',
  status: 'confirmed' as const,
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

const savedCorpus: UserStoryCorpusDomain = {
  id: 'corp_1',
  projectId: 'prj_1',
  featureSplitClusterId: 'clu_1',
  reviewReadyAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lines: [
    {
      id: 'line_1',
      corpusId: 'corp_1',
      sortOrder: 0,
      title: 'Checkout',
      body: 'As a user…',
      archivedAt: null,
      draftMarker: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

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

const makeMockCorpusRepo = (): IUserStoryCorpusRepository => ({
  findByProjectAndCluster: vi.fn(),
  save: vi.fn(),
  markReviewReady: vi.fn(),
});

describe('SaveUserStoryCorpusUseCase', () => {
  it('saves corpus when cluster is confirmed', async () => {
    const projectRepo = makeMockProjectRepo();
    const splitRepo = makeMockSplitRepo();
    const corpusRepo = makeMockCorpusRepo();
    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(project));
    vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([confirmedSplit]));
    vi.mocked(corpusRepo.save).mockResolvedValue(ok(savedCorpus));

    const uc = new SaveUserStoryCorpusUseCase(projectRepo, splitRepo, corpusRepo);
    const result = await uc.execute('prj_1', 'usr_1', 'clu_1', [
      { sortOrder: 0, title: 'Checkout', body: 'As a user…' },
    ]);

    expect(result.isOk()).toBe(true);
    expect(corpusRepo.save).toHaveBeenCalledWith('prj_1', 'clu_1', [
      { sortOrder: 0, title: 'Checkout', body: 'As a user…' },
    ]);
  });

  it('rejects when cluster is not confirmed', async () => {
    const projectRepo = makeMockProjectRepo();
    const splitRepo = makeMockSplitRepo();
    const corpusRepo = makeMockCorpusRepo();
    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(project));
    vi.mocked(splitRepo.findByProjectId).mockResolvedValue(
      ok([{ ...confirmedSplit, status: 'draft' as const }])
    );

    const uc = new SaveUserStoryCorpusUseCase(projectRepo, splitRepo, corpusRepo);
    const result = await uc.execute('prj_1', 'usr_1', 'clu_1', [
      { sortOrder: 0, title: 'Checkout', body: 'As a user…' },
    ]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toBeInstanceOf(NotFoundError);
    expect(corpusRepo.save).not.toHaveBeenCalled();
  });

  it('rejects empty line list', async () => {
    const projectRepo = makeMockProjectRepo();
    const splitRepo = makeMockSplitRepo();
    const corpusRepo = makeMockCorpusRepo();
    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(project));

    const uc = new SaveUserStoryCorpusUseCase(projectRepo, splitRepo, corpusRepo);
    const result = await uc.execute('prj_1', 'usr_1', 'clu_1', []);

    expect(result.isErr()).toBe(true);
    expect(corpusRepo.save).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    const projectRepo = makeMockProjectRepo();
    const splitRepo = makeMockSplitRepo();
    const corpusRepo = makeMockCorpusRepo();
    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(project));
    vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([confirmedSplit]));
    vi.mocked(corpusRepo.save).mockResolvedValue(err(new NotFoundError('Corpus missing')));

    const uc = new SaveUserStoryCorpusUseCase(projectRepo, splitRepo, corpusRepo);
    const result = await uc.execute('prj_1', 'usr_1', 'clu_1', [
      { sortOrder: 0, title: 'Checkout', body: 'As a user…' },
    ]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toBeInstanceOf(NotFoundError);
  });
});
