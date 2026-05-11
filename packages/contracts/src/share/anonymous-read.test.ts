import { describe, expect, it } from 'vitest';
import {
  AnonymousSharedPrdResponseSchema,
  ShareReadTokenParamSchema,
} from './anonymous-read';

describe('ShareReadTokenParamSchema', () => {
  it('accepts typical token strings', () => {
    expect(ShareReadTokenParamSchema.safeParse('abc-token-xyz').success).toBe(true);
  });

  it('rejects empty string', () => {
    expect(ShareReadTokenParamSchema.safeParse('').success).toBe(false);
  });

  it('rejects excessively long tokens', () => {
    expect(ShareReadTokenParamSchema.safeParse('x'.repeat(257)).success).toBe(false);
  });
});

describe('AnonymousSharedPrdResponseSchema', () => {
  it('parses API-shaped payload', () => {
    const p = AnonymousSharedPrdResponseSchema.safeParse({
      versionNumber: 2,
      content: { title: 'T', sections: [] },
      status: 'final',
      createdAt: '2026-05-11T12:00:00.000Z',
    });
    expect(p.success).toBe(true);
    if (p.success) {
      expect(p.data.versionNumber).toBe(2);
      expect(p.data.status).toBe('final');
      expect(p.data.createdAt instanceof Date).toBe(true);
    }
  });

  it('accepts null content', () => {
    const p = AnonymousSharedPrdResponseSchema.safeParse({
      versionNumber: 1,
      content: null,
      status: 'draft',
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
    });
    expect(p.success).toBe(true);
  });

  it('rejects invalid status enum', () => {
    expect(
      AnonymousSharedPrdResponseSchema.safeParse({
        versionNumber: 1,
        content: null,
        status: 'archived',
        createdAt: new Date(),
      }).success
    ).toBe(false);
  });

  it('rejects workspace leakage field', () => {
    expect(
      AnonymousSharedPrdResponseSchema.safeParse({
        versionNumber: 1,
        content: null,
        status: 'draft',
        createdAt: new Date(),
        projectName: 'Secret',
      }).success
    ).toBe(false);
  });
});
