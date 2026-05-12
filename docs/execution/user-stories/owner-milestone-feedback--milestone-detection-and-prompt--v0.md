# User Story: Owner milestone detection and prompt (v0)

## Parent Scope Slice

[Milestone detection and prompt](../../product/scope-slices/owner-milestone-feedback--milestone-detection-and-prompt.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false  
> **NEED_UPDATE:** false

---

## Story

As a signed-in project owner, I want a lightweight skippable feedback prompt after specific PRD milestones so that I can optionally share quick reactions without breaking my flow.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I am the signed-in owner of the active project | I complete an action that corresponds to “first PRD version created” (`prd_created`) | A non-blocking prompt appears with an obvious Skip control |
| AC-2 | I am the signed-in owner | I complete “PRD version updated after clarification” (`prd_updated`) | Same prompt behavior as AC-1 |
| AC-3 | I am the signed-in owner | I mint a read-only share link (`prd_shared`) | Same prompt behavior as AC-1 |
| AC-4 | I am the signed-in owner | I reopen / view the PRD after generation (`prd_viewed`) | Same prompt behavior as AC-1 |
| AC-5 | A milestone fires again in the same browser session after I already saw or skipped a prompt | Any milestone repeats | No duplicate prompt until the next full page load |
| AC-6 | I am anonymous or viewing via share surface, or I am not the project owner | Any milestone would fire | No prompt is shown |
| AC-7 | The prompt is visible | I choose Skip / dismiss | The prompt closes immediately with no required rating or comment |

---

## Test Plan

- [ ] Contract tests for milestone detection payload schema (`packages/contracts`) (contract)
- [ ] Unit tests for session deduplication helper / provider logic (unit)
- [ ] Manual smoke: trigger each milestone path once as owner and confirm prompt + Skip (manual)

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|----------------|-------------|--------|
| `packages/contracts/src/feedback/milestone-prompt.ts` | new | Serialize/detect milestone payload at UI/app boundary |
| `apps/web/app/dashboard/projects/[id]/layout.tsx` or parent dashboard layout | modify | Mount owner-only milestone prompt provider |
| `apps/web/.../owner-milestone-prompt-provider.tsx` (new component path under dashboard project tree) | new | Client prompt UI + session suppression |
| PRD capture / versioning routes or actions | modify | Emit milestone signal after successful version create/update |
| Share mint flow (`apps/web/app/api/share/create/route.ts` or client caller) | modify | Emit `prd_shared` after successful mint |
| PRD view/open flows after generation | modify | Emit `prd_viewed` when owner lands on PRD |

---

## Out of Scope

- Persisting feedback responses or linking to `feedback-capture-and-attribution` (separate slice).
- Prompts for anonymous share viewers.
- Prompts on arbitrary non-milestone actions.

---

## Open Questions

None — milestone keys align with existing `OwnerMilestoneTypeSchema` (`prd_created`, `prd_updated`, `prd_shared`, `prd_viewed`).

---

## Decision References

None.
