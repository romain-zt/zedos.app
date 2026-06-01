<!--
  Feature Area — updated 2026-06-01 (Q-021–023 resolved; Phase 3 complete)
  Original scaffold: /feature-area scaffold, 2026-05-09.
-->

# Feature Area: Account & session

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Product Surface (Buyer entry point; Merchant operating surface); § Operating Model; § Feature Groups (FG-PRD-V0 — Auth shell); § Flow Inventory (Sign up / sign in); § Core User Journeys (1)
- Related open questions: Q-021, Q-022, Q-023 (answered — see `docs/prd/questions/open-questions.md`)
- Related product decisions: none
- Locked stack decision: authentication framework = better-auth. See `docs/state/HANDOFF.md` §6 and `.cursor/rules/76-better-auth.mdc`.

---

## Product Intent

Solo founders can discover Zedos through open signup, create an account, and stay signed in as the **single owner** of their workspace. Sessions persist across page navigation and browser restarts, and any area requiring sign-in redirects cleanly to the sign-in page rather than showing an error. This area exists so every other v0 capability can assume a clear, accountable, authenticated identity — without team or invite flows.

---

## In Scope

- Public self-serve signup as the default v0 entry (no waitlist or invite gate as the default).
- Sign-in for returning owners so they reach their signed-in experience.
- Session semantics consistent with **one account owns projects and PRDs** (solo v0).
- **Session persistence** across page navigation and browser refresh — founder stays signed in without unexpected logouts.
- **Protected-route redirect** — accessing a signed-in-only area without a session redirects to sign-in with a return path preserved.
- **Sign-out** — founder can explicitly terminate their session and be returned to a public page.

## Out of Scope

- Multi-user collaboration: invites, roles, co-editing (PRD Hard v0 exclusions).
- Waitlist-only or invite-only acquisition as the **default** v0 path.
- Separate merchant or admin persona.
- OAuth / social sign-in providers — require explicit product decision; not v0 baseline.
- API keys for programmatic access — planned for v2/v3 only.
- Multi-device session management (view active sessions, revoke individual devices) — partial: settings page lists sessions; full device management not v0-critical.
- Two-factor authentication, step-up auth, passkeys — not v0.
- **Full profile settings slice** (display name beyond basics) — deferred post-v0 per Q-023; **minimal account settings** (email change, password change, consent, session list) shipped in `apps/web/app/dashboard/settings/` as operational convenience, not a separate promoted slice.
- Account deletion / data export — deferred post-v0 (API routes may exist for compliance scaffolding).

---

## Business Objects Touched

| Object | Relationship |
|--------|----------------|
| User account | Create on signup; authenticate returning owner; scope ownership of workspace |
| Signed-in session | Create on successful auth; persist across navigation; destroy on sign-out or expiry |

---

## User Journeys Touched

- Journey 1 — Sign up → land in dashboard (session establishes access to downstream flows).

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| PRD identity stance (solo, open signup) | ready | Grounded in Product Surface / Operating Model |
| Phase 3 Turborepo migration | complete | `packages/auth/` + better-auth in production |
| Dashboard shell FA (`FA-dashboard-shell`) | complete | Post-auth landing and protected routes |

---

## Risks

- Signup friction vs fraud — v0 uses no email verification gate (Q-021).
- Session expiry during clarification — acceptable data loss on expiry for session slice (Q-022); auto-save belongs to PRD/clarification FAs.

---

## Open Blockers

None.

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| Sign-up and sign-in | Founder creates a new account or signs back in via email and password; arrives at the signed-in dashboard. | complete (orchestration) |
| Session persistence and protected routes | Signed-in session survives navigation; protected routes redirect to sign-in; sign-out destroys session cleanly. | complete (orchestration) |
| Profile settings (extended) | Full profile product slice — deferred post-v0 per Q-023. | candidate — deferred |

---

## Readiness Verdict

- [x] PRD source sections read
- [x] Product intent stated without technical language
- [x] Business objects enumerated
- [x] User journeys identified
- [x] In-scope / out-of-scope explicitly separated
- [x] No unresolved PRD open questions affecting this area
- [x] Deferred behaviors explicitly named
- [x] Candidate Scope Slices are individually small enough

**Verdict:** CLEAR — implementation complete for v0 slices; extended profile remains deferred.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-09 | Initial scaffold | — |
| 2026-05-09 | Promoted to validated | — |
| 2026-05-10 | Expanded scope; Phase 3 dependency | cloud-agent |
| 2026-06-01 | Cleared Q-021–023 blockers; NEED_HUMAN false; slices marked complete; noted settings page vs deferred profile slice | agent |
