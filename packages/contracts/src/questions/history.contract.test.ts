import { describe, expect, it } from 'vitest';
import { ClarifyAiResponseSchema } from '../ai/clarify-stream';
import { GeneratePrdAiResponseSchema } from '../ai/generate-prd-stream';
import {
  ClarifyPostBodySchema,
  QuestionHistoryRowSchema,
  QuestionCoverageReadinessScoreResponseSchema,
  buildReadinessScoreFromQuestionRows,
  comingUpPrdSectionsFromAssistantParsed,
  PRD_SECTIONS,
} from './history';

describe('ClarifyPostBodySchema', () => {
  it('accepts empty body', () => {
    const r = ClarifyPostBodySchema.safeParse({});
    expect(r.success).toBe(true);
  });
});

describe('ClarifyAiResponseSchema', () => {
  it('accepts minimal valid clarify JSON', () => {
    const r = ClarifyAiResponseSchema.safeParse({
      reasoning: 'r',
      message: 'm',
      decision_ui: null,
      prd_section_affected: 'Scope',
      suggested_credit_type: 'clarification',
    });
    expect(r.success).toBe(true);
  });

  it('rejects invalid decision_ui type', () => {
    const r = ClarifyAiResponseSchema.safeParse({
      reasoning: 'r',
      message: 'm',
      decision_ui: { type: 'invalid', title: 't', description: 'd', options: [], allow_custom: true, allow_not_sure: true },
      prd_section_affected: 'Scope',
      suggested_credit_type: 'clarification',
    });
    expect(r.success).toBe(false);
  });
});

describe('GeneratePrdAiResponseSchema', () => {
  it('accepts shaped PRD JSON', () => {
    const r = GeneratePrdAiResponseSchema.safeParse({
      title: 'T',
      version_summary: 'S',
      sections: [
        {
          id: 'vision',
          title: 'Vision',
          content: '...',
          confidence: 'high',
          open_questions: [],
        },
      ],
    });
    expect(r.success).toBe(true);
  });
});

describe('QuestionHistoryRowSchema', () => {
  it('coerces invalid available_options to null', () => {
    const r = QuestionHistoryRowSchema.safeParse({
      id: '1',
      projectId: 'p',
      prdVersionId: null,
      structuredQuestion: 'Q',
      availableOptions: { not: 'decision ui' },
      founderAnswer: null,
      optionalComment: null,
      aiInterpretation: null,
      prdImpact: null,
      questionType: 'clarification',
      createdAt: '2026-05-11T00:00:00.000Z',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.availableOptions).toBeNull();
  });
});

describe('QuestionCoverageReadinessScoreResponseSchema', () => {
  const valid = {
    score: 42,
    answered: 2,
    remaining: 6,
    coveredSections: ['Product Vision'],
    remainingSections: PRD_SECTIONS.filter((s) => s !== 'Product Vision'),
  };

  it('accepts a shaped readiness payload', () => {
    const r = QuestionCoverageReadinessScoreResponseSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('rejects score out of range', () => {
    const r = QuestionCoverageReadinessScoreResponseSchema.safeParse({ ...valid, score: 101 });
    expect(r.success).toBe(false);
  });
});

describe('buildReadinessScoreFromQuestionRows', () => {
  it('caps score at 95 when no PRD version exists and raw ratio is 100%', () => {
    const rows = PRD_SECTIONS.map((prdImpact) => ({ founderAnswer: 'y', prdImpact }));
    const out = buildReadinessScoreFromQuestionRows(rows, false);
    expect(out.score).toBe(95);
    expect(out.remaining).toBe(0);
  });

  it('returns 100 when PRD version exists and all sections covered by answered rows', () => {
    const rows = PRD_SECTIONS.map((prdImpact) => ({ founderAnswer: 'y', prdImpact }));
    const out = buildReadinessScoreFromQuestionRows(rows, true);
    expect(out.score).toBe(100);
  });
});

describe('comingUpPrdSectionsFromAssistantParsed', () => {
  it('returns first uncovered canonical sections in order', () => {
    const up = comingUpPrdSectionsFromAssistantParsed(['Product Vision'], 3);
    expect(up).toEqual(['Target Users', 'Core Features', 'User Journeys']);
  });

  it('ignores non-canonical assistant labels', () => {
    const up = comingUpPrdSectionsFromAssistantParsed(['Scope', null, 'Product Vision'], 2);
    expect(up).toEqual(['Target Users', 'Core Features']);
  });
});
