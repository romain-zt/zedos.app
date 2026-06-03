# Implementation Plan: Owner product journey funnels (v0)

## Parent User Story

[Owner product journey funnels (v0)](../user-stories/product-analytics--owner-product-journey-funnels--v0.md)

## Status

`approved`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** open (legal gate for production enable)
> **NEED_HUMAN:** false (B-ANALYTICS-001 gates prod enable only; implement with tracking default-off)
> **NEED_UPDATE:** false

---

## Approach

Introduce PostHog as an **infrastructure adapter** (`apps/web/src/infrastructure/analytics/`): internal API `capture`, `identify`, `isAnalyticsEnabled` — no scattered direct `posthog-js` calls in UI. Client initializes via `instrumentation-client.ts` (per `77-nextjs.mdc`). Identification uses better-auth `user.id` (`76-better-auth.mdc`) in a client component mounted under `Providers`.

**Funnel A** events fire at existing boundaries: auth (`login`/`signup`), `POST /api/projects`, clarify send (client) + stream completion (server), PRD persist in `generate-prd-stream-flow` (server, `posthog-node`). Workspace tabs emit `workspace_tab_selected` on the client. Common properties: `project_id`, `journey_mode`, `version_number` — **no PII or business content** (`74-contracts-zod.mdc`: no new cross-layer schemas; analytics types live in `analytics-events.ts`).

No `domain` / `application` imports of PostHog (`72-hexagonal-boundaries.mdc` §9: no new `lib/` files). Rollback = disable env + remove calls; no DB migration.

**Production:** tracking off by default until B-ANALYTICS-001 is cleared; staging may use a EU PostHog test project.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle — unchanged |
| Auth source-of-truth | better-auth (`requireUser`, `useSession`) |
| Async/sync boundary | Synchronous capture per request / client action; PRD complete on stream callback |
| Transaction boundary | n/a (analytics side-effect after persist, best-effort, non-blocking) |
| External dependencies | PostHog EU Cloud (`posthog-js`, `posthog-node`) |
| Payment shape | n/a |

### Surface Blockers

- **B-ANALYTICS-001** — legal validation before enabling prod tracking on real users; does not block implement (default-off). Staging may use a EU test project.

---

## Layers Affected

- [ ] `domain` — none
- [ ] `application` — none
- [ ] `contracts` — none
- [x] `infrastructure` — PostHog adapter; `generate-prd-stream-flow`, clarify route
- [x] `app` (routes) — `api/projects`
- [x] `ui` — `components/analytics`, `providers`, login/signup, workspace, clarification-chat
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/instrumentation-client.ts` | add | Init `posthog-js` |
| `apps/web/src/infrastructure/analytics/posthog-analytics.ts` | add | Wrapper + server client |
| `apps/web/src/infrastructure/analytics/analytics-events.ts` | add | Event constants + property types |
| `apps/web/src/infrastructure/analytics/posthog-analytics.test.ts` | add | Unit tests |
| `apps/web/components/analytics/posthog-identify.tsx` | add | Session identify |
| `apps/web/components/providers.tsx` | modify | Provider tree |
| `apps/web/app/login/page.tsx` | modify | Sign-in events |
| `apps/web/app/signup/page.tsx` | modify | Sign-up + identify |
| `apps/web/app/api/projects/route.ts` | modify | `project_created` |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | Tab events |
| `apps/web/app/dashboard/projects/[id]/_components/clarification-chat.tsx` | modify | `clarify_message_sent` |
| `apps/web/app/api/projects/[id]/clarify/route.ts` | modify | `clarify_stream_completed` |
| `apps/web/src/infrastructure/prd/generate-prd-stream-flow.ts` | modify | `prd_generation_completed` |
| `apps/web/.env.example` | modify | Document env vars |
| `turbo.jsonc` | modify | `globalEnv` |
| `apps/web/package.json` | modify | `posthog-js`, `posthog-node` (via pnpm) |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| _None_ | — | Analytics properties are infra-local, not cross-layer DTOs |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| _None_ | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `apps/web/src/infrastructure/analytics/posthog-analytics.test.ts` | unit | Disabled flags; forbidden keys |
| `pnpm typecheck` | repo | Clean |
| `pnpm test` | repo | Clean |
| `pnpm build` | repo | Clean |

---

## Dependencies Added

- `posthog-js` — browser capture + identify
- `posthog-node` — server capture on PRD/clarify completion

---

## Rollback

Set `NEXT_PUBLIC_POSTHOG_DISABLED=true` or remove PostHog keys → wrapper no-op. Revert commit removes calls; no migration to reverse.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| PII leak in properties | Low | High | Typed helper + unit test denylist |
| Analytics call blocks UX | Low | Med | Fire-and-forget; log errors, do not throw |
| E2E pollutes PostHog | Med | Med | Disable when `E2E_MODE` |
| Prod enabled without legal OK | Med | High | Default disabled; document B-ANALYTICS-001 |

---

## Out of Scope (deliberate)

- Funnel B credits / checkout
- Session replay, `$exception`, ingest proxy
- `sign_up_started` (optional follow-up)
- PostHog dashboard creation (operator manual, see `docs/observability/posthog.md`)

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | Analytics confined to `infrastructure/` + `app`/`components`; no PostHog in domain/application; no new `lib/` |
| scope-critic | PASS | Matches slice: Funnel A + tabs + journey_mode; credit/replay/feedback excluded |

---

## Approval

- [x] User reviewed and approved this Plan
- [x] Patch Intent Summary will be produced before any code edit
- [x] Verification: typecheck, lint, test, build

**Approval status:** approved
**Approval date:** 2026-06-03

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Plan approved and persisted | user |
| 2026-06-03 | Surface blocker aligned with FA: prod-only legal gate | — |
