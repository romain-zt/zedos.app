import { z } from 'zod';

/**
 * Minimal Linear webhook envelope used by the v1 status-sync stub. Tolerant of
 * extra fields via passthrough.
 */
export const LinearWebhookEnvelopeSchema = z
  .object({
    action: z.enum(['create', 'update', 'remove']).optional(),
    type: z.string().optional(),
    data: z
      .object({
        id: z.string().min(1).optional(),
        identifier: z.string().min(1).optional(),
        state: z
          .object({
            name: z.string().min(1).optional(),
            type: z.string().min(1).optional(),
          })
          .optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type LinearWebhookEnvelope = z.infer<typeof LinearWebhookEnvelopeSchema>;

export const LINEAR_SIGNATURE_HEADER = 'linear-signature';
export const LINEAR_DELIVERY_HEADER = 'linear-delivery';

export const LinearWebhookAckResponseSchema = z.object({
  received: z.literal(true),
  matchedLinkId: z.string().nullable(),
});

export type LinearWebhookAckResponse = z.infer<typeof LinearWebhookAckResponseSchema>;
