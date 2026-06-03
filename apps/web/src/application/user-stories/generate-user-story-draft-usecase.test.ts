import { describe, it, expect, vi } from 'vitest';
import { GenerateUserStoryDraftUseCase } from './generate-user-story-draft-usecase';
import { ok, err } from '@repo/result';
import { NotFoundError, ExternalServiceError, DatabaseError, ValidationError } from '@shared/errors/application-error';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import type { IUserStoryCorpusRepository } from '@domain/user-stories/user-story-corpus-repository';
import type { IUserStoryDraftGenerator } from '@domain/user-stories/user-story-draft-generator';
import type { FeatureSplitDomain } from '@domain/feature-split/feature-split';
import type { UserStoryCorpusDomain } from '@domain/user-stories/user-story-corpus';

const now = new Date('2026-01-01T00:00:00Z');

const makeProject = () => ({
  id: 'prj_1',
  userId: 'usr_1',
  name: 'Test Project',
  description: null,
  phase: 'intake' as const,
  journeyMode: 'standard' as const,
  architectureStartedAt: null,
  createdAt: now,
  updatedAt: now,
});

const makeCluster = (overrides: {
  label?: string;
  valueLine?: string;
  boundaryCue?: string;
} = {}) => ({
  id: 'clu_1',
  featureSplitId: 'fs_1',
  sortOrder: 0,
  label: overrides.label ?? 'Payments',
  valueLine: overrides.valueLine ?? 'Collect money from users',
  boundaryCue: overrides.boundaryCue ?? 'No refund logic',
  createdAt: now,
  updatedAt: now,
});

const makeFeatureSplit = (cluster = makeCluster()): FeatureSplitDomain => ({
  id: 'fs_1',
  projectId: 'prj_1',
  sourcePrdVersionId: 'prdver_1',
  status: 'confirmed',
  clusters: [cluster],
  createdAt: now,
  updatedAt: now,
});

const makeCorpus = (lines: UserStoryCorpusDomain['lines'] = []): UserStoryCorpusDomain => ({
  id: 'corpus_1',
  projectId: 'prj_1',
  featureSplitClusterId: 'clu_1',
  reviewReadyAt: null,
  createdAt: now,
  updatedAt: now,
  lines,
});

const makeLine = (overrides: Partial<UserStoryCorpusDomain['lines'][number]> = {}): UserStoryCorpusDomain['lines'][number] => ({
  id: 'line_1',
  corpusId: 'corpus_1',
  sortOrder: 0,
  title: 'Collect money',
  body: 'Given a user, when they pay, then money is collected',
  archivedAt: null,
  draftMarker: null,
  createdAt: now,
  updatedAt: now,
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

const makeMockCorpusRepo = (): IUserStoryCorpusRepository => ({
  findByProjectAndCluster: vi.fn(),
  save: vi.fn(),
  markReviewReady: vi.fn(),
});

const makeMockDraftGenerator = (): IUserStoryDraftGenerator => ({
  draftOutlines: vi.fn(),
  draftSingleStory: vi.fn(),
});

describe('GenerateUserStoryDraftUseCase', () => {
  describe('template mode', () => {
    const templateScaffoldSuffix =
      '\n\n## Draft behaviors\n' +
      '- As a user, I can …\n' +
      '- As a user, I can …\n' +
      '\n## Acceptance outline\n' +
      '- Given … When … Then …\n' +
      '\n_Template scaffold — replace placeholders with implementation-ready criteria._';

    it('saves a structured scaffold body that expands cluster hints', async () => {
      const projectRepo = makeMockProjectRepo();
      const splitRepo = makeMockSplitRepo();
      const corpusRepo = makeMockCorpusRepo();
      const generator = makeMockDraftGenerator();
      const cluster = makeCluster({
        label: 'Payments',
        valueLine: 'Collect money',
        boundaryCue: 'No refunds',
      });

      const expectedBody =
        '## Goal\n' +
        'Turn this cluster into concrete, user-visible behaviors. Each capability below must be **distinct** — do not ship the cluster fields alone as the story.\n' +
        '\n## Cluster reference (expand; do not use as sole story text)\n' +
        '- Label: Payments\n' +
        '- Value line: Collect money\n' +
        '- Boundary cue: No refunds' +
        templateScaffoldSuffix;

      vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(makeProject()));
      vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([makeFeatureSplit(cluster)]));
      vi.mocked(corpusRepo.save).mockResolvedValue(ok(makeCorpus([makeLine({
        title: 'Payments',
        body: expectedBody,
      })])));

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      const result = await uc.execute('prj_1', 'usr_1', {
        featureSplitClusterId: 'clu_1',
        mode: 'template',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.unwrap().kind).toBe('corpus');
      }
      expect(corpusRepo.save).toHaveBeenCalledWith(
        'prj_1',
        'clu_1',
        [{ sortOrder: 0, title: 'Payments', body: expectedBody }]
      );
    });
  });

  describe('ai mode', () => {
    it('returns outlines on outline step', async () => {
      const projectRepo = makeMockProjectRepo();
      const splitRepo = makeMockSplitRepo();
      const corpusRepo = makeMockCorpusRepo();
      const generator = makeMockDraftGenerator();

      vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(makeProject()));
      vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([makeFeatureSplit()]));
      vi.mocked(generator.draftOutlines).mockResolvedValue(
        ok({ outlines: [{ title: 'A' }, { title: 'B' }] })
      );

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      const result = await uc.execute('prj_1', 'usr_1', {
        featureSplitClusterId: 'clu_1',
        mode: 'ai',
        aiStep: 'outline',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const value = result.unwrap();
        expect(value.kind).toBe('outline');
        if (value.kind === 'outline') {
          expect(value.total).toBe(2);
        }
      }
      expect(corpusRepo.save).not.toHaveBeenCalled();
    });

    it('generates one story and appends to existing lines on story step', async () => {
      const projectRepo = makeMockProjectRepo();
      const splitRepo = makeMockSplitRepo();
      const corpusRepo = makeMockCorpusRepo();
      const generator = makeMockDraftGenerator();

      vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(makeProject()));
      vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([makeFeatureSplit()]));
      vi.mocked(generator.draftSingleStory).mockResolvedValue(
        ok({ title: 'Story B', body: 'Body B', sortOrder: 1 })
      );
      vi.mocked(corpusRepo.save).mockResolvedValue(
        ok(
          makeCorpus([
            makeLine({ title: 'Story A', body: 'Body A', sortOrder: 0 }),
            makeLine({ id: 'l2', title: 'Story B', body: 'Body B', sortOrder: 1 }),
          ])
        )
      );

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      const result = await uc.execute('prj_1', 'usr_1', {
        featureSplitClusterId: 'clu_1',
        mode: 'ai',
        aiStep: 'story',
        outlines: [{ title: 'A' }, { title: 'B' }],
        outlineIndex: 1,
        existingLines: [{ sortOrder: 0, title: 'Story A', body: 'Body A' }],
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const value = result.unwrap();
        expect(value.kind).toBe('story');
        if (value.kind === 'story') {
          expect(value.progress).toEqual({ current: 2, total: 2, done: true });
        }
      }
      expect(corpusRepo.save).toHaveBeenCalledWith('prj_1', 'clu_1', [
        { sortOrder: 0, title: 'Story A', body: 'Body A' },
        { sortOrder: 1, title: 'Story B', body: 'Body B' },
      ]);
    });

    it('returns ValidationError when outlineIndex is out of range', async () => {
      const projectRepo = makeMockProjectRepo();
      const splitRepo = makeMockSplitRepo();
      const corpusRepo = makeMockCorpusRepo();
      const generator = makeMockDraftGenerator();

      vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(makeProject()));
      vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([makeFeatureSplit()]));

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      const result = await uc.execute('prj_1', 'usr_1', {
        featureSplitClusterId: 'clu_1',
        mode: 'ai',
        aiStep: 'story',
        outlines: [{ title: 'A' }],
        outlineIndex: 3,
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it('returns ExternalServiceError when draft generator fails', async () => {
      const projectRepo = makeMockProjectRepo();
      const splitRepo = makeMockSplitRepo();
      const corpusRepo = makeMockCorpusRepo();
      const generator = makeMockDraftGenerator();

      vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(makeProject()));
      vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([makeFeatureSplit()]));
      vi.mocked(generator.draftOutlines).mockResolvedValue(
        err(new ExternalServiceError('AI', 'AI returned invalid JSON for user stories'))
      );

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      const result = await uc.execute('prj_1', 'usr_1', {
        featureSplitClusterId: 'clu_1',
        mode: 'ai',
        aiStep: 'outline',
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ExternalServiceError);
      }
      expect(corpusRepo.save).not.toHaveBeenCalled();
    });

    it('returns DatabaseError when corpus save fails', async () => {
      const projectRepo = makeMockProjectRepo();
      const splitRepo = makeMockSplitRepo();
      const corpusRepo = makeMockCorpusRepo();
      const generator = makeMockDraftGenerator();

      vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(makeProject()));
      vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([makeFeatureSplit()]));
      vi.mocked(generator.draftSingleStory).mockResolvedValue(
        ok({ title: 'Story', body: 'Body', sortOrder: 0 })
      );
      vi.mocked(corpusRepo.save).mockResolvedValue(
        err(new DatabaseError('Failed to save user story corpus'))
      );

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      const result = await uc.execute('prj_1', 'usr_1', {
        featureSplitClusterId: 'clu_1',
        mode: 'ai',
        aiStep: 'story',
        outlines: [{ title: 'A' }],
        outlineIndex: 0,
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(DatabaseError);
      }
    });
  });

  describe('authorization and cluster lookup', () => {
    it('returns error when project not found', async () => {
      const projectRepo = makeMockProjectRepo();
      const splitRepo = makeMockSplitRepo();
      const corpusRepo = makeMockCorpusRepo();
      const generator = makeMockDraftGenerator();

      vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(
        err(new NotFoundError('Project not found'))
      );

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      const result = await uc.execute('prj_1', 'usr_1', {
        featureSplitClusterId: 'clu_1',
        mode: 'template',
      });

      expect(result.isErr()).toBe(true);
      expect(splitRepo.findByProjectId).not.toHaveBeenCalled();
      expect(corpusRepo.save).not.toHaveBeenCalled();
    });
  });
});
