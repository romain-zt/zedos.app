<!--
  Feature Area — updated 2026-05-10 to reflect better-auth context, expanded scope
  (session persistence + protected routes), and Phase 3 implementation dependency.
  Original scaffold: /feature-area scaffold, 2026-05-09.
-->

# Feature Area: Account & session

## Status

`validated`

> **NEED_HUMAN:** true — open blockers in child scope slices (Q-021: email verification required before first access; Q-022: session expiry behavior during active work). Resolving these does not block FA-level validity; it blocks slice promotion to `ready-for-user-stories`.
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Product Surface (Buyer entry point; Merchant operating surface); § Operating Model; § Feature Groups (FG-PRD-V0 — Auth shell); § Flow Inventory (Sign up / sign in); § Core User Journeys (1)
- Related open questions: Q-021 (email verification), Q-022 (session expiry + in-progress data), Q-023 (profile editing scope)
- Related product decisions: none
- Locked stack decision: authentication framework = better-auth (post-Phase 3 migration). See `docs/state/HANDOFF.md` §6 and `.cursor/rules/76-better-auth.mdc`.

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
- Waitlist-only or invite-only acquisition as the **default** v0 path (non-default experiments are out unless PRD changes).
- Separate merchant or admin persona (same signed-in founder is the operating surface in v0).
- OAuth / social sign-in providers (Google, GitHub, etc.) — require explicit product decision; not v0 baseline.
- API keys for programmatic access — planned for v2/v3 only per `.cursor/rules/76-better-auth.mdc` §6.
- Multi-device session management (view active sessions, revoke individual devices) — not v0.
- Two-factor authentication, step-up auth, passkeys — not v0.
- Profile editing (display name, password change, email change) — candidate for a future scope slice; not in the two slices defined for Phase 3 launch.
- Account deletion / data export — deferred post-v0.

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
| Phase 3 Turborepo migration | pending | better-auth requires the monorepo layout (`packages/auth/`) to be in place before this FA can be implemented |
| better-auth installation in `packages/auth/` | pending | Locked stack decision; implementation only after Phase 3 completes; see `.cursor/rules/76-better-auth.mdc` |
| Dashboard shell FA (`FA-dashboard-shell`) | exploratory | Protected-route redirect destination; landing page post-auth; slices can be designed in parallel but implementation depends on shell existing |

---

## Risks

- If signup friction is high (e.g. required email verification step adds confusion), founders never reach PRD value — balance with fraud/abuse concerns outside this FA's boundary. Pending Q-021.
- Session expiry during an active clarification session could destroy unsaved work if no auto-save exists — product-level decision required (Q-022) before session-persistence slice can be fully refined.
- The auth method choice (email+password as v0 baseline) is locked; adding OAuth providers later will require a new product decision and may surface migration concerns for existing email-only accounts.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| Q-021: Is email verification required before a founder's first access? | sign-up-sign-in slice UX states; readiness for user stories | true |
| Q-022: What happens to in-progress draft data when a session expires mid-clarification? | session-persistence slice scope boundary | true |
| Q-023: Is profile editing (name, password change, email change) a v0 requirement or deferred? | FA completeness — determines whether a third slice is needed | true |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| Sign-up and sign-in | Founder creates a new account or signs back in via email and password; arrives at the signed-in dashboard. Covers both new-account and returning-owner paths. | exploratory |
| Session persistence and protected routes | Signed-in session survives navigation and browser refresh; protected-only areas redirect to sign-in when no session; sign-out destroys session cleanly. | exploratory |
| Profile settings | Founder views and updates account details (display name, password change, email change). | candidate — deferred pending Q-023 |

> **Note on superseded slices:** Earlier scaffold slices `account-session--signup-to-signed-in-dashboard.md` and `account-session--returning-owner-sign-in.md` are superseded by the `sign-up-sign-in` slice above, which merges both paths and adds better-auth-era context. Those files are retained for audit history.

---

## Readiness Verdict

- [x] PRD source sections read
- [x] Product intent stated without technical language
- [x] Business objects enumerated
- [x] User journeys identified
- [x] In-scope / out-of-scope explicitly separated
- [x] No unresolved PRD open questions affecting the FA-level decomposition
- [x] Deferred behaviors explicitly named
- [x] Candidate Scope Slices are individually small enough

**Verdict:** READY FOR SCOPE SLICES — two primary slices defined (sign-up-sign-in; session-persistence-protected-routes). Implementation blocked on Phase 3 completion. Slice promotion to `ready-for-user-stories` additionally blocked on Q-021 and Q-022.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-09 | Initial scaffold from approved Feature Area map (`/feature-area scaffold`) | — |
| 2026-05-09 | Promoted to validated after CLEAR readiness check (`/feature-area promote`) | — |
| 2026-05-10 | Expanded In Scope (session persistence, protected routes, sign-out); added Phase 3 / better-auth dependency; updated Candidate Scope Slices to reflect sign-up-sign-in + session-persistence slices; set NEED_HUMAN=true (Q-021, Q-022, Q-023 surfaced by slice definitions); added profile settings as candidate-deferred | cloud-agent |
