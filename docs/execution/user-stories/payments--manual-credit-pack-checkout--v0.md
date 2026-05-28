# User Story: Manual credit pack checkout (v0)

## Parent Scope Slice

[Manual credit pack checkout](../../product/scope-slices/payments--manual-credit-pack-checkout.md)

## Status

`draft`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want to buy a prepaid credit pack (100, 200, or 1000 credits) through a one-time Stripe checkout so that I can immediately replenish my credit balance and continue AI work.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I am signed in on the credits page | I open available packs | I can see 100, 200, and 1000 credit options with one-time prepaid wording |
| AC-2 | I choose a valid pack | I start checkout | I am redirected to Stripe Checkout for a one-time card payment |
| AC-3 | Checkout succeeds | I return to the credits page | Purchase verification runs and my balance increases by the purchased pack quantity |
| AC-4 | I cancel checkout | I return to the credits page | I see a canceled outcome and no credits are added |
| AC-5 | Stripe checkout cannot start (invalid pack or provider unavailable) | I attempt to buy | I get an actionable error and no purchase is finalized |
| AC-6 | I am not authenticated | I call checkout endpoint | I receive unauthorized and checkout is not created |

---

## Test Plan

- [ ] Route-level: checkout returns expected status for unauthorized / invalid pack / provider unavailable
- [ ] Flow-level: success and canceled return states on credits page
- [ ] Verify-level: successful Stripe session increases credits exactly once
- [ ] Repo checks: `pnpm typecheck` and `pnpm build`

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `apps/web/app/api/stripe/checkout/route.ts` | modify | Tighten one-time checkout boundary and response shape |
| `apps/web/app/api/stripe/verify/route.ts` | modify | Ensure successful sessions apply credits exactly once |
| `apps/web/app/dashboard/credits/page.tsx` | modify | Improve checkout outcomes and user feedback states |
| `apps/web/lib/config.ts` | modify (if needed) | Keep pack definitions aligned with v0 scope |
| `docs/execution/plans/payments--manual-credit-pack-checkout--v0.plan.md` | add | Implementation authority doc |

---

## Out-of-Scope

- Auto-reload behavior and fallback outcomes (separate slice)
- Tax/VAT copy and receipt legibility details (separate slice)
- Subscription, BYOK, or non-v0 pack models

---

## Open Questions

- None.

---

## Decision References

- `docs/product/scope-slices/payments--manual-credit-pack-checkout.md`
- `docs/product/feature-areas/payments.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-28 | Authored from promoted scope slice `payments--manual-credit-pack-checkout` | — |
