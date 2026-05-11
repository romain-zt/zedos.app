import { z } from 'zod';

/** Opaque string id (cuid/uuid) — validated non-empty at the boundary. */
export const IdSchema = z.string().min(1);
