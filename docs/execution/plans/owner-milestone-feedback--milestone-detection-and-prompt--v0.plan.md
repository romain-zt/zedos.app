# Implementation Plan: Milestone detection and prompt (v0)

## Parent User Story

[Milestone detection and prompt (v0)](../user-stories/owner-milestone-feedback--milestone-detection-and-prompt--v0.md)

## Status

`proposed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** true *(plan approval gate — execution bridge §6)*
> **NEED_UPDATE:** false

---

## Approach

Stack work one hex-friendly layer per PR / orchestrator iteration (≤3 layers touched per `.cursor/rules/79-pr-sizing.mdc`). **Iteration 1 (this gated commit):** canonical Zod discriminants plus `OwnerMilestonePromptPayloadSchema` exported from `@repo/contracts` so PRD versioning, share mint routes, reopen flows and the eventual dashboard presenter share one contract-shaped event. Emitters validate outbound payloads (`safeParse` in thin Next routes or server helpers) — no DB writes here. Session dedupe + UI hosting land in subsequent layers after orchestrator approvals + PIS. Follow rules 72–74, 76–77 — only infrastructure touches Next routes; presenter remains client-owner-only guards.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | No new tables this slice (`docs/product/scope-slices/owner-milestone-feedback--milestone-detection-and-prompt.md` Data Touched) |
| Auth source-of-truth | better-auth `requireUser` / session claims before emit surfaces |
| Async/sync boundary | Synchronous milestone dispatch per request/route |
| Transaction boundary | Milestone payloads piggyback immediate success handlers — no transactional coupling |
| External dependencies | none |
| Payment shape | n/a |

### Surface Blockers

- **Plan approval**: human/orchestrator must reply `approved` on this file before touching `packages/**` or `apps/web/**`.

---

## Layers Affected (by iteration)

### Iteration 1 — contracts-domain

- [x] `contracts` — new module `packages/contracts/src/owner-milestone-feedback`

### Deferred iterations (explicit)

- Iteration 2 — `application` façade + domain-free helper exporting Result-safe dedupe semantics
- Iteration 3 — `app` emitter hooks (PR capture route, clarification completion path, `/api/share/create`, reopen heuristic) respecting owner guard
- Iteration 4 — `ui` lightweight prompt host wired into dashboard layouts with sessionStorage/React state suppression

_No layer merges until its iteration is unlocked in `docs/state/HANDOFF.md`._

---

## Touched Files (exact paths — Iteration **1 contracts only**)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/src/owner-milestone-feedback/milestones.ts` | add | `OwnerMilestoneKindSchema`, payload schema |
| `packages/contracts/src/owner-milestone-feedback/milestones.test.ts` | add | Fixture coverage positive/negative |
| `packages/contracts/src/owner-milestone-feedback/index.ts` | add | Barrel |
| `packages/contracts/src/index.ts` | modify | Barrel export |

Subsequent iterations append rows here before execution.

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `OwnerMilestoneKindSchema`, `OwnerMilestonePromptPayloadSchema` | add | `milestones.test.ts` |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|----------------------|
| none | — | — |

---

## Tests

| Path | Type | Notes |
|------|------|-------|
| `packages/contracts/src/owner-milestone-feedback/milestones.test.ts` | contract | Validates enum + UUID fields + ISO timestamps |

Additional tests arrive with later emitter/UI iterations.

---

## Dependencies Added

- None

---

## Rollback

Delete new contracts submodule + revert barrel export — no persisted data mutations.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Milestone discriminants drift from PR semantics | Medium | Emitters/UI disagree | Freeze enum list in contracts + cite PRD + Slice numbering in comments |
| Over-eager emits causing duplicate UX | Medium | Spammy prompts | Subsequent iteration wraps session/sessionStorage dedupe per Slice |

---

## Out of Scope (deliberate)

- Persisting dismissal or feedback payloads
- Non-owner observers / anonymous share UX
- Extending milestones beyond enumerated four events

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-12 | Proposed stacked plan for orchestrator milestone prompt slice (`status=proposed`, awaiting approval) | cloud-agent |
