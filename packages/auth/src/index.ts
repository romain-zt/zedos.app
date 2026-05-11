/**
 * @repo/auth — better-auth authentication package
 *
 * This package provides:
 * - auth: The better-auth instance (server-only)
 * - authClient: The auth client for React components
 * - guards: requireSession, requireUser, requireApiKey helpers
 * - types: Session, User, UnauthorizedError types
 *
 * Legacy NextAuth exports are maintained for backwards compatibility
 * during the migration period and will be removed in PR-3.
 */

export { auth } from './server';
export type { Auth } from './server';

export { authClient, signIn, signUp, signOut, useSession, getSession } from './client';

export { requireSession, requireUser, requireApiKey } from './guards';

export type { Session, User, UnauthorizedError, ApiKey } from './types';
export { createUnauthorizedError } from './types';

export { API_KEY_PLUGIN_ENABLED, apiKeyPluginConfig } from './plugins/api-key';

export { authOptions } from './auth-options';
