import { describe, it, expect } from 'vitest';
import {
  CreateOrCapturePrdVersionRequestSchema,
  CapturedPrdVersionResponseSchema,
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
