import { describe, expect, it, vi } from 'vitest';
import type {
  MilestoneFeedbackRowDTO,
  MilestoneFeedbackSubmitRequest,
} from '@repo/contracts/feedback/submit';
import { CaptureMilestoneFeedbackUseCase } from './capture-milestone-feedback-usecase';

function makeRequest(): MilestoneFeedbackSubmitRequest {
  return {
    projectId: 'project-1',
    prdVersionId: 'prd-1',
    milestoneType: 'prd_created',
    ratingType: 'stars',
    ratingValue: 4,
    comment: 'Nice flow',
  };
}

function makeRow(): MilestoneFeedbackRowDTO {
  return {
    id: 'fb-1',
    userId: 'user-1',
    projectId: 'project-1',
    prdVersionId: 'prd-1',
    milestoneType: 'prd_created',
    ratingType: 'stars',
    ratingValue: 4,
    comment: 'Nice flow',
    createdAt: new Date().toISOString(),
  };
}

describe('CaptureMilestoneFeedbackUseCase', () => {
  it('returns forbidden when project is not owned', async () => {
    const repository = {
      isProjectOwnedByUser: vi.fn(async () => false),
      findDuplicate: vi.fn(async () => false),
      createFeedback: vi.fn(async () => makeRow()),
    };
    const useCase = new CaptureMilestoneFeedbackUseCase(repository);

    const result = await useCase.execute({
      userId: 'user-1',
      request: makeRequest(),
    });

    expect(result.isErr()).toBe(true);
    expect(repository.findDuplicate).not.toHaveBeenCalled();
    expect(repository.createFeedback).not.toHaveBeenCalled();
  });

  it('returns duplicate without persisting when feedback exists', async () => {
    const repository = {
      isProjectOwnedByUser: vi.fn(async () => true),
      findDuplicate: vi.fn(async () => true),
      createFeedback: vi.fn(async () => makeRow()),
    };
    const useCase = new CaptureMilestoneFeedbackUseCase(repository);

    const result = await useCase.execute({
      userId: 'user-1',
      request: makeRequest(),
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.kind).toBe('duplicate');
    }
    expect(repository.createFeedback).not.toHaveBeenCalled();
  });

  it('creates attributed feedback when owner and non-duplicate', async () => {
    const repository = {
      isProjectOwnedByUser: vi.fn(async () => true),
      findDuplicate: vi.fn(async () => false),
      createFeedback: vi.fn(async () => makeRow()),
    };
    const useCase = new CaptureMilestoneFeedbackUseCase(repository);

    const result = await useCase.execute({
      userId: 'user-1',
      request: makeRequest(),
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.kind).toBe('created');
      if (result.value.kind === 'created') {
        expect(result.value.row.projectId).toBe('project-1');
        expect(result.value.row.prdVersionId).toBe('prd-1');
        expect(result.value.row.milestoneType).toBe('prd_created');
      }
    }
    expect(repository.createFeedback).toHaveBeenCalledTimes(1);
  });
});
