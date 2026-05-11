import { describe, it, expect } from 'vitest';
import {
  ProjectClarifyRequestSchema,
  QuestionHistoryEntryDTOSchema,
  QuestionHistoryListResponseSchema,
} from './question-contracts';

describe('ProjectClarifyRequestSchema', () => {
  it('accepts empty object', () => {
    expect(ProjectClarifyRequestSchema.safeParse({}).success).toBe(true);
  });

  it('accepts clarify payload with optional fields', () => {
    const r = ProjectClarifyRequestSchema.safeParse({
      message: 'hello',
      optionalComment: 'note',
      decisionResponse: { type: 'single_choice', optionId: 'a' },
      prdVersionId: 'ver_1',
    });
    expect(r.success).toBe(true);
  });

  it('rejects optionalComment over max length', () => {
    const r = ProjectClarifyRequestSchema.safeParse({
      optionalComment: 'x'.repeat(8001),
    });
    expect(r.success).toBe(false);
  });
});

describe('QuestionHistoryEntryDTOSchema', () => {
  const row = {
    id: 'qh_1',
    projectId: 'proj_1',
    prdVersionId: null,
    structuredQuestion: 'What is MVP scope?',
    availableOptions: { type: 'single_choice', title: 'Scope', options: [] },
    founderAnswer: '{"type":"single_choice"}',
    optionalComment: null,
    aiInterpretation: 'reasoning',
    prdImpact: 'Core Features',
    questionType: 'clarification',
    createdAt: '2026-05-11T12:00:00.000Z',
  };

  it('parses valid row', () => {
    expect(QuestionHistoryEntryDTOSchema.safeParse(row).success).toBe(true);
  });

  it('rejects missing structuredQuestion', () => {
    const bad = { ...row };
    delete (bad as { structuredQuestion?: string }).structuredQuestion;
    expect(QuestionHistoryEntryDTOSchema.safeParse(bad).success).toBe(false);
  });
});

describe('QuestionHistoryListResponseSchema', () => {
  const row = {
    id: 'qh_1',
    projectId: 'proj_1',
    prdVersionId: 'ver_1',
    structuredQuestion: 'Q',
    availableOptions: null,
    founderAnswer: null,
    optionalComment: null,
    aiInterpretation: null,
    prdImpact: null,
    questionType: 'decision',
    createdAt: '2026-05-11T12:00:00.000Z',
  };

  it('parses non-empty list', () => {
    expect(QuestionHistoryListResponseSchema.safeParse([row]).success).toBe(true);
  });

  it('parses empty list', () => {
    expect(QuestionHistoryListResponseSchema.safeParse([]).success).toBe(true);
  });

  it('rejects non-array root', () => {
    expect(QuestionHistoryListResponseSchema.safeParse({}).success).toBe(false);
  });
});
