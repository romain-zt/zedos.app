# User Story: PRD to feature split (v0)

## Parent Scope Slice

[PRD to feature split](../../product/scope-slices/services-feature-split--prd-to-feature-split.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want to turn a chosen PRD version into ordered, editable feature clusters and confirm a persisted split so that downstream story work has a single unambiguous handoff artifact.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | My active project has no PRD version usable as split input | I open the feature split surface | I see guidance to complete or capture a PRD version first (empty / gated) |
| AC-2 | My project has one or more PRD versions | I have not yet chosen a source version for the split | I can pick a version from the same workspace flows I already use for PRD browsing, with guidance to prefer stable drafts (choosing input) |
| AC-3 | A proposal is generating or I am saving the split | The operation is in flight | I see an explicit busy state and no ambiguous partial persistence (loading / in-progress) |
| AC-4 | A proposal is shown | I edit clusters | I can rename labels, rewrite one-line value descriptions, merge or split clusters, and reorder execution priority without changing underlying PRD text (review) |
| AC-5 | A recoverable failure occurs (for example network or transient generation) | I choose retry | I see a clear error summary and my unsaved manual edits are not silently discarded (error recoverable) |
| AC-6 | The source PRD version payload is missing or otherwise unusable | — | I see blocked messaging with a path back to PRD versioning (error blocked) |
| AC-7 | I finish adjusting clusters | I confirm the split | The confirmed split artifact is persisted and linked to the chosen PRD version; I get a confirmation state and can proceed toward downstream work (success confirmed) |
| AC-8 | Assisted generation requires prepaid credits and my balance blocks the operation | I attempt that flow | I see explanation and recharge path consistent with global credit behavior (partially constrained) |
| AC-9 | I am not authenticated | I call split APIs | I am not allowed to read or mutate splits |
| AC-10 | I target another user’s project or PRD version | — | I get a not-found style response without leaking existence |

---

## Test Plan

- [ ] Unit: feature-split use cases (orchestration, validation, confirm) with mocked `IFeatureSplitRepository` / `IPrdRepository` (unit)
- [ ] Contract: request/response and AI proposal shape schemas in `packages/contracts` (contract)
- [ ] Integration: Drizzle repository loads/saves clusters and enforces project ownership (integration)
- [ ] `pnpm typecheck` and `pnpm build` on the tracking branch (integration)

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/db/src/schema/*.ts` | new / modify | Persist feature split header + cluster rows |
| `packages/contracts/src/feature-split/` | new | Zod DTOs for clusters, split artifact, API bodies, optional AI proposal |
| `apps/web/src/domain/feature-split/` | new | Port(s) + entities for split aggregate |
| `apps/web/src/application/feature-split/` | new | Propose, load/save draft, confirm use cases |
| `apps/web/src/infrastructure/persistence/` | new / modify | Drizzle `FeatureSplitRepository`; optional AI adapter calls existing infra pattern |
| `apps/web/app/api/projects/[id]/feature-split/**/route.ts` | new | Thin authenticated routes (parse → use case → zod out) |
| `apps/web/app/dashboard/**` | modify | Surface for picker, editor, states; retire “under construction” entry when wired |

---

## Out of Scope

- Generating user stories, implementation tasks, or Cursor prompts
- Choosing runtime architecture, services, schemas, repos, APIs, deployment boundaries, or stack
- Multi-user collaborative editing or inviting others to edit the split
- Changing core PRD clarification or versioning rules (owned by PRD versioning FA)

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| OQ-1 | Exact prepaid credit burn tier for “propose clusters” when AI-assisted | Plan only if product locks tier | Resolve via operator matrix or PD; until then gate with existing ledger + configurable cost constant in application |
| OQ-2 | Canonical AI provider response schema for cluster proposal | Implement AI-assisted path | Add `contracts/ai/feature-split-proposal.ts` before enabling assisted generation in production |

---

## Decision References

- None (slice assumes FG-PRD-V0 credit gating policies for messaging)

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
| 2026-05-11 | Authored for orchestrator `fa-services-feature-split--prd-to-feature-split` | — |
