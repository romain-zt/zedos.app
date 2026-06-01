import { z } from 'zod';
import { PrdVersionContentSchema } from '../prd/prd-contracts';

/** Path param for GET /api/share/[token] */
export const ShareReadTokenParamSchema = z.string().min(1).max(256);

const PrdStatusSchema = z.enum(['draft', 'final', 'generated']);

/**
 * Public anonymous read payload — no workspace fields (no project name, ids, or owner context).
 */
export const AnonymousSharedPrdResponseSchema = z
  .object({
    versionNumber: z.coerce.number().int().min(1),
    content: PrdVersionContentSchema.nullable(),
    status: PrdStatusSchema,
    createdAt: z.coerce.date(),
  })
  .strict();

export type AnonymousSharedPrdResponse = z.infer<typeof AnonymousSharedPrdResponseSchema>;
