import { describe, expect, it } from 'vitest';
import {
  AnonymousSharedPrdResponseSchema,
  ShareLinkTokenPathSchema,
} from './anonymous-read';

describe('ShareLinkTokenPathSchema', () => {
  it('accepts non-empty token', () => {
    expect(ShareLinkTokenPathSchema.safeParse('abc123').success).toBe(true);
  });
  it('rejects empty', () => {
    expect(ShareLinkTokenPathSchema.safeParse('').success).toBe(false);
  });
});

describe('AnonymousSharedPrdResponseSchema', () => {
  it('parses minimal payload', () => {
    const p = AnonymousSharedPrdResponseSchema.safeParse({
      versionNumber: 1,
      content: { title: 'PRD', sections: [] },
    });
    expect(p.success).toBe(true);
  });
  it('allows null content', () => {
    const p = AnonymousSharedPrdResponseSchema.safeParse({
      versionNumber: 2,
      content: null,
    });
    expect(p.success).toBe(true);
  });
});
