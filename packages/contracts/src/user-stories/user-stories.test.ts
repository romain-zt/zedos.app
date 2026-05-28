import { describe, expect, it } from 'vitest';
import {
  GetUserStoryCorpusQuerySchema,
  MarkUserStoriesReviewReadyRequestSchema,
  SaveUserStoryCorpusRequestSchema,
  UserStoryCorpusSchema,
  UserStoryLineSchema,
} from './corpus';
import {
  GenerateUserStoriesRequestSchema,
  GenerateUserStoriesResponseSchema,
  UserStoryAiDraftListSchema,
  UserStoryAiOutlineListSchema,
  UserStoryAiSingleDraftSchema,
} from './generate';

describe('user-stories contracts', () => {
  it('parses UserStoryLineSchema', () => {
    const line = {
      id: 'line-1',
      sortOrder: 0,
      title: 'As a user',
      body: 'I want behavior',
      archivedAt: null,
      draftMarker: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(UserStoryLineSchema.safeParse(line).success).toBe(true);
  });

  it('parses UserStoryCorpusSchema', () => {
    const now = new Date().toISOString();
    const corpus = {
      id: 'c1',
      projectId: 'p1',
      featureSplitClusterId: 'cl1',
      reviewReadyAt: null,
      createdAt: now,
      updatedAt: now,
      lines: [
        {
          id: 'line-1',
          sortOrder: 0,
          title: 'T',
          body: 'B',
          archivedAt: null,
          draftMarker: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
    };
    expect(UserStoryCorpusSchema.safeParse(corpus).success).toBe(true);
  });

  it('rejects SaveUserStoryCorpusRequest without lines', () => {
    const bad = { featureSplitClusterId: 'x', lines: [] };
    expect(SaveUserStoryCorpusRequestSchema.safeParse(bad).success).toBe(false);
  });

  it('parses SaveUserStoryCorpusRequest with new line (no id)', () => {
    const ok = {
      featureSplitClusterId: 'cl1',
      lines: [{ sortOrder: 0, title: 'T', body: 'B' }],
    };
    expect(SaveUserStoryCorpusRequestSchema.safeParse(ok).success).toBe(true);
  });

  it('parses GenerateUserStoriesRequest', () => {
    expect(
      GenerateUserStoriesRequestSchema.safeParse({
        featureSplitClusterId: 'cl1',
        mode: 'template',
      }).success
    ).toBe(true);
  });

  it('parses UserStoryAiDraftListSchema', () => {
    expect(
      UserStoryAiDraftListSchema.safeParse({
        stories: [{ title: 'A', body: 'B' }],
      }).success
    ).toBe(true);
  });

  it('parses outline and single-story AI schemas', () => {
    expect(
      UserStoryAiOutlineListSchema.safeParse({
        outlines: [{ title: 'Sign in with email' }],
      }).success
    ).toBe(true);
    expect(
      UserStoryAiSingleDraftSchema.safeParse({
        story: { title: 'Sign in', body: '### User-visible outcome\n…' },
      }).success
    ).toBe(true);
  });

  it('parses GenerateUserStoriesResponseSchema variants', () => {
    const now = new Date().toISOString();
    const corpus = {
      id: 'c1',
      projectId: 'p1',
      featureSplitClusterId: 'cl1',
      reviewReadyAt: null,
      createdAt: now,
      updatedAt: now,
      lines: [
        {
          id: 'l1',
          sortOrder: 0,
          title: 't',
          body: 'b',
          archivedAt: null,
          draftMarker: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
    };
    expect(
      GenerateUserStoriesResponseSchema.safeParse({ kind: 'corpus', corpus }).success
    ).toBe(true);
    expect(
      GenerateUserStoriesResponseSchema.safeParse({
        kind: 'outline',
        outlines: [{ title: 'Pay' }],
        total: 1,
      }).success
    ).toBe(true);
    expect(
      GenerateUserStoriesResponseSchema.safeParse({
        kind: 'story',
        corpus,
        progress: { current: 1, total: 2, done: false },
      }).success
    ).toBe(true);
  });

  it('parses query + mark-ready bodies', () => {
    expect(
      GetUserStoryCorpusQuerySchema.safeParse({ featureSplitClusterId: 'x' }).success
    ).toBe(true);
    expect(
      MarkUserStoriesReviewReadyRequestSchema.safeParse({ featureSplitClusterId: 'x' }).success
    ).toBe(true);
  });
});
