# Implementation Plan: Credit blockage and monetization funnel (v0)

## Parent User Story

[Credit blockage and monetization funnel (v0)](../user-stories/product-analytics--credit-blockage-and-monetization--v0.md)

## Status

`executed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved (extends funnel plan adapter)
> **NEED_HUMAN:** false (B-ANALYTICS-001 gates prod enable only; default-off tracking)
> **NEED_UPDATE:** false

---

## Approach

**Prerequisite:** `product-analytics--owner-product-journey-funnels` adapter shipped (`apps/web/src/infrastructure/analytics/posthog-analytics.ts`, `analytics-events.ts`, `isAnalyticsEnabled`).

Extend the same **infrastructure adapter** — no new `lib/`, no PostHog in `domain` / `application` (`72-hexagonal-boundaries.mdc`).

### Funnel B events (catalog: `docs/observability/posthog.md` §4–5)

| Event | Emit boundary |
|-------|----------------|
| `clarify_blocked_insufficient_credits` | Clarify API returns / surfaces `insufficient_credits` |
| `prd_generation_blocked_insufficient_credits` | PRD stream flow blocks at zero balance |
| `feature_split_blocked_insufficient_credits` | (if applicable) feature-split credit gate |
| `credits_depleted_surface_shown` | Toast / modal when credits block an action |
| `credits_page_viewed` | Owner opens `/dashboard/credits` |
| `credit_pack_checkout_started` | Stripe Checkout session created (manual pack) |
| `credit_pack_checkout_completed` | Stripe webhook success path (idempotent with ledger) |
| `auto_reload_enabled` / `auto_reload_disabled` | Owner toggles opt-in preference |

**Properties (no PII):** `project_id`, `action`, `surface`, `pack_id`, `balance_bucket` (`zero` | `low` | `ok`) — not raw card data, not email.

**Server + client:** blockage on routes / stream flow (`posthog-node`); page view + checkout start on client (`posthog-js`); webhook on server.

**Production:** unchanged default-off until B-ANALYTICS-001; disable when `E2E_MODE` or missing keys.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres / Stripe — unchanged |
| Auth source-of-truth | better-auth |
| Async/sync boundary | Best-effort capture; never block credit gate or checkout |
| Transaction boundary | Capture after gate decision / after webhook credit grant |
| External dependencies | PostHog (existing from funnel slice) |
| Payment shape | Observability only — no change to Stripe or ledger rules |

### Surface Blockers

- **B-ANALYTICS-001** — prod tracking enable only; does not block implement with default-off.

---

## Layers Affected

- [ ] `domain` — none
- [ ] `application` — none
- [ ] `contracts` — none
- [x] `infrastructure` — extend `analytics-events.ts`, calls in credit/PRD/clarify paths
- [x] `app` — Stripe checkout + webhook routes
- [x] `ui` — credits page, depleted-credit surfaces
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/src/infrastructure/analytics/analytics-events.ts` | modify | Funnel B event names + property types |
| `apps/web/src/infrastructure/analytics/posthog-analytics.ts` | modify | Helpers for balance bucket |
| `apps/web/src/infrastructure/analytics/posthog-analytics.test.ts` | modify | Denylist + new events |
| `apps/web/app/api/projects/[id]/clarify/route.ts` | modify | `clarify_blocked_insufficient_credits` |
| `apps/web/src/infrastructure/prd/generate-prd-stream-flow.ts` | modify | `prd_generation_blocked_insufficient_credits` |
| `apps/web/app/dashboard/credits/page.tsx` | modify | `credits_page_viewed` |
| Depleted-credit toast/modal component(s) | modify | `credits_depleted_surface_shown` |
| `apps/web/app/api/stripe/checkout/route.ts` | modify | `credit_pack_checkout_started` |
| Stripe webhook handler (credit grant path) | modify | `credit_pack_checkout_completed` |
| Auto-reload preference API/UI | modify | `auto_reload_enabled` / `disabled` |
| `docs/observability/posthog.md` | modify | Confirm Funnel B dashboard steps if event names change |

_Paths for feature-split / other credit gates: locate at implement time; same event pattern._

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| _None_ | — | Infra-local analytics types only |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| _None_ | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `posthog-analytics.test.ts` | unit | New events; no forbidden property keys |
| Credit gate unit/integration | integration | Capture invoked once on `insufficient_credits` (mock adapter) |
| `pnpm typecheck` / `pnpm test` / `pnpm build` | repo | Clean |

---

## Dependencies Added

- None (reuses `posthog-js` / `posthog-node` from funnel slice)

---

## Rollback

Disable analytics env → Funnel B events no-op. No DB impact.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Double capture on retry | Med | Med | Idempotent event keys or dedupe in wrapper |
| Balance in properties too sensitive | Low | Med | Use `balance_bucket` per slice policy |
| Webhook + client both fire “completed” | Low | Med | Single source: webhook for `completed` |

---

## Out of Scope (deliberate)

- Session replay (friction-replay slice)
- PostHog dashboard build (operator manual, `posthog.md` §5)
- Changing credit burn, packs, or grace policy

---

## Prerequisites

1. Funnel slice **implemented** (adapter + `isAnalyticsEnabled`).
2. Operator configures **Funnel B** in PostHog after deploy to staging.

---

## Approval

- [ ] User reviewed and approved this Plan
- [ ] Patch Intent Summary will be produced before any code edit
- [ ] Verification: typecheck, lint, test, build

**Approval status:** draft

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Draft plan — Funnel B instrumentation | doc-sync |
