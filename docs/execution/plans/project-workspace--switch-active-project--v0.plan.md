# Implementation Plan: Switch active project (v0)

## Parent User Story

[Switch active project (v0)](../user-stories/project-workspace--switch-active-project--v0.md)

## Status

`executed`

> **Layout in effect:** `apps/web/` + workspace packages  
> **Architecture Surface:** resolved  
> **NEED_HUMAN:** false  
> **NEED_UPDATE:** false  
> **Approval:** Orchestrator phase `fa-project-workspace--switch-active-project` (2026-05-11) authorizes execution on tracking branch `orchestrator/tracking-fa-project-workspace--switch-active-project-1778510579921`.

---

## Approach

Add a **project switcher** client control in the dashboard shell header whenever the pathname matches `/dashboard/projects/[id]`. Reuse the same **`GET /api/projects`** client fetch pattern and error/retry UX as the Projects page (no silent empty failure). Selecting another project **`router.push`** to `/dashboard/projects/<id>` preserves better-auth session. No new use cases or API routes — read-only list only.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Existing list endpoint + domain read types |
| Auth source-of-truth | better-auth (layout already gated) |
| Async/sync boundary | Synchronous browser fetch |
| Transaction boundary | n/a |
| External dependencies | None |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [x] `domain` — none (type-only import for `ProjectWithCounts`, same as Projects page)
- [ ] `application` — none
- [ ] `contracts` — none
- [ ] `infrastructure` — none
- [x] `app` — dashboard shell + new `_components/project-switcher.tsx`
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/app/dashboard/_components/project-switcher.tsx` | add | Fetch list, dropdown, retry, navigate |
| `apps/web/app/dashboard/_components/dashboard-shell.tsx` | modify | Render switcher when under project workspace segment |
| `docs/product/scope-slices/project-workspace--switch-active-project.md` | modify | Ready-for-user-stories + refinement |
| `docs/product/feature-areas/project-workspace.md` | modify | Slice row **complete** |
| `docs/execution/user-stories/project-workspace--switch-active-project--v0.md` | add | User story |
| `docs/execution/plans/project-workspace--switch-active-project--v0.plan.md` | add | This plan |
| `docs/state/status.json` | modify | Step complete + `fa_project_workspace` mirror |
| `docs/state/HANDOFF.md` | modify | Phase handoff |

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

| Test | Type |
|------|------|
| `pnpm typecheck` | repo |
| `pnpm build` | repo |

---

## Rollback

Revert commits on tracking branch; no migration.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Duplicate list-fetch versus Projects page | Acceptable tradeoff for small payload; aligns with slice scope |

---

## Out of Scope

- Server-driven project list for the shell (SSR layout fetch)
- E2E Playwright for this slice
- New aggregated “switch project” API
