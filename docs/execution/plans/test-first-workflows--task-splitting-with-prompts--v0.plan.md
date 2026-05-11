# Implementation Plan: Task splitting with prompts (v0)

## Parent User Story

[Task splitting with prompts (v0)](../user-stories/test-first-workflows--task-splitting-with-prompts--v0.md)

## Status

`approved`

> **Layout in effect:** `apps/web/` + `packages/db` + `packages/contracts` (where shared DTOs are lifted)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false
> **Approval note:** Orchestrator governance approval for FG-POST-PRD-V1 pipeline step `fa-test-first-workflows--task-splitting-with-prompts`. Implementation may proceed via `/implement` with Patch Intent Summary per execution bridge.

---

## Approach

Persist per-project **task split bundles** scoped to the owning user: header row keyed by `projectId` + optional `sourceUserStoryId` (nullable until user-story corpus FK exists—use stable client-provided key or synthetic id + denormalized snapshot fields for narrative lineage). Child rows `task_split_tasks` store `sortOrder`, `title`, `promptBody`, `manual` flag, soft-delete marker if needed.

Use Drizzle in `packages/db`, ports returning `Result<T, ApplicationError>`, zod contracts under `apps/web/src/contracts/task-split/` (or `packages/contracts` if promoted). Use cases: `getBundle`, `saveBundle` (full replace or transactional upsert per product choice—start with replace-list inside transaction), `generateDraftTasks` optional path returning validated task list only after zod parse (AI in `infrastructure/ai/`), `lockBundle`. Credits: wire assisted generation through existing deduct/check patterns when AI used.

Routes under `apps/web/app/api/projects/[projectId]/task-split/` — thin handlers. Dashboard page under `app/dashboard/projects/[projectId]/task-split/` — mobile-first workspace.

**Dependency:** When `user_story_lines` / corpus lands from the user-stories slice, add FK from bundle to `user_story_line_id` and drop temporary snapshot-only fields if redundant.

**PR stacking (79):** (1) migration + schema, (2) contracts + domain + repo + core use cases, (3) API routes, (4) UI — each within sizing limits.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`packages/db`) |
| Auth source-of-truth | better-auth (`requireUser` / guards aligned with existing project APIs) |
| Async/sync boundary | Synchronous HTTP only |
| Transaction boundary | Per use-case transaction for save/reorder |
| External dependencies | Managed AI only in infrastructure; validates against contracts before returning |
| Payment shape | n/a (credits ledger only when assisted) |

### Surface Blockers

- None

---

## Layers Affected

- [x] `domain` — `ITaskSplitBundleRepository`, bundle + task entities
- [x] `application` — get/save/generate/lock use cases
- [x] `contracts` — DTOs + AI draft list schema
- [x] `infrastructure` — Drizzle repo; optional AI wrapper
- [x] `app` — API routes
- [x] `ui` — dashboard workspace components

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/db/src/schema/task-split.ts` | new | Tables for bundle + tasks |
| `packages/db/src/schema/index.ts` | modify | Re-export |
| `packages/db/src/migrations/0004_task_split_tables.sql` | new | DDL (number follows journal) |
| `packages/db/src/migrations/meta/*` | modify | Drizzle meta as required |
| `apps/web/src/contracts/task-split/*.ts` | new | Request/response zod |
| `apps/web/src/domain/task-split/task-split-bundle-repository.ts` | new | Port |
| `apps/web/src/domain/task-split/task-split-bundle.ts` | new | Entities |
| `apps/web/src/infrastructure/persistence/task-split-bundle-repository.ts` | new | Drizzle adapter |
| `apps/web/src/infrastructure/persistence/index.ts` | modify | Export |
| `apps/web/src/application/task-split/get-task-split-bundle-usecase.ts` | new | |
| `apps/web/src/application/task-split/save-task-split-bundle-usecase.ts` | new | |
| `apps/web/src/application/task-split/lock-task-split-bundle-usecase.ts` | new | |
| `apps/web/app/api/projects/[projectId]/task-split/route.ts` | new | GET/PUT bundle |
| `apps/web/app/api/projects/[projectId]/task-split/generate/route.ts` | new | POST optional draft |
| `apps/web/app/api/projects/[projectId]/task-split/lock/route.ts` | new | POST lock |
| `apps/web/app/dashboard/projects/[projectId]/task-split/page.tsx` | new | Entry page |

*(Paths are authoritative for implementation; if migration sequence advances, renumber migration file to stay after latest journal entry.)*

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `TaskSplitTaskSchema`, `TaskSplitBundleDTOSchema` | add | `apps/web/src/contracts/task-split/task-split.contract.test.ts` |
| `SaveTaskSplitBundleRequestSchema`, `GenerateTaskSplitDraftResponseSchema` | add | same |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| `0004_task_split_tables` | `task_split_bundles`, `task_split_tasks` | yes (additive) |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `apps/web/src/contracts/task-split/task-split.contract.test.ts` | contract | Valid/invalid DTOs |
| `apps/web/src/application/task-split/save-task-split-bundle-usecase.test.ts` | unit | Ordering + lock rules |

---

## Dependencies Added

- None (use existing `zod`, `@repo/db`, `@repo/result`)

---

## Rollback

- Drop migration in a follow-up migration only after traffic confirmation; v0 additive tables can remain empty.

---

## Risks

- Upstream user story corpus schema drift — mitigate with nullable FK + snapshot fields until corpus ships.

---
