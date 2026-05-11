<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/owner-milestone-feedback.md
-->

# Scope Slice: Feedback capture and attribution

## Parent Feature Area

[Owner milestone feedback](../feature-areas/owner-milestone-feedback.md)

## Status

`exploratory`

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
|       |      |                                  |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
|        |           |       |

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
| `milestone-detection-and-prompt` | Scope Slice | exploratory | The prompt must exist and surface before a response can be submitted |

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

- [ ] User value stated without implementation language
- [ ] Exact boundary defined (included + excluded)
- [ ] UX states enumerated (including error and empty states)
- [ ] Business objects named
- [ ] Credit / payment impact assessed
- [ ] Sharing / privacy surface assessed
- [ ] Feedback / instrumentation impact assessed
- [ ] All dependencies named and their status known
- [ ] All blockers resolved or NEED_HUMAN=true explicitly set
- [ ] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** NOT READY

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Scaffolded from approved `/feature-area slice owner-milestone-feedback` proposal via `/feature-area scaffold-slices` | — |
