# User Story: Auto-reload opt-in and outcomes (v0)

## Parent Scope Slice

[Auto-reload opt-in and outcomes](../../product/scope-slices/payments--auto-reload-opt-in-and-outcomes.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want to opt in to automatic prepaid credit refills using my saved payment method so that my balance is replenished without interrupting my work, and I am clearly guided to manual recharge when an automatic attempt fails or requires authentication.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I am signed in and auto-reload is off | I view auto-reload settings | I see auto-reload is optional, off by default, described as prepaid convenience (not subscription, not required for first PRD) |
| AC-2 | I have a saved payment method from a prior successful manual checkout | I opt in to auto-reload | Auto-reload is enabled and the product confirms a saved method is on file |
| AC-3 | I have no saved payment method | I attempt to opt in | I see that auto-reload requires a saved payment method and am guided to complete manual recharge first |
| AC-4 | Auto-reload is enabled and a trigger fires with a saved method | An off-session purchase succeeds | My credit balance increases without blocking my workflow |
| AC-5 | Auto-reload is enabled and a trigger fires | The off-session charge fails (declined or error) | I receive a clear manual recharge prompt; paid AI features stay blocked until I recharge manually |
| AC-6 | Auto-reload is enabled and a trigger fires | Authentication is required (e.g. SCA) | I am routed to complete payment manually; paid AI features stay blocked until successful manual recharge; no automatic retry loop |
| AC-7 | Auto-reload is enabled | I opt out | Auto-reload is disabled and no further automatic refill attempts occur until I re-enable |

---

## Test Plan

- [ ] Contract tests for auto-reload preference and outcome payloads (contract)
- [ ] Repository tests for opt-in persistence and idempotent preference updates (integration)
- [ ] Use-case tests for opt-in guards (saved method required) and trigger outcome routing (unit)
- [ ] Route tests for preference read/update endpoints (route)
- [ ] UI tests for settings states, failure prompts, and opt-out (unit/integration)
- [ ] Repo checks: `pnpm typecheck` and `pnpm build`

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/db` schema / migration | new | Persist owner auto-reload opt-in preference |
| `packages/contracts` auto-reload schemas | new | Cross-layer DTOs for preference and outcomes |
| `application` auto-reload use cases | new | Opt-in/out, trigger handling, outcome routing |
| `infrastructure/persistence` auto-reload repository | new | Read/write preference |
| `infrastructure/payments` off-session adapter | new | Attempt prepaid pack purchase with saved method |
| `apps/web/app/api` auto-reload routes | new | Authenticated preference and trigger surfaces |
| `apps/web/app/dashboard/credits` UI | modify | Settings, messaging, manual recharge prompts |

---

## Out of Scope

- Subscription billing or recurring scheduled charges
- Auto-reload without explicit prior opt-in
- Multiple simultaneous auto-reload rules or tier-based reload configurations
- Operator-configurable pack size display in PRD
- Automatic retry of failed off-session charges without user action
- Tax/VAT legibility (separate slice)

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| OQ-1 | Which credit-balance threshold or event fires auto-reload? | — | **Resolved 2026-06-01:** trigger on insufficient-credits path (before returning block to client) when opt-in + saved payment method exist; no automatic retry after failure. |

---

## Decision References

- `docs/product/scope-slices/payments--auto-reload-opt-in-and-outcomes.md`
- `docs/product/feature-areas/payments.md`

---

## Readiness for Implementation Plan

- [x] Story expressed in user-value terms (no implementation language)
- [x] Acceptance Criteria cover at least one row per UX state from the parent Scope Slice
- [x] Test plan names test type for each item (unit / integration / contract / e2e)
- [x] Touched Files (predicted) is non-empty
- [x] Out of Scope is non-empty
- [x] All Open Questions either answered or carry an explicit next action
- [x] Decision references resolved (or `none` stated explicitly)

**Verdict:** READY FOR IMPLEMENTATION PLAN

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-28 | Authored from promoted scope slice `payments--auto-reload-opt-in-and-outcomes` | cloud-agent |
