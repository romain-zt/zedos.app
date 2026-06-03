# Implementation Plan: Friction replay and error signals (v0)

## Parent User Story

[Friction replay and error signals (v0)](../user-stories/product-analytics--friction-replay-and-error-signals--v0.md)

## Status

`draft`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** open (B-ANALYTICS-002 masking sign-off before prod replay)
> **NEED_HUMAN:** false for `/plan` and `/implement` with replay **disabled in prod** until B-ANALYTICS-002 cleared
> **NEED_UPDATE:** false

---

## Approach

**Phase 2** — run only after:

1. `product-analytics--owner-product-journey-funnels` adapter live.
2. `product-analytics--credit-blockage-and-monetization` events live (replay filters depend on blockage/failure events).

Enable **PostHog session replay** (sampled, not 100%) and **error tracking** correlation per `docs/observability/posthog.md` §6–§9 P4.

### Client (posthog-js)

- `session_recording` config with **masking** on clarification inputs and PRD body regions (CSS selectors / `data-ph-mask` — exact list fixed at implement + documented for B-ANALYTICS-002 sign-off).
- `$exception` or PostHog Error Tracking integration from:
  - `ChunkLoadErrorHandler` (if present)
  - Dashboard error boundary
  - Clarify / PRD stream failure handlers (metadata only: `error_code`, `route`, `project_id`)

### Server

- Optional server-side exception capture on stream failures (`posthog-node`) — **no** PRD/clarification text in properties.

### Sampling

- Replay triggered on sessions with: `clarify_blocked_insufficient_credits`, `prd_generation_failed`, `clarify_failed`, or linked error issue — not all sessions.

### Production gates

| Gate | Effect |
|------|--------|
| **B-ANALYTICS-001** | No prod replay until legal OK for analytics |
| **B-ANALYTICS-002** | No prod replay until masking reviewed and signed off |
| Default | `session_recording: false` or PostHog disabled until operator enables |

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres — unchanged |
| Auth source-of-truth | better-auth |
| Async/sync boundary | Client replay + async error capture |
| Transaction boundary | n/a |
| External dependencies | PostHog replay + error tracking |
| Payment shape | n/a |

### Surface Blockers

- **B-ANALYTICS-001** — prod enable (parent FA).
- **B-ANALYTICS-002** — masking sign-off before prod replay.

---

## Layers Affected

- [ ] `domain` — none
- [ ] `application` — none
- [ ] `contracts` — none
- [x] `infrastructure` — extend PostHog init options
- [x] `app` — error surfaces on routes (capture hooks only)
- [x] `ui` — masking attributes on clarification + PRD readers; error boundary
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/instrumentation-client.ts` | modify | Replay config + masking |
| `apps/web/src/infrastructure/analytics/posthog-analytics.ts` | modify | `captureException` helper |
| `apps/web/components/providers.tsx` | modify | Error boundary wiring if needed |
| `apps/web/app/dashboard/projects/[id]/_components/clarification-chat.tsx` | modify | Mask sensitive fields |
| PRD reader component(s) in project workspace | modify | Mask PRD body |
| `apps/web/app/dashboard/projects/[id]/_components/chunk-load-error-handler.tsx` (or equivalent) | modify | `$exception` capture |
| `apps/web/src/infrastructure/prd/generate-prd-stream-flow.ts` | modify | `prd_generation_failed` + optional server capture |
| `apps/web/app/api/projects/[id]/clarify/route.ts` | modify | `clarify_failed` |
| `docs/observability/posthog.md` | modify | §6 masking selector list + §10 runbook |
| `apps/web/.env.example` | modify | Replay enable flag (default off) |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| _None_ | — | — |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| _None_ | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `posthog-analytics.test.ts` | unit | Replay disabled when env off |
| Manual staging | smoke | Replay shows UI chrome; masked fields are `[masked]` |
| `pnpm typecheck` / `pnpm test` / `pnpm build` | repo | Clean |

---

## Dependencies Added

- None if PostHog SDK already present from funnel slice

---

## Rollback

Set replay disabled in init + env → no recordings ingested. Remove `$exception` hooks.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| PRD text in replay | Med | Critical | B-ANALYTICS-002 sign-off; default off |
| Replay cost / quota | Med | Med | Sampling + session filters only |
| Error fingerprint noise | Med | Low | Group by `error_code` + route |

---

## Out of Scope (deliberate)

- Funnel A/B event definitions (prior slices)
- LLM trace / token observability
- Automated user-facing retry UX

---

## Prerequisites

1. Funnel + credit analytics slices **implemented**.
2. **B-ANALYTICS-002** masking document updated in `posthog.md` and reviewed by operator.
3. Staging smoke: one replay on `insufficient_credits` path (`posthog.md` §9 checklist).

---

## Approval

- [ ] User reviewed and approved this Plan
- [ ] Patch Intent Summary will be produced before any code edit
- [ ] Verification: typecheck, lint, test, build
- [ ] B-ANALYTICS-002 masking sign-off recorded before prod replay enable

**Approval status:** draft

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Draft plan — phase 2 replay + errors | doc-sync |
