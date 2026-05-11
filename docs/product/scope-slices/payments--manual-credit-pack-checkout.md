<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/payments.md
-->

# Scope Slice: Manual credit pack checkout

## Parent Feature Area

[Payments](../feature-areas/payments.md)

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Founder can buy a prepaid credit pack (100, 200, or 1000 credits) via a one-time payment and immediately receives the credits to use for AI work.

---

## Exact Boundary

### Included Behavior

- Signed-in founder can initiate a one-time credit pack purchase.
- Three pack sizes are available: 100, 200, and 1000 credits.
- Payment is processed via Stripe one-time checkout.
- Supported markets: France/EU and US.
- On successful payment, the purchased credits are added to the founder's account.
- The product communicates clearly that this is a prepaid purchase, not a subscription.

### Excluded Behavior

- Subscription billing (Hard v0 exclusion).
- BYOK (Hard v0 exclusion).
- Auto-reload behavior triggered automatically (that is `auto-reload-opt-in-and-outcomes`).
- Setting or displaying list prices in the PRD (operator-config per Q-016 — not a PRD-fixed value).
- Tax/VAT display during checkout (that is `tax-and-vat-legibility`).
- Markets outside FR/EU and US.

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

This slice **is** a payment flow. It directly feeds the credit ledger: a successful purchase must result in the correct number of credits being added to the founder's account. Coordination with the `credit-system` FA required.

---

## Sharing / Privacy Impact

None — payment flow is owner-only and does not affect the anonymous share surface.

---

## Feedback / Instrumentation Impact

None — completing a credit pack purchase is not a defined owner milestone trigger in PRD v1.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Credit system | Feature Area | exploratory (NEED_HUMAN) | Ledger must apply purchased credits correctly; FA has open commercial-config blockers but they do not prevent defining this slice's product boundary |
| Stripe as named payment provider | Constraint | ready | Integration Boundaries in PRD |
| Account & session | Feature Area | pending | Owner identity required to attribute the purchase |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder can choose a credit pack size (100, 200, or 1000), complete a one-time Stripe payment, and immediately see the purchased credits reflected in their account balance; the flow clearly communicates it is a one-time prepaid purchase; failed payments do not add credits.

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
