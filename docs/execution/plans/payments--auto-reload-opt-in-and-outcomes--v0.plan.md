# Implementation Plan: Auto-reload opt-in and outcomes (v0)

## Parent User Story

[Auto-reload opt-in and outcomes (v0)](../user-stories/payments--auto-reload-opt-in-and-outcomes--v0.md)

## Status

`executed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Deliver auto-reload in stacked layers on tracking PR #123. Iteration 1 adds persistence for owner opt-in preference only. Later iterations add contracts, use cases, off-session Stripe adapter (reusing manual checkout pack catalog and webhook idempotency patterns), thin API routes, and credits-page UI for opt-in/out and failure prompts. No subscription framing; no automatic retry after failure; SCA routes to manual recharge.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`@repo/db`) |
| Auth source-of-truth | better-auth (`requireUser`) |
| Async/sync boundary | Synchronous HTTP; trigger evaluated on credit-deduct / balance-check paths (no background queue) |
| Transaction boundary | Per use-case (`db.transaction`) |
| External dependencies | Stripe Customer + PaymentMethod from manual checkout; off-session PaymentIntent or Checkout per Stripe best practice |
| Payment shape | One-time prepaid pack (same sizes as manual checkout); webhook idempotency via existing checkout processor patterns |

### Surface Blockers

- OQ-1 (auto-reload trigger threshold/event) blocks trigger wiring only — not Iteration 1 schema

---

## Stacked iterations

| Iteration | Layer | Scope |
|-----------|-------|-------|
| 1 | `db-migration` | `auto_reload_preferences` table + Drizzle schema |
| 2 | `contracts-domain` | Zod schemas for preference + outcome enums |
| 3 | `persistence-use-cases` | Repository + opt-in/out use cases + saved-method guard |
| 4 | `api-routes` | Authenticated preference routes; hook trigger evaluation into credits bridge |
| 5 | `ui` | Credits page settings, failure/SCA manual recharge prompts |
| 6 | `tests-state-finalization` | Contract, use-case, route tests; typecheck/build/test |

---

## Layers Affected (full stack)

- [x] `domain` — auto-reload invariants (opt-in required, no retry loop)
- [x] `application` — opt-in/out, trigger attempt, outcome routing use cases
- [x] `contracts` — preference and outcome DTOs
- [x] `infrastructure` — persistence + Stripe off-session adapter
- [x] `app` (routes) — preference API
- [x] `ui` — credits settings and failure prompts

---

## Touched Files (exact paths) — Iteration 1 only

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/db/src/schema/auto-reload-preferences.ts` | add | Drizzle table definition |
| `packages/db/src/schema/index.ts` | modify | Export new table |
| `packages/db/drizzle/` | add migration | `auto_reload_preferences` with user_id unique, enabled boolean, timestamps |

---

## Contracts Changed (Iteration 1)

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| None in Iteration 1 | — | Deferred to Iteration 2 |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| `add_auto_reload_preferences` | `auto_reload_preferences` | Yes — additive |

---

## Tests (Iteration 1)

| Path | Type | Asserts |
|------|------|---------|
| Migration applies cleanly | integration | Table exists with expected columns |
| `pnpm -w run typecheck` | repo | No type regression |

---

## Dependencies Added

- None

---

## Rollback

Drop `auto_reload_preferences` migration in reverse order; revert schema files.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Trigger event undefined (OQ-1) | Medium | Medium | Ship preference persistence first; wire trigger in Iteration 4 after product decision |
| Duplicate credit grant on webhook replay | Low | High | Reuse idempotent checkout-session processor + correlation ids |
| Off-session SCA failure UX confusion | Medium | Medium | Explicit manual recharge prompt; block paid AI until manual success |

---

## Out of Scope (deliberate)

- Subscription billing
- Auto-reload without opt-in
- Multiple reload rules or operator pack-size PRD display
- Automatic off-session retry without user action
- Tax/VAT copy

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-28 | Proposed stacked plan from user story v0 | cloud-agent |
