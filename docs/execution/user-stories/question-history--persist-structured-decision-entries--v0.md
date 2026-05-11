<!--
  User Story — Question history: persist structured decision entries (v0)
-->

# User Story: Persist structured decision entries (v0)

## Parent Scope Slice

[Persist structured decision entries](../../product/scope-slices/question-history--persist-structured-decision-entries.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want each clarification turn that represents a product decision moment to be stored as a structured, owner-private record (not a raw chat transcript) so that I can revisit what was asked, what I answered, and how it affects the PRD.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I am signed in and own the project | I complete a clarification turn whose streamed assistant JSON validates | A new `question_history` row exists for my project with structured question, optional validated decision UI options, my answer/decision payload, AI interpretation, PRD impact, and type; it is not exposed on any anonymous share surface. |
| AC-2 | I send a malformed clarify request body | The API parses the body | I receive **400** with validation details; no credit deduction for that request path; no new history row. |
| AC-3 | I lack credits before the model runs | I attempt clarification | I receive **402**; no new history row. |
| AC-4 | The model returns JSON that fails the clarify contract | The stream completes | I am not charged for that completion path and no `question_history` row is inserted for that invalid buffer. |
| AC-5 | I am the owner | I fetch question history for the project | I receive an array ordered by creation time; each row matches the public list contract; invalid legacy `available_options` JSON is not leaked as arbitrary structures (coerced to null at the boundary). |
| AC-6 | No rows exist yet | I fetch question history | I receive an empty array (**200**). |
| AC-7 | Generate-PRD runs with streamed JSON | The buffer validates against the generate-PRD contract | Credits deduct and `prd_versions` insert occur only after successful validation (ordering consistency with clarify). |

---

## Test Plan

- [ ] Contract unit tests for clarify / generate-PRD / question-history schemas and legacy `available_options` coercion (contract)
- [ ] `pnpm typecheck` at repo root (integration)
- [ ] `pnpm build` at repo root (integration)

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/contracts/src/ai/*.ts` | new | Zod schemas for streamed AI JSON |
| `packages/contracts/src/questions/history.ts` | new / modify | Clarify POST + history list DTOs |
| `packages/contracts/src/questions/*.contract.test.ts` | new | Schema tests |
| `packages/contracts/package.json` | modify | Export subpaths for app imports |
| `apps/web/app/api/projects/[id]/clarify/route.ts` | modify | Inbound + stream-end validation before deduct/insert |
| `apps/web/app/api/projects/[id]/generate-prd/route.ts` | modify | Stream-end validation before deduct/insert |
| `apps/web/app/api/projects/[id]/questions/route.ts` | modify | Outbound list validation |
| `docs/product/scope-slices/question-history--persist-structured-decision-entries.md` | modify | Story-ready slice |
| `docs/product/feature-areas/question-history.md` | modify | Slice status |
| `docs/execution/plans/*.plan.md` | new | Implementation plan |
| `docs/state/status.json`, `docs/state/HANDOFF.md` | modify | Orchestration bookkeeping |

---

## Out of Scope

- Owner-facing browsing/search UX for history (separate slice: owner views question history).
- Manual edit or deletion of history rows by the founder.
- Raw chat transcripts as first-class stored records.
- Collaboration / multi-editor history.
- Refactoring `lib/ai-service.ts` or `lib/credits.ts` frozen throws (v0 debt).

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| — | — | — | — |

---

## Decision References

- PRD / Q-017 — six fields per decision log (cited in parent Feature Area).
- none

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
| 2026-05-11 | Initial story from promoted scope slice | cloud-agent |
