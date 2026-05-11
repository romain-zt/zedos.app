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

  it('accepts optional content as record', () => {
    const r = CreateOrCapturePrdVersionRequestSchema.safeParse({ content: { sections: [] } });
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
});
