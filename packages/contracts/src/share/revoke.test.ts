import { describe, expect, it } from 'vitest';
import { DisableShareLinkRequestSchema } from './revoke';

describe('DisableShareLinkRequestSchema', () => {
  it('accepts a non-empty shareLinkId', () => {
    const r = DisableShareLinkRequestSchema.safeParse({ shareLinkId: 'abc' });
    expect(r.success).toBe(true);
  });

  it('rejects empty shareLinkId', () => {
    const r = DisableShareLinkRequestSchema.safeParse({ shareLinkId: '' });
    expect(r.success).toBe(false);
  });

  it('rejects missing shareLinkId', () => {
    const r = DisableShareLinkRequestSchema.safeParse({});
    expect(r.success).toBe(false);
  });
});
