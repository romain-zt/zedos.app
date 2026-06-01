<!--
  Scope Slice — refined 2026-06-01 for promote-slice readiness
  Parent: docs/product/feature-areas/payments.md
-->

# Scope Slice: Tax and VAT legibility

## Parent Feature Area

[Payments](../feature-areas/payments.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

During checkout and on receipts, the founder sees a clear, accurate statement of the applicable VAT/tax for digital AI credits in their supported market (France/EU or US) — no surprises at payment time.

---

## Exact Boundary

### Included Behavior

- Before completing a purchase, the founder sees the applicable tax/VAT amount or rate clearly stated for their supported market (FR/EU or US).
- Receipts or post-purchase confirmations include a legible tax/VAT line so the founder knows exactly what they paid and why.
- The product communicates that the purchase is for digital AI credits and the applicable tax stance follows from that classification.
- Coverage applies to both France/EU and US as the launch markets defined in PRD.

### Excluded Behavior

- Tax advisory, legal compliance determinations, or tax filing support (the product communicates; tax law and compliance obligations are not in product scope).
- Markets outside FR/EU and US (not in v0 scope).
- Showing tax breakdowns for historical purchases outside the purchase flow (not in v0 scope for this slice).
- Custom tax handling for edge cases beyond the two launch markets.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Loading packs / tax preview | Founder opens credits purchase | Pack cards load; tax line may show skeleton or "calculated at checkout" until Stripe session is prepared |
| Pre-checkout tax visible | Founder selects a pack before redirect | Estimated VAT/tax for digital AI credits shown for FR/EU or US (wording from Stripe or product copy aligned with Stripe Tax) |
| Checkout on Stripe | Founder on Stripe Checkout | Stripe-hosted tax breakdown when enabled for the account/region |
| Success return | Payment completed, return to `/dashboard/credits` | Confirmation shows credits added; receipt area or success toast references tax paid when Stripe provides it |
| Canceled checkout | Founder abandons Stripe | No tax line change; return without purchase |
| Tax unavailable | Stripe/account cannot compute tax for region | Clear copy: tax shown at payment provider or contact support; manual checkout still available where legally allowed |
| Error | Stripe or verify failure | Actionable error; no misleading tax figures |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Purchase (`purchases`) | Read | Link receipt copy to completed purchase row |
| Credit pack catalog (config) | Read | Display pack price before tax |
| Stripe Checkout Session | Read (via API) | Tax/total lines when retrieving session for verify/receipt UX |

---

## Credit / Payment Impact

This slice is part of the payment flow. It adds legibility to the checkout and receipt surfaces of `manual-credit-pack-checkout` — it does not independently process payments but depends on the purchase flow existing.

---

## Sharing / Privacy Impact

None — tax/VAT display is owner-only, shown during checkout and on receipts; not on the anonymous share surface.

---

## Feedback / Instrumentation Impact

None — tax legibility is not a defined owner milestone trigger in PRD v1.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `manual-credit-pack-checkout` | Scope Slice | complete | Tax/VAT display extends checkout and receipt surfaces |
| Stripe as named payment provider | Constraint | ready | Stripe handles tax calculation display in supported markets (PRD-allowed product-level term) |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A founder completing a credit pack purchase in France/EU or US sees the applicable VAT or tax amount clearly displayed before confirming payment; their receipt after purchase includes a legible tax/VAT line; the classification of the purchase as digital AI credits is communicated without ambiguity.

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

**Verdict:** CLEAR — ready for user story + implementation plan

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Scaffolded from approved `/feature-area slice payments` proposal via `/feature-area scaffold-slices` | — |
| 2026-06-01 | Refined UX states + data touched; dependency → complete; promoted to `ready-for-user-stories` | agent |
