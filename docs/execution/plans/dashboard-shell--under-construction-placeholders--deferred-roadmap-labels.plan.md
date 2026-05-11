# Implementation Plan: Deferred roadmap labels (under-construction placeholders)

## Parent User Story

[Deferred roadmap labels (under-construction placeholders)](../user-stories/dashboard-shell--under-construction-placeholders--deferred-roadmap-labels.md)

## Status

`executed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

> **Orchestrator approval:** Cloud agent pipeline authorized execution of `fa-dashboard-shell-slice2` with plan + code on tracking branch `orchestrator/tracking-fa-dashboard-shell-slice2-1778498120608`.

---

## Approach

Introduce a small shared module under `app/dashboard/_lib/` listing every deferred roadmap placeholder (copy + tooltip text) so the signed-in home grid and `DashboardShell` sidebar stay consistent. Wrap the shell layout in Radix `TooltipProvider` and use tooltips on placeholder rows/cards so hover, focus, or tap surfaces “not in v0” without `router.push` to fake routes. Unify visual treatment: dashed/subtle bordered panels, `Construction` accent, and an explicit “Under construction” status line. Add the missing **Architecture analysis** row from the Scope Slice. No domain, contracts, or API changes.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | n/a (static UI) |
| Auth source-of-truth | better-auth (unchanged) |
| Async/sync boundary | synchronous |
| Transaction boundary | n/a |
| External dependencies | none added |
| Payment shape | n/a |

### Surface Blockers

- none

---

## Layers Affected

- [ ] `domain` — none
- [ ] `application` — none
- [ ] `contracts` — none
- [ ] `infrastructure` — none
- [x] `app` — dashboard page + shell + co-located `_lib`
- [x] `ui` — uses existing `@/components/ui/tooltip`
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/app/dashboard/_lib/deferred-roadmap-placeholders.ts` | add | Shared placeholder definitions |
| `apps/web/app/dashboard/page.tsx` | modify | Home grid + tooltips from shared list |
| `apps/web/app/dashboard/_components/dashboard-shell.tsx` | modify | Sidebar rows + `TooltipProvider` + shared list |
| `docs/execution/user-stories/dashboard-shell--under-construction-placeholders--deferred-roadmap-labels.md` | add | User story |
| `docs/execution/plans/dashboard-shell--under-construction-placeholders--deferred-roadmap-labels.plan.md` | add | This plan |
| `docs/state/status.json` | modify | `fa-dashboard-shell-slice2` complete + mirror |
| `docs/state/HANDOFF.md` | modify | Phase handoff for slice 2 |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| n/a | — | — |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| n/a | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| Manual steps in User Story | manual | AC-1–AC-4 |
| `pnpm typecheck` | integration | Workspace compiles |
| `pnpm build` | integration | Next.js production build |

---

## Dependencies Added

- none

---

## Rollback

Revert listed files; no migrations.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tooltip UX varies on mobile | low | low | Radix tooltip; tap opens on touch devices |

---

## Out of Scope (deliberate)

- Implementing deferred pipeline capabilities
- Instrumentation / analytics for placeholder views

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial plan; approved via orchestrator execute slice2 | cloud-agent |
