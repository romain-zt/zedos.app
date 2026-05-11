# User Story: Story generation from feature split (v0)

## Parent Scope Slice

[Story generation from feature split](../../product/scope-slices/user-stories--story-generation-from-feature-split.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want to pick one confirmed feature cluster, generate or refine behavioral user stories tied to that cluster, edit and reorder them, and mark the set ready for task-level workflows so that post-split work stays anchored to cluster identity and PRD lineage.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | My project has no **confirmed** feature split / cluster artifact usable as input | I open the user-story generation surface | I see empty / gated guidance to finish the services → feature split flow first |
| AC-2 | Multiple confirmed clusters exist for my project | I start story work | I can select exactly one cluster via a selector that surfaces summaries consistent with split labels / value lines |
| AC-3 | Stories are generating (assisted or templated) | The operation is in flight | I see loading / drafting feedback and a cancel affordance that respects credit policy (no silent abandonment of spend rules) |
| AC-4 | Draft stories are shown | I review the list | I see a readable list or grid with lightweight metadata (cluster linkage, relative order, draft vs saved markers) |
| AC-5 | I edit title or body, reorder, archive, or merge duplicates | I save | Persisted server state wins on conflict; I get a recoverable notice if my save races or validation fails, without silent loss of the latest server truth |
| AC-6 | A transient failure occurs | I retry | Error is recoverable; locally staged edits that were not overwritten are surfaced so I can reconcile |
| AC-7 | I attempt story work without the prerequisite locked split artifact | — | I see blocked messaging that routes me back to upstream feature split (not downstream task workflows) |
| AC-8 | Assisted generation is credit-gated and my balance blocks the operation | I attempt assisted drafting | I see balance, grace, and recharge messaging aligned with prepaid credit policy |
| AC-9 | I mark the corpus as sufficiently reviewed | I confirm | I get a success-ready state that enables navigation toward test-first / task workflows, with stories visibly behavioral (not implementation specs) |
| AC-10 | I am not authenticated | I call user-story APIs | I am not allowed to read or mutate story corpora |
| AC-11 | I target another user’s project, cluster, or story corpus | — | I receive a not-found style response without leaking existence |

---

## Test Plan

- [ ] Unit: story-generation use cases (load corpus, draft/save, reorder, archive/merge rules, mark review-ready) with mocked `IUserStoryCorpusRepository` and optional `IFeatureSplitRepository` / credits port (unit)
- [ ] Contract: request/response + AI draft payload schemas in `packages/contracts` (contract)
- [ ] Integration: Drizzle repository enforces project ownership and cluster linkage to confirmed split rows (integration)
- [ ] E2E (optional v1): signed-in owner completes select-cluster → review → mark ready on a seeded project (e2e)
- [ ] `pnpm typecheck` and `pnpm build` on the tracking branch (integration)

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/db/src/schema/*.ts` | new / modify | Persist story corpus header, story rows, optional generation-session metadata; FK to confirmed cluster id from feature split |
| `packages/contracts/src/user-stories/` | new | Zod DTOs for stories, corpus, API bodies, optional AI draft output |
| `apps/web/src/domain/user-stories/` | new | Port(s) + entities for corpus aggregate and story lines |
| `apps/web/src/application/user-stories/` | new | Generate/list/update/reorder/archive/merge/mark-review-ready use cases |
| `apps/web/src/infrastructure/persistence/` | new / modify | Drizzle `UserStoryCorpusRepository`; optional AI adapter in `infrastructure/ai/` for assisted drafting |
| `apps/web/src/infrastructure/` credits hooks | modify | Assisted path aligns with existing deduct / gate patterns when credits apply |
| `apps/web/app/api/projects/[id]/user-stories/**/route.ts` | new | Thin authenticated routes (parse → use case → zod out) |
| `apps/web/app/dashboard/projects/[id]/user-stories/**` | new | Owner-only UI: cluster pick, review list, edit/reorder, mark ready |

---

## Out of Scope

- Generating Cursor prompts, ordered engineering tasks, or acceptance tests-as-code in this slice
- Architectural specifications, external ticket formats, or schema design as a user-visible output
- Collaboration / inviting editors beyond the owner session
- Re-running or refining the upstream feature split inside this surface
- Emitting sharing or public surfaces for generated stories

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| OQ-1 | Prepaid credit burn tier for “generate/refine stories” when AI-assisted | Plan detail until product locks tier | Use existing ledger + configurable application constant; align with FG-POST-PRD-V1 burn table when published |
| OQ-2 | Canonical AI provider output schema for story drafts | Enabling assisted path in production | Add `contracts` module for draft list validation before widening rollout |

---

## Decision References

- None (assumes FG-PRD-V0 credit gating and better-auth session patterns)

---

## Readiness for Implementation Plan

- [x] Story expressed in user-value terms (no implementation language)
- [x] Acceptance Criteria cover at least one row per UX state from the parent Scope Slice
- [x] Test plan names test type for each item (unit / integration / contract / e2e)
- [x] Touched Files (predicted) is non-empty
- [x] Out of Scope is non-empty
- [x] All Open Questions either answered or carry an explicit next action
- [x] Decision references resolved (or `none` stated explicitly)

**Verdict:** READY FOR IMPLEMENTATION PLAN

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Authored for orchestrator `fa-user-stories--story-generation-from-feature-split` | — |
