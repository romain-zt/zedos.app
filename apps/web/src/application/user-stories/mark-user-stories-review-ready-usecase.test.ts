import { describe, it, expect, vi } from 'vitest';
import { MarkUserStoriesReviewReadyUseCase } from './mark-user-stories-review-ready-usecase';
import { ok } from '@repo/result';
import { NotFoundError, ValidationError } from '@shared/errors/application-error';
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

const baseCorpus = (lines: UserStoryCorpusDomain['lines']): UserStoryCorpusDomain => ({
  id: 'corp_1',
  projectId: 'prj_1',
  featureSplitClusterId: 'clu_1',
  reviewReadyAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lines,
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

const makeMockCorpusRepo = (): IUserStoryCorpusRepository => ({
  findByProjectAndCluster: vi.fn(),
  save: vi.fn(),
  markReviewReady: vi.fn(),
});

describe('MarkUserStoriesReviewReadyUseCase', () => {
  it('marks review ready when at least one active line exists', async () => {
    const projectRepo = makeMockProjectRepo();
    const splitRepo = makeMockSplitRepo();
    const corpusRepo = makeMockCorpusRepo();
    const corpus = baseCorpus([
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
    ]);
    const readyCorpus = { ...corpus, reviewReadyAt: new Date() };

    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(project));
    vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([confirmedSplit]));
    vi.mocked(corpusRepo.findByProjectAndCluster).mockResolvedValue(ok(corpus));
    vi.mocked(corpusRepo.markReviewReady).mockResolvedValue(ok(readyCorpus));

    const uc = new MarkUserStoriesReviewReadyUseCase(projectRepo, splitRepo, corpusRepo);
    const result = await uc.execute('prj_1', 'usr_1', 'clu_1');

    expect(result.isOk()).toBe(true);
    expect(corpusRepo.markReviewReady).toHaveBeenCalledWith('prj_1', 'clu_1');
  });

  it('rejects when corpus is missing', async () => {
    const projectRepo = makeMockProjectRepo();
    const splitRepo = makeMockSplitRepo();
    const corpusRepo = makeMockCorpusRepo();

    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(project));
    vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([confirmedSplit]));
    vi.mocked(corpusRepo.findByProjectAndCluster).mockResolvedValue(ok(null));

    const uc = new MarkUserStoriesReviewReadyUseCase(projectRepo, splitRepo, corpusRepo);
    const result = await uc.execute('prj_1', 'usr_1', 'clu_1');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toBeInstanceOf(NotFoundError);
    expect(corpusRepo.markReviewReady).not.toHaveBeenCalled();
  });

  it('rejects when all lines are archived', async () => {
    const projectRepo = makeMockProjectRepo();
    const splitRepo = makeMockSplitRepo();
    const corpusRepo = makeMockCorpusRepo();
    const corpus = baseCorpus([
      {
        id: 'line_1',
        corpusId: 'corp_1',
        sortOrder: 0,
        title: 'Checkout',
        body: 'As a user…',
        archivedAt: new Date(),
        draftMarker: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(project));
    vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([confirmedSplit]));
    vi.mocked(corpusRepo.findByProjectAndCluster).mockResolvedValue(ok(corpus));

    const uc = new MarkUserStoriesReviewReadyUseCase(projectRepo, splitRepo, corpusRepo);
    const result = await uc.execute('prj_1', 'usr_1', 'clu_1');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toBeInstanceOf(ValidationError);
    expect(corpusRepo.markReviewReady).not.toHaveBeenCalled();
  });
});
