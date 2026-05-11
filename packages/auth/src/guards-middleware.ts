/**
 * Edge / Next.js middleware–compatible session guard.
 *
 * Does not import `auth` / DB (unlike `./guards.ts`). Resolves session by
 * calling the app's better-auth `GET /api/auth/get-session` with forwarded
 * cookies so the middleware bundle stays edge-safe.
 *
 * Must stay consistent with `requireSession` in `./guards.ts` (same effective
 * source of truth: better-auth session resolution).
 */

import { err, ok, type Result } from '@repo/result';
import type { Session, UnauthorizedError } from './types';
import { createUnauthorizedError } from './types';

const GET_SESSION_PATH = '/api/auth/get-session';

function hasUserShape(data: unknown): data is Session {
  if (data === null || typeof data !== 'object') return false;
  const o = data as Record<string, unknown>;
  return (
    o.user !== null &&
    typeof o.user === 'object' &&
    o.session !== null &&
    typeof o.session === 'object'
  );
}

/**
 * Same contract as `requireSession` from `./guards.ts`, for use in
 * `middleware.ts` where `@repo/auth/server` cannot run.
 */
export async function requireSession(
  request: Request
): Promise<Result<Session, UnauthorizedError>> {
  try {
    const url = new URL(GET_SESSION_PATH, request.url);
    const cookie = request.headers.get('cookie') ?? '';
    const res = await fetch(url, {
      headers: { cookie },
      cache: 'no-store',
    });

    if (!res.ok) {
      return err(createUnauthorizedError('No active session'));
    }

    const data: unknown = await res.json();

    if (data === null || !hasUserShape(data)) {
      return err(createUnauthorizedError('No active session'));
    }

    return ok(data);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Session verification failed';
    return err(createUnauthorizedError(message));
  }
}
