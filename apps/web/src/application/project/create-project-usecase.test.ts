import { describe, it, expect, vi, type Mocked } from 'vitest';
import { CreateProjectUseCase } from './create-project-usecase';
import { ok, err } from '@repo/result';
import { DatabaseError } from '@shared/errors/application-error';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IPrdRepository } from '@domain/prd/prd-repository';

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
});

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
});
