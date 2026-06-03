<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/owner-milestone-feedback.md
-->

# Scope Slice: Feedback capture and attribution

## Parent Feature Area

[Owner milestone feedback](../feature-areas/owner-milestone-feedback.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

When the owner submits feedback, the rating and optional comment are stored with the correct project, PRD version, milestone type, and timestamp so product usefulness can be measured.

---

## Exact Boundary

### Included Behavior

- When a signed-in owner submits a feedback response (stars 1–5 or like/dislike + optional comment), it is durably stored.
- Each stored response is attributed to: the project, the PRD version, the milestone type (one of the four defined triggers), and a timestamp.
- If the owner skips the prompt, no empty record is created.
- Feedback responses are owner-private data — not exposed on the anonymous share surface.

### Excluded Behavior

- Analytics dashboards or aggregate reporting on feedback data (this FA captures inputs, not analysis).
- Feedback from anonymous share viewers (Hard v0 exclusion).
- Showing the owner their historical feedback responses in a dedicated view (not in v0 scope for this slice).
- Editing or deleting previously submitted feedback.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Prompt ready | A defined owner milestone just occurred and owner is eligible | Owner sees a lightweight feedback prompt with stars (1-5) or like/dislike and an optional comment field. |
| Empty comment | Owner selects a rating signal but leaves comment empty | Owner can still submit; optional comment remains truly optional. |
| In progress | Owner submits feedback | Owner sees submission in progress and avoids duplicate submit action while request is processing. |
| Success | Feedback save succeeds | Owner sees confirmation that feedback was recorded; prompt is dismissed for that milestone event. |
| Skip | Owner chooses to skip prompt | Prompt closes without creating any feedback record. |
| Error / retry | Save fails or cannot be completed | Owner sees an error message and can retry submission without losing selected input. |
| Not eligible | Viewer is anonymous or actor is not signed-in owner | No feedback capture UI is shown for this slice. |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Milestone feedback | Create | Stores rating signal (stars or like/dislike) and optional comment. |
| PRD version | Read | Resolves version attribution for the stored feedback row. |
| Project | Read | Resolves project attribution for the stored feedback row. |
| Milestone event context | Read | Resolves milestone type and capture timestamp at submit time. |
| Milestone feedback | No-op on skip | Skip path must not create an empty or placeholder record. |

---

## Credit / Payment Impact

None — submitting feedback does not consume credits.

---

## Sharing / Privacy Impact

Feedback responses are owner-private data. They must not appear on the anonymous share surface or be accessible to any party other than the signed-in owner and the product team for analysis purposes.

---

## Feedback / Instrumentation Impact

This slice **is** the capture mechanism. It stores the structured response that the feedback program relies on. All four milestone attribution fields (project, PRD version, milestone type, timestamp) must be stored correctly for the Success Metrics defined in PRD v1 to be meaningful.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `owner-milestone-feedback--milestone-detection-and-prompt` | Scope Slice | ready-for-user-stories (impl. complete) | Prompt eligibility and rendering shipped (`status.json` + `WORK_QUEUE`). |
| `project-workspace--create-project` | Scope Slice | ready-for-user-stories (impl. complete) | Project context for attribution — orchestration complete. |
| `prd-versioning--create-or-capture-prd-version` | Scope Slice | ready-for-user-stories (impl. complete) | PRD version context for attribution — orchestration complete. |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

When a signed-in founder submits a feedback response after a milestone prompt, the response (rating + optional comment) is durably stored with the correct project, PRD version, milestone type, and timestamp; skipping the prompt produces no stored record; no feedback data is visible to anonymous visitors.

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
| 2026-05-11 | Scaffolded from approved `/feature-area slice owner-milestone-feedback` proposal via `/feature-area scaffold-slices` | — |
| 2026-05-28 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
| 2026-06-03 | Dependencies: `pending` → impl. complete per orchestration | doc-sync |
