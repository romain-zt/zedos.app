import { describe, expect, it } from 'vitest';

describe('SharedPrdPage metadata', () => {
  it(
    'declares noindex,nofollow for all share URLs',
    async () => {
      const { metadata } = await import('./page');
      expect(metadata.robots).toEqual({ index: false, follow: false });
    },
    15_000
  );
});
