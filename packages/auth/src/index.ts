/**
 * @repo/auth — better-auth authentication package
 *
 * Server-only imports (auth instance, guards) must use subpath imports:
 *   import { auth, toNextJsHandler } from '@repo/auth/server'
 *   import { requireSession, requireUser } from '@repo/auth/guards'
 *
 * Client imports are safe from the root or subpath:
 *   import { authClient, signIn, signUp } from '@repo/auth'
 *   import { authClient } from '@repo/auth/client'
 */

export { authClient, signIn, signUp, signOut, useSession, getSession } from './client';

export type { Session, User, UnauthorizedError, ApiKey } from './types';
export { createUnauthorizedError } from './types';

export { API_KEY_PLUGIN_ENABLED, apiKeyPluginConfig } from './plugins/api-key';
