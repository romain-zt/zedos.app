/**
 * better-auth API route handler
 *
 * This route mounts the better-auth handler at /api/auth/[...all].
 * All auth operations (sign-in, sign-up, sign-out, session) are handled here.
 *
 * No business logic — just forwards to auth.handler per 76-better-auth.mdc §2.
 */

import { auth, toNextJsHandler } from '@repo/auth/server';

export const { GET, POST } = toNextJsHandler(auth);
