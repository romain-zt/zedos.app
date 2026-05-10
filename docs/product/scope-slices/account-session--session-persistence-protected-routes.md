<!--
  Scope Slice — account-session: session persistence and protected routes
  Designed for better-auth (post-Phase 3). Do not implement against NextAuth.
  Produced: 2026-05-10 as part of FA-account-session redefinition.
-->

# Scope Slice: Session persistence and protected routes

## Parent Feature Area

[Account & session](../feature-areas/account-session.md)

## Status

`exploratory`

> **NEED_HUMAN:** true — Q-022 (what happens to in-progress draft data when a session expires mid-clarification?) is open. The answer may materially expand this slice's scope (requiring auto-save or a draft-recovery mechanism) or confirm that data loss on expiry is acceptable v0 behavior.
> **NEED_UPDATE:** false

---

## User Value

A signed-in founder can navigate freely across the web app and return across browser restarts without being signed out unexpectedly, and accessing any area that requires sign-in automatically redirects to sign-in — with the original destination preserved so the founder can pick up exactly where they left off.

---

## Exact Boundary

### Included Behavior

- **Session persistence across in-app navigation** — moving between pages, projects, or PRD versions does not trigger re-authentication; the signed-in state is maintained seamlessly.
- **Session persistence across browser refresh** — reloading a page does not end the session; the founder remains signed in.
- **Session persistence across browser restarts** — closing and reopening the browser within the session lifetime maintains the signed-in state (session lifetime: 7-day JWT, default from locked stack decision).
- **Protected-route redirect with return URL** — accessing a URL that requires a session without having one redirects the founder to the sign-in page, preserving the original destination so they land there after successful sign-in.
- **Explicit sign-out** — the founder can voluntarily end their session; the session is destroyed and they are returned to a public page (sign-in page or public landing).
- **Session expiry redirect** — when a session lifetime has elapsed and the founder accesses a protected area, they are redirected to sign-in (same behavior as no-session access); no silent failure or confusing blank state.
- **Public routes remain accessible without session** — the sign-up, sign-in, and share-link viewer pages do not require a session.

### Excluded Behavior

- **Sign-up and sign-in credential flows** — covered in the sibling slice `account-session--sign-up-sign-in`; this slice consumes the session created by that slice but does not define how credentials are validated.
- **Multi-device session management** — viewing active sessions across devices, revoking individual device sessions — not v0.
- **Session duration controls exposed to the user** — no "remember me" toggle, no "session expires in X" display; the 7-day default is a stack-level default, not a user-facing setting in v0.
- **Auto-save / draft recovery on session expiry** — whether the product preserves in-progress clarification session data across an expiry event is **out of scope for this slice pending Q-022**; if required, it would be addressed in the PRD versioning or guided clarification FA.
- **Step-up authentication** (re-entering password to access sensitive settings) — not v0.
- **Two-factor authentication, passkeys, device trust** — not v0.
- **Share-link access for anonymous viewers** — anonymous viewers access shared PRDs without a signed-in session; this is handled in the read-only sharing FA. This slice only governs the **owner's signed-in session**.
- **Rate limiting and IP-based blocking** — handled at middleware layer (separate concern per `.cursor/rules/76-better-auth.mdc` §5); not a product-visible behavior in this slice.
- **Profile or account settings protection** — profile editing is a deferred slice; whether its routes are protected follows from this slice's general principle (protected if it requires sign-in).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Active session — navigating | Founder moves between pages while session is valid | Signed-in state maintained; navigation feels seamless; no re-auth prompt |
| Active session — browser refresh | Founder reloads a signed-in page | Page reloads into the same signed-in state; no sign-in interruption |
| Active session — browser restart within session lifetime | Founder closes and reopens browser within 7-day session window | Returns to the signed-in web app; session is still active |
| No session — accessing protected route | Founder visits a signed-in-only URL without an active session (direct link, bookmark, or expired prior session) | Redirect to sign-in page; return URL preserved so founder lands at original destination after successful sign-in |
| Session expired — accessing protected route | Session lifetime has elapsed; founder visits a protected URL | Same UX as no-session: redirect to sign-in with return URL; no alarming error message |
| Session expiry during active use | Session expires while founder is actively using the web app | Next navigation to a protected route triggers redirect to sign-in; in-progress form state on the current page may be lost (extent depends on Q-022) |
| Explicit sign-out — success | Founder triggers sign-out action | Session destroyed; redirect to sign-in page (or public landing); clean state |
| Explicit sign-out — session already expired | Founder triggers sign-out when session had already timed out | Clean sign-out; redirect to sign-in page; no error |
| Public route — no session required | Founder accesses sign-in, sign-up, or a public share link URL | Page renders without requiring session; no redirect |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Signed-in session | Read (validate on protected route access); Delete (sign-out) | Session was created by the sign-up-sign-in slice; this slice reads and eventually destroys it |

---

## Credit / Payment Impact

None — session persistence and protected-route behavior do not consume credits, trigger balance checks, or initiate purchase flows.

---

## Sharing / Privacy Impact

This slice establishes the **session-presence boundary** that separates the private owner workspace from public-facing surfaces. Specifically:

- A route check (session present vs absent) determines whether a founder sees their private workspace or is redirected to sign-in.
- Anonymous share viewers access public PRD content via share links (read-only sharing FA) **without** a session; this slice must not treat a session-absent share-link viewer as a failed protected-route access — public routes must be explicitly whitelisted.
- The session check must not expose private workspace content (projects, PRD versions, question history) to unauthenticated requests.

This is a product-level privacy boundary, not a separate feature addition — it must be correct by design when this slice is implemented.

---

## Feedback / Instrumentation Impact

None — session persistence and route protection are not owner milestone events per `docs/prd/PRD.md` Learning/feedback. Sign-out is not a feedback trigger. Session expiry is not a feedback trigger.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| [Account & session FA](../feature-areas/account-session.md) | Feature Area | ready | Parent scope and solo-owner stance |
| [Sign-up and sign-in](./account-session--sign-up-sign-in.md) | Scope Slice | exploratory | The session that this slice persists is created by the sign-up-sign-in slice; implementation must follow that slice |
| Phase 3 Turborepo migration | Technical prerequisite | pending | better-auth session management lives in `packages/auth/`; implementation only after Phase 3 |
| better-auth installed and configured in `packages/auth/` | Technical prerequisite | pending | Session JWT (7-day default), `requireSession` guard helper, `requireUser` helper — all defined by better-auth post-migration; see `.cursor/rules/76-better-auth.mdc` §4 |
| Dashboard shell FA (`FA-dashboard-shell`) | Feature Area | exploratory | Protected routes redirect to sign-in; the product must have a clear list of which routes are protected vs public. Dashboard shell defines the signed-in navigation structure that this slice protects |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| **Q-022** — What is the expected product behavior when a founder's session expires during an active clarification session — is unsaved in-progress work preserved, or is loss acceptable for v0? If preservation is required, auto-save or draft recovery must be scoped (likely in the PRD versioning or guided clarification FA, not here), but the inter-FA dependency changes scope. | Finalising the acceptance-level outcome; cross-FA dependency mapping | true |
| **Route inventory** — The full list of protected vs public routes depends on what FAs and surfaces have been defined. As of this writing, the dashboard, project workspace, PRD editor, and question history are protected; sign-up, sign-in, and public share links are public. This list is incomplete until FA-dashboard-shell and FA-project-workspace are refined. | Completeness of the protected-route list; edge cases in the UX states for "public route no session required" | false — informational; can be refined without human decision, but should be revisited before promotion |

---

## Acceptance-Level Outcome

A founder with a valid session can navigate across any signed-in area of the web app — including page refreshes and browser restarts within the session lifetime — without being interrupted by sign-in prompts. A founder whose session has expired or who has no session is redirected to sign-in when they access a protected area, with their intended destination preserved, so they can resume immediately after authenticating. A founder who signs out explicitly has their session destroyed and lands on a public page. Anonymous share-link access (no session) reaches public share content without triggering the protected-route redirect.

---

## Scope Readiness Check (mental run against scope-readiness-checker.md)

| Check | Result | Notes |
|-------|--------|-------|
| SS-01 · Single user value | PASS | One sentence, no technical language |
| SS-02 · Boundary is exact | PASS | Included and excluded are exhaustive; adjacent concerns explicitly named and excluded |
| SS-03 · UX states enumerated | PASS | Active session, refresh, restart, no-session, expired, explicit sign-out, public route — all covered |
| SS-04 · No implementation details | PASS | No routes, components, DB tables, or framework references in slice body |
| SS-05 · Credit / payment impact assessed | PASS | None, with reason |
| SS-06 · Sharing / privacy impact assessed | PASS | Session-presence boundary explicitly described |
| SS-07 · Feedback / instrumentation impact assessed | PASS | None, with reason |
| SS-08 · Dependencies explicit | PASS | All named with status; cross-FA dependency on dashboard-shell noted |
| SS-09 · Blockers resolved or flagged | PASS | Q-022 flagged NEED_HUMAN=true; route-inventory gap flagged informational |
| SS-10 · Acceptance outcome is behavioral | PASS | Observable behavior described; no test cases or code |
| SS-11 · Status reflects readiness | PASS | `exploratory`; not `ready-for-user-stories` while Q-022 is open |
| CC-03 · v0 boundary not leaked | PASS | No subscriptions, multi-user, multi-device management, or BYOK |
| CC-04 · NEED_HUMAN propagates | PASS | Parent FA updated to NEED_HUMAN=true |

**Advancement verdict:** BLOCKED — SS-09 open (Q-022). Resolve Q-022 and confirm route inventory before promoting to `ready-for-user-stories`.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated (including error and empty states)
- [x] Business objects named
- [x] Credit / payment impact assessed
- [x] Sharing / privacy surface assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [ ] All blockers resolved or NEED_HUMAN=true explicitly set — **OPEN**: Q-022 (session expiry + in-progress data behavior) needs human decision
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** NOT READY — pending Q-022.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial definition — designed for better-auth (post-Phase 3); covers session persistence, protected-route redirect, and sign-out as one coherent slice | cloud-agent |
