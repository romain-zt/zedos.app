import { describe, expect, it } from 'vitest';
import { ClarifyAiResponseSchema } from '../ai/clarify-stream';
import { GeneratePrdAiResponseSchema } from '../ai/generate-prd-stream';
import {
  ClarifyPostBodySchema,
  PRD_SECTIONS,
  QuestionHistoryRowSchema,
  QuestionReadinessScoreResponseSchema,
  computeReadinessScoreDto,
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

describe('PRD_SECTIONS', () => {
  it('lists eight canonical sections in pipeline order', () => {
    expect(PRD_SECTIONS).toHaveLength(8);
    expect(PRD_SECTIONS[0]).toBe('Product Vision');
    expect(PRD_SECTIONS[7]).toBe('Open Questions');
  });
});

describe('QuestionReadinessScoreResponseSchema', () => {
  it('accepts a valid readiness payload', () => {
    const r = QuestionReadinessScoreResponseSchema.safeParse({
      score: 75,
      answered: 10,
      remaining: 6,
      coveredSections: ['Product Vision'],
      remainingSections: ['Target Users'],
    });
    expect(r.success).toBe(true);
  });

  it('rejects score out of 0–100', () => {
    const r = QuestionReadinessScoreResponseSchema.safeParse({
      score: 101,
      answered: 1,
      remaining: 0,
      coveredSections: [],
      remainingSections: [],
    });
    expect(r.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const r = QuestionReadinessScoreResponseSchema.safeParse({ score: 50 });
    expect(r.success).toBe(false);
  });
});

describe('computeReadinessScoreDto', () => {
  it('uses answered / (answered + remaining_sections) and ignores non-canonical impacts', () => {
    const dto = computeReadinessScoreDto({
      answeredQuestionCount: 8,
      answeredPrdImpacts: ['Product Vision', 'Not a real section', 'Product Vision'],
      hasPrdVersion: false,
    });
    expect(dto.answered).toBe(8);
    expect(dto.remaining).toBe(7);
    expect(dto.coveredSections).toEqual(['Product Vision']);
    expect(dto.score).toBe(53);
  });

  it('allows 100% when a PRD version exists', () => {
    const dto = computeReadinessScoreDto({
      answeredQuestionCount: 20,
      answeredPrdImpacts: [...PRD_SECTIONS],
      hasPrdVersion: true,
    });
    expect(dto.remaining).toBe(0);
    expect(dto.score).toBe(100);
  });

  it('caps at 95 when formula would exceed 100% and no PRD version', () => {
    const dto = computeReadinessScoreDto({
      answeredQuestionCount: 20,
      answeredPrdImpacts: [...PRD_SECTIONS],
      hasPrdVersion: false,
    });
    expect(dto.score).toBe(95);
  });
});
