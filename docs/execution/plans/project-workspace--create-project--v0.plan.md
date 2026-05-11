# Implementation Plan: Create project (v0)

## Parent User Story

[Create project (v0)](../user-stories/project-workspace--create-project--v0.md)

## Status

`executed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)  
> **Architecture Surface:** resolved  
> **NEED_HUMAN:** false  
> **NEED_UPDATE:** false  
> **Approval:** Orchestrator run `fa-project-workspace--create-project` (2026-05-11) authorizes execution on tracking branch `orchestrator/tracking-fa-project-workspace--create-project-1778509618433`.

---

## Approach

Reuse existing hexagonal flow: `CreateProjectRequestSchema` on the API boundary, `CreateProjectUseCase` + `DrizzleProjectRepository`, better-auth `requireUser` for owner id. Close the contracts gap called out in retro finding #17 by validating outbound `ProjectDTO` on POST and list items on GET with `ProjectListItemDTOSchema`. Remove misleading `prisma` import from the route (repository uses singleton `db`). Align the projects list UI with domain field names (`prdVersionCount`, `questionHistoryCount`). Tighten mobile-first layout and touchTarget sizes on the projects page.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`@repo/db`) |
| Auth source-of-truth | better-auth (`requireUser`) |
| Async/sync boundary | Synchronous per request |
| Transaction boundary | Per use-case (single insert today) |
| External dependencies | None for this slice |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [ ] `domain` — none
- [x] `application` — existing `CreateProjectUseCase` (no signature change)
- [x] `contracts` — use existing schemas; no schema file edits required
- [ ] `infrastructure` — none (repository already Drizzle)
- [x] `app` (routes) — `app/api/projects/route.ts`
- [x] `ui` — `app/dashboard/projects/page.tsx` (page-level client component)
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/app/api/projects/route.ts` | modify | Outbound DTO validation; drop `prisma` import |
| `apps/web/app/dashboard/projects/page.tsx` | modify | Field names + mobile layout |
| `docs/product/scope-slices/project-workspace--create-project.md` | modify | Ready-for-user-stories |
| `docs/execution/user-stories/project-workspace--create-project--v0.md` | add | User story |
| `docs/execution/plans/project-workspace--create-project--v0.plan.md` | add | This plan |
| `docs/state/status.json` | modify | `orchestration.steps` + mirrors |
| `docs/state/HANDOFF.md` | modify | Handoff |
| `docs/product/feature-areas/project-workspace.md` | modify | Slice status row |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| _None_ | — | Existing `CreateProjectRequestSchema`, `ProjectDTOSchema`, `ProjectListItemDTOSchema` |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| _None_ | — | — |

---

## Tests

| Test | Type |
|------|------|
| `apps/web/src/application/project/create-project-usecase.test.ts` | unit (existing) |
| `pnpm typecheck` | repo |
| `pnpm build` | repo |

---

## Rollback

Revert commits on tracking branch; no migration.

---

## Risks

| Risk | Mitigation |
|------|------------|
| GET list shape drift vs `ProjectListItemDTOSchema` | Validation returns 500 with generic error — surfaces contract bugs early |

---

## Out of Scope

- E2E Playwright (not required for this slice closure)
- Refactoring `CreateProjectUseCase` `as any` (frozen debt)
