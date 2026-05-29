import { describe, it, expect, vi } from 'vitest';
import { ok, err } from '@repo/result';
import { SaveTaskSplitBundleUseCase } from './save-task-split-bundle-usecase';
import { NotFoundError, ValidationError } from '@shared/errors/application-error';

const mockProject = { id: 'proj-1', userId: 'user-1', name: 'Test' };

const mockProjectRepo = {
  findByIdAndUserId: vi.fn().mockResolvedValue(ok(mockProject)),
  findById: vi.fn(),
  findByUserId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

const mockBundle = {
  id: 'bundle-1',
  projectId: 'proj-1',
  sourceUserStoryKey: null,
  storyTitleSnapshot: null,
  lockedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  tasks: [],
};

const mockBundleRepo = {
  findByProject: vi.fn().mockResolvedValue(ok(null)),
  save: vi.fn().mockResolvedValue(ok(mockBundle)),
  lock: vi.fn(),
};

describe('SaveTaskSplitBundleUseCase', () => {
  it('returns error when project not found', async () => {
    mockProjectRepo.findByIdAndUserId.mockResolvedValueOnce(
      err(new NotFoundError('Not found'))
    );
    const uc = new SaveTaskSplitBundleUseCase(mockProjectRepo as never, mockBundleRepo as never);
    const result = await uc.execute('proj-1', 'user-1', { tasks: [{ sortOrder: 0, title: 'T', promptBody: 'P', manual: false }] });
    expect(result.isErr()).toBe(true);
  });

  it('returns error when tasks array is empty', async () => {
    const uc = new SaveTaskSplitBundleUseCase(mockProjectRepo as never, mockBundleRepo as never);
    const result = await uc.execute('proj-1', 'user-1', { tasks: [] });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationError);
    }
  });

  it('saves and returns bundle on valid input', async () => {
    const uc = new SaveTaskSplitBundleUseCase(mockProjectRepo as never, mockBundleRepo as never);
    const result = await uc.execute('proj-1', 'user-1', {
      tasks: [{ sortOrder: 0, title: 'Implement auth', promptBody: 'Use better-auth...', manual: false }],
    });
    expect(result.isOk()).toBe(true);
  });
});
