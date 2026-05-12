---
type: state-handoff
date: 2026-05-12
author: cloud-agent (orchestrator pipeline)
workspace: /workspace
status: handoff-ready
current_phase: fa-user-stories--story-generation-from-feature-split--impl--in-progress
current_blocker: null
---

# Cloud Agent State Handoff

## Orchestration (canonical)

- **Pipeline step** `fa-services-feature-split--prd-to-feature-split--impl`: **complete** — verified artifacts on `main`; unchanged.
- **Pipeline step** `fa-user-stories--story-generation-from-feature-split--impl`: **in progress** (`orchestration.steps[...]` = `in-progress`). Tracking PR **#88**, branch `orchestrator/tracking-fa-user-stories--story-generation-from-feature-split--impl-1778614749792` → `main`.

### Layer checklist (story generation slice)

| Layer | Status |
|-------|--------|
| `db-migration` | complete (`0005_user_story_corpus_tables`, Drizzle schema) |
| `contracts-domain` | complete (`packages/contracts/src/user-stories/`, domain ports under `apps/web/src/domain/user-stories/`) |
| `persistence-use-cases` | complete (`DrizzleUserStoryCorpusRepository`, AI draft wrapper `user-story-draft.ts`, use cases get/save/generate/mark + barrel; domain `OperationType` includes `user_story_generation`; `CREDIT_COST_USER_STORY_GENERATION` in `apps/web/.env.example`; persistence barrel exports corpus repo |
| `api-routes` | complete — `apps/web/app/api/projects/[id]/user-stories/route.ts` (GET query `featureSplitClusterId`, PUT save), `generate/route.ts` (POST), `review-ready/route.ts` (POST); `GetUserStoryCorpusResponseSchema` in contracts; `_lib/corpus-response.ts`; `requireUser` + inbound/outbound Zod |
| `ui` | **complete this run** — `/dashboard/projects/[id]/user-stories` page + `user-stories-workspace.tsx`; project header Split/Stories links; post-confirm link from feature split workspace |
| `tests-state-finalization` | **next** — plan tests + set `orchestration.steps[...]=complete` + `gh pr ready 88` only after gates pass |

## Active pipeline step (in progress)

- **`fa-user-stories--story-generation-from-feature-split--impl`** — implement per `docs/execution/plans/user-stories--story-generation-from-feature-split--v0.plan.md`.
- **Next layer for autonomous agent:** `tests-state-finalization` — contract/unit tests per plan, then mark `fa-user-stories--story-generation-from-feature-split--impl` complete and `gh pr ready 88 --repo romain-zt/zedos.app` when all gates pass.

## Next action for autonomous agent

1. On tracking branch **#88** (`...1778614749792`), run **tests + state finalization** next unless `FULL_STACK_ALLOWED=true`.
2. Keep orchestration step **not** `complete` until finalization gates pass (`pnpm typecheck`, `pnpm build`, tests per plan).

## Still blocked elsewhere

- **Credits slice** `orch-credit-system--ledger-concurrency-and-stripe-webhook` — PIS + plan approval (see `docs/state/status.json` `pis_blockers`).
- **`fa-owner-milestone-feedback--milestone-detection-and-prompt`** — see `status.json`.

## Key files (user stories slice)

- Plan: `docs/execution/plans/user-stories--story-generation-from-feature-split--v0.plan.md`
- DB schema: `packages/db/src/schema/user-stories.ts`
- Contracts: `packages/contracts/src/user-stories/`
- Domain: `apps/web/src/domain/user-stories/`
- Application use cases: `apps/web/src/application/user-stories/`
- Drizzle corpus repo / AI wrapper: `apps/web/src/infrastructure/persistence/user-story-corpus-repository.ts`, `apps/web/src/infrastructure/ai/user-story-draft.ts`
