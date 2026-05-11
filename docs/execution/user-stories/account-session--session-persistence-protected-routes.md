# User Story: Session persistence and protected routes

## Parent Scope Slice

[Session persistence and protected routes](../../product/scope-slices/account-session--session-persistence-protected-routes.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want my session to persist across navigation and restarts within the configured lifetime, and I want any attempt to reach a protected area without a valid session to send me to sign-in with my original destination preserved, so that I can resume work without confusion or lost context.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | No active session | The user requests a protected URL | They are redirected to the sign-in experience with the original path (and query) preserved for return after sign-in |
| AC-2 | Session expired or invalid | The user navigates to a protected route | The same redirect and return-URL behavior applies as for no session |
| AC-3 | A valid session | The user moves within the signed-in app | They are not prompted to sign in again for routine navigation |
| AC-4 | A valid session | The user refreshes the browser on a signed-in page | They remain signed in |
| AC-5 | Public entry points | The user opens sign-in, sign-up, auth API routes, or a share viewer URL without a session | Those routes load without being forced through a session gate |
| AC-6 | The user chooses to sign out | They confirm sign-out | The session ends and they land on the sign-in experience |

---

## Test Plan

- [ ] Manual: unauthenticated visit to a protected deep link shows sign-in and successful login returns to the deep link (e2e)
- [ ] Manual: sign-out from the dashboard clears session and shows sign-in (e2e)
- [ ] `pnpm --filter @repo/auth run typecheck` and `pnpm --filter @repo/web run typecheck` after changes (integration)

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `apps/web/middleware.ts` (predicted, new) | new | Edge route protection and public allowlist |
| `packages/auth` middleware guard (predicted, new) | new | Edge-safe session check with Result |
| `apps/web/app/**/layout.tsx` (dashboard) (predicted, modify) | modify | Server guard alignment with sign-in redirect |
| `apps/web/app/_actions/sign-out.ts` (predicted, new) | new | Server sign-out and redirect |

---

## Out of Scope

- Credential entry and validation flows (sibling slice)
- Multi-device session list or revocation
- User-visible session duration controls
- Rate limiting and IP blocking as a product behavior

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| — | None | — | — |

---

## Decision References

- Stack: better-auth session JWT (7-day default) — see `docs/state/status.json` locked decisions
- none

---

## Readiness for Implementation Plan

- [x] Story expressed in user-value terms (no implementation language)
- [x] Acceptance Criteria cover protected redirect, return URL, public routes, sign-out, expiry equivalence
- [x] Test plan names test type for each item
- [x] Touched Files (predicted) is non-empty
- [x] Out of Scope is non-empty
- [x] All Open Questions either answered or carry an explicit next action
- [x] Decision references resolved (or `none` stated explicitly)

**Verdict:** READY FOR IMPLEMENTATION PLAN

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial story for Slice 2 | Cloud Agent |
