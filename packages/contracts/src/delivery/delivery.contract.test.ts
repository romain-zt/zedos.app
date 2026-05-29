import { describe, it, expect } from 'vitest';
import {
  DeliveryExportRequestSchema,
  DeliveryPreviewRequestSchema,
  DeliveryPreviewResponseSchema,
  ExportEligibleListResponseSchema,
} from './delivery-contracts';

describe('ExportEligibleListResponseSchema', () => {
  it('accepts an empty bundle list', () => {
    expect(ExportEligibleListResponseSchema.safeParse({ bundles: [] }).success).toBe(true);
  });

  it('rejects negative task counts', () => {
    const r = ExportEligibleListResponseSchema.safeParse({
      bundles: [{ id: 'b1', storyTitle: 'Story', taskCount: -1, lockedAt: new Date() }],
    });
    expect(r.success).toBe(false);
  });
});

describe('DeliveryPreviewRequestSchema', () => {
  it('requires at least one bundle id', () => {
    expect(DeliveryPreviewRequestSchema.safeParse({ bundleIds: [] }).success).toBe(false);
  });

  it('accepts a valid selection', () => {
    expect(
      DeliveryPreviewRequestSchema.safeParse({ bundleIds: ['bundle-1', 'bundle-2'] }).success
    ).toBe(true);
  });

  it('rejects more than 50 bundle ids', () => {
    const bundleIds = Array.from({ length: 51 }, (_, i) => `id-${i}`);
    expect(DeliveryPreviewRequestSchema.safeParse({ bundleIds }).success).toBe(false);
  });
});

describe('DeliveryPreviewResponseSchema', () => {
  it('accepts stories with task excerpts', () => {
    const r = DeliveryPreviewResponseSchema.safeParse({
      stories: [
        {
          bundleId: 'b1',
          storyTitle: 'Checkout',
          tasks: [
            {
              id: 't1',
              sortOrder: 0,
              title: 'API route',
              promptExcerpt: 'Implement POST /checkout',
            },
          ],
        },
      ],
    });
    expect(r.success).toBe(true);
  });

  it('rejects prompt excerpts over 500 chars', () => {
    const r = DeliveryPreviewResponseSchema.safeParse({
      stories: [
        {
          bundleId: 'b1',
          storyTitle: 'X',
          tasks: [
            {
              id: 't1',
              sortOrder: 0,
              title: 'T',
              promptExcerpt: 'x'.repeat(501),
            },
          ],
        },
      ],
    });
    expect(r.success).toBe(false);
  });
});

describe('DeliveryExportRequestSchema', () => {
  it('mirrors preview request shape', () => {
    expect(DeliveryExportRequestSchema.safeParse({ bundleIds: ['b1'] }).success).toBe(true);
  });
});
