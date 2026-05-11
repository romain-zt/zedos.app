import { z } from 'zod';

/** Path segment for share token (non-empty, bounded) */
export const ShareLinkTokenPathSchema = z.string().min(1).max(512);

export type ShareLinkTokenPath = z.infer<typeof ShareLinkTokenPathSchema>;

/** Response body: version number + PRD JSON payload only (no workspace metadata) */
export const AnonymousSharedPrdResponseSchema = z.object({
  versionNumber: z.coerce.number().int().nonnegative(),
  /** Stored PRD document JSON (structure varies by generator) */
  content: z.unknown().nullable(),
});

export type AnonymousSharedPrdResponse = z.infer<typeof AnonymousSharedPrdResponseSchema>;
