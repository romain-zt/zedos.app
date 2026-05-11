<!--
  Scope Slice — approved via /plan guided-clarification contextual-tab-refinement
  Parent: docs/product/feature-areas/guided-clarification.md
-->

# Scope Slice: Contextual tab refinement

## Parent Feature Area

[Guided clarification](../feature-areas/guided-clarification.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Founder can click a "Refine" action on any section or item in the PRD, Architecture, or History tabs and have a focused clarification turn without switching to the main Clarify tab — keeping their place and context intact.

---

## Exact Boundary

### Included Behavior

- Signed-in owner sees a small refinement trigger (icon button) on each major section in the PRD viewer, on items in the Architecture panel, and on each question row in the History panel.
- Tapping the trigger opens a compact focused panel (drawer or popover) pre-labeled with the section or item being refined.
- The panel renders a minimal single-turn chat: a text area, send button, and an AI response display (message + optional reasoning chip).
- Sending submits to the existing `/api/projects/[id]/clarify` endpoint with a prefixed context message naming the section.
- Credits are consumed through the existing credit flow (same as the Clarify tab).
- On completion, the panel can be closed; a question history entry is created by the existing clarify route.

### Excluded Behavior

- Multi-turn threaded conversation within the panel (v0: single refinement turn per open).
- No separate persistence of "contextual refinement" vs "clarification" question history — both land in the same `questionHistory` table.
- No automatic refresh of the PRD/Architecture content after a refinement turn (PRD regeneration remains explicit via "Generate PRD").
- No refinement triggers on the anonymous share surface.
- No refinement from within the Clarify tab itself (it already is the chat).

---

## UX States

| State | When | What the user sees |
|-------|------|-------------------|
| **Trigger visible** | Owner views PRD / Architecture / History tab | Small `MessageSquare` icon button near each section / item heading |
| **Panel opening** | Owner taps trigger | Drawer slides in; header shows context label (e.g. "Refine: Target Users") |
| **Input idle** | Panel open, nothing typed | Placeholder text; send disabled |
| **Streaming** | Send tapped, AI responding | Loading indicator; send disabled; reasoning chip may appear during stream |
| **Done** | AI response received | Message shown; optional "Continue" (another turn) or "Close" |
| **Credit error (402)** | Insufficient credits | Toast error; panel stays open; send disabled |
| **Network error** | Fetch throws | Toast error; panel stays open; retry available |
| **Closed** | User taps close or presses Esc | Drawer dismissed; underlying tab unchanged |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Question history | create (via existing clarify route) | Same table as main clarification turns; `prdImpact` populated from AI response |
| Credits | deduct | Same credit deduction path as the Clarify tab |

---

## Credit / Payment Impact

Yes — each refinement turn consumes 1–5 credits (same `OperationType` logic as the clarify route: `clarification`, `decision`, or `mini_form`). No new credit type needed.

---

## Sharing / Privacy Impact

None — contextual refinement is owner-only; no changes to the share surface or anonymous read views.

---

## Feedback / Instrumentation Impact

None at this slice level. A refinement turn produces a `questionHistory` entry, which may indirectly contribute to milestone detection (e.g. "PRD version updated after clarification") handled by the `owner-milestone-feedback` FA. No direct new milestone hooks required here.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Guided clarification (clarify route) | Feature Area | validated | Panel reuses `POST /api/projects/[id]/clarify` — no new API endpoint |
| PRD versioning | Feature Area | validated | `prdVersionId` passed from `project-workspace.tsx` state |
| Project workspace | Feature Area | validated | Provides `projectId` and shared panel state |

---

## Blockers

None.

---

## Acceptance-Level Outcome

A signed-in founder viewing any of the three content tabs (PRD, Architecture, History) can open a focused refinement panel for a specific section or question, type a free-form response, receive an AI reply, and close the panel — all without leaving the current tab. The interaction produces a `questionHistory` row and deducts credits exactly as a main clarification turn would.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated (including error and empty states)
- [x] Business objects named
- [x] Credit / payment impact assessed
- [x] Sharing / privacy surface assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Created via `/plan` approval; parent FA promoted to `validated` same session | — |
