/**
 * Share link revoke — request contract for POST /api/share/disable
 */

import { z } from 'zod';

export const DisableShareLinkRequestSchema = z.object({
  shareLinkId: z.string().min(1, 'Share link ID is required'),
});

export type DisableShareLinkRequest = z.infer<typeof DisableShareLinkRequestSchema>;
