import { z } from 'zod';

export const GithubConnectionStatusSchema = z.enum(['active', 'disconnected', 'token_invalid']);
export type GithubConnectionStatusContract = z.infer<typeof GithubConnectionStatusSchema>;

/**
 * v1 minimal: owner manually supplies owner/repo. Real OAuth dance is deferred —
 * see prd-drift-github--connect-repo--v1 plan "Out of Scope".
 */
export const ConnectGithubRepoRequestSchema = z.object({
  ownerLogin: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/u, 'Invalid GitHub owner login'),
  repoName: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-zA-Z0-9._-]+$/u, 'Invalid GitHub repository name'),
  installationId: z.string().min(1).max(64).nullable().optional(),
});

export type ConnectGithubRepoRequest = z.infer<typeof ConnectGithubRepoRequestSchema>;

export const GithubConnectionDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  ownerLogin: z.string(),
  repoName: z.string(),
  installationId: z.string().nullable(),
  status: GithubConnectionStatusSchema,
  createdAt: z.coerce.date(),
  disconnectedAt: z.coerce.date().nullable(),
});

export type GithubConnectionDTO = z.infer<typeof GithubConnectionDTOSchema>;

export const GetGithubConnectionResponseSchema = z.object({
  connection: GithubConnectionDTOSchema.nullable(),
});

export type GetGithubConnectionResponse = z.infer<typeof GetGithubConnectionResponseSchema>;
