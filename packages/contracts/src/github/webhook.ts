import { z } from 'zod';

/**
 * Minimal GitHub webhook envelope used in v1 ingest. Only the subset of fields
 * the ingest use case currently reads — we deliberately accept unknown extras to
 * stay tolerant of GitHub adding fields (`.passthrough()`).
 */
export const GithubWebhookEnvelopeSchema = z
  .object({
    repository: z
      .object({
        full_name: z.string().min(1),
        name: z.string().min(1),
        owner: z.object({
          login: z.string().min(1),
        }),
      })
      .optional(),
    sender: z
      .object({
        login: z.string().min(1).optional(),
      })
      .optional(),
    action: z.string().optional(),
  })
  .passthrough();

export type GithubWebhookEnvelope = z.infer<typeof GithubWebhookEnvelopeSchema>;

export const GITHUB_DELIVERY_HEADER = 'x-github-delivery';
export const GITHUB_EVENT_HEADER = 'x-github-event';
export const GITHUB_SIGNATURE_HEADER = 'x-hub-signature-256';

export const GithubWebhookAckResponseSchema = z.object({
  received: z.literal(true),
  signalId: z.string().nullable(),
  duplicate: z.boolean(),
});

export type GithubWebhookAckResponse = z.infer<typeof GithubWebhookAckResponseSchema>;
