# Implementation Plan: payments--builder-subscription-checkout (v1)

## Parent User Story

[payments--builder-subscription-checkout (v1)](../user-stories/payments--builder-subscription-checkout--v1.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Add a recurring **Builder Monthly** subscription on top of the existing one-time credit-pack flow. Stripe runs in **subscription mode** Checkout; webhooks update a new `subscriptions` table and a `plan_tier` column on `users`. The existing pack ledger is untouched — packs and subscription coexist. Customer Portal is exposed via `/api/stripe/subscription/portal`. All Stripe configuration (price ID, portal config ID, automatic_tax) flows through env keys documented in `apps/web/.env.example` only.

Hexagonal layout:

- `domain/subscription/` — pure entity + repository port + tier resolver
- `application/subscription/` — checkout, portal, webhook-apply, tier-resolve use cases (Result<T, E>)
- `infrastructure/payments/stripe-subscription-flows.ts` — Stripe SDK calls (subscription mode)
- `infrastructure/payments/stripe-subscription-webhook-processor.ts` — webhook → use case
- `infrastructure/payments/subscription-config.ts` — env reader
- `infrastructure/persistence/subscription-repository.ts` — Drizzle adapter
- `infrastructure/persistence/plan-tier-reader.ts` — `users.planTier` reader used by gate & red-team
- `app/api/stripe/subscription/*` — Next.js route handlers (< 30 lines each)
- `app/api/stripe/webhook/route.ts` — route both pack and subscription webhook event types

---

## Layers Affected

- [x] `domain`
- [x] `application`
- [x] `contracts`
- [x] `infrastructure`
- [x] `app`
- [ ] `ui`

---

## Touched Files

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/db/src/schema/subscriptions.ts` | new | `subscriptions` table (Stripe sub id, customer id, status, current_period_end, cancel_at_period_end) |
| `packages/db/src/schema/users.ts` | edit | Add `planTier` column ('free' \| 'builder' \| 'pro' \| 'team'); default 'free' |
| `packages/db/src/schema/index.ts` | edit | Re-export new subscriptions schema |
| `packages/db/src/migrations/0016_plan_tier_subscriptions_red_team_data_room.sql` | new | Add column + tables (single migration covers all 4 features) |
| `packages/db/src/migrations/meta/_journal.json` | edit | Migration journal entry |
| `packages/contracts/src/payments/subscription.ts` | new | `CreateSubscriptionCheckoutRequest`, `BillingSubscriptionDTO`, webhook event zod |
| `packages/contracts/src/payments/index.ts` | edit | Re-export subscription contracts |
| `packages/contracts/src/index.ts` | (no edit) | Already exports `./payments` |
| `apps/web/src/domain/subscription/subscription.ts` | new | `Subscription` entity, `PlanTier` value, `BillerStatus` enum |
| `apps/web/src/domain/subscription/subscription-repository.ts` | new | Port |
| `apps/web/src/domain/subscription/index.ts` | new | Re-exports |
| `apps/web/src/application/subscription/create-subscription-checkout-usecase.ts` | new | Use case wrapping Stripe Checkout (subscription mode) |
| `apps/web/src/application/subscription/open-customer-portal-usecase.ts` | new | Returns Stripe Customer Portal URL |
| `apps/web/src/application/subscription/apply-subscription-webhook-usecase.ts` | new | Webhook → repo update + plan tier sync |
| `apps/web/src/application/subscription/resolve-plan-tier-usecase.ts` | new | Reads users.planTier; default 'free' |
| `apps/web/src/application/subscription/get-billing-subscription-usecase.ts` | new | Account billing view |
| `apps/web/src/application/subscription/index.ts` | new | Re-exports |
| `apps/web/src/infrastructure/payments/stripe-subscription-flows.ts` | new | `createBuilderSubscriptionCheckout`, `createCustomerPortalSession` |
| `apps/web/src/infrastructure/payments/stripe-subscription-webhook-processor.ts` | new | Routes `customer.subscription.*` + `invoice.payment_*` events |
| `apps/web/src/infrastructure/payments/subscription-config.ts` | new | Env reader: `STRIPE_BUILDER_PRICE_ID`, `STRIPE_PORTAL_CONFIG_ID` |
| `apps/web/src/infrastructure/persistence/subscription-repository.ts` | new | Drizzle adapter |
| `apps/web/src/infrastructure/persistence/plan-tier-reader.ts` | new | Reads `users.planTier`; shared by gate + red-team |
| `apps/web/app/api/stripe/subscription/checkout/route.ts` | new | POST, < 30 LOC |
| `apps/web/app/api/stripe/subscription/portal/route.ts` | new | POST, < 30 LOC |
| `apps/web/app/api/stripe/webhook/route.ts` | edit | Dispatch on event type (existing pack-completed left unchanged) |
| `apps/web/app/api/billing/subscription/route.ts` | new | GET for billing surface |
| `apps/web/src/infrastructure/analytics/analytics-events.ts` | edit | `SUBSCRIPTION_CHECKOUT_STARTED`, `SUBSCRIPTION_ACTIVATED`, `SUBSCRIPTION_CANCELED` |
| `apps/web/.env.example` | edit | Add `STRIPE_BUILDER_PRICE_ID`, `STRIPE_BUILDER_MONTHLY_EUR`, `STRIPE_PORTAL_CONFIG_ID`, `BUILDER_PLAN_NAME` |

---

## Verification

- [x] `pnpm --filter @repo/web typecheck`
- [ ] `pnpm --filter @repo/web test` (deferred; no test fixtures requested by user)
- [ ] `pnpm --filter @repo/web build`

---

## Blueprint

Generated 2026-06-04. Approved + filled 2026-06-05.
