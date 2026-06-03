# User Story: Friction replay and error signals (v0)

## Parent Scope Slice

[Friction replay and error signals](../../product/scope-slices/product-analytics--friction-replay-and-error-signals.md)

## Status

`draft`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a product operator, I want **session replay** and **error correlation** on friction paths so I can debug clarify/generation failures without reading raw PRD text in analytics.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | B-ANALYTICS-001 cleared **and** B-ANALYTICS-002 masking signed off | Replay enabled in prod | Masking hides clarification input and PRD body in replay |
| AC-2 | Generation/clarify error | Exception captured | Linked to PostHog error tracking issue where configured |
| AC-3 | Replay disabled | Prod default | No replay ingestion until operator enables |
| AC-4 | Funnel slice not live | Phase 2 start | This story blocked in queue until P0 funnel events ship |

---

## Test Plan

- [ ] Masking config documented in posthog.md
- [ ] Staging-only replay smoke test

---

## Out of Scope

- Activation funnel (owner-product-journey-funnels)
- PII in event properties

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Draft US (phase 2) | doc-sync |
