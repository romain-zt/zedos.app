/**
 * Share link disable (revoke) — request contract for POST /api/share/disable
 */

import { z } from 'zod';
import { IdSchema } from '../shared/common';

export const DisableShareLinkRequestSchema = z.object({
  shareLinkId: IdSchema,
});

export type DisableShareLinkRequest = z.infer<typeof DisableShareLinkRequestSchema>;
