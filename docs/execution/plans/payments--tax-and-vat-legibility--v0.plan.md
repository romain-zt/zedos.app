# Implementation Plan: Tax and VAT legibility (v0)

## Parent User Story

[Tax and VAT legibility (v0)](../user-stories/payments--tax-and-vat-legibility--v0.md)

## Status

`executed`

> **Approval note:** Continuation batch 2026-06-01 per user « fais la suite ».

---

## Approach

Enable Stripe `automatic_tax` on Checkout when `STRIPE_AUTOMATIC_TAX_ENABLED` is not `0`. Surface product copy on `/dashboard/credits` and return `taxLegibility` from verify flow parsed from Checkout Session totals.

---

## Touched Files (exact paths)

| Path | Operation |
|------|-----------|
| `packages/contracts/src/payments/tax-legibility.ts` | add |
| `packages/contracts/src/payments/index.ts` | modify |
| `apps/web/src/infrastructure/payments/checkout-tax-legibility.ts` | add |
| `apps/web/src/infrastructure/payments/checkout-tax-legibility.test.ts` | add |
| `apps/web/src/infrastructure/payments/stripe-checkout-flows.ts` | modify |
| `apps/web/app/api/credits/packs/route.ts` | modify |
| `apps/web/app/api/stripe/verify/route.ts` | modify |
| `apps/web/app/dashboard/credits/page.tsx` | modify |
| `apps/web/.env.example` | modify |

---

## Dependencies Added

None

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Executed tax/VAT legibility slice |
