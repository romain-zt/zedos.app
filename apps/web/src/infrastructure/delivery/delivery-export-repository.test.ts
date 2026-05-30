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

function sqlText(query: unknown): string {
  if (!query || typeof query !== 'object') return '';
  const chunks = (query as { queryChunks?: unknown[] }).queryChunks;
  if (!Array.isArray(chunks)) return String(query);
  return chunks.map((chunk) => (typeof chunk === 'string' ? chunk : '')).join('');
}

describe('DrizzleDeliveryExportRepository', () => {
  beforeEach(() => {
    mocks.execute.mockReset();
  });

  it('queries task_split schema columns when listing eligible bundles', async () => {
    mocks.execute.mockResolvedValue([
      {
        id: 'bundle-1',
        project_id: 'proj-1',
        story_title_snapshot: 'Checkout flow',
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
    expect(bundles[0]?.storyBody).toBe('');
    expect(bundles[0]?.taskCount).toBe(2);

    const query = sqlText(mocks.execute.mock.calls[0]?.[0]);
    expect(query).toContain('story_title_snapshot');
    expect(query).not.toContain('story_title');
    expect(query).not.toContain('story_body');
    expect(query).not.toContain('deleted_at');
  });

  it('loads tasks without deleted_at filter when fetching bundles by id', async () => {
    mocks.execute
      .mockResolvedValueOnce([
        {
          id: 'bundle-1',
          project_id: 'proj-1',
          story_title_snapshot: 'Checkout flow',
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

    const bundleQuery = sqlText(mocks.execute.mock.calls[0]?.[0]);
    const taskQuery = sqlText(mocks.execute.mock.calls[1]?.[0]);
    expect(bundleQuery).toContain('story_title_snapshot');
    expect(bundleQuery).not.toContain('deleted_at');
    expect(taskQuery).not.toContain('deleted_at');
  });
});
