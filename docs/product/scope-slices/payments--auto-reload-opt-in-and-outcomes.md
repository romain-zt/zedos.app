<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/payments.md
-->

# Scope Slice: Auto-reload opt-in and outcomes

## Parent Feature Area

[Payments](../feature-areas/payments.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Founder can opt in to automatic credit refill; when triggered, the product attempts to use their saved payment method — and if that fails or requires authentication, they are routed to a clear manual recharge path instead of a broken loop.

---

## Exact Boundary

### Included Behavior

- Signed-in founder can opt in to auto-reload (and opt out again).
- When the auto-reload trigger fires and a saved payment method is available, the product attempts to purchase one prepaid credit pack using that method.
- On success: credits are added to the account; founder is not interrupted.
- On failure (declined, SCA authentication required, or other): founder receives a clear manual recharge prompt — paid AI features remain blocked until recharge is completed.
- The product communicates clearly that auto-reload is a prepaid refill convenience, **not** a subscription, and is **not** required to finish the first PRD flow.
- Auto-reload requires a saved payment method — the product explains this requirement.

### Excluded Behavior

- Subscription billing or recurring scheduled charges framed as a subscription (Hard v0 exclusion).
- Auto-reload without prior explicit opt-in from the founder.
- Multiple simultaneous auto-reload rules or tier-based reload configurations.
- Setting or displaying auto-reload pack sizes in the PRD (operator-config — not a PRD-fixed value).
- Retry logic that re-attempts off-session charges without user action (only manual recharge path after failure).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Opt-in off (default) | Founder has not enabled auto-reload | Auto-reload is off; product explains optional prepaid refill convenience (not subscription, not required for first PRD). |
| Opt-in on, saved method present | Founder enabled auto-reload after a prior successful manual checkout saved a payment method | Setting shows auto-reload enabled; product confirms a saved payment method is on file for prepaid refills. |
| Opt-in on, no saved method | Founder enables auto-reload before any saved payment method exists | Product explains auto-reload requires a saved payment method from a prior successful manual checkout; founder is guided to complete manual recharge first. |
| Trigger pending / processing | Auto-reload trigger fires while founder is using the product | No interrupting UI on the happy path; product attempts one prepaid pack purchase using the saved method in the background. |
| Silent success | Off-session purchase succeeds | Credits increase without blocking the founder; no subscription framing. |
| Failure — declined or error | Off-session charge fails (declined, network, or provider error) | Clear manual recharge prompt; paid AI features stay blocked until founder completes manual recharge; no automatic retry loop. |
| Failure — authentication required (SCA) | Off-session attempt requires payer authentication (e.g. EU/SCA) | Founder is routed to complete payment manually (not framed as subscription); paid AI features stay blocked until successful manual recharge. |
| Opt-out | Founder disables auto-reload | Setting reflects off; no further automatic refill attempts until re-enabled. |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Auto-reload preference | Read / Update | Owner opt-in and opt-out state; default off until explicit opt-in. |
| Saved payment method | Read | Whether a payment method from prior manual checkout is available for off-session refill. |
| Credit pack purchase | Create | One automated prepaid pack purchase when trigger fires (same pack sizes as manual checkout; size is operator-config, not PRD-fixed). |
| Credit pack purchase | Update | Record automated purchase outcome (succeeded, failed, authentication required). |
| AI credit balance | Update | Increase only on successful automated purchase by the purchased pack quantity. |
| Credit ledger | Create | Auditable top-up entry for successful auto-reload credit addition. |
| User account | Read | Resolve signed-in owner for preference and purchase attribution. |

---

## Credit / Payment Impact

This slice directly affects the credit ledger via an automated purchase path. The credit system must apply credits from a successful auto-reload. On failure, paid AI features remain blocked — coordination with `credit-system` FA required. Saved payment method handling involves Stripe's off-session payment flow (PRD-allowed product-level term).

---

## Sharing / Privacy Impact

None — auto-reload is an owner account setting and does not affect the anonymous share surface.

---

## Feedback / Instrumentation Impact

None — auto-reload events are not defined owner milestone triggers in PRD v1.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `manual-credit-pack-checkout` | Scope Slice | complete | Shipped (tracking PR #102); saved payment method established during prior manual checkout; auto-reload references the same prepaid pack sizes |
| Credit system — ledger concurrency & webhook | Scope Slice | complete | `orch-credit-system--ledger-concurrency-and-stripe-webhook` complete; ledger applies credits from successful purchases idempotently |
| Stripe as named payment provider | Constraint | ready | Off-session payment attempts and SCA handling are Stripe-specific product constraints (PRD Integration Boundaries) |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder who opts in to auto-reload has their credits automatically refilled when the trigger fires, using their saved payment method; if the attempt fails or requires authentication (e.g. EU/SCA), the founder sees a clear manual recharge prompt and paid AI features remain blocked until they act; the product never presents auto-reload as a subscription.

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
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Scaffolded from approved `/feature-area slice payments` proposal via `/feature-area scaffold-slices` | — |
| 2026-05-28 | Refined UX states, data touched, dependency statuses (manual checkout + credit ledger complete); readiness checklist cleared | cloud-agent |
