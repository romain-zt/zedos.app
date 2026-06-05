<!--
  Implementation Plan — Turborepo Migration Phase 3: NextAuth → better-auth
  Parent Scope Slice: docs/product/scope-slices/turborepo-migration--phase-3-better-auth.md
  Authored per: .cursor/templates/execution/implementation-plan.template.md
  Governed by: .cursor/rules/70-execution-bridge.mdc, 76-better-auth.mdc
  PR split: ~3 PRs (package scaffold → handler + session wiring → cleanup + verification)
-->

# Implementation Plan: Turborepo Migration — Phase 3: better-auth

## Parent Scope Slice

[docs/product/scope-slices/turborepo-migration--phase-3-better-auth.md](../../product/scope-slices/turborepo-migration--phase-3-better-auth.md)

## Status

`executed`

> **Layout in effect:** post-Phase-2 (packages/db/ uses Drizzle; @repo/db exports Drizzle `db` client)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Replace NextAuth with better-auth inside `packages/auth/`. The `@repo/auth` package created in Phase 1 (wrapping NextAuth) is replaced with a better-auth implementation. All session reads in `apps/web/` are updated. The API-key plugin for v2/v3 is stubbed but disabled in v0.

**PR split:**

- **PR-1 (`@repo/auth` better-auth scaffold):** Create better-auth server, client, adapter, guards in `packages/auth/src/`; add better-auth Drizzle schema tables to `packages/db/src/schema/auth.ts`; generate migration
- **PR-2 (handler + session wiring):** Replace `apps/web/app/api/auth/[...nextauth]/route.ts` with better-auth handler; replace all `getServerSession` calls with `@repo/auth` session helpers; update `apps/web/middleware.ts`
- **PR-3 (cleanup + verification):** Remove `next-auth`, `@auth/prisma-adapter`; remove `packages/auth/src/auth-options.ts` (NextAuth-era file); final `pnpm build` + `pnpm typecheck` green; update `docs/state/status.json`

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (Phase 2 complete) |
| Auth source-of-truth | better-auth (this Plan performs the migration) |
| Async/sync boundary | Unchanged |
| Transaction boundary | Unchanged (better-auth manages its own session transactions internally) |
| External dependencies | `better-auth@^1`, Drizzle adapter included in `better-auth` |
| Payment shape | n/a |

---

## Layers Affected

- [ ] `domain` — none
- [ ] `application` — use-cases unchanged; `userId` resolution unchanged (string)
- [ ] `contracts` — none
- [x] `infrastructure` — `packages/auth/` replaced; session reads updated in server components and actions
- [x] `app` (routes, server actions) — auth route handler replaced; middleware updated; session reads updated in all server-component/action files
- [ ] `ui` — sign-in/sign-up page UI unchanged (form submissions still work; only backend auth mechanism changes)

---

## Touched Files (exact paths)

### PR-1: @repo/auth better-auth scaffold + DB tables (base: main post-Phase-2)

| Path | Operation | Notes |
|------|-----------|-------|
| `packages/auth/package.json` | Modify | Replace `next-auth`, `@auth/prisma-adapter` deps with `better-auth@^1`, `@repo/db: workspace:*`; add `@repo/result: workspace:*` |
| `packages/auth/tsconfig.json` | Modify | Keep references to `packages/db`, `packages/result`; ensure `composite: true` |
| `packages/auth/src/server.ts` | Create | better-auth server instance per `.cursor/rules/76-better-auth.mdc` §3: `import { betterAuth } from 'better-auth'; import { drizzleAdapter } from 'better-auth/adapters/drizzle'; import { db } from '@repo/db'; export const auth = betterAuth({ database: drizzleAdapter(db, { provider: 'pg' }), emailAndPassword: { enabled: true, minPasswordLength: 8 }, session: { expiresIn: 7 * 24 * 60 * 60, cookieCache: { enabled: true, maxAge: 5 * 60 } } });` |
| `packages/auth/src/client.ts` | Create | `import { createAuthClient } from 'better-auth/react'; export const authClient = createAuthClient({ baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000' });` |
| `packages/auth/src/types.ts` | Create | Session and User type re-exports from `better-auth`; `export type { Session, User } from 'better-auth/types';` — no `as any` needed; `session.user.id` is `string` |
| `packages/auth/src/guards.ts` | Create | `requireSession` and `requireUser` helpers per `.cursor/rules/76-better-auth.mdc` §4: server-side helpers wrapping `auth.api.getSession({ headers: headers() })`; return `Result<Session, AppError>` so callers use RoP; redirect to `/sign-in` on missing session |
| `packages/auth/src/plugins/api-key.ts` | Create | Disabled stub: `// Phase 3 stub — API key plugin for v2/v3. DO NOT activate in v0. // Activation path: import { apiKey } from 'better-auth/plugins'; add to betterAuth({ plugins: [apiKey()] }). export const apiKeyPlugin = null; /* disabled */` |
| `packages/auth/src/index.ts` | Modify | Export `auth`, `authClient`, `requireSession`, `requireUser`, `Session`, `User`; do NOT export `apiKeyPlugin` |
| `packages/db/src/schema/auth.ts` | Create | better-auth Drizzle adapter tables (the adapter auto-generates these but explicit schema is safer): `users` (better-auth version — note: may conflict with existing `users` table; check adapter docs for `usePlural: true` or table prefix config); `sessions`, `accounts`, `verifications` tables; if better-auth extends the existing `users` table, use the `user` table config option to map to existing `users` table |
| `packages/db/src/schema/index.ts` | Modify | Export `auth.ts` schema |
| `packages/db/src/migrations/000N_better_auth_tables.sql` | Create | Generated by `drizzle-kit generate` after adding auth schema; document command: `cd packages/db && pnpm drizzle-kit generate` |

> **Critical schema note:** better-auth's Drizzle adapter creates `user`, `session`, `account`, `verification` tables. Our existing `users` table must either (a) be mapped via `user: { tableName: 'users', additionalFields: { passwordHash, creditBalance, ... } }` OR (b) the adapter creates a separate `better_auth_users` table with a FK to `users`. Option (a) is preferred — configure the adapter with `{ user: { modelName: 'user', tableName: 'users', additionalFields: { creditBalance: { type: 'number' }, graceUsed: { type: 'boolean' }, ... } } }` to reuse the existing users table.

### PR-2: Handler + session wiring (base: PR-1)

| Path | Operation | Notes |
|------|-----------|-------|
| `apps/web/app/api/auth/[...nextauth]/route.ts` | Delete | NextAuth route handler removed |
| `apps/web/app/api/auth/[...all]/route.ts` | Create | better-auth handler: `import { auth } from '@repo/auth'; export { auth as GET, auth as POST }` — or per better-auth Next.js docs: `import { toNextJsHandler } from 'better-auth/next-js'; import { auth } from '@repo/auth'; export const { GET, POST } = toNextJsHandler(auth);` |
| `apps/web/middleware.ts` | Modify | Replace NextAuth `withAuth` middleware with better-auth: `import { requireSession } from '@repo/auth'; export async function middleware(req) { const session = await auth.api.getSession({ headers: req.headers }); if (!session && isProtectedRoute(req.nextUrl.pathname)) { return NextResponse.redirect(new URL('/sign-in', req.url)); } return NextResponse.next(); }` |
| All `apps/web/src/` and `apps/web/app/` files with `getServerSession(authOptions)` | Modify | Replace with `import { requireSession } from '@repo/auth'; const sessionResult = await requireSession();` and unwrap with `if (sessionResult.isErr()) redirect('/sign-in');`; `const session = sessionResult.value;` |
| All `apps/web/src/` files with `session.user?.id as string` | Modify | Remove `as string` casts; `session.user.id` is properly typed as `string` |
| `apps/web/app/api/auth/[...nextauth]/` | Delete directory | No longer needed |

**Files likely containing `getServerSession`** (grep: `getServerSession` in `apps/web/`):
- `apps/web/app/` route handlers and server components that check auth
- `apps/web/src/application/auth/sign-in-usecase.ts`, `sign-up-usecase.ts`
- Any server action wrappers that extract `userId`

Run: `grep -r 'getServerSession\|authOptions\|next-auth' apps/web/src apps/web/app --include='*.ts' --include='*.tsx' -l` to find all files to update.

### PR-3: Cleanup + verification (base: PR-2)

| Path | Operation | Notes |
|------|-----------|-------|
| `packages/auth/package.json` | Modify | Remove `next-auth`, `@auth/prisma-adapter`; bump to `0.1.0`; add changeset |
| `packages/auth/src/auth-options.ts` | Delete | NextAuth era; replaced by `packages/auth/src/server.ts` |
| `apps/web/package.json` | Modify | Remove `next-auth` dep |
| `apps/web/lib/auth-options.ts` | Delete (if still exists) | Should already be gone from Phase 1; verify |
| `packages/db/src/schema/auth.ts` | Verify | All better-auth tables present; `drizzle-kit check` exits 0 |
| `docs/state/status.json` | Modify | Set `phase3.p3 = "complete"` and commit |
| `packages/auth/CHANGELOG.md` | Create | Via `changeset add` — documents the NextAuth → better-auth migration |

---

## Session Shape (post-migration)

better-auth session accessed server-side:

```typescript
import { auth } from '@repo/auth';
import { headers } from 'next/headers';

const session = await auth.api.getSession({ headers: headers() });
// session is: { user: { id: string; email: string; name: string; ... }, session: { ... } } | null
```

Via `requireSession` guard (Result pattern):

```typescript
import { requireSession } from '@repo/auth';

const result = await requireSession();
if (result.isErr()) redirect('/sign-in');
const { user } = result.value;
// user.id is string — no `as any`
```

---

## API Key Plugin Stub (v2/v3 future-proofing)

`packages/auth/src/plugins/api-key.ts` documents the activation path:

```typescript
// PHASE 3 STUB — API key plugin for v2/v3 activation
// 
// To activate in v2:
//   1. Import: import { apiKey } from 'better-auth/plugins';
//   2. Add to betterAuth({ plugins: [apiKey()] }) in server.ts
//   3. Generate Drizzle migration for the api_keys table
//   4. Expose POST /api/auth/api-key/create as a protected route
//   5. Update FA-account-session to include key management UI
//
// Schema that will be added (for planning reference only — do not create manually):
//   api_keys: { id, userId, name, keyHash, prefix, expiresAt, createdAt, lastUsedAt, enabled }
//
export const apiKeyPlugin = null; // disabled in v0
```

---

## Contracts Changed

None — Zod schemas in `@repo/contracts` are unchanged. Auth session shape changes internally; `userId` type (`string`) is unchanged in all use-case interfaces.

---

## Migrations

`packages/db/src/migrations/000N_better_auth_tables.sql` — generated by `drizzle-kit generate`. Adds `sessions`, `accounts`, `verifications` tables (and `users` fields if using `additionalFields`).

**Migration warning:** All existing NextAuth sessions are invalidated on cutover. This is acceptable for v0/staging. Document in PR description.

---

## Dependencies Added

| Package | Workspace | Version | Rationale |
|---------|-----------|---------|-----------|
| `better-auth` | `packages/auth` | `^1.0.0` | Locked decision: Drizzle-native auth with API-key plugin for v2/v3 |

---

## Tests

- `packages/auth/src/guards.test.ts` — unit test: `requireSession()` returns `Err` when no session; returns `Ok` with user when session exists (mock `auth.api.getSession`)
- E2E smoke (manual): `pnpm dev` in workspace; navigate to `/dashboard` without session → redirected to `/sign-in`; sign in with test credentials → session established; `session.user.id` accessible in server action

---

## Verification Gates

```bash
# PR-1 gate
pnpm -w run typecheck     # better-auth types compile; auth schema types resolve

# PR-2 gate
pnpm -w run typecheck     # no getServerSession imports remain
pnpm -w run build         # apps/web builds with new auth handler
grep -r 'getServerSession\|from.*.next-auth' apps/web/src apps/web/app --include='*.ts' --include='*.tsx' | wc -l  # must be 0

# PR-3 gate (final)
pnpm -w run typecheck
pnpm -w run build
pnpm -w run test
grep -r 'next-auth\|@auth/prisma-adapter' apps packages --include='*.json' --include='*.ts' | grep -v node_modules | wc -l  # must be 0
```

---

## Out of Scope

- Activating the API-key plugin (v2/v3 only)
- Adding OAuth providers (GitHub, Google, etc.) — credentials only in v0
- Magic link / email OTP — deferred
- Changing sign-in/sign-up UX pages — FA-account-session owns those
- Migrating existing production sessions — v0/staging only; sessions are invalidated

---

## Blocker Protocol

If `pnpm typecheck` fails or better-auth adapter produces schema drift:

1. **Stop** — do not open the next PR
2. Document in `docs/state/HANDOFF.md` under "Current Blocker"
3. Set `docs/state/status.json` → `phase3.p3 = "blocked"` + `phase3.blocker = "<summary>"`
4. Commit and push

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial — written for overnight pipeline; based on `.cursor/rules/76-better-auth.mdc` and scope slice | local-agent |
