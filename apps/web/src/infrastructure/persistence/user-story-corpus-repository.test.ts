import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  corpusInsert: null as Record<string, unknown> | null,
  linesInsert: null as unknown,
  corporaFromCalls: 0,
}));

vi.mock('@repo/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/db')>();
  const fixedDate = new Date('2026-05-15T12:00:00.000Z');

  const mockTx = {
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
    execute: vi.fn(() => Promise.resolve()),
    insert: vi.fn(() => ({
      values: (v: unknown) => {
        if (!mocks.corpusInsert) {
          mocks.corpusInsert = v as Record<string, unknown>;
          return {
            returning: vi.fn(() => Promise.resolve([{ id: 'new-corpus-id' }])),
          };
        }
        mocks.linesInsert = v;
        return Promise.resolve();
      },
    })),
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => {
        if (table === actual.userStoryCorpora) {
          mocks.corporaFromCalls++;
          return {
            where: vi.fn(() => {
              if (mocks.corporaFromCalls === 1) {
                return Promise.resolve([]);
              }
              return Promise.resolve([
                {
                  id: 'new-corpus-id',
                  projectId: 'proj_a',
                  featureSplitClusterId: 'cluster_a',
                  reviewReadyAt: null,
                  createdAt: fixedDate,
                  updatedAt: fixedDate,
                },
              ]);
            }),
          };
        }
        if (table === actual.userStoryLines) {
          return {
            where: vi.fn(() => ({
              orderBy: vi.fn(() => Promise.resolve([])),
            })),
          };
        }
        throw new Error('Unexpected table in mock');
      }),
    })),
  };

  return {
    ...actual,
    db: {
      ...actual.db,
      transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    },
  };
});

import { DrizzleUserStoryCorpusRepository } from './user-story-corpus-repository';

describe('DrizzleUserStoryCorpusRepository.save', () => {
  beforeEach(() => {
    mocks.corpusInsert = null;
    mocks.linesInsert = null;
    mocks.corporaFromCalls = 0;
    vi.clearAllMocks();
  });

  it('includes updatedAt on new corpus insert', async () => {
    const repo = new DrizzleUserStoryCorpusRepository();
    const result = await repo.save('proj_a', 'cluster_a', []);

    expect(result.isOk()).toBe(true);
    expect(mocks.corpusInsert).not.toBeNull();
    expect(mocks.corpusInsert?.updatedAt).toBeInstanceOf(Date);
    expect(mocks.linesInsert).toBeNull();
  });

  it('includes updatedAt on each new line insert', async () => {
    const repo = new DrizzleUserStoryCorpusRepository();
    const result = await repo.save('proj_a', 'cluster_a', [
      {
        title: 'T',
        body: 'B',
        sortOrder: 0,
        archivedAt: null,
        draftMarker: null,
      },
    ]);

    expect(result.isOk()).toBe(true);
    expect(mocks.linesInsert).not.toBeNull();
    const rows = mocks.linesInsert as Record<string, unknown>[];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.updatedAt).toBeInstanceOf(Date);
  });
});
