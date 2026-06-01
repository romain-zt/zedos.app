import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
}));

vi.mock('@repo/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/db')>();
  return {
    ...actual,
    db: {
      execute: mocks.execute,
    },
  };
});

import { DrizzleDeliveryExportRepository } from './delivery-export-repository';

const repositorySource = readFileSync(
  new URL('./delivery-export-repository.ts', import.meta.url),
  'utf8'
);

describe('DrizzleDeliveryExportRepository', () => {
  beforeEach(() => {
    mocks.execute.mockReset();
  });

  it('uses actual task_split column names in SQL', () => {
    expect(repositorySource).toContain('story_title');
    expect(repositorySource).toContain('story_body');
    expect(repositorySource).toContain('deleted_at');
    expect(repositorySource).toContain('task_split_bundles');
    expect(repositorySource).toContain('task_split_tasks');
  });

  it('maps story_title and story_body rows when listing eligible bundles', async () => {
    mocks.execute.mockResolvedValue([
      {
        id: 'bundle-1',
        project_id: 'proj-1',
        story_title: 'Checkout flow',
        story_body: 'User completes purchase',
        locked_at: new Date('2026-05-01'),
        task_count: 2,
      },
    ]);

    const repo = new DrizzleDeliveryExportRepository();
    const result = await repo.listLockedBundlesByProject('proj-1');

    expect(result.isOk()).toBe(true);
    const bundles = result.unwrap();
    expect(bundles).toHaveLength(1);
    expect(bundles[0]?.storyTitle).toBe('Checkout flow');
    expect(bundles[0]?.storyBody).toBe('User completes purchase');
    expect(bundles[0]?.taskCount).toBe(2);
  });

  it('loads tasks when fetching bundles by id', async () => {
    mocks.execute
      .mockResolvedValueOnce([
        {
          id: 'bundle-1',
          project_id: 'proj-1',
          story_title: 'Checkout flow',
          story_body: 'User completes purchase',
          locked_at: new Date('2026-05-01'),
          task_count: 1,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'task-1',
          bundle_id: 'bundle-1',
          sort_order: 0,
          title: 'Add route',
          prompt_body: 'Implement the route.',
        },
      ]);

    const repo = new DrizzleDeliveryExportRepository();
    const result = await repo.findLockedBundlesByIds('proj-1', ['bundle-1']);

    expect(result.isOk()).toBe(true);
    const bundles = result.unwrap();
    expect(bundles[0]?.tasks).toHaveLength(1);
    expect(bundles[0]?.tasks[0]?.title).toBe('Add route');
  });
});
