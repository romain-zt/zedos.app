import { describe, it, expect } from 'vitest';
import {
  KNOWN_TEMPLATE_SLUGS,
  TemplateDetailDTOSchema,
  TemplateListResponseSchema,
  TemplateSlugSchema,
  TemplateSummaryDTOSchema,
} from './template';

const summary = {
  slug: 'pitch-tomorrow' as const,
  title: 'Pitch tomorrow',
  description: 'Generic express pitch deck',
  category: 'playbook' as const,
  journeyHint: 'express' as const,
  sector: 'Generic',
  author: 'zedos-official' as const,
  forkCount: 0,
};

const detail = {
  ...summary,
  sectionsOutline: [{ id: 'vision', title: 'Vision' }],
  clarifyHints: ['What is the one-sentence problem you solve?'],
  content: {
    title: 'Pitch tomorrow — express template',
    version_summary: 'Lean 12-section pitch deck.',
    sections: [
      {
        id: 'vision',
        title: 'Vision',
        content: 'One-sentence problem + insight.',
        confidence: 'medium' as const,
        open_questions: ['Which insight differentiates you?'],
      },
    ],
  },
};

describe('Template contracts', () => {
  it('exposes exactly 10 known slugs', () => {
    expect(KNOWN_TEMPLATE_SLUGS.length).toBe(10);
  });

  it('TemplateSlugSchema accepts every known slug', () => {
    for (const slug of KNOWN_TEMPLATE_SLUGS) {
      expect(TemplateSlugSchema.safeParse(slug).success).toBe(true);
    }
  });

  it('TemplateSlugSchema rejects unknown slugs', () => {
    expect(TemplateSlugSchema.safeParse('not-a-real-template').success).toBe(false);
  });

  it('TemplateSummaryDTOSchema accepts a well-formed summary', () => {
    expect(TemplateSummaryDTOSchema.safeParse(summary).success).toBe(true);
  });

  it('TemplateSummaryDTOSchema rejects negative forkCount', () => {
    expect(TemplateSummaryDTOSchema.safeParse({ ...summary, forkCount: -1 }).success).toBe(false);
  });

  it('TemplateDetailDTOSchema accepts a well-formed detail and reuses GeneratePrdAiResponseSchema', () => {
    expect(TemplateDetailDTOSchema.safeParse(detail).success).toBe(true);
  });

  it('TemplateDetailDTOSchema rejects empty sectionsOutline', () => {
    expect(
      TemplateDetailDTOSchema.safeParse({ ...detail, sectionsOutline: [] }).success
    ).toBe(false);
  });

  it('TemplateListResponseSchema accepts an array of summaries', () => {
    expect(TemplateListResponseSchema.safeParse([summary, summary]).success).toBe(true);
  });
});
