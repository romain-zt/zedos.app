<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/payments.md
-->

# Scope Slice: Manual credit pack checkout

## Parent Feature Area

[Payments](../feature-areas/payments.md)

## Status

`ready-for-user-stories`

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
| Empty / no selection yet | Founder opens recharge before selecting a pack | Three available prepaid packs (100 / 200 / 1000) are presented with clear one-time purchase messaging. |
| Checkout entry | Founder has insufficient credits or proactively opens recharge | Clear choice of three prepaid packs (100 / 200 / 1000) with explicit one-time purchase wording (not subscription). |
| In progress / payment processing | Founder confirms pack and payment is being processed | Founder sees that payment confirmation is in progress and that credits are not added until success is confirmed. |
| Redirect to Stripe checkout | Founder confirms a selected pack | Founder is redirected to secure Stripe checkout to complete one-time payment. |
| Successful purchase return | Stripe confirms payment success | Founder returns to app with success confirmation and updated credit balance reflecting the exact purchased pack. |
| Payment canceled by founder | Founder abandons or cancels checkout | Founder returns without credit change, with clear message that no purchase was completed. |
| Payment failed / declined | Stripe cannot complete payment | Founder sees actionable error and can retry checkout or choose another payment attempt later; credits remain unchanged. |
| Temporary verification required | Payment flow requires additional payer action | Founder is informed that payment needs completion before credits are added; no credits are added until successful completion. |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Credit pack purchase | Create | Record one-time pack purchase intent for selected denomination (100 / 200 / 1000). |
| Credit pack purchase | Update | Mark final purchase outcome (succeeded, canceled, failed) after checkout returns. |
| AI credit balance | Update | Increase owner balance only on successful payment by the exact purchased pack quantity. |
| Credit ledger | Create | Add a top-up entry that makes the credit addition traceable and auditable at product level. |
| User account | Read | Resolve signed-in owner identity to attribute purchase and resulting credit addition. |

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
| Credit system | Feature Area | pending | Ledger must apply purchased credits exactly once on successful checkout and never on canceled/failed outcomes. |
| Stripe as named payment provider | Constraint | ready | Integration Boundaries in PRD |
| Account & session | Feature Area | ready | Signed-in owner identity is required to attribute purchase and credit addition to the correct account. |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder can select a 100, 200, or 1000 credit pack, complete a one-time Stripe checkout, and see credits added to their balance only after successful payment, with explicit prepaid (non-subscription) messaging and no credit addition on canceled or failed payment outcomes.

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
| 2026-05-28 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
