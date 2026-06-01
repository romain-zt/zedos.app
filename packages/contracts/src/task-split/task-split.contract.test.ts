import { describe, expect, it } from 'vitest';
import {
  GenerateTaskSplitDraftResponseSchema,
  GenerateTaskSplitRequestSchema,
  TaskSplitAiDraftListSchema,
} from './generate';
import {
  GetTaskSplitBundleQuerySchema,
  LockTaskSplitBundleRequestSchema,
  SaveTaskSplitBundleRequestSchema,
  TaskSplitBundleSchema,
  TaskSplitTaskSchema,
} from './bundle';

describe('task-split contracts', () => {
  it('parses TaskSplitTaskSchema', () => {
    const task = {
      id: 't1',
      sortOrder: 0,
      title: 'Implement API',
      promptBody: 'Add route handler with zod validation.',
      manual: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(TaskSplitTaskSchema.safeParse(task).success).toBe(true);
  });

  it('parses TaskSplitBundleSchema', () => {
    const now = new Date().toISOString();
    const bundle = {
      id: 'b1',
      projectId: 'p1',
      userStoryLineId: 'line-1',
      storyTitle: 'Checkout',
      storyBody: 'User pays',
      lockedAt: null,
      createdAt: now,
      updatedAt: now,
      tasks: [
        {
          id: 't1',
          sortOrder: 0,
          title: 'Task',
          promptBody: 'Do work',
          manual: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
    };
    expect(TaskSplitBundleSchema.safeParse(bundle).success).toBe(true);
  });

  it('rejects SaveTaskSplitBundleRequestSchema with empty tasks', () => {
    const parsed = SaveTaskSplitBundleRequestSchema.safeParse({
      userStoryLineId: 'line-1',
      tasks: [],
    });
    expect(parsed.success).toBe(false);
  });

  it('parses generate request and AI draft list', () => {
    expect(
      GenerateTaskSplitRequestSchema.safeParse({
        userStoryLineId: 'line-1',
        mode: 'ai',
      }).success
    ).toBe(true);

    expect(
      TaskSplitAiDraftListSchema.safeParse({
        tasks: [{ title: 'A', promptBody: 'Prompt A' }],
      }).success
    ).toBe(true);
  });

  it('parses query and lock payloads', () => {
    expect(GetTaskSplitBundleQuerySchema.safeParse({ userStoryLineId: 'l1' }).success).toBe(true);
    expect(LockTaskSplitBundleRequestSchema.safeParse({ bundleId: 'b1' }).success).toBe(true);
  });

  it('rejects invalid GenerateTaskSplitDraftResponseSchema', () => {
    const parsed = GenerateTaskSplitDraftResponseSchema.safeParse({
      userStoryLineId: 'l1',
      storyTitle: '',
      storyBody: 'x',
      tasks: [],
    });
    expect(parsed.success).toBe(false);
  });
});
