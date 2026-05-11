<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/payments.md
-->

# Scope Slice: Tax and VAT legibility

## Parent Feature Area

[Payments](../feature-areas/payments.md)

## Status

`exploratory`

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
|       |      |                                  |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
|        |           |       |

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
| `manual-credit-pack-checkout` | Scope Slice | exploratory | Tax/VAT display is part of the checkout and receipt surfaces established by the manual checkout slice |
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
