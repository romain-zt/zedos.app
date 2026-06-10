import { describe, it, expect, vi, type Mocked } from 'vitest';
import { CreateProjectUseCase } from './create-project-usecase';
import { ok, err } from '@repo/result';
import { DatabaseError, NotFoundError } from '@shared/errors/application-error';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IPrdRepository } from '@domain/prd/prd-repository';
import type { ITemplateCatalogPort } from '@domain/templates/template-catalog-port';
import type { TemplateDetail } from '@domain/templates/template';

const makeMockRepo = (): Mocked<IProjectRepository> => ({
  findById: vi.fn(),
  findByIdAndUserId: vi.fn(),
  findAllByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const makeMockPrdRepo = (): Mocked<IPrdRepository> => ({
  findByProjectId: vi.fn(),
  findLatestByProjectId: vi.fn(),
  ensureFirstVersion: vi.fn(),
  mintReadOnlyShareLink: vi.fn(),
  revokeReadOnlyShareLink: vi.fn(),
  getAnonymousPrdVersionByShareToken: vi.fn(),
  getShareLinkGateByToken: vi.fn(),
  verifyShareLinkPassword: vi.fn(),
  findVersionByIdForOwner: vi.fn(),
  insertNextVersion: vi.fn(),
});

const makeMockCatalog = (): Mocked<ITemplateCatalogPort> => ({
  listAll: vi.fn(),
  getBySlug: vi.fn(),
});

const TEMPLATE_FIXTURE: TemplateDetail = {
  slug: 'pitch-tomorrow',
  title: 'Pitch tomorrow',
  description: 'Express pitch template',
  category: 'playbook',
  journeyHint: 'express',
  sector: 'Generic',
  author: 'zedos-official',
  forkCount: 0,
  sectionsOutline: [{ id: 'vision', title: 'Vision' }],
  clarifyHints: ['What problem do you solve?'],
  content: {
    title: 'Pitch tomorrow — express',
    version_summary: 'Lean pitch deck.',
    sections: [
      {
        id: 'vision',
        title: 'Vision',
        content: 'Problem + insight.',
        confidence: 'medium',
        open_questions: [],
      },
    ],
  },
};

describe('CreateProjectUseCase', () => {
  it('creates a project successfully', async () => {
    const repo = makeMockRepo();
    repo.create.mockResolvedValue(ok({
      id: 'p1',
      userId: 'u1',
      name: 'Test',
      description: null,
      phase: 'intake',
      journeyMode: 'standard',
      architectureStartedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const uc = new CreateProjectUseCase(repo);
    const result = await uc.execute({ userId: 'u1', name: 'Test', description: null });
    expect(result.isOk()).toBe(true);
    expect(repo.create).toHaveBeenCalledOnce();
  });

  it('creates a project with express journey mode', async () => {
    const repo = makeMockRepo();
    repo.create.mockResolvedValue(ok({
      id: 'p1',
      userId: 'u1',
      name: 'Express',
      description: null,
      phase: 'intake',
      journeyMode: 'express',
      architectureStartedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const uc = new CreateProjectUseCase(repo);
    const result = await uc.execute({
      userId: 'u1',
      name: 'Express',
      description: null,
      journeyMode: 'express',
    });
    expect(result.isOk()).toBe(true);
    expect(repo.create).toHaveBeenCalledOnce();
    const createdArg = repo.create.mock.calls[0]?.[0];
    expect(createdArg?.journeyMode).toBe('express');
  });

  it('returns validation error for empty name', async () => {
    const repo = makeMockRepo();
    const uc = new CreateProjectUseCase(repo);
    const result = await uc.execute({ userId: 'u1', name: '   ', description: null });
    expect(result.isErr()).toBe(true);
  });

  it('propagates repo error', async () => {
    const repo = makeMockRepo();
    repo.create.mockResolvedValue(err(new DatabaseError('fail')));

    const uc = new CreateProjectUseCase(repo);
    const result = await uc.execute({ userId: 'u1', name: 'Valid', description: null });
    expect(result.isErr()).toBe(true);
  });

  it('creates project and imported PRD version', async () => {
    const repo = makeMockRepo();
    const prdRepo = makeMockPrdRepo();
    repo.create.mockResolvedValue(
      ok({
        id: 'p1',
        userId: 'u1',
        name: 'Imported',
        description: null,
        phase: 'intake',
        journeyMode: 'standard',
        architectureStartedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    prdRepo.ensureFirstVersion.mockResolvedValue(
      ok({
        created: true,
        version: {
          id: 'v1',
          projectId: 'p1',
          versionNumber: 1,
          content: {
            title: 'Imported',
            version_summary: 'x',
            sections: [
              {
                id: 'imported_content',
                title: 'Imported content',
                content: 'Body',
                confidence: 'medium',
                open_questions: [],
              },
            ],
          },
          status: 'draft',
          deliverableKind: 'standard',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    );

    const uc = new CreateProjectUseCase(repo, prdRepo);
    const result = await uc.execute({
      userId: 'u1',
      name: 'Imported',
      description: null,
      importedPrdContent: {
        title: 'Imported',
        version_summary: 'x',
        sections: [
          {
            id: 'imported_content',
            title: 'Imported content',
            content: 'Body',
            confidence: 'medium',
            open_questions: [],
          },
        ],
      },
    });
    expect(result.isOk()).toBe(true);
    expect(prdRepo.ensureFirstVersion).toHaveBeenCalledOnce();
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('rolls back project when import persist fails', async () => {
    const repo = makeMockRepo();
    const prdRepo = makeMockPrdRepo();
    repo.create.mockResolvedValue(
      ok({
        id: 'p1',
        userId: 'u1',
        name: 'Imported',
        description: null,
        phase: 'intake',
        journeyMode: 'standard',
        architectureStartedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    prdRepo.ensureFirstVersion.mockResolvedValue(err(new DatabaseError('prd fail')));
    repo.delete.mockResolvedValue(ok(undefined));

    const uc = new CreateProjectUseCase(repo, prdRepo);
    const result = await uc.execute({
      userId: 'u1',
      name: 'Imported',
      description: null,
      importedPrdContent: {
        title: 'T',
        version_summary: 's',
        sections: [
          {
            id: 'imported_content',
            title: 'Imported content',
            content: 'B',
            confidence: 'medium',
            open_questions: [],
          },
        ],
      },
    });
    expect(result.isErr()).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith('p1');
  });

  describe('templateSlug flow', () => {
    it('creates a project from a template and forces journey mode from the template', async () => {
      const repo = makeMockRepo();
      const prdRepo = makeMockPrdRepo();
      const catalog = makeMockCatalog();

      catalog.getBySlug.mockResolvedValue(ok(TEMPLATE_FIXTURE));
      repo.create.mockResolvedValue(
        ok({
          id: 'p1',
          userId: 'u1',
          name: 'Pitch',
          description: null,
          phase: 'intake',
          journeyMode: 'express',
          architectureStartedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
      prdRepo.ensureFirstVersion.mockResolvedValue(
        ok({
          created: true,
          version: {
            id: 'v1',
            projectId: 'p1',
            versionNumber: 1,
            content: TEMPLATE_FIXTURE.content,
            status: 'draft',
            deliverableKind: 'express',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      );

      const uc = new CreateProjectUseCase(repo, prdRepo, catalog);
      // User picked "standard" but template is express → template wins.
      const result = await uc.execute({
        userId: 'u1',
        name: 'Pitch',
        description: null,
        journeyMode: 'standard',
        templateSlug: 'pitch-tomorrow',
      });

      expect(result.isOk()).toBe(true);
      expect(catalog.getBySlug).toHaveBeenCalledWith('pitch-tomorrow');
      const createdArg = repo.create.mock.calls[0]?.[0];
      expect(createdArg?.journeyMode).toBe('express');
      expect(prdRepo.ensureFirstVersion).toHaveBeenCalledWith('p1', TEMPLATE_FIXTURE.content);
      if (result.isOk()) {
        expect(result.unwrap().templateSlug).toBe('pitch-tomorrow');
      }
    });

    it('rolls back when seeding PRD from template fails', async () => {
      const repo = makeMockRepo();
      const prdRepo = makeMockPrdRepo();
      const catalog = makeMockCatalog();

      catalog.getBySlug.mockResolvedValue(ok(TEMPLATE_FIXTURE));
      repo.create.mockResolvedValue(
        ok({
          id: 'p1',
          userId: 'u1',
          name: 'Pitch',
          description: null,
          phase: 'intake',
          journeyMode: 'express',
          architectureStartedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
      prdRepo.ensureFirstVersion.mockResolvedValue(err(new DatabaseError('prd fail')));
      repo.delete.mockResolvedValue(ok(undefined));

      const uc = new CreateProjectUseCase(repo, prdRepo, catalog);
      const result = await uc.execute({
        userId: 'u1',
        name: 'Pitch',
        description: null,
        templateSlug: 'pitch-tomorrow',
      });

      expect(result.isErr()).toBe(true);
      expect(repo.delete).toHaveBeenCalledWith('p1');
    });

    it('returns NotFoundError when the slug is unknown to the catalog', async () => {
      const repo = makeMockRepo();
      const prdRepo = makeMockPrdRepo();
      const catalog = makeMockCatalog();

      catalog.getBySlug.mockResolvedValue(err(new NotFoundError('Template not found')));

      const uc = new CreateProjectUseCase(repo, prdRepo, catalog);
      const result = await uc.execute({
        userId: 'u1',
        name: 'Mystery',
        description: null,
        templateSlug: 'pitch-tomorrow',
      });

      expect(result.isErr()).toBe(true);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects when both templateSlug and importedPrdContent are provided', async () => {
      const repo = makeMockRepo();
      const prdRepo = makeMockPrdRepo();
      const catalog = makeMockCatalog();

      const uc = new CreateProjectUseCase(repo, prdRepo, catalog);
      const result = await uc.execute({
        userId: 'u1',
        name: 'Both',
        description: null,
        templateSlug: 'pitch-tomorrow',
        importedPrdContent: {
          title: 'X',
          version_summary: 's',
          sections: [
            {
              id: 'imported_content',
              title: 'Imported content',
              content: 'B',
              confidence: 'medium',
              open_questions: [],
            },
          ],
        },
      });

      expect(result.isErr()).toBe(true);
      expect(repo.create).not.toHaveBeenCalled();
      expect(catalog.getBySlug).not.toHaveBeenCalled();
    });

    it('rejects when templateSlug is set but catalog port is missing', async () => {
      const repo = makeMockRepo();
      const prdRepo = makeMockPrdRepo();

      const uc = new CreateProjectUseCase(repo, prdRepo); // no catalog injected
      const result = await uc.execute({
        userId: 'u1',
        name: 'Pitch',
        description: null,
        templateSlug: 'pitch-tomorrow',
      });

      expect(result.isErr()).toBe(true);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });
});
