# User Story: Persist From Question History (v1)

## Parent Scope Slice

[decision-graph--persist-from-question-history](../../product/scope-slices/decision-graph--persist-from-question-history.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a **signed-in founder**, I want **every past and new clarification turn to be persisted as a durable product decision linked to my PRD** so that **my rationale is traceable from each PRD section back to the question I answered, without re-entering data**.

---

## Acceptance Criteria

> One row per UX state listed in the parent slice (Silent success / Backfill in progress / Backfill complete / Mapping error / Empty history), plus authorization.

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I am the project owner with a clarify turn in flight | The clarify stream completes and the question history row is inserted | A `Decision` row is created for that question history entry (one-to-one), linked to my project and current PRD version, with `chosenOption`, `rejectedOptions`, `aiInterpretation`, and `ownerComment` derived from the entry — and a `DecisionLink` is created when the entry's PRD section impact matches a canonical PRD section. (Silent success — no new UI surfaced.) |
| AC-2 | I am the project owner and my project has existing question history rows but no decisions | I open the project for the first time after this slice ships and trigger the owner backfill | All eligible question history rows are mapped to `Decision` rows, in chronological order, and the call returns the counts (`scanned`, `inserted`, `skipped`). Clarify remains usable while the backfill runs (no blocking modal). |
| AC-3 | I am the project owner and the backfill has already run for my project | I trigger the backfill a second time (manually, or from a concurrent tab) | No duplicate `Decision` rows are created; the response reports `inserted: 0` and `skipped` equal to the previously inserted count. (Backfill — complete + idempotent re-run.) |
| AC-4 | I am the project owner and a single question history row cannot be mapped (e.g. malformed `availableOptions` JSON) | I run clarify or the backfill | The mapping failure is logged server-side without leaking PII, that one row is skipped, and the rest of the operation (clarify response, backfill loop) still succeeds. (Error — mapping failed.) |
| AC-5 | I am a brand-new project owner with zero question history rows | I open my project | No `Decision` rows are created; the backfill route returns `scanned: 0, inserted: 0, skipped: 0`. Clarify continues to work and the first clarify turn produces the first decision per AC-1. (Empty history.) |
| AC-6 | I am not signed in, or I am signed in but I am not the project owner | I call the backfill endpoint or attempt to trigger the persist path for someone else's project | The request is rejected with an authorization error and no rows are created or read across the project boundary. |

---

## Test Plan

- [ ] `mapQuestionHistoryRowToDecisionDraft` correctly derives `chosenOption` / `rejectedOptions` / `prdImpact` from canonical and edge-case rows (**unit**)
- [ ] `persistDecisionFromQuestionHistoryEntryUseCase` is a no-op on the second call for the same `questionHistoryId` (**unit**, ports mocked)
- [ ] `backfillDecisionsForProjectUseCase` is idempotent: two sequential calls produce the same `decisions` count (**unit**, ports mocked)
- [ ] `DrizzleDecisionGraphRepository` rejects duplicate inserts via the unique index on `decisions.question_history_id` and returns success on the second concurrent insert (**integration**, real test Postgres)
- [ ] `decision.contract.test.ts` validates `DecisionDTOSchema`, `DecisionLinkDTOSchema`, `BackfillDecisionsResponseSchema` happy path + malformed inputs (**contract**)
- [ ] Owner triggers backfill twice from the API; second call inserts zero rows; unauthenticated caller is rejected (**e2e**, Playwright)

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/db/src/schema/decision-graph.ts` | new | Add `decisions` + `decision_links` tables (Drizzle schema) |
| `packages/db/src/schema/index.ts` | modify | Re-export new schema module |
| `packages/db/src/migrations/0014_decision_graph.sql` | new (generated) | `pnpm generate` migration |
| `packages/db/src/migrations/meta/0014_snapshot.json` | new (generated) | Drizzle snapshot |
| `packages/db/src/migrations/meta/_journal.json` | modify (generated) | Journal entry |
| `packages/contracts/src/decisions/decision.ts` | new | Zod schemas: `DecisionDTOSchema`, `DecisionLinkDTOSchema`, `BackfillDecisionsResponseSchema` |
| `packages/contracts/src/decisions/decision.contract.test.ts` | new | Contract tests |
| `packages/contracts/src/decisions/index.ts` | new | Barrel |
| `packages/contracts/src/index.ts` | modify | Re-export decisions module |
| `packages/contracts/package.json` | modify | Add `./decisions` export path |
| `apps/web/src/domain/decision-graph/decision.ts` | new | Domain entity + invariants |
| `apps/web/src/domain/decision-graph/decision-graph-repository.ts` | new | Port |
| `apps/web/src/domain/decision-graph/map-question-history-to-decision.ts` | new | Pure mapper |
| `apps/web/src/domain/decision-graph/index.ts` | new | Barrel |
| `apps/web/src/application/decision-graph/persist-decision-from-question-history-usecase.ts` | new | Sync persistence use case |
| `apps/web/src/application/decision-graph/persist-decision-from-question-history-usecase.test.ts` | new | Unit |
| `apps/web/src/application/decision-graph/backfill-decisions-for-project-usecase.ts` | new | Backfill use case |
| `apps/web/src/application/decision-graph/backfill-decisions-for-project-usecase.test.ts` | new | Unit (idempotency) |
| `apps/web/src/application/decision-graph/index.ts` | new | Barrel |
| `apps/web/src/infrastructure/persistence/decision-graph-repository.ts` | new | Drizzle adapter |
| `apps/web/src/infrastructure/persistence/decision-graph-repository.integration.ts` | new | Integration test |
| `apps/web/src/infrastructure/persistence/index.ts` | modify | Export new adapter |
| `apps/web/app/api/projects/[id]/clarify/route.ts` | modify | Capture inserted `questionHistory.id` and call persist use case |
| `apps/web/app/api/projects/[id]/decision-graph/backfill/route.ts` | new | Owner-only POST backfill route |
| `apps/web/e2e/decision-graph-backfill.spec.ts` | new | Playwright owner backfill smoke |

---

## Out of Scope

Carries over the parent slice's Excluded Behavior:

- Owner Decisions list UI (slice `decision-graph--owner-decisions-list-panel`).
- PRD section badges and links on the PRD viewer (slice `decision-graph--section-badges-and-links`).
- `decisions.json` in the Cursor delivery zip (slice `decision-graph--export-decisions-json`).
- Force-directed graph visualization.
- Anonymous share viewers reading decisions (owner-private only).
- No PRD viewer or owner panel route is exposed by this story; only the persistence and backfill endpoints.

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| _(none)_ | — | — | — |

---

## Decision References

- none

---

## Readiness for Implementation Plan

- [x] Story expressed in user-value terms (no implementation language)
- [x] Acceptance Criteria cover at least one row per UX state from the parent Scope Slice
- [x] Test plan names test type for each item (unit / integration / contract / e2e)
- [x] Touched Files (predicted) is non-empty
- [x] Out of Scope is non-empty
- [x] All Open Questions either answered or carry an explicit next action
- [x] Decision references resolved (`none` stated explicitly)

**Verdict:** READY FOR IMPLEMENTATION PLAN

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-04 | Blueprint scaffold from blueprint backlog | — |
| 2026-06-05 | Filled ACs against UX states, typed tests, exact predicted paths; promoted to `ready-for-implementation` | architect |
