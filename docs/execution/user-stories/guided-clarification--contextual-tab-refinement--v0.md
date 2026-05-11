# User Story: Contextual tab refinement (v0)

## Parent Scope Slice

[Contextual tab refinement](../../product/scope-slices/guided-clarification--contextual-tab-refinement.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder viewing my PRD, Architecture, or History tab, I want to open a focused refinement panel on any section or item and have a single clarification turn without leaving the current tab, so I can iterate on specific parts of my product thinking in context.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I am viewing the PRD tab | I tap the refinement icon on a PRD section | A compact panel opens labeled with that section name |
| AC-2 | I am viewing the Architecture tab | I tap the refinement icon on an ADR or decision item | A compact panel opens labeled with that item |
| AC-3 | I am viewing the History tab | I tap the "Revise" button on a past question row | A compact panel opens labeled with that question |
| AC-4 | The panel is open | I type a message and send | The existing `/api/projects/[id]/clarify` endpoint is called with a context-prefixed message |
| AC-5 | AI responds | Streaming completes | The response (message + optional reasoning chip) is displayed in the panel |
| AC-6 | Refinement completes | I tap Close | The panel dismisses; the current tab is unchanged and unrefreshed |
| AC-7 | I have insufficient credits | I tap send | A toast error appears; the panel stays open; send is disabled |
| AC-8 | A network error occurs | Fetch fails | A toast error appears; I can retry |
| AC-9 | I am not signed in | — | The underlying clarify route returns 401; toast error shown |
| AC-10 | The panel is open | I press Esc | The panel closes |

---

## Test Plan

- [ ] Unit: `ContextualRefinementPanel` renders with correct context label
- [ ] Unit: `ContextualRefinementPanel` sends correct prefixed message to `/clarify`
- [ ] Unit: `ContextualRefinementPanel` shows streaming response and closes on done
- [ ] Unit: credit error (402) renders toast and disables send
- [ ] `pnpm typecheck` and `pnpm build` on the tracking branch

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | Add `refinementContext` state; pass `onOpenRefinement` callback to child tabs |
| `apps/web/app/dashboard/projects/[id]/_components/prd-viewer.tsx` | modify | Add section-level refinement trigger buttons |
| `apps/web/app/dashboard/projects/[id]/_components/architecture-panel.tsx` | modify | Add item-level refinement trigger buttons |
| `apps/web/app/dashboard/projects/[id]/_components/question-history.tsx` | modify | Add per-item "Revise" trigger |
| `apps/web/app/dashboard/projects/[id]/_components/contextual-refinement-panel.tsx` | create | New compact panel: label, textarea, send, streaming display |

---

## Out-of-Scope

- Multi-turn threaded conversation within the panel
- Automatic PRD content refresh after a refinement turn
- Separate question history tracking for "contextual" vs "main tab" turns
- Any changes to the `/api/projects/[id]/clarify` API route

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
| 2026-05-11 | Authored for `fa-guided-clarification--contextual-tab-refinement` | — |
