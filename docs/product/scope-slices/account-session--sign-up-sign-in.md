<!--
  Scope Slice — account-session: sign-up and sign-in flows
  Designed for better-auth (post-Phase 3). Do not implement against NextAuth.
  Produced: 2026-05-10 as part of FA-account-session redefinition.
-->

# Scope Slice: Sign-up and sign-in

## Parent Feature Area

[Account & session](../feature-areas/account-session.md)

## Status

`exploratory`

> **NEED_HUMAN:** true — Q-021 (email verification required before first access?) is open and directly affects the UX state inventory for sign-up. The slice can be designed in full but cannot be promoted to `ready-for-user-stories` until Q-021 is answered.
> **NEED_UPDATE:** false

---

## User Value

A founder can create a new account using email and password, or sign back in as a returning owner, and arrive at the signed-in web app ready to start PRD work — without friction, without losing account context.

---

## Exact Boundary

### Included Behavior

- **Public self-serve signup via email and password** — a new founder provides an email address and password to create an account; this is the v0 default entry path (aligned with PRD Buyer entry point: open self-serve, no waitlist/invite gate).
- **Sign-in via email and password** for a returning owner — existing credentials authenticate the founder and restore their signed-in state.
- **Single-owner account creation** — the resulting account scopes ownership of all projects and PRDs to one person (solo v0; no team/invite flow).
- **Landing at the signed-in dashboard** after successful signup or sign-in, consistent with Journey 1 (Sign up → land in dashboard; `docs/prd/PRD.md` Core User Journeys).
- **Redirect to sign-in** when a founder tries to access a protected area without an active session (hand-off to session-persistence slice behavior, but sign-in form is the target).
- **Redirect to dashboard** when a signed-in founder navigates to the sign-up or sign-in page (already authenticated — no need to re-auth).

### Excluded Behavior

- **OAuth / social sign-in providers** (Google, GitHub, Apple, etc.) — not v0 baseline; activation requires explicit product decision per locked stack rule. Excluded from this slice.
- **Magic link / passwordless email sign-in** — not the v0 baseline authentication method; deferred pending a product decision.
- **Invite-only or waitlist-only signup as the default path** — PRD anchors default entry as public open signup.
- **Multi-user collaboration** (invites, roles, co-editing) — PRD Hard v0 exclusion.
- **Email verification** flow and resulting states — pending Q-021; scope of this slice changes depending on the answer. If required: additional UX states and a "verify your email" intermediate step must be added. Currently: **excluded pending human decision**.
- **Session persistence across navigation** — covered in the sibling slice `account-session--session-persistence-protected-routes`.
- **Profile editing** (display name, password change, email change) — deferred to a future scope slice.
- **Credit balance display** at sign-up/sign-in moment — credit system is a separate Feature Area; no credit interaction in this slice.
- **Share link access** for anonymous viewers — separate Feature Area (read-only sharing).
- **Password reset / forgot-password flow** — a necessary companion but treated as a distinct user journey; its inclusion here is a NEED_HUMAN question (see Blockers).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Sign-up form (empty) | Founder navigates to the sign-up URL with no active session | Email field, password field, submit / create account button, link to sign-in for returning owners |
| Sign-in form (empty) | Founder navigates to the sign-in URL with no active session | Email field, password field, submit / sign-in button, link to sign-up for new founders |
| Submitting | Founder submits either form | Submit button disabled or shows loading state; form fields non-interactive |
| Validation error — field level | Invalid email format, password below minimum length, or required field left blank | Inline error message per offending field; form not submitted |
| Sign-up error: email already registered | Signup attempt with an email that already has an account | Error message indicating the email is taken; link to sign-in offered |
| Sign-in error: invalid credentials | Submitted email and password do not match any account | Generic error message (no hint of which field is wrong, to avoid email enumeration) |
| Rate-limited | Too many failed attempts in a short window | Error message directing the founder to wait before retrying |
| Success — new account created | Signup completes and session is established | Redirect to signed-in dashboard; founder is now in their workspace |
| Success — returning founder signed in | Sign-in completes and session is established | Redirect to signed-in dashboard (or the original protected URL if sign-in was triggered by a redirect) |
| Already signed in visiting sign-up or sign-in | Founder navigates to auth pages while holding a valid session | Redirect to signed-in dashboard; auth pages not shown while signed in |
| *Email verification — pending Q-021* | *If email verification is required: after sign-up, before first dashboard access* | *"Check your inbox" state; resend verification email option; access blocked until verified* |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| User account | Create (sign-up); Read / verify credentials (sign-in) | Email is the unique identifier; single-owner account |
| Signed-in session | Create | Established on successful auth; scope = one owner; session lifecycle is managed in the sibling session-persistence slice |

---

## Credit / Payment Impact

None — no credit deduction, balance check, recharge modal, purchase, or auto-reload interaction occurs during account creation or sign-in.

---

## Sharing / Privacy Impact

None — this slice operates on the private signed-in surface only. It does not create, modify, or expose share links. Anonymous viewers reach the product via share links (separate FA), not via this sign-in flow.

---

## Feedback / Instrumentation Impact

None — sign-up and sign-in are not owner milestone events per `docs/prd/PRD.md` Learning/feedback (§ Success Metrics). Milestone prompts fire after PRD-related actions (first PRD version created, PRD version updated, PRD shared, PRD reopened by owner after generation). Sign-in alone does not trigger a feedback prompt.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| [Account & session FA](../feature-areas/account-session.md) | Feature Area | ready | Parent boundaries and solo-owner stance |
| Phase 3 Turborepo migration | Technical prerequisite | pending | better-auth lives in `packages/auth/` (post-migration layout); this slice must not be implemented against NextAuth |
| better-auth installed and configured in `packages/auth/` | Technical prerequisite | pending | Locked stack decision; email+password baseline per `.cursor/rules/76-better-auth.mdc` §5; implementation only after Phase 3 |
| Dashboard shell FA (`FA-dashboard-shell`) | Feature Area | exploratory | The signed-in dashboard that founders land on after auth; implementation order: shell should exist before auth redirect targets it |
| [Session persistence and protected routes](./account-session--session-persistence-protected-routes.md) | Scope Slice | exploratory | Sign-in creates a session; persistence and protected-route redirect are covered in the sibling slice |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| **Q-021** — Is email verification required before a founder's first access to the signed-in web app? If required, an intermediate "verify your email" state must be added and the acceptance outcome changes materially. | Finalising UX states (sign-up flow); promoting slice to `ready-for-user-stories` | true |
| **Password reset / forgot-password scope** — Is the "forgot password" / password reset flow included in this slice, or is it a separate slice? The sign-in form typically links to it, but it involves additional UX states and account security flows. | Completeness of the sign-in form UX boundary | true |

---

## Acceptance-Level Outcome

A founder with no account can complete **public self-serve signup** using email and password, arrive **signed in** at the web app's post-auth entry, and the product attributes **solo ownership** of all projects and PRDs to that account. A returning founder can authenticate with their credentials and resume the **same signed-in experience** — without multi-user, OAuth, or payment flows in this slice, and without the signed-in session expiring unexpectedly within this slice's boundary.

---

## Scope Readiness Check (mental run against scope-readiness-checker.md)

| Check | Result | Notes |
|-------|--------|-------|
| SS-01 · Single user value | PASS | One sentence, no technical language |
| SS-02 · Boundary is exact | PASS | Included and excluded are exhaustive; overlap with sibling slice noted |
| SS-03 · UX states enumerated | CONDITIONAL PASS | Happy path, errors, edge cases covered; email-verification state marked pending Q-021 |
| SS-04 · No implementation details | PASS | No routes, components, DB tables, or framework choices in slice body |
| SS-05 · Credit / payment impact assessed | PASS | None, with reason |
| SS-06 · Sharing / privacy impact assessed | PASS | None, with reason |
| SS-07 · Feedback / instrumentation impact assessed | PASS | None, with reason |
| SS-08 · Dependencies explicit | PASS | All named with status |
| SS-09 · Blockers resolved or flagged | PASS | Q-021 and password-reset scope flagged with NEED_HUMAN=true |
| SS-10 · Acceptance outcome is behavioral | PASS | Observable behavior described; no test cases or code |
| SS-11 · Status reflects readiness | PASS | `exploratory`; not `ready-for-user-stories` while Q-021 and password-reset blocker are open |
| CC-03 · v0 boundary not leaked | PASS | No subscriptions, multi-user, PDF export, or BYOK |
| CC-04 · NEED_HUMAN propagates | PASS | Parent FA updated to NEED_HUMAN=true |

**Advancement verdict:** BLOCKED — SS-09 open (Q-021, password-reset scope). Resolve both before promoting to `ready-for-user-stories`.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [ ] UX states enumerated (including error and empty states) — **PARTIAL**: email-verification state pending Q-021
- [x] Business objects named
- [x] Credit / payment impact assessed
- [x] Sharing / privacy surface assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [ ] All blockers resolved or NEED_HUMAN=true explicitly set — **OPEN**: Q-021 (email verification) and password-reset scope need human decisions
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** NOT READY — pending Q-021 and password-reset scope decision.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial definition — designed for better-auth (post-Phase 3); replaces and expands the earlier `signup-to-signed-in-dashboard` and `returning-owner-sign-in` scaffold slices | cloud-agent |
