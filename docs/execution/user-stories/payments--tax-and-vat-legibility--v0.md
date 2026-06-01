# User Story: Tax and VAT legibility (v0)

## Parent Scope Slice

[Tax and VAT legibility](../../product/scope-slices/payments--tax-and-vat-legibility.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want to see clear VAT/tax information when buying prepaid digital AI credits so that I know what I pay before and after checkout in supported markets (France/EU and US).

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I view credit packs | I read pack pricing | I see that purchases are digital AI credits and tax/VAT is calculated at checkout when applicable |
| AC-2 | Stripe Tax is enabled | I start checkout | Stripe Checkout shows applicable tax for my region |
| AC-3 | I complete a paid checkout | I return to credits | Success messaging includes tax paid when Stripe provides it |
| AC-4 | Tax is unavailable from Stripe | I complete checkout | I still receive credits; copy does not invent tax amounts |

---

## Test Plan

- [x] Unit: `extractTaxLegibilityFromCheckoutSession` + `formatTaxSummaryEur`
- [x] `pnpm typecheck` / `pnpm test` / `pnpm build`

---

## Touched Files (predicted)

| Path | Change |
|------|--------|
| `packages/contracts/src/payments/tax-legibility.ts` | new |
| `apps/web/src/infrastructure/payments/checkout-tax-legibility.ts` | new |
| `apps/web/src/infrastructure/payments/stripe-checkout-flows.ts` | modify |
| `apps/web/app/api/credits/packs/route.ts` | modify |
| `apps/web/app/api/stripe/verify/route.ts` | modify |
| `apps/web/app/dashboard/credits/page.tsx` | modify |
| `apps/web/.env.example` | modify |

---

## Out of Scope

- Tax advisory or filing
- Historical purchase tax reports
- Markets outside FR/EU/US

---

## Open Questions

None.

---

## Readiness for Implementation Plan

**Verdict:** READY — implemented 2026-06-01
