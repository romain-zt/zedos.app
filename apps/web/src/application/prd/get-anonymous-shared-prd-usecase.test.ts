import { describe, expect, it, vi } from 'vitest';
import { ok, err } from '@repo/result';
import type { IPrdRepository } from '@domain/prd/prd-repository';
import { NotFoundError } from '@shared/errors/application-error';
import { GetAnonymousSharedPrdUseCase } from './get-anonymous-shared-prd-usecase';

describe('GetAnonymousSharedPrdUseCase', () => {
  it('delegates repository success', async () => {
    const snapshot = {
      versionNumber: 1,
      content: null,
      status: 'draft' as const,
      createdAt: new Date(),
    };
    const repo: IPrdRepository = {
      findByProjectId: vi.fn(),
      findLatestByProjectId: vi.fn(),
      ensureFirstVersion: vi.fn(),
      mintReadOnlyShareLink: vi.fn(),
      getAnonymousPrdVersionByShareToken: vi.fn().mockResolvedValue(ok(snapshot)),
    };
    const uc = new GetAnonymousSharedPrdUseCase(repo);
    const result = await uc.execute('tok');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.unwrap().versionNumber).toBe(1);
    expect(repo.getAnonymousPrdVersionByShareToken).toHaveBeenCalledWith('tok');
  });

  it('delegates repository not-found', async () => {
    const repo: IPrdRepository = {
      findByProjectId: vi.fn(),
      findLatestByProjectId: vi.fn(),
      ensureFirstVersion: vi.fn(),
      mintReadOnlyShareLink: vi.fn(),
      getAnonymousPrdVersionByShareToken: vi.fn().mockResolvedValue(err(new NotFoundError('gone'))),
    };
    const uc = new GetAnonymousSharedPrdUseCase(repo);
    const result = await uc.execute('x');
    expect(result.isErr()).toBe(true);
  });
});
