import { describe, expect, it } from 'vitest';
import { ClarifyAiResponseSchema } from '../ai/clarify-stream';
import { GeneratePrdAiResponseSchema } from '../ai/generate-prd-stream';
import { ClarifyPostBodySchema, QuestionHistoryRowSchema } from './history';

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
