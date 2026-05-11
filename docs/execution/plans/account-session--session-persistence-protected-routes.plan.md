# Implementation Plan: Session persistence and protected routes

## Parent User Story

[Session persistence and protected routes](../user-stories/account-session--session-persistence-protected-routes.md)

## Status

`executed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Add Next.js middleware that checks for an active better-auth session using an edge-compatible guard that delegates to the same session source as server code (HTTP `get-session` with forwarded cookies), returning `Result` for failures. Unauthenticated users hitting non-public paths are redirected to `/sign-in` with `from` capturing the requested path and query. Public paths include sign-in, sign-up, legacy login/signup aliases, auth API routes, share viewer prefixes, and static assets. Provide a server action that calls `auth.api.signOut` and redirects to `/sign-in`. Reuse existing JWT session duration in `packages/auth` (7-day default). Align dashboard and home redirects with the canonical sign-in route; add thin `/sign-in` and `/sign-up` routes that forward to existing pages so middleware and links stay consistent.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (post-Phase 3) |
| Auth source-of-truth | better-auth |
| Async/sync boundary | synchronous per request |
| Transaction boundary | per use-case (n/a for this slice) |
| External dependencies | none added |
| Payment shape (if money) | n/a |

### Surface Blockers

- none

---

## Layers Affected

- [ ] `domain` — none
- [ ] `application` — none
- [ ] `contracts` — none
- [x] `infrastructure` — `@repo/auth` edge guard + package export
- [x] `app` (routes, server actions, server components) — middleware, sign-out action, redirect routes, layout/home/shell alignment
- [ ] `ui` — none
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/middleware.ts` | add | Edge protection + public allowlist |
| `packages/auth/src/guards-middleware.ts` | add | `requireSession(Request)` via get-session + Result |
| `packages/auth/package.json` | modify | Export `guards-middleware` |
| `apps/web/app/_actions/sign-out.ts` | add | Server sign-out + redirect |
| `apps/web/app/sign-in/page.tsx` | add | Canonical URL → existing `/login` |
| `apps/web/app/sign-up/page.tsx` | add | Canonical URL → existing `/signup` |
| `apps/web/app/login/page.tsx` | modify | Honor `from` as post-login destination |
| `apps/web/app/page.tsx` | modify | Unauthenticated → `/sign-in` |
| `apps/web/app/dashboard/layout.tsx` | modify | Redirect guard → `/sign-in` |
| `apps/web/app/dashboard/projects/[id]/page.tsx` | modify | Redirect guard → `/sign-in` |
| `apps/web/app/dashboard/_components/dashboard-shell.tsx` | modify | signOut callback → `/sign-in` |
| `docs/execution/user-stories/account-session--session-persistence-protected-routes.md` | add | Governance |
| `docs/execution/plans/account-session--session-persistence-protected-routes.plan.md` | add | Governance |
| `docs/state/status.json` | modify | Slice 2 + orchestration step complete |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| n/a | — | — |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| n/a | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| Manual verification (see Test plan in User Story) | e2e | Protected redirect, return URL, sign-out |

---

## Dependencies Added

- none

---

## Rollback

- Revert middleware and auth package export; remove new routes and server action; restore prior redirects. No schema changes.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Middleware fetch to get-session misconfigured in non-standard deployments | low | false negatives/positives | Same origin URL from request; forward Cookie header |

---

## Out of Scope (deliberate)

- IP rate limiting in middleware (separate hardening)
- Replacing legacy `/login` and `/signup` implementations entirely

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | Auth stays in `packages/auth`; no cross-layer leaks |
| scope-critic | PASS | Matches slice boundary |

---

## Approval

- [x] User reviewed and approved this Plan
- [x] Patch Intent Summary will be produced before any code edit
- [x] Verification steps (typecheck / lint / test / build) defined in §Tests above

**Approval status:** approved
**Approval date:** 2026-05-11 (executed-by-orchestrator)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial plan; marked executed after implementation | Cloud Agent |
