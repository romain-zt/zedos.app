# Implementation Plan: List and open project (v0)

## Parent User Story

[List and open project (v0)](../user-stories/project-workspace--list-and-open-project--v0.md)

## Status

`executed`

> **Layout in effect:** `apps/web/` + workspace packages  
> **Architecture Surface:** resolved  
> **NEED_HUMAN:** false  
> **NEED_UPDATE:** false  
> **Approval:** Orchestrator run `fa-project-workspace--list-and-open-project` (2026-05-11) authorizes execution on tracking branch `orchestrator/tracking-fa-project-workspace--list-and-open-project-1778509983393`.

---

## Approach

Ship list/open behavior aligned with the Scope Slice: dashboard + Projects page already list via `GET /api/projects` and navigate to `/dashboard/projects/[id]`. Harden UX with explicit **list error** + **retry** (no silent empty list on failure). Replace **`prisma.project.findFirst`** on the project workspace page with existing **`GetProjectUseCase`** + `PrismaProjectRepository` (Drizzle-backed alias) so “open” stays inside hex boundaries. Tighten **`GetProjectUseCase`** return type from `any` to domain **`Project`**. Add a small **unit test** for `GetProjectUseCase`. Update product + orchestration docs.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`@repo/db`) through `IProjectRepository` |
| Auth source-of-truth | better-auth (`requireUser`) |
| Async/sync boundary | Synchronous per request |
| Transaction boundary | Per use-case |
| External dependencies | None for this slice |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [x] `domain` — none (read-only types)
- [x] `application` — `GetProjectUseCase` typing
- [ ] `contracts` — none
- [x] `infrastructure` — consume existing repository from app adapter only
- [x] `app` — `dashboard/page.tsx`, `projects/page.tsx`, `projects/[id]/page.tsx`
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/app/dashboard/projects/[id]/page.tsx` | modify | `GetProjectUseCase` + repo; remove Prisma from page |
| `apps/web/app/dashboard/projects/page.tsx` | modify | `ProjectWithCounts[]`, list error + retry |
| `apps/web/app/dashboard/page.tsx` | modify | List error + retry |
| `apps/web/src/application/project/get-project-usecase.ts` | modify | `Result<Project, ApplicationError>` |
| `apps/web/src/application/project/get-project-usecase.test.ts` | add | Unit coverage |
| `docs/product/scope-slices/project-workspace--list-and-open-project.md` | modify | Refine + ready-for-user-stories |
| `docs/product/feature-areas/project-workspace.md` | modify | Slice row **complete** |
| `docs/execution/user-stories/project-workspace--list-and-open-project--v0.md` | add | User story |
| `docs/execution/plans/project-workspace--list-and-open-project--v0.plan.md` | add | This plan |
| `docs/state/status.json` | modify | Step complete + mirrors |
| `docs/state/HANDOFF.md` | modify | Phase handoff |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| _None_ | — | Existing list/create DTOs unchanged |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| _None_ | — | — |

---

## Tests

| Test | Type |
|------|------|
| `apps/web/src/application/project/get-project-usecase.test.ts` | unit |
| `pnpm typecheck` | repo |
| `pnpm build` | repo |

---

## Rollback

Revert commits on tracking branch; no migration.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Client list fetch still depends on `/api/projects` | Same as prior slice; errors now visible |

---

## Out of Scope

- E2E Playwright for this slice
- Removing `PrismaProjectRepository` naming alias
- Global switch-project navigation
