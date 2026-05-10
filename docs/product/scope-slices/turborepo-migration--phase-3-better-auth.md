<!--
  Scope Slice — Turborepo Migration Phase 3: NextAuth → better-auth
  Parent Feature Area: turborepo-migration
  Governed by: .cursor/rules/feature-area-workflow.mdc
-->

# Scope Slice: Turborepo Migration — Phase 3: better-auth

## Parent Feature Area

[Turborepo migration](../feature-areas/turborepo-migration.md)

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Authentication runs through better-auth — the locked-decision replacement for NextAuth — giving the codebase a Drizzle-native auth layer with a properly typed session (`session.user.id` is `string`, never `string | undefined`), a composable plugin model that supports API keys in v2/v3, and server guards that integrate cleanly with Next.js App Router server actions and middleware.

---

## Exact Boundary

### Included Behavior

- `packages/auth/` created with structure per `.cursor/rules/76-better-auth.mdc` §2: `src/server.ts` (better-auth instance), `src/client.ts` (React client), `src/adapter.ts` (Drizzle adapter wiring against `@repo/db`), `src/types.ts` (Session + User augmentations), `src/guards.ts` (`requireSession`, `requireUser`), `src/index.ts`; `packages/auth/package.json` with `"name": "@repo/auth"`
- `apps/web/app/api/auth/[...all]/route.ts` rewritten to mount the better-auth handler (`auth.handler`) — no business logic in the route
- `apps/web/middleware.ts` updated to use `@repo/auth`'s `requireSession` guard for protected routes
- `apps/web/lib/auth-options.ts` deleted; `@repo/auth` (NextAuth-based, from Phase 1) replaced by the better-auth `@repo/auth` package
- better-auth Drizzle adapter tables (`users`, `sessions`, `accounts`, `verifications`) added to `packages/db/src/schema/auth.ts`; migration generated (`drizzle-kit generate`) as `000N_better_auth_tables.sql`
- `packages/auth/src/plugins/api-key.ts` scaffolded as a disabled plugin stub — not activated, not exposed in v0; documents the v2/v3 activation path
- All `import { getServerSession } from 'next-auth'` replaced with `@repo/auth` session reads in `apps/web/src/` and `apps/web/app/`
- `@auth/prisma-adapter` and `next-auth` removed from `packages/auth/package.json` and `apps/web/package.json`
- `@repo/auth` package version bumped; changelog entry added via `changeset add`

### Excluded Behavior

- Activating the API-key plugin (v2/v3 only — stub is created but disabled)
- Adding OAuth providers (GitHub, Google, etc.) — credentials provider only in v0 per PRD
- Magic link / email OTP flows — deferred to a dedicated `FA-account-session` slice
- Changing the sign-up or sign-in UX pages — `FA-account-session` owns user-visible auth surfaces
- Changing any credit, PRD, or project logic — only the auth wiring changes
- Migrating existing user sessions — all active sessions are invalidated on better-auth cutover; this is acceptable in a dev/staging environment

---

## UX States

No end-user UX change beyond session invalidation on cutover. Engineering-facing states:

| State | When | What the engineer sees / experiences |
|-------|------|---------------------------------------|
| Auth route mounts | After handler wiring | `GET /api/auth/session` returns a valid better-auth session response |
| Session typed | After `@repo/auth` | `session.user.id` resolves as `string` in all server-component and server-action call sites; TypeScript reports no `as any` needed |
| Middleware guards work | After `middleware.ts` update | Unauthenticated requests to `/dashboard/*` redirect to `/sign-in`; authenticated requests pass through |
| DB tables created | After migration | `better_auth_users`, `better_auth_sessions`, `better_auth_accounts`, `better_auth_verifications` tables exist in DB; `drizzle-kit check` exits 0 |
| Old adapter gone | After cleanup | No `next-auth` or `@auth/prisma-adapter` import exists anywhere in `apps/` or `packages/` |
| Build passes | After all | `pnpm build` succeeds; no missing type augmentations |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| `packages/auth/` | Created | better-auth server, client, adapter, guards, API-key stub |
| `packages/db/src/schema/auth.ts` | Modified | better-auth tables added (users, sessions, accounts, verifications) |
| `packages/db/src/migrations/000N_better_auth_tables.sql` | Created | Schema migration for better-auth tables |
| `apps/web/app/api/auth/[...all]/route.ts` | Modified | Mounts better-auth handler |
| `apps/web/middleware.ts` | Modified | Uses `@repo/auth` guards |
| `apps/web/lib/auth-options.ts` | Deleted | Replaced by `packages/auth/` |
| Auth session object | Migrated | NextAuth `Session` → better-auth `Session`; `user.id` properly typed |

---

## Credit / Payment Impact

None — credit deduction and grant paths are not changed by this slice. Auth session identity (`userId`) is still resolved before credit checks, and the shape of `userId` is unchanged (string UUID).

---

## Sharing / Privacy Impact

None — share link access is unauthenticated (anonymous readers); authenticated share-link creation is not changed in this slice.

---

## Feedback / Instrumentation Impact

None — no feedback prompt or attribution in this slice.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Phase 0 scaffold complete | Scope Slice | pending | pnpm workspace and `apps/web/` must exist |
| Phase 1 package extraction complete | Scope Slice | pending | `packages/auth/` initially created in Phase 1 (NextAuth wrapper); Phase 3 replaces it with better-auth |
| Phase 2 Drizzle migration complete | Scope Slice | pending | `@repo/db` Drizzle schema must exist so the better-auth Drizzle adapter can wire against it |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| Phase 2 not yet executed | All sub-steps | false |

---

## Acceptance-Level Outcome

An engineer running `pnpm dev` sees the application start. Visiting `/dashboard` without a session redirects to `/sign-in`. Signing in via the credentials provider creates a better-auth session. `session.user.id` is a non-nullable string accessible in server actions and server components with no `as any` cast. No `next-auth` package appears in `pnpm list`. `pnpm build` and `pnpm typecheck` pass. The `api-key` plugin stub exists in `packages/auth/src/plugins/api-key.ts` with a comment documenting the v2/v3 activation path.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [ ] UX states enumerated (engineering-facing only — acceptable for migration slice)
- [x] Business objects named
- [x] Credit / payment impact assessed (none)
- [x] Sharing / privacy surface assessed (none)
- [x] Feedback / instrumentation impact assessed (none)
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral

**Verdict:** NOT READY — depends on Phase 2 executing first. Promote to ready-for-user-stories after Phase 2 merges.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial scaffold from `docs/retro/zedos-monorepo-retro.md` §6 and `.cursor/rules/76-better-auth.mdc` | Cloud Agent |
