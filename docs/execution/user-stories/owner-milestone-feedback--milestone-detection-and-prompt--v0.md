# User Story: Milestone detection and prompt (v0)

## Parent Scope Slice

[Milestone detection and prompt](../../product/scope-slices/owner-milestone-feedback--milestone-detection-and-prompt.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As the signed-in product owner, I want a lightweight feedback prompt after key PRD milestones so I can optionally rate the experience—without interruptions for visitors or unrelated actions.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I complete first PRD generation (stream completes with kind `first`) | The completion envelope parses | A prompt may show with milestone `first_prd_version_created` and the emitted `prdVersionId` |
| AC-2 | I complete a PRD update generation (kind `update`) after clarification | Same | A prompt may show with `prd_version_updated_after_clarification` |
| AC-3 | I successfully mint or reuse a share link for the viewed version | Mint succeeds | A prompt may show with `prd_shared` for that version |
| AC-4 | I open the PRD tab from another tab, or switch PRD versions while on the PRD tab | The event is detected | A prompt may show with `prd_reopened_after_generation` (deduped per session/version) |
| AC-5 | I already dismissed or skipped a prompt this session for a milestone/version pair | Same milestone revisits | No duplicate prompt |
| AC-6 | I close the modal or tap Skip without submitting | — | Session dedupe treats the prompt as consumed for that milestone/version |

---

## Test Plan

- [x] Contract: `packages/contracts/src/feedback/milestone.test.ts`
- [ ] `pnpm typecheck` and `pnpm build` on tracking branch

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/contracts` | modify | SSE completion + milestone request schemas |
| `apps/web` PRD clarification / viewer / workspace | modify | Detection + modal triggers |
| `apps/web` `/api/feedback` | modify | Validates POST body |

---

## Out-of-Scope

- Attribution and persistence semantics beyond existing `/api/feedback` (`feedback-capture-and-attribution` slice).
- Prompts on anonymous share pages.

---

## Open Questions

- None

---

## Decision References

- None

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Authored for orchestrator milestone-detection slice | — |
