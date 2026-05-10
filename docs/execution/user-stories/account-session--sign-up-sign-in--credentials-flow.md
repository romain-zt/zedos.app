<!--
  User Story — account-session: sign-up and sign-in via email + password
  Parent Scope Slice: docs/product/scope-slices/account-session--sign-up-sign-in.md
  Governed by: .cursor/rules/70-execution-bridge.mdc
  Authored by: local-agent (overnight pre-fill)
  Implementation prerequisite: Phase 3 better-auth must be complete (@repo/auth with better-auth installed)
-->

# User Story: Sign-up and Sign-in via Email + Password

## Parent Scope Slice

[account-session — Sign-up and sign-in](../../product/scope-slices/account-session--sign-up-sign-in.md)

## Status

`draft`

> **NEED_HUMAN:** true — Q-021 (email verification before first access?) and password-reset scope are open blockers on the parent slice. This User Story covers the unambiguous portion of the slice (credentials flow, validation errors, session creation, redirects). The "email verification" AC row is marked `[PENDING Q-021]` and must be resolved before this story can be promoted to `ready-for-implementation`.
> **NEED_UPDATE:** false

---

## Story

As a founder, I want to create an account with my email and password or sign back in with my credentials, so that I arrive at the signed-in workspace ready to start PRD work.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | No account exists for an email | Founder submits a valid email and password (≥8 chars) on the sign-up form | A new user account is created; a signed-in session is established; founder is redirected to the dashboard (`/dashboard`) |
| AC-2 | A valid account exists | Founder submits their email and correct password on the sign-in form | Founder's existing session is established; founder is redirected to the dashboard |
| AC-3 | Founder navigates to `/sign-in` with a valid session already active | Page renders | Founder is redirected to `/dashboard`; sign-in form is not shown |
| AC-4 | Founder navigates to `/sign-up` with a valid session already active | Page renders | Founder is redirected to `/dashboard` |
| AC-5 | Sign-up form submitted | Email field contains an invalid format (e.g. `notanemail`) | Sign-up is rejected with an inline validation error on the email field; no account is created |
| AC-6 | Sign-up form submitted | Password is fewer than 8 characters | Sign-up is rejected with an inline validation error on the password field; no account is created |
| AC-7 | Existing account with email `founder@example.com` | Founder attempts to sign up again with `founder@example.com` | Sign-up form shows an error indicating the email is already registered; a link to sign in is offered; no duplicate account is created |
| AC-8 | Sign-in form submitted | Email and password do not match any account | Sign-in form shows a generic error ("Invalid email or password"); no hint about which field is wrong (anti-enumeration); no session is created |
| AC-9 | Founder signs in from a redirect (e.g. was accessing `/dashboard/projects/123`) | Credentials are valid | After sign-in, founder is redirected to the original destination (`/dashboard/projects/123`), not to the generic dashboard |
| AC-10 | Any form | Submit button is clicked | Submit button enters a disabled/loading state while the request is in flight; form fields are non-interactive |
| AC-11 | [PENDING Q-021] | Founder completes sign-up | If email verification is required: founder sees a "Check your inbox" page; dashboard access is blocked until the email link is clicked | ← **Human decision required on Q-021 before implementing** |
| AC-12 | [PENDING blocker 2] | Founder clicks "Forgot password?" | Password reset flow begins | ← **Human decision required on password-reset scope before adding to this story** |

---

## Test Plan

- [ ] Unit: `sign-up-usecase.ts` — duplicate email returns `Err(EMAIL_ALREADY_EXISTS)` (unit)
- [ ] Unit: `sign-up-usecase.ts` — valid input returns `Ok(session)` (unit)
- [ ] Unit: `sign-in-usecase.ts` — wrong password returns `Err(INVALID_CREDENTIALS)` (unit, generic error — no field hint)
- [ ] Unit: `sign-in-usecase.ts` — valid credentials return `Ok(session)` (unit)
- [ ] Contract: POST `/api/auth/sign-up` — request/response shape validated against `@repo/contracts/auth` schema (contract)
- [ ] Contract: POST `/api/auth/sign-in` — same (contract)
- [ ] Integration: Redirect to dashboard on successful sign-up (integration — test the route handler + session creation chain)
- [ ] Integration: Return-URL redirect preserved after sign-in (integration)
- [ ] Integration: Redirect to dashboard when already signed in visiting `/sign-up` or `/sign-in` (integration)

---

## Out of Scope for This Story

- Email verification flow (pending Q-021)
- Password reset / forgot-password (pending blocker 2 on parent slice)
- Session persistence and expiry (covered in sibling slice `account-session--session-persistence-protected-routes`)
- Sign-in page UI design beyond functional form (UI polish is a separate concern)
- Rate limiting (infrastructure concern; not a product-level AC here)
- OAuth / social sign-in

---

## Implementation Notes (for agent reading this story)

- better-auth must be installed in `packages/auth/` (Phase 3 complete) before this story can be implemented
- Use `emailAndPassword.signUp` and `emailAndPassword.signIn` from `better-auth` client
- Server-side sign-up/sign-in should go through the use-cases in `apps/web/src/application/auth/` (`sign-up-usecase.ts`, `sign-in-usecase.ts`) — do not add business logic directly to route handlers
- Return URL: preserve via query param `?callbackUrl=<encoded-path>` (better-auth supports this natively)
- Generic error on sign-in is intentional and required (AC-8) — do not leak whether email or password is wrong

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial draft — partial story covering credentials flow; email-verification AC marked pending Q-021; authored for overnight pipeline context | local-agent |
