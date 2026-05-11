# User Story: Task splitting with prompts (v0)

## Parent Scope Slice

[Task splitting with prompts](../../product/scope-slices/test-first-workflows--task-splitting-with-prompts.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want to select one finalized user story from my workspace, receive an ordered list of implementation tasks each with a Cursor-ready prompt, edit reorder and regenerate safely, and lock a persisted bundle `{ story, tasks[{ title, promptBody }] }` so downstream delivery can package it—without auto-running Cursor or shipping tests-as-code.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | No eligible finalized story exists for the project | I open the task-splitting surface | I see empty / gated copy pointing me to finalize user stories upstream |
| AC-2 | At least one finalized story exists | I start splitting | I can select exactly one story via a picker that shows narrative excerpt + readiness cues |
| AC-3 | I request generation (template or assisted) | The request is in flight | I see loading feedback and can cancel without orphaning credit rules when AI is involved |
| AC-4 | Tasks and prompts are returned | I review | I see an ordered list; each row has title + prompt body; I can expand to read prompts |
| AC-5 | I reorder, edit task titles or prompt bodies, delete tasks, or insert a manual task | I save | Order and edits persist; conflicts surface a recoverable notice; server truth is explicit |
| AC-6 | Assisted regeneration is credit-gated | My balance blocks the operation | I see the same prepaid / grace / recharge pattern as other AI surfaces |
| AC-7 | I lock the bundle for delivery | I confirm | The bundle is marked locked / export-ready; edits require an explicit unlock or new revision rule (v0: single mutable revision until lock) |
| AC-8 | I am not authenticated | I call task-bundle APIs | I cannot read or mutate bundles |
| AC-9 | I target another user’s project or story | — | I receive not-found style responses without leaking existence |

---

## Test Plan

- [ ] Unit: save/reorder/lock use cases with mocked `ITaskSplitBundleRepository` and optional credits port
- [ ] Contract: zod schemas for task row, bundle DTO, save request; invalid payloads fail closed
- [ ] Integration (optional): Drizzle repository enforces project ownership and story linkage
- [ ] `pnpm typecheck` and `pnpm build` on the tracking branch

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|----------------|-------------|--------|
| `packages/db/src/schema/` | new | `task_split_bundles` + `task_split_tasks` (or JSON bundle column—per approved plan) |
| `packages/db/src/migrations/` | new | Forward-only DDL |
| `apps/web/src/contracts/` or `packages/contracts` | new | HTTP + bundle DTOs |
| `apps/web/src/domain/task-split/` | new | Ports + entities |
| `apps/web/src/application/task-split/` | new | Load, generate (stub/AI behind port), save, lock |
| `apps/web/src/infrastructure/persistence/` | new | Drizzle repository; optional AI adapter |
| `apps/web/app/api/projects/[id]/task-split/**/route.ts` | new | Authenticated routes |
| `apps/web/app/dashboard/projects/[id]/task-split/**` | new | Owner workspace UI |

---

## Out of Scope

- Launching Cursor or live IDE automation
- Markdown/PDF export packaging (Delivery FA)
- Literal automated test or CI config generation
- Multi-user concurrent editing

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| OQ-1 | Canonical ID for "finalized user story line" before `user_story_lines` table ships | Linkage in DB | v0: optional `sourceUserStoryKey` string + FK migration when corpus exists |
| OQ-2 | AI provider output schema for suggested tasks | Assisted path | Validate with zod in infrastructure before persistence |

---

## Decision References

- None
