import { z } from 'zod';

export const LinearConnectionStatusSchema = z.enum(['active', 'disconnected', 'token_invalid']);
export type LinearConnectionStatusContract = z.infer<typeof LinearConnectionStatusSchema>;

/**
 * v1 minimal: owner supplies team id + optional Linear project id. The actual
 * API key lives in env (LINEAR_API_KEY) — single-tenant for v1. OAuth is
 * deferred to a follow-up slice once the demand gate (≥3 builders) is met by
 * organic usage; the FA stays in "exploratory→ready-for-user-stories" per the
 * user override on GATE-LINEAR-001 captured in the slice changelog.
 */
export const ConnectLinearRequestSchema = z.object({
  teamId: z.string().min(1).max(64),
  linearProjectId: z.string().min(1).max(64).nullable().optional(),
});

export type ConnectLinearRequest = z.infer<typeof ConnectLinearRequestSchema>;

export const LinearConnectionDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  teamId: z.string(),
  linearProjectId: z.string().nullable(),
  status: LinearConnectionStatusSchema,
  createdAt: z.coerce.date(),
  disconnectedAt: z.coerce.date().nullable(),
});

export type LinearConnectionDTO = z.infer<typeof LinearConnectionDTOSchema>;

export const GetLinearConnectionResponseSchema = z.object({
  connection: LinearConnectionDTOSchema.nullable(),
});

export type GetLinearConnectionResponse = z.infer<typeof GetLinearConnectionResponseSchema>;
