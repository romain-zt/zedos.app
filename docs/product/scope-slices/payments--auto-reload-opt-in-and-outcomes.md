<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/payments.md
-->

# Scope Slice: Auto-reload opt-in and outcomes

## Parent Feature Area

[Payments](../feature-areas/payments.md)

## Status

`exploratory`

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
|       |      |                                  |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
|        |           |       |

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
| `manual-credit-pack-checkout` | Scope Slice | exploratory | Saved payment method is typically established during a prior manual checkout; auto-reload references the same pack sizes |
| Credit system | Feature Area | exploratory (NEED_HUMAN) | Ledger must handle auto-reload credits; open commercial-config blockers do not prevent defining the product boundary of this slice |
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

- [ ] User value stated without implementation language
- [ ] Exact boundary defined (included + excluded)
- [ ] UX states enumerated (including error and empty states)
- [ ] Business objects named
- [ ] Credit / payment impact assessed
- [ ] Sharing / privacy surface assessed
- [ ] Feedback / instrumentation impact assessed
- [ ] All dependencies named and their status known
- [ ] All blockers resolved or NEED_HUMAN=true explicitly set
- [ ] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** NOT READY

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Scaffolded from approved `/feature-area slice payments` proposal via `/feature-area scaffold-slices` | — |
