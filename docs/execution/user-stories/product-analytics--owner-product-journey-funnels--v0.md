<!--
  User Story — product-analytics: owner product journey funnels (v0)
  Authored via /plan 2026-06-03
-->

# User Story: Owner product journey funnels (v0)

## Parent Scope Slice

[Owner product journey funnels](../../product/scope-slices/product-analytics--owner-product-journey-funnels.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As an **operator**, I want **PostHog to record the owner activation funnel and workspace tab usage** so that **I can see where founders drop off before their first PRD and compare express vs standard journeys**.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | PostHog is configured and tracking is enabled (non-E2E) | A founder completes sign-up and lands signed in | PostHog receives `sign_up_completed` and the person is **identified** by account id (no email in event properties) |
| AC-2 | PostHog enabled | A returning founder signs in successfully | PostHog receives `sign_in_completed` with stable identify |
| AC-3 | PostHog enabled | A signed-in founder creates a project | PostHog receives `project_created` with `project_id` and `journey_mode` when applicable |
| AC-4 | PostHog enabled | A founder sends a clarification message in a project | PostHog receives `clarify_message_sent` with `project_id` (no message body) |
| AC-5 | PostHog enabled | PRD generation finishes successfully for a project | PostHog receives `prd_generation_completed` with `project_id` and `version_number` (no PRD content) |
| AC-6 | PostHog enabled | Funnel A is configured in PostHog (operator) | Steps 1→4 above form a funnel where the largest drop-off step is visible within five minutes |
| AC-7 | PostHog enabled | Founders use standard and express modes | Events carry `journey_mode` so express vs standard cohorts are filterable |
| AC-8 | PostHog enabled | A founder switches workspace tabs | PostHog receives `workspace_tab_selected` with `tab` ∈ clarify, prd, architecture, history |
| AC-9 | `E2E_MODE=true` or `NEXT_PUBLIC_POSTHOG_DISABLED=true` | Any founder action | No PostHog network calls are made |
| AC-10 | Production without legal clearance (B-ANALYTICS-001) | Deploy with default env | Tracking remains off until operator explicitly enables keys + legal go-ahead |

---

## Test Plan

- [ ] Analytics adapter returns disabled/no-op when `E2E_MODE` or `NEXT_PUBLIC_POSTHOG_DISABLED` (unit)
- [ ] `capture` helper rejects or strips forbidden property keys (`email`, `password`, `prd`, `message`, `token`) (unit)
- [ ] `project_created` emitted on successful `POST /api/projects` (integration with mocked PostHog client)
- [ ] `prd_generation_completed` emitted when PRD row is persisted in stream completion path (integration)
- [ ] Manual: operator creates Funnel A in PostHog UI per `docs/observability/posthog.md` §5 (e2e ops)

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `apps/web/instrumentation-client.ts` | new | Client SDK init |
| `apps/web/src/infrastructure/analytics/posthog-analytics.ts` | new | Vendor wrapper (capture, identify, isEnabled) |
| `apps/web/src/infrastructure/analytics/analytics-events.ts` | new | Event name + property types |
| `apps/web/src/infrastructure/analytics/posthog-analytics.test.ts` | new | Unit tests |
| `apps/web/components/analytics/posthog-identify.tsx` | new | Identify on session |
| `apps/web/components/providers.tsx` | modify | Mount identify provider |
| `apps/web/app/login/page.tsx` | modify | `sign_in_completed` / failed |
| `apps/web/app/signup/page.tsx` | modify | `sign_up_completed` / failed + identify |
| `apps/web/app/api/projects/route.ts` | modify | `project_created` server-side |
| `apps/web/app/dashboard/projects/page.tsx` | modify | Optional client confirm on create UX |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | `workspace_tab_selected` |
| `apps/web/app/dashboard/projects/[id]/_components/clarification-chat.tsx` | modify | `clarify_message_sent` |
| `apps/web/app/api/projects/[id]/clarify/route.ts` | modify | `clarify_stream_completed` server-side |
| `apps/web/src/infrastructure/prd/generate-prd-stream-flow.ts` | modify | `prd_generation_completed` server-side |
| `apps/web/.env.example` | modify | PostHog env vars (commented) |
| `turbo.jsonc` | modify | `globalEnv` PostHog keys |
| `apps/web/package.json` | modify | Dependencies (via pnpm) |

---

## Out of Scope

- Credit blockage → checkout funnel (separate slice)
- Session replay and error tracking (exploratory slice)
- Milestone feedback prompts (dedicated FA)
- PRD / clarification content in event properties
- Founder-facing analytics UI
- PostHog feature flags
- Analytics consent banner (legal blocker — see Plan)

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| OQ-PA-001 | Is an analytics cookies consent required before EU prod? | Real-user tracking in production | **NEED_HUMAN** — legal validation (B-ANALYTICS-001); implementation may ship with tracking **disabled by default** |

---

## Decision References

- none (PD to be created if legal rules on analytics consent)

---

## Readiness for Implementation Plan

- [x] Story expressed in user-value terms (no implementation language)
- [x] Acceptance Criteria cover UX states from the parent Scope Slice
- [x] Test plan names test type for each item
- [x] Touched Files (predicted) is non-empty
- [x] Out of Scope is non-empty
- [x] All Open Questions carry an explicit next action
- [x] Decision references resolved (`none`)

**Verdict:** READY FOR IMPLEMENTATION PLAN

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Created via `/plan` approval | — |
