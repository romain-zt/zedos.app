/**
 * @repo/auth server — better-auth instance (server-only entry)
 *
 * This module configures the better-auth instance with:
 * - Drizzle adapter wired against @repo/db
 * - Email + password provider (v0 baseline)
 * - Session JWT with 7d expiry
 * - CSRF protection enabled (default)
 *
 * NOTE: API keys are disabled in v0 — see plugins/api-key.ts
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { toNextJsHandler } from 'better-auth/next-js';
import { db } from '@repo/db';
import * as schema from '@repo/db/schema';

function resolveAuthBaseURL(): string | undefined {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return undefined;
}

const authSecret =
  process.env.BETTER_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
const authBaseURL = resolveAuthBaseURL();

export const auth = betterAuth({
  ...(authSecret ? { secret: authSecret } : {}),
  ...(authBaseURL ? { baseURL: authBaseURL } : {}),

  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    schema: {
      ...schema,
      user: schema.users,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  user: {
    additionalFields: {
      creditBalance: {
        type: 'number',
        required: false,
        defaultValue: 0,
        input: false,
      },
      starterCreditsGranted: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
      graceUsed: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },

  trustedOrigins: [
    authBaseURL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    'http://localhost:3000',
  ].filter(Boolean) as string[],

});

export type Auth = typeof auth;

export { toNextJsHandler };
