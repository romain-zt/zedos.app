# User Story: Feedback capture and attribution (v0)

## Parent Scope Slice

[Feedback capture and attribution](../../product/scope-slices/owner-milestone-feedback--feedback-capture-and-attribution.md)

## Status

`draft`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in owner, when I submit milestone feedback, I want my rating and optional comment to be saved with the right project, PRD version, milestone type, and timestamp so that usefulness metrics are reliable.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I am the signed-in owner and a milestone prompt is visible | I submit a rating (stars or like/dislike) with optional comment | A feedback record is created with project id, PRD version id, milestone type, and timestamp |
| AC-2 | I submit feedback with no comment | Save succeeds | Feedback is stored with rating and empty/absent comment without validation error |
| AC-3 | I choose to skip the prompt | Prompt closes | No feedback record is created |
| AC-4 | Save request fails | I submit | I see an error and can retry without losing input |
| AC-5 | I am not eligible (anonymous viewer or non-owner) | A feedback interaction would otherwise occur | No capture UI or save path is available |
| AC-6 | A record is stored | Later metrics processing reads it | Attribution fields are present and usable (`project`, `prdVersion`, `milestoneType`, `timestamp`) |

---

## Test Plan

- [x] Contract: feedback capture payload/response schemas parse valid and reject invalid attribution
- [x] Unit: capture use case maps owner feedback input to attributed persistence payload
- [x] Route: unauthorized / forbidden / validation errors return expected statuses
- [x] Integration: skip path does not persist placeholder feedback
- [x] Repo checks: `pnpm -w run typecheck` and `pnpm -w run build`

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/contracts/src/feedback/*` | modify | Align capture contracts with attributed fields |
| `apps/web/src/application/feedback/*` | add/modify | Capture use case + input/output mapping |
| `apps/web/src/domain/*` | modify | Feedback entity/port shapes (product-level attribution) |
| `apps/web/src/infrastructure/persistence/*` | modify | Persist attributed feedback row |
| `apps/web/app/api/*feedback*` | add/modify | Thin route for submission + zod validation |
| `apps/web/app/dashboard/projects/[id]/*` | modify | Submit/skip UX wiring to capture endpoint |
| `docs/execution/plans/owner-milestone-feedback--feedback-capture-and-attribution--v0.plan.md` | add | Implementation authority doc |

---

## Out of Scope

- Analytics dashboards and aggregates
- Editing/deleting historic feedback
- Anonymous share-viewer feedback

---

## Open Questions

- None.

---

## Decision References

- `docs/product/scope-slices/owner-milestone-feedback--feedback-capture-and-attribution.md`
- `docs/product/feature-areas/owner-milestone-feedback.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-28 | Authored from promoted scope slice `owner-milestone-feedback--feedback-capture-and-attribution` | — |
