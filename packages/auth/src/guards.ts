/**
 * @repo/auth guards — Server-side authentication guards using Result<T,E> pattern
 *
 * Every protected route, server action, and server component goes through these helpers.
 * Returns Result<T, UnauthorizedError>, never throws.
 *
 * Usage:
 *   const sessionResult = await requireSession(headers());
 *   if (sessionResult.isErr()) {
 *     return Response.json({ error: sessionResult.error.message }, { status: 401 });
 *   }
 *   const session = sessionResult.unwrap();
 */

import { ok, err, type Result } from '@repo/result';
import { auth } from './server';
import { createUnauthorizedError, type Session, type User, type UnauthorizedError, type ApiKey } from './types';

/**
 * Require a valid session — returns Result<Session, UnauthorizedError>
 *
 * @param headers - Request headers (use headers() from next/headers)
 * @returns Result containing the session or an UnauthorizedError
 */
export async function requireSession(
  headers: Headers
): Promise<Result<Session, UnauthorizedError>> {
  try {
    const session = await auth.api.getSession({ headers });

    if (!session) {
      return err(createUnauthorizedError('No active session'));
    }

    return ok(session);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Session verification failed';
    return err(createUnauthorizedError(message));
  }
}

/**
 * Require a valid user — returns Result<User, UnauthorizedError>
 *
 * @param headers - Request headers (use headers() from next/headers)
 * @returns Result containing the user or an UnauthorizedError
 */
export async function requireUser(
  headers: Headers
): Promise<Result<User, UnauthorizedError>> {
  const sessionResult = await requireSession(headers);

  if (sessionResult.isErr()) {
    return err(sessionResult.error);
  }

  const session = sessionResult.unwrap();

  if (!session.user) {
    return err(createUnauthorizedError('No user in session'));
  }

  return ok(session.user);
}

/**
 * Require a valid API key — DISABLED in v0
 *
 * This guard is a stub for v2/v3 API key authentication.
 * Activation requires:
 * 1. Product decision in docs/product-decisions/
 * 2. Scope schema in packages/contracts/auth/api-key.ts
 * 3. Migration adding API key tables
 * 4. Rate-limit rules per key id
 * 5. Revocation UI surface
 *
 * @param _headers - Request headers (unused in v0)
 * @returns Always returns UnauthorizedError in v0
 */
export async function requireApiKey(
  _headers: Headers
): Promise<Result<ApiKey, UnauthorizedError>> {
  return err(
    createUnauthorizedError('API key authentication is not enabled in v0')
  );
}
