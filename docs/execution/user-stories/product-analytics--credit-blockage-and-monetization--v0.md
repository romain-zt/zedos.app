# User Story: Credit blockage and monetization funnel (v0)

## Parent Scope Slice

[Credit blockage and monetization funnel](../../product/scope-slices/product-analytics--credit-blockage-and-monetization.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a product operator, I want to see when founders hit **insufficient credits**, open the credits page, and complete checkout so we can fix monetization drop-offs.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | Tracking enabled (non-prod or post B-ANALYTICS-001) | Founder blocked for credits | Server emits `clarify_blocked_insufficient_credits` or `prd_generation_blocked_insufficient_credits` (per `posthog.md`) with `action` + `project_id` |
| AC-2 | AC-1 | Founder opens `/dashboard/credits` | `credits_page_viewed` event |
| AC-3 | AC-1 | Checkout completes | `credit_pack_checkout_completed` with `pack_id` only (no card data) |
| AC-4 | Production without legal clearance | Deploy | Tracking remains **off** by default |
| AC-5 | E2E / CI | Tests run | No PostHog capture |

---

## Test Plan

- [ ] Server capture on credit gate paths
- [ ] Funnel configured in PostHog (operator doc step)

---

## Out of Scope

- Session replay (friction-replay slice)
- Founder-facing analytics UI

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Draft US | doc-sync |
