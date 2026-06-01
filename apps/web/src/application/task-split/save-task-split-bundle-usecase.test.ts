import { describe, expect, it, vi } from 'vitest';
import { ok, err } from '@repo/result';
import { SaveTaskSplitBundleUseCase } from './save-task-split-bundle-usecase';
import { ForbiddenError, NotFoundError } from '@shared/errors/application-error';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { ITaskSplitBundleRepository } from '@domain/task-split/task-split-bundle-repository';

function makeProjectRepo(): IProjectRepository {
  return {
    findByIdAndUserId: vi.fn().mockResolvedValue(ok({ id: 'p1', name: 'P', userId: 'u1' })),
  } as unknown as IProjectRepository;
}

describe('SaveTaskSplitBundleUseCase', () => {
  it('rejects when story line is not eligible', async () => {
    const bundleRepo: ITaskSplitBundleRepository = {
      findEligibleStoryLine: vi.fn().mockResolvedValue(ok(null)),
      findByProjectAndStoryLine: vi.fn(),
      save: vi.fn(),
      lock: vi.fn(),
    };

    const uc = new SaveTaskSplitBundleUseCase(makeProjectRepo(), bundleRepo);
    const result = await uc.execute('p1', 'u1', 'line-1', [
      { sortOrder: 0, title: 'T', promptBody: 'P', manual: false },
    ]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toBeInstanceOf(NotFoundError);
  });

  it('persists tasks when story line is eligible', async () => {
    const bundle = {
      id: 'b1',
      projectId: 'p1',
      userStoryLineId: 'line-1',
      storyTitle: 'Story',
      storyBody: 'Body',
      lockedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [],
    };

    const bundleRepo: ITaskSplitBundleRepository = {
      findEligibleStoryLine: vi.fn().mockResolvedValue(
        ok({ lineId: 'line-1', title: 'Story', body: 'Body' })
      ),
      findByProjectAndStoryLine: vi.fn(),
      save: vi.fn().mockResolvedValue(ok(bundle)),
      lock: vi.fn(),
    };

    const uc = new SaveTaskSplitBundleUseCase(makeProjectRepo(), bundleRepo);
    const result = await uc.execute('p1', 'u1', 'line-1', [
      { sortOrder: 0, title: 'T', promptBody: 'P', manual: true },
    ]);

    expect(result.isOk()).toBe(true);
    expect(bundleRepo.save).toHaveBeenCalledWith('p1', 'line-1', 'Story', 'Body', [
      { sortOrder: 0, title: 'T', promptBody: 'P', manual: true },
    ]);
  });

  it('surfaces forbidden when repository rejects locked bundle', async () => {
    const bundleRepo: ITaskSplitBundleRepository = {
      findEligibleStoryLine: vi.fn().mockResolvedValue(
        ok({ lineId: 'line-1', title: 'Story', body: 'Body' })
      ),
      findByProjectAndStoryLine: vi.fn(),
      save: vi.fn().mockResolvedValue(err(new ForbiddenError('Bundle is locked'))),
      lock: vi.fn(),
    };

    const uc = new SaveTaskSplitBundleUseCase(makeProjectRepo(), bundleRepo);
    const result = await uc.execute('p1', 'u1', 'line-1', [
      { sortOrder: 0, title: 'T', promptBody: 'P', manual: false },
    ]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toBeInstanceOf(ForbiddenError);
  });
});
