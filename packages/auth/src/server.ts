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
import { db } from '@repo/db';
import * as schema from '@repo/db/schema';

export const auth = betterAuth({
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
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ].filter(Boolean),

});

export type Auth = typeof auth;
