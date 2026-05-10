---
name: add-better-auth-flow
description: Adds a sign-in / sign-up / session / protected-route flow with better-auth. Server-side guards return Result<…,UnauthorizedError>; CSRF and trusted-origins protections enforced. Pre-migration NextAuth bridge documented.
disable-model-invocation: true
---

# Add better-auth Flow

Use when the Plan adds an auth flow — a new sign-in surface, sign-up form, protected route, or session-derived data fetch. Auth lives in `packages/auth/` (post-migration target) or `zedos/nextjs_space/lib/auth-options.ts` + `app/api/auth/...` (pre-migration NextAuth — frozen).

## When to use

- The Plan adds a route, action, or page that requires authentication.
- The Plan touches the session shape (e.g. extends `User` with a new field).
- The Plan introduces a new provider (email, OAuth, magic link).
- The Plan activates the API-key plugin (v2/v3 — requires the 5-step process in `.cursor/rules/76-better-auth.mdc` §6).

## Read first

- `.cursor/rules/76-better-auth.mdc` (canonical conventions)
- better-auth docs: https://better-auth.com (read on demand)

## Recipe (post-migration)

### Step 1 — Confirm the layout

Auth code under `packages/auth/`. Adapter wires against `packages/database`.

### Step 2 — Configure the auth instance

```typescript
// packages/auth/src/server.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@zedos/database';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // v0 default; revisit per product decision
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7d
    updateAge: 60 * 60 * 24,     // refresh on read once per day
  },
  trustedOrigins: process.env.AUTH_TRUSTED_ORIGINS?.split(',') ?? [],
  // CSRF: enabled by default — DO NOT DISABLE.
  // API keys: off in v0; activation requires the 5-step process in 76-better-auth.mdc §6.
});

export type Session = typeof auth.$Infer.Session;
export type User = Session['user'];
```

### Step 3 — Mount the handler

```typescript
// apps/web/app/api/auth/[...all]/route.ts
import { auth } from '@zedos/auth';

export const POST = auth.handler;
export const GET = auth.handler;
```

The handler route is < 10 lines — it forwards to better-auth. No business logic.

### Step 4 — Author the guards

```typescript
// packages/auth/src/guards.ts
import { ok, err, Result } from '@zedos/shared/result';
import { UnauthorizedError } from '@zedos/shared/errors';
import { auth, type Session, type User } from './server';

export async function requireSession(headers: Headers): Promise<Result<Session, UnauthorizedError>> {
  const session = await auth.api.getSession({ headers });
  if (!session) return err(new UnauthorizedError('no session'));
  return ok(session);
}

export async function requireUser(headers: Headers): Promise<Result<User, UnauthorizedError>> {
  const session = await requireSession(headers);
  if (session.isErr()) return session;
  return ok(session.unwrap().user);
}
```

### Step 5 — Use guards in routes / actions / pages

```typescript
// app/api/projects/route.ts
import { requireSession } from '@zedos/auth';

export async function POST(req: Request) {
  const session = await requireSession(req.headers);
  if (session.isErr()) return Response.json({ error: 'unauthorized' }, { status: 401 });
  // ... use session.unwrap().user.id
}
```

### Step 6 — Sign-in / sign-up UI

Better-auth provides client helpers. Use them in components:

```tsx
// apps/web/app/login/_components/login-form.tsx
'use client';
import { useState } from 'react';
import { authClient } from '@zedos/auth/client';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = await authClient.signIn.email({ email, password });
    if (result.error) setError(result.error.message);
    else window.location.href = '/dashboard';
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Sign in</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
```

### Step 7 — Tests

- Unit test `requireSession` and `requireUser` returning `err` on missing session, `ok` on present session.
- Integration test the sign-in flow against a test DB.
- E2E test (Playwright) covering sign-up → sign-in → dashboard.

### Step 8 — Verify

Route to `verifier`.

## Pre-migration recipe (NextAuth — transitional)

Per `.cursor/rules/76-better-auth.mdc` §7, NextAuth is the transitional path until Phase 2 of the monorepo retro lands. When the Plan must touch auth pre-migration:

1. Use `getServerSession(authOptions)` only inside route handlers and server actions.
2. Wrap in a `requireSession` helper returning `Result<Session, UnauthorizedError>`.
3. Do not add new `(session.user as any).id` casts — extend `next-auth.d.ts`:

```typescript
// zedos/nextjs_space/types/next-auth.d.ts
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
    };
  }
}
```

4. Replace silent catches (`try { ... } catch { return null }`) with `Result.err(new ExternalServiceError(...))`.
5. Note in the Plan: "transitional NextAuth path; replaced by better-auth in Phase 2".

## Failure modes

| Failure | Fix |
|---------|-----|
| Route reads `userId` from request body | Use `requireSession(req.headers)` and derive from session |
| Auth disabled CSRF or wildcards on trusted origins | Re-enable; restrict origins |
| API-key plugin enabled without §6 prerequisites | Block; route to product-decision capture |
| New `(session.user as any).id` cast | Extend type augmentation file instead |
| Silent error catch in auth | Return typed `err(...)` |

## Hard rules

- One auth source per layout (NextAuth pre-migration, better-auth post-migration).
- CSRF and trusted-origins protections must not be disabled.
- Server code derives the user from the verified session — never request body.
- API keys off in v0; activation requires the full 5-step process.
- Guards return `Result<…, UnauthorizedError>`; they do not throw.
