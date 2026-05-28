# Implementation Plan: Manual credit pack checkout (v0)

## Parent User Story

[Manual credit pack checkout (v0)](../user-stories/payments--manual-credit-pack-checkout--v0.md)

## Status

`approved`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Keep the current one-time prepaid checkout flow and harden it around product guarantees: only signed-in founders can start checkout, only valid pack ids (100/200/1000) are accepted, Stripe unavailability is surfaced clearly, successful verification credits the balance exactly once, and canceled or failed payments never add credits. Route handlers remain thin, with domain behavior delegated to application/repository boundaries already in place.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`@repo/db`) |
| Auth source-of-truth | better-auth (`requireUser`) |
| Async/sync boundary | Synchronous HTTP request flow |
| Transaction boundary | Per verification/purchase update path |
| External dependencies | Stripe checkout + Stripe session verify |
| Payment shape | One-time prepaid credit packs only |

### Surface Blockers

- None

---

## Layers Affected

- [x] `domain` — credit purchase outcomes and balance invariants (existing primitives)
- [x] `application` — verify/apply credits path (existing use cases/adapters)
- [ ] `contracts` — no new contract package changes planned
- [x] `infrastructure` — purchase persistence and idempotent updates
- [x] `app` (routes) — Stripe checkout + verify route handlers
- [x] `ui` — credits page checkout and return-state UX
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/app/api/stripe/checkout/route.ts` | modify | Enforce pack and auth guards; keep one-time checkout semantics |
| `apps/web/app/api/stripe/verify/route.ts` | modify | Guarantee exactly-once credit addition on successful session |
| `apps/web/app/dashboard/credits/page.tsx` | modify | Clear success/cancel/error UX aligned with slice states |
| `apps/web/lib/config.ts` | modify (if needed) | Align pack catalog with 100/200/1000 scope |
| `docs/execution/user-stories/payments--manual-credit-pack-checkout--v0.md` | add | Parent story artifact |
| `docs/execution/plans/payments--manual-credit-pack-checkout--v0.plan.md` | add | This plan artifact |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| None planned | — | — |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| None | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `apps/web/app/api/stripe/checkout/route.test.ts` | route | Auth/invalid-pack/provider-unavailable behavior |
| `apps/web/app/api/stripe/webhook/route.test.ts` | route/integration | Purchase status progression and replay safety expectations |
| `apps/web/app/dashboard/credits/page.tsx` (existing tests or add) | UI | Success/canceled/error outcomes shown correctly |
| `pnpm -w run typecheck` | repo | No type regression |
| `pnpm -w run build` | repo | Build remains green |

---

## Dependencies Added

- None

---

## Rollback

Revert implementation commits on the working branch; no migration rollback required.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Duplicate credit application on retries/reloads | Medium | High | Preserve idempotent verification guard tied to purchase/session status |
| Checkout origin/callback mismatch in some envs | Medium | Medium | Keep explicit error handling and safe fallback messaging in credits page |

---

## Out of Scope (deliberate)

- Auto-reload opt-in and SCA fallback logic
- Tax/VAT messaging specifics
- Subscription or alternative monetization models

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| scope-critic | PASS | Scope stays within manual checkout slice |
| domain-guardian | PASS | No cross-layer expansion beyond existing boundaries |

---

## Approval

- [x] User reviewed and approved this Plan
- [ ] Patch Intent Summary will be produced before any code edit
- [ ] Verification steps (`typecheck`/`build`/tests) confirmed

**Approval status:** approved

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-28 | Initial implementation plan from promoted manual checkout scope slice | — |
| 2026-05-28 | Decision recorded: approved | Product + Engineering lead |
