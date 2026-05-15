import { describe, it, expect, vi } from 'vitest';
import { GenerateUserStoryDraftUseCase } from './generate-user-story-draft-usecase';
import { ok, err } from '@repo/result';
import { NotFoundError, ExternalServiceError, DatabaseError } from '@shared/errors/application-error';
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
  draftFromCluster: vi.fn(),
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
      const result = await uc.execute('prj_1', 'usr_1', 'clu_1', 'template');

      expect(result.isOk()).toBe(true);
      expect(corpusRepo.save).toHaveBeenCalledWith(
        'prj_1',
        'clu_1',
        [{ sortOrder: 0, title: 'Payments', body: expectedBody }]
      );
    });

    it('uses refinement placeholders when valueLine and boundaryCue are empty', async () => {
      const projectRepo = makeMockProjectRepo();
      const splitRepo = makeMockSplitRepo();
      const corpusRepo = makeMockCorpusRepo();
      const generator = makeMockDraftGenerator();
      const cluster = makeCluster({ label: 'User Auth', valueLine: '', boundaryCue: '' });

      const expectedBody =
        '## Goal\n' +
        'Turn this cluster into concrete, user-visible behaviors. Each capability below must be **distinct** — do not ship the cluster fields alone as the story.\n' +
        '\n## Cluster reference (expand; do not use as sole story text)\n' +
        '- Label: User Auth\n' +
        '- Value line: _add during refinement_\n' +
        '- Boundary cue: _add during refinement_' +
        templateScaffoldSuffix;

      vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(makeProject()));
      vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([makeFeatureSplit(cluster)]));
      vi.mocked(corpusRepo.save).mockResolvedValue(ok(makeCorpus([makeLine({ title: 'User Auth', body: expectedBody })])));

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      const result = await uc.execute('prj_1', 'usr_1', 'clu_1', 'template');

      expect(result.isOk()).toBe(true);
      expect(corpusRepo.save).toHaveBeenCalledWith(
        'prj_1',
        'clu_1',
        [{ sortOrder: 0, title: 'User Auth', body: expectedBody }]
      );
    });

    it('uses "Feature story" fallback when label is also empty', async () => {
      const projectRepo = makeMockProjectRepo();
      const splitRepo = makeMockSplitRepo();
      const corpusRepo = makeMockCorpusRepo();
      const generator = makeMockDraftGenerator();
      const cluster = makeCluster({ label: '', valueLine: '', boundaryCue: '' });

      const expectedBody =
        '## Goal\n' +
        'Turn this cluster into concrete, user-visible behaviors. Each capability below must be **distinct** — do not ship the cluster fields alone as the story.\n' +
        '\n## Cluster reference (expand; do not use as sole story text)\n' +
        '- Label: Feature story\n' +
        '- Value line: _add during refinement_\n' +
        '- Boundary cue: _add during refinement_' +
        templateScaffoldSuffix;

      vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(makeProject()));
      vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([makeFeatureSplit(cluster)]));
      vi.mocked(corpusRepo.save).mockResolvedValue(ok(makeCorpus([
        makeLine({ title: 'Feature story', body: expectedBody }),
      ])));

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      const result = await uc.execute('prj_1', 'usr_1', 'clu_1', 'template');

      expect(result.isOk()).toBe(true);
      const savedLines = vi.mocked(corpusRepo.save).mock.calls[0][2];
      expect(savedLines[0].title).toBe('Feature story');
      expect(savedLines[0].body).toBe(expectedBody);
      expect(savedLines[0].title.length).toBeGreaterThan(0);
      expect(savedLines[0].body.length).toBeGreaterThan(0);
    });

    it('strips whitespace-only valueLine and boundaryCue', async () => {
      const projectRepo = makeMockProjectRepo();
      const splitRepo = makeMockSplitRepo();
      const corpusRepo = makeMockCorpusRepo();
      const generator = makeMockDraftGenerator();
      const cluster = makeCluster({ label: 'Search', valueLine: '   ', boundaryCue: '  ' });

      const expectedBody =
        '## Goal\n' +
        'Turn this cluster into concrete, user-visible behaviors. Each capability below must be **distinct** — do not ship the cluster fields alone as the story.\n' +
        '\n## Cluster reference (expand; do not use as sole story text)\n' +
        '- Label: Search\n' +
        '- Value line: _add during refinement_\n' +
        '- Boundary cue: _add during refinement_' +
        templateScaffoldSuffix;

      vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(makeProject()));
      vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([makeFeatureSplit(cluster)]));
      vi.mocked(corpusRepo.save).mockResolvedValue(ok(makeCorpus([makeLine({ title: 'Search', body: expectedBody })])));

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      await uc.execute('prj_1', 'usr_1', 'clu_1', 'template');

      const savedLines = vi.mocked(corpusRepo.save).mock.calls[0][2];
      expect(savedLines[0].body).toBe(expectedBody);
    });
  });

  describe('ai mode', () => {
    it('calls draftGenerator and saves AI-generated stories', async () => {
      const projectRepo = makeMockProjectRepo();
      const splitRepo = makeMockSplitRepo();
      const corpusRepo = makeMockCorpusRepo();
      const generator = makeMockDraftGenerator();

      vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(makeProject()));
      vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([makeFeatureSplit()]));
      vi.mocked(generator.draftFromCluster).mockResolvedValue(ok({
        stories: [
          { title: 'Story A', body: 'Given A When A Then A', sortOrder: 0 },
          { title: 'Story B', body: 'Given B When B Then B', sortOrder: 1 },
        ],
      }));
      vi.mocked(corpusRepo.save).mockResolvedValue(ok(makeCorpus([
        makeLine({ id: 'l1', title: 'Story A', body: 'Given A When A Then A', sortOrder: 0 }),
        makeLine({ id: 'l2', title: 'Story B', body: 'Given B When B Then B', sortOrder: 1 }),
      ])));

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      const result = await uc.execute('prj_1', 'usr_1', 'clu_1', 'ai');

      expect(result.isOk()).toBe(true);
      expect(generator.draftFromCluster).toHaveBeenCalledWith({
        label: 'Payments',
        valueLine: 'Collect money from users',
        boundaryCue: 'No refund logic',
      });
      expect(corpusRepo.save).toHaveBeenCalledWith(
        'prj_1',
        'clu_1',
        [
          { sortOrder: 0, title: 'Story A', body: 'Given A When A Then A' },
          { sortOrder: 1, title: 'Story B', body: 'Given B When B Then B' },
        ]
      );
    });

    it('returns ExternalServiceError when draft generator fails', async () => {
      const projectRepo = makeMockProjectRepo();
      const splitRepo = makeMockSplitRepo();
      const corpusRepo = makeMockCorpusRepo();
      const generator = makeMockDraftGenerator();

      vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(makeProject()));
      vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([makeFeatureSplit()]));
      vi.mocked(generator.draftFromCluster).mockResolvedValue(
        err(new ExternalServiceError('AI', 'AI returned invalid JSON for user stories'))
      );

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      const result = await uc.execute('prj_1', 'usr_1', 'clu_1', 'ai');

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
      vi.mocked(generator.draftFromCluster).mockResolvedValue(ok({
        stories: [{ title: 'Story', body: 'Body', sortOrder: 0 }],
      }));
      vi.mocked(corpusRepo.save).mockResolvedValue(
        err(new DatabaseError('Failed to save user story corpus'))
      );

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      const result = await uc.execute('prj_1', 'usr_1', 'clu_1', 'ai');

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
      const result = await uc.execute('prj_1', 'usr_1', 'clu_1', 'template');

      expect(result.isErr()).toBe(true);
      expect(splitRepo.findByProjectId).not.toHaveBeenCalled();
      expect(corpusRepo.save).not.toHaveBeenCalled();
    });

    it('returns NotFoundError when cluster is not confirmed', async () => {
      const projectRepo = makeMockProjectRepo();
      const splitRepo = makeMockSplitRepo();
      const corpusRepo = makeMockCorpusRepo();
      const generator = makeMockDraftGenerator();
      const draftSplit: FeatureSplitDomain = {
        ...makeFeatureSplit(),
        status: 'draft',
      };

      vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(makeProject()));
      vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([draftSplit]));

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      const result = await uc.execute('prj_1', 'usr_1', 'clu_1', 'template');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
      expect(corpusRepo.save).not.toHaveBeenCalled();
    });

    it('returns NotFoundError when cluster id does not exist', async () => {
      const projectRepo = makeMockProjectRepo();
      const splitRepo = makeMockSplitRepo();
      const corpusRepo = makeMockCorpusRepo();
      const generator = makeMockDraftGenerator();

      vi.mocked(projectRepo.findByIdAndUserId).mockResolvedValue(ok(makeProject()));
      vi.mocked(splitRepo.findByProjectId).mockResolvedValue(ok([makeFeatureSplit()]));

      const uc = new GenerateUserStoryDraftUseCase(projectRepo, splitRepo, corpusRepo, generator);
      const result = await uc.execute('prj_1', 'usr_1', 'WRONG_CLUSTER_ID', 'template');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });
  });
});
