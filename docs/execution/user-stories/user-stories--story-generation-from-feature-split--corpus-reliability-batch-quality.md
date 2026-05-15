# User Story: User story corpus reliability, batch generation, and draft quality

## Parent Scope Slice

[Story generation from feature split](../../product/scope-slices/user-stories--story-generation-from-feature-split.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want user story drafts to save reliably, optional multi-cluster generation with clear progress, and AI/template output that reads like behavioral user stories—not a raw paste of the cluster—so that I can review and persist a trustworthy corpus per cluster.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | No confirmed split for the selected PRD version | I open the user stories surface | I see gated guidance to finish feature split first |
| AC-2 | Several confirmed clusters exist | I work with clusters | I can see cluster summaries (labels / value lines) and select **one** cluster for editing (existing behavior preserved) |
| AC-2b | Slice Included Behavior has been updated to allow multi-select (prerequisite; see Open Questions) | I select multiple clusters and choose bulk template or bulk AI | The app runs generation for **each** selected cluster (sequential or clearly throttled), shows progress and per-cluster errors without aborting the whole batch silently, and each cluster still has its own persisted corpus |
| AC-3 | I trigger generation (single or bulk) | An operation is in flight | I see loading/progress feedback; cancel/stop behaves reasonably (at minimum: no duplicate stray requests after navigate away—document chosen behavior in Plan) |
| AC-4 | Drafts are returned | I review the list for the active cluster | Titles and bodies read as user-facing behaviors; template mode is clearly labeled as scaffold and does not present a single undifferentiated duplicate of the cluster blob as the only “story” unless product explicitly keeps that (see Plan) |
| AC-5 | I save edits | A race or validation failure occurs | I get a recoverable notice; server truth is not silently overwritten |
| AC-6 | A transient failure (network / 5xx) | I retry | Error is recoverable; I can retry without losing context |
| AC-7 | I lack prerequisites (no confirmed cluster) | I try to generate | I see blocked / upstream messaging |
| AC-8 | Assisted generation is credit-gated (when wired) | My balance blocks AI | I see prepaid / recharge messaging (reuse existing HTTP semantics if present) |
| AC-9 | I mark review-ready on a corpus that exists | I confirm | Corpus state updates and UI reflects review-ready |
| AC-10 | I am not authenticated | I call user-story APIs | I am denied without leaking other users’ data |
| AC-11 | I target another user’s project | I call APIs | I get not-found / unauthorized style responses |
| AC-12 | Production DB driver (Postgres) | I save or mark review-ready after generation | No `Date` binding errors; corpora and lines persist |

---

## Test Plan

- [ ] Unit: `GenerateUserStoryDraftUseCase` — template path produces improved scaffold (not only raw cluster concatenation) per Plan (unit)
- [ ] Unit / integration: `DrizzleUserStoryCorpusRepository` — `save` and `markReviewReady` exercise Drizzle `update().set()` paths (no raw `sql` with JS `Date`); extend `user-story-corpus-repository.test.ts` (integration)
- [ ] Contract: only if request/response schemas change for batch endpoint; **if UI-only batch**, skip new contract rows and add a note in Plan (contract)
- [ ] Manual: single + multi-cluster generate on Vercel-like Node + Postgres (document in Plan test checklist) (e2e / manual)

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `apps/web/src/infrastructure/persistence/user-story-corpus-repository.ts` | modify | Replace unsafe `sql`…`${Date}` with Drizzle `update().set({ … })` per `75-drizzle.mdc` |
| `apps/web/src/infrastructure/ai/user-story-draft.ts` | modify | Prompt/rules so stories are distinct behaviors, not verbatim cluster copy |
| `apps/web/src/application/user-stories/generate-user-story-draft-usecase.ts` | modify | Template scaffold quality (e.g. structured “As a … / I want … / so that …” skeleton) |
| `apps/web/app/dashboard/projects/[id]/_components/user-stories-workspace.tsx` | modify | Multi-select + bulk actions + progress / errors |
| `docs/product/scope-slices/user-stories--story-generation-from-feature-split.md` | modify | **Human / `/feature-area refine-slice` only** — relax “exactly one” to allow multi-select batch per AC-2b |

---

## Out of Scope

- Task splitting, Cursor prompts, acceptance tests-as-code (per parent slice)
- New async job system / background workers for generation
- Changing feature split semantics or PRD versioning
- **Multi-select shipped as default in-scope** until parent slice Included Behavior is updated (see Open Questions) — implementer gates Phase UI behind prerequisite or ships persistence+quality first

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| OQ-1 | Parent slice still says “Selecting **exactly one** confirmed feature cluster” while AC-2b needs multi-select | AC-2b until resolved | Run **`/feature-area refine-slice`** on `docs/product/scope-slices/user-stories--story-generation-from-feature-split.md` with approved wording (see Implementation Plan Appendix A); then re-run checker on Story |

---

## Decision References

- None

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
| 2026-05-15 | Authored from production logs + dashboard feedback | — |
| 2026-05-15 | Persisted after user `approved` | — |
