# User Story: Milestone detection and prompt (v0)

## Parent Scope Slice

[Milestone detection and prompt](../../product/scope-slices/owner-milestone-feedback--milestone-detection-and-prompt.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As the signed-in product owner, after I complete certain PRD milestones, I want an optional feedback prompt so I can share impressions without interruption; I must be able to skip it.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I own the active project | A defined owner milestone succeeds (first PRD version captured; PRD version updated post-clarification; read-only share link minted for a version; or I reopen/view the PRD after generation completes) | A lightweight, dismissible prompt appears anchored to owner-only UI (toast or banner) with a clearly labeled Skip/dismiss |
| AC-2 | I tap Skip/dismiss | — | The prompt closes immediately with no consequence; nothing is persisted for feedback text in this slice |
| AC-3 | The same milestone (or another milestone) fires again in this browser tab session | My session already suppressed prompts | No duplicate prompts until a full reload per session-level dedupe (React state ± session coordination) |
| AC-4 | I am anonymous or viewing a share link surface, or I am signed in but not the project owner | A milestone-producing action occurs | No feedback prompt appears at any time |
| AC-5 | Only non-milestone interactions occur | Normal navigation/use | Baseline UI with no prompting |

---

## Test Plan

- [ ] Contract: Zod parses for milestone kind + outbound payload emitted to the UI surface (`packages/contracts` once added under plan §Tests)
- [ ] Unit/integration: emitters invoke the milestone surface helper with correct discriminant (`apps/web/` per Implementation Plan phases after approval)
- [ ] Manual: milestone smoke on dashboard after each emitting slice (share mint, capture PRD, reopen flow)
- [ ] `pnpm typecheck` and `pnpm build` on the tracking branch before merge-ready

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/contracts` | add | Canonical owner milestone discriminator + emitted payload schemas |
| Domain / application milestone helper | add | Session-scoped dedupe adapter boundary (thin) |
| PRD versioning + share flows | minimal emit hooks | Produce milestone payloads only for owner-signed-in contexts |
| Dashboard layout shell | compose client prompt host | Consume payloads; render owner-only transient UI |

Exact paths phase by phase in Implementation Plan (`docs/execution/plans/owner-milestone-feedback--milestone-detection-and-prompt--v0.plan.md`).

---

## Out-of-Scope

- Capturing feedback text or persistence (`feedback-capture-and-attribution`)
- Collaboration / invited-editor feedback prompts
- Arbitrary milestones beyond the PRD-defined four
- Prompts on anonymous surfaces

---

## Open Questions

- None (dependencies `fa-prd-versioning` mint + capture slices are validated per Slice file)

---

## Decision References

- None

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-12 | Authored `v0` for orchestrator `fa-owner-milestone-feedback--milestone-detection-and-prompt` tracking PR #92 | cloud-agent |
