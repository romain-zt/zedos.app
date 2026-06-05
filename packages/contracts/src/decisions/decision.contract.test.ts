import { describe, expect, it } from 'vitest';
import {
  BackfillDecisionsResponseSchema,
  DecisionDTOSchema,
  DecisionDraftSchema,
  DecisionLinkDTOSchema,
} from './decision';

describe('Decision contracts', () => {
  it('accepts valid DecisionDTO', () => {
    const parsed = DecisionDTOSchema.safeParse({
      id: 'd1',
      projectId: 'p1',
      prdVersionId: null,
      questionHistoryId: 'qh1',
      structuredQuestion: 'Who is the user?',
      chosenOption: 'B2B founders',
      rejectedOptions: ['Consumers'],
      ownerComment: null,
      aiInterpretation: 'Focus B2B',
      sectionIds: ['Target Users'],
      createdAt: new Date().toISOString(),
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects malformed rejectedOptions on DecisionDTO', () => {
    const parsed = DecisionDTOSchema.safeParse({
      id: 'd1',
      projectId: 'p1',
      prdVersionId: null,
      questionHistoryId: 'qh1',
      structuredQuestion: 'Q',
      chosenOption: null,
      rejectedOptions: 'not-array',
      ownerComment: null,
      aiInterpretation: null,
      sectionIds: [],
      createdAt: new Date().toISOString(),
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts valid DecisionLinkDTO', () => {
    const parsed = DecisionLinkDTOSchema.safeParse({
      id: 'l1',
      decisionId: 'd1',
      sectionId: 'Product Vision',
      anchor: null,
      createdAt: new Date().toISOString(),
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts DecisionDraft with null section', () => {
    const parsed = DecisionDraftSchema.safeParse({
      projectId: 'p1',
      prdVersionId: null,
      questionHistoryId: 'qh1',
      structuredQuestion: 'Q',
      chosenOption: 'A',
      rejectedOptions: [],
      ownerComment: null,
      aiInterpretation: null,
      sectionId: null,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects negative backfill counts', () => {
    const parsed = BackfillDecisionsResponseSchema.safeParse({
      scanned: 1,
      inserted: -1,
      skipped: 0,
    });
    expect(parsed.success).toBe(false);
  });
});
