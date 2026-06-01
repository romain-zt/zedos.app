import { z } from 'zod';

export const ShareAccessRequestSchema = z.object({
  password: z.string().min(1).max(128),
});

export type ShareAccessRequest = z.infer<typeof ShareAccessRequestSchema>;

export const ShareAccessResponseSchema = z.object({
  ok: z.literal(true),
});

export type ShareAccessResponse = z.infer<typeof ShareAccessResponseSchema>;

export const SharePasswordRequiredResponseSchema = z.object({
  error: z.string(),
  code: z.literal('SHARE_PASSWORD_REQUIRED'),
  requiresPassword: z.literal(true),
});

export type SharePasswordRequiredResponse = z.infer<typeof SharePasswordRequiredResponseSchema>;
