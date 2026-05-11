import { describe, expect, it } from 'vitest';
import {
  CreateShareLinkRequestSchema,
  ShareLinkMintResponseSchema,
  ShareLinkSummarySchema,
} from './mint';

describe('CreateShareLinkRequestSchema', () => {
  it('accepts valid body', () => {
    const p = CreateShareLinkRequestSchema.safeParse({ prdVersionId: 'pv-1' });
    expect(p.success).toBe(true);
  });

  it('rejects empty prdVersionId', () => {
    const p = CreateShareLinkRequestSchema.safeParse({ prdVersionId: '' });
    expect(p.success).toBe(false);
  });
});

describe('ShareLinkMintResponseSchema', () => {
  it('parses serialized API payload', () => {
    const p = ShareLinkMintResponseSchema.safeParse({
      id: 'sl-1',
      prdVersionId: 'pv-1',
      token: 'abc',
      enabled: true,
      createdAt: '2026-05-11T12:00:00.000Z',
      disabledAt: null,
    });
    expect(p.success).toBe(true);
    if (p.success) expect(p.data.token).toBe('abc');
  });
});

describe('ShareLinkSummarySchema', () => {
  it('matches nested PRD version share link shape', () => {
    const p = ShareLinkSummarySchema.safeParse({
      id: 'x',
      token: 'tok',
      enabled: true,
    });
    expect(p.success).toBe(true);
  });
});
