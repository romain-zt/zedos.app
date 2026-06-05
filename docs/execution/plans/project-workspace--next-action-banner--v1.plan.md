# Implementation Plan: project-workspace--next-action-banner (v1)

## Parent User Story

[project-workspace--next-action-banner (v1)](../user-stories/project-workspace--next-action-banner--v1.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Implement per scope slice `project-workspace--next-action-banner` under FA **Project workspace**. Follow hexagonal boundaries: keep state derivation pure in `domain/`, surface in `app/_components/`. See `docs/product/scope-slices/project-workspace--next-action-banner.md` and `docs/product/next-action-banner-spec.md`.

The banner is a presentational concern with **no cross-layer DTOs** (no HTTP boundary owns the state-machine result), so no zod contract is added. Inputs come from data already loaded by `project-workspace.tsx` (`/api/projects/:id` and `/api/projects/:id/prd`) — `phase`, `journeyMode`, PRD versions and their `shareLinks`, plus `_count.questionHistory`.

State priority (S1 → S6 with S5 override when `journeyMode=express`):

| State | Trigger (data) | Primary CTA | Secondary CTA |
|-------|---------------|-------------|----------------|
| `S1` | No PRD version, no question history | Open Clarify (switch tab) | — |
| `S2` | No PRD version, question history exists | Resume Clarify (switch tab) | — |
| `S3` | PRD version(s) exist, latest has no enabled share link | Open PRD tab to share | Refine PRD (switch tab) |
| `S4` | PRD + active share, `standard` mode | Open Delivery (navigate) | Open PRD (copy link) |
| `S5` | `journeyMode === 'express'` and ≥1 PRD version (post-PRD locked) | Switch to standard (journey-mode endpoint) | — |
| `S6` | Builder export completed | _Out of v1_ | _Out of v1_ |

**S0** (dashboard zero-projects) and **S6** (export-done) are **excluded from v1**:

- S0 belongs on the dashboard surface, not the workspace.
- S6 needs a "first builder export at" persistent flag the schema does not currently expose; surfacing S6 would either require speculative client storage or a schema change beyond this slice's `Data Touched`. The state machine returns `null` (banner hidden) when no S1–S5 condition matches.

---

## Layers Affected

- [x] `domain` (pure state derivation)
- [ ] `application`
- [ ] `contracts`
- [ ] `infrastructure` (only the analytics event-name constants, infra-local)
- [x] `app` (workspace wiring)
- [x] `ui` (banner component)

---

## Touched Files

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/src/domain/project-workspace/derive-next-action-banner-state.ts` | new | Pure state-machine S1→S5 with S5 express override |
| `apps/web/src/domain/project-workspace/derive-next-action-banner-state.test.ts` | new | Unit tests covering each state, priority order, loading/empty cases |
| `apps/web/src/domain/project-workspace/index.ts` | new | Barrel export |
| `apps/web/app/dashboard/projects/[id]/_components/next-action-banner.tsx` | new | Sticky banner UI, primary + secondary CTA, fires shown/click telemetry |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | Capture `_count.questionHistory`, mount banner between header and tabs, wire CTA handlers |
| `apps/web/src/infrastructure/analytics/analytics-events.ts` | modify | Add `NEXT_ACTION_BANNER_SHOWN` and `NEXT_ACTION_BANNER_CTA_CLICKED` event names |
| `apps/web/public/messages/en/common.json` | modify | Add `nextActionBanner.*` keys (S1–S5 titles, CTA labels, body strings) |
| `apps/web/public/messages/fr/common.json` | modify | French translations for the same keys |

---

## Verification

- [x] `pnpm --filter @zedos/web typecheck`
- [x] `pnpm --filter @zedos/web test` for the domain unit test

---

## Tests

- Unit (domain): `derive-next-action-banner-state.test.ts` — covers each S1–S5 transition, S5 express override, loading suppression, S6 returning null when not detectable.

---

## Out of Scope

- Dashboard zero-projects banner (S0) — separate surface.
- S6 builder-export-done detection (no persistent backend flag yet).
- Express disclaimer copy (lives on PRD/share surfaces).
- Drift coordination flag.
- Replacing project list, version history, or post-PRD nav.

---

## Risks

- **Telemetry double-fire:** mitigated by tracking the previously emitted state in a ref and only firing `next_action_banner_shown` on actual transitions.
- **Stale `hasActiveShareLink` after creating a share link:** `project-workspace.tsx` already passes `onRefresh={fetchVersions}` to PrdViewer; share creation triggers a refresh, so the banner re-renders with the new state. Documented in the component.

---

## Blueprint

Generated 2026-06-04. Approved 2026-06-05 with full Touched Files and S6/S0 carve-out. Executed 2026-06-05: typecheck PASS (`pnpm --filter @repo/web typecheck`), 8/8 domain unit tests PASS for `derive-next-action-banner-state`.
