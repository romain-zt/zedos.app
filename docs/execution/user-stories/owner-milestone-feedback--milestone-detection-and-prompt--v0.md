# User Story: Owner milestone detection and prompt (v0)

## Parent Scope Slice

[Milestone detection and prompt](../../product/scope-slices/owner-milestone-feedback--milestone-detection-and-prompt.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in project owner (product owner), after I complete certain PRD milestones, I want an optional lightweight skippable feedback prompt so I can share impressions or quick reactions **without interruption** or breaking my flow; I must be able to skip/dismiss it with no persistence of feedback **text** in this slice.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I am the signed-in owner of the active project | I complete “first PRD version created” (`prd_created`) | A non-blocking, dismissible prompt appears with an obvious Skip/dismiss control (toast or banner) anchored to owner-only UI |
| AC-2 | I am the signed-in owner | I complete “PRD version updated after clarification” (`prd_updated`) | Same prompt behavior as AC-1 |
| AC-3 | I am the signed-in owner | I mint a read-only share link (`prd_shared`) | Same prompt behavior as AC-1 |
| AC-4 | I am the signed-in owner | I reopen / view the PRD after generation (`prd_viewed`) | Same prompt behavior as AC-1 |
| AC-5 | A milestone fires again in the **same browser session / tab** after I already saw or skipped a prompt (suppression active) | Any milestone repeats | No duplicate prompts until the next **full reload** (`sessionStorage` / React coordination per plan) |
| AC-6 | I am anonymous, viewing via share surface, or signed in but **not** the project owner | A milestone-producing action occurs | No feedback prompt appears at any time |
| AC-7 | The prompt is visible | I choose Skip / dismiss | The prompt closes immediately with no required rating, comment, or persisted feedback payload in this slice |
| AC-8 | Only non-milestone interactions occur | Normal navigation/use | Baseline UI with no prompting |

---

## Test Plan

- [ ] **Contract:** milestone detection / outbound payload schema (`packages/contracts` — `feedback/milestone-prompt` + tests) *(landed on tracking branch)*
- [ ] **Unit:** session deduplication helper / provider logic *(scheduled with UI layer)*
- [ ] **Unit/integration:** emitters invoke the milestone surface helper with correct discriminant (`apps/web/` per Implementation Plan phases after approvals)
- [ ] **Manual:** milestone smoke on dashboard after each emitting slice (share mint, capture PRD, reopen flow)
- [ ] **`pnpm typecheck`** and **`pnpm build`** on the tracking branch before merge-ready

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|----------------|-------------|--------|
| `packages/contracts/src/feedback/milestone-prompt.ts` (+ tests) | new / modify *(contracts landed)* | Serialize/detect milestone payload at UI/app boundary |
| `apps/web/app/dashboard/projects/[id]/layout.tsx` or parent dashboard layout | modify — **next** | Mount owner-only milestone prompt provider |
| `apps/web/app/dashboard/projects/[id]/_components/owner-milestone-prompt.tsx` (or equivalent) | new — **next** | Client prompt UI + session suppression |
| PRD capture / versioning routes or actions | modify — **next** | Emit milestone signal after successful version create/update |
| Share mint flow (`apps/web/app/api/share/create/route.ts` or client caller) | modify — **next** | Emit `prd_shared` after successful mint |
| PRD view/open flows after generation | modify — **next** | Emit `prd_viewed` when owner lands on PRD |
| Domain/application milestone helper (thin) | add — *optional iteration* | Session-scoped dedupe adapter boundary |

Exact paths iterate phase-by-phase in the Implementation Plan (`docs/execution/plans/owner-milestone-feedback--milestone-detection-and-prompt--v0.plan.md`).

---

## Out of Scope

- Persisting feedback responses or linking to `feedback-capture-and-attribution` *(separate slice)*.
- Prompts for anonymous share viewers / collaboration or invited-editor feedback prompts.
- Prompts on arbitrary non-milestone actions.
- Persisting dismissal state server-side *(client tab/session suppression only for v0).*

---

## Open Questions

- None — milestone keys align with existing `OwnerMilestoneTypeSchema` (`prd_created`, `prd_updated`, `prd_shared`, `prd_viewed`). Dependencies (`fa-prd-versioning` mint + capture slices) are validated per Slice file where applicable.

---

## Decision References

- None.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-12 | Authored `v0` for orchestrator `fa-owner-milestone-feedback--milestone-detection-and-prompt` (tracking PR #92 / #93 lineage) | cloud-agent |
