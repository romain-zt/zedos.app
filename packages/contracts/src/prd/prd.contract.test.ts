import { describe, it, expect } from 'vitest';
import {
  CreateOrCapturePrdVersionRequestSchema,
  CapturedPrdVersionResponseSchema,
  PrdVersionListResponseSchema,
} from './prd-contracts';

describe('CreateOrCapturePrdVersionRequestSchema', () => {
  it('accepts empty object', () => {
    expect(CreateOrCapturePrdVersionRequestSchema.safeParse({}).success).toBe(true);
  });

  it('accepts optional intake content as string record', () => {
    const r = CreateOrCapturePrdVersionRequestSchema.safeParse({
      content: { vision: 'Build X' },
    });
    expect(r.success).toBe(true);
  });

  it('accepts optional AI-generated content shape', () => {
    const r = CreateOrCapturePrdVersionRequestSchema.safeParse({
      content: {
        title: 'PRD',
        version_summary: 'v1',
        sections: [
          {
            id: 'vision',
            title: 'Vision',
            content: '...',
            confidence: 'high',
            open_questions: [],
          },
        ],
      },
    });
    expect(r.success).toBe(true);
  });

  it('rejects non-object body shape at top level', () => {
    const r = CreateOrCapturePrdVersionRequestSchema.safeParse('not-an-object');
    expect(r.success).toBe(false);
  });
});

describe('CapturedPrdVersionResponseSchema', () => {
  const valid = {
    created: true,
    version: {
      id: 'ver_1',
      projectId: 'proj_1',
      versionNumber: 1,
      content: null,
      status: 'draft',
      createdAt: '2026-05-11T12:00:00.000Z',
      updatedAt: '2026-05-11T12:00:00.000Z',
    },
  };

  it('parses valid payload with ISO date strings', () => {
    expect(CapturedPrdVersionResponseSchema.safeParse(valid).success).toBe(true);
  });

  it('parses AI-generated content on version', () => {
    const withAiContent = {
      ...valid,
      version: {
        ...valid.version,
        content: {
          title: 'PRD',
          version_summary: 'First draft',
          sections: [],
        },
      },
    };
    expect(CapturedPrdVersionResponseSchema.safeParse(withAiContent).success).toBe(true);
  });

  it('rejects when version object missing', () => {
    expect(CapturedPrdVersionResponseSchema.safeParse({ created: true }).success).toBe(false);
  });
});

describe('PrdVersionListResponseSchema', () => {
  const row = {
    id: 'ver_1',
    projectId: 'proj_1',
    versionNumber: 2,
    content: null,
    status: 'draft',
    createdAt: '2026-05-11T12:00:00.000Z',
    updatedAt: '2026-05-11T12:05:00.000Z',
  };

  it('parses a valid non-empty array from JSON date strings', () => {
    const r = PrdVersionListResponseSchema.safeParse([row]);
    expect(r.success).toBe(true);
  });

  it('parses empty array', () => {
    expect(PrdVersionListResponseSchema.safeParse([]).success).toBe(true);
  });

  it('rejects non-array root', () => {
    expect(PrdVersionListResponseSchema.safeParse({}).success).toBe(false);
  });

  it('rejects row missing versionNumber', () => {
    const bad = { ...row };
    delete (bad as { versionNumber?: number }).versionNumber;
    expect(PrdVersionListResponseSchema.safeParse([bad]).success).toBe(false);
  });

  it('rejects fractional versionNumber', () => {
    expect(
      PrdVersionListResponseSchema.safeParse([{ ...row, versionNumber: 1.5 }])
        .success,
    ).toBe(false);
  });

  it('parses list with legacy draft placeholder and generated AI content', () => {
    const r = PrdVersionListResponseSchema.safeParse([
      {
        ...row,
        versionNumber: 1,
        content: {
          source: 'in_app',
          summary: 'Initial PRD version (placeholder — edit via clarify and generate when ready)',
          sections: [],
        },
      },
      {
        ...row,
        versionNumber: 2,
        status: 'generated',
        content: {
          title: 'E2E PRD',
          version_summary: 'Generated in test',
          sections: [
            {
              id: 'vision',
              title: 'Vision',
              content: 'Test',
              confidence: 'high',
              open_questions: [],
            },
          ],
        },
        questionHistoryCount: '0',
      },
    ]);
    expect(r.success).toBe(true);
  });
});
