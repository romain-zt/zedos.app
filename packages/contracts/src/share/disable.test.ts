import { describe, expect, it } from 'vitest';
import { DisableShareLinkRequestSchema } from './disable';

describe('DisableShareLinkRequestSchema', () => {
  it('accepts valid body', () => {
    const p = DisableShareLinkRequestSchema.safeParse({ shareLinkId: 'clxyz123' });
    expect(p.success).toBe(true);
  });

  it('rejects missing shareLinkId', () => {
    const p = DisableShareLinkRequestSchema.safeParse({});
    expect(p.success).toBe(false);
  });

  it('rejects empty shareLinkId', () => {
    const p = DisableShareLinkRequestSchema.safeParse({ shareLinkId: '' });
    expect(p.success).toBe(false);
  });
});
