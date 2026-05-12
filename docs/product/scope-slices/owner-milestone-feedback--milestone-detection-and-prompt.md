<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/owner-milestone-feedback.md
-->

# Scope Slice: Milestone detection and prompt

## Parent Feature Area

[Owner milestone feedback](../feature-areas/owner-milestone-feedback.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

After specific owner actions, a lightweight skippable feedback prompt appears — never intrusive, never mandatory.

---

## Exact Boundary

### Included Behavior

- The product detects the four owner milestone events defined in PRD v1: first PRD version created; PRD version updated after clarification; PRD shared (link minted); PRD reopened / viewed by owner after generation.
- After each detected milestone, a lightweight feedback prompt is surfaced to the signed-in owner.
- The prompt is skippable — the owner can dismiss it without providing feedback.
- Prompts are selective: not every product action triggers a prompt; only the defined milestones do.
- Prompts appear only for the signed-in owner, never for anonymous share viewers.

### Excluded Behavior

- Feedback prompts for anonymous share viewers (Hard v0 exclusion per PRD).
- Collaboration feedback loops from invited editors.
- Triggering prompts on arbitrary product actions outside the four defined milestones.
- Storing the feedback response (that is `feedback-capture-and-attribution`).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Baseline — no prompt | Owner is using the product; no milestone has fired in this session | Normal product UI; no feedback prompt visible anywhere |
| Milestone detected — prompt appears | Owner just completed one of the four milestone actions: first PRD version created; PRD version updated after clarification; share link minted; PRD reopened / viewed after generation | A lightweight, non-blocking feedback prompt appears (toast or anchored banner); includes a visible "Skip" control; does not interrupt the current flow |
| Prompt dismissed / skipped | Owner clicks "Skip" or the dismiss control | Prompt closes immediately; owner continues without consequence; no rating is required and none is recorded in this slice |
| Already prompted this session | Same milestone (or any milestone) fires again within the same browser session | No duplicate prompt shown; session-level deduplication (React state) prevents re-surfacing until the next full page load |
| Anonymous / share visitor | A share link is opened by a non-signed-in visitor, or the signed-in user is not the project owner | No prompt is visible at any point; the prompt surface is strictly owner-account-only |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| User session / auth | Read | Verified before any prompt is shown; prompt never surfaces unless the viewer is the signed-in project owner |
| `PrdVersion` | Read (event) | "First PRD version created" and "PRD version updated after clarification" milestones are triggered by version-create/update events emitted by the `create-or-capture-prd-version` slice |
| `ShareLink` | Read (event) | "PRD shared" milestone is triggered by the link-minted event emitted by the `mint-read-only-link` slice |
| `Project` | Read | Prompt is scoped to the owning project; owner identity is validated against `project.ownerId` |
| Client session state (React / sessionStorage) | Write (client-only) | Once a prompt is shown or dismissed in a session, a client flag suppresses re-surfacing for that session; nothing is written to the database in this slice — persistent tracking of dismissed prompts is deferred to the `feedback-capture-and-attribution` slice |

---

## Credit / Payment Impact

None — displaying a feedback prompt does not consume credits.

---

## Sharing / Privacy Impact

None — prompts are strictly owner-only and do not appear on the anonymous share surface.

---

## Feedback / Instrumentation Impact

This slice **is** the feedback surface entry point. It detects milestones and surfaces the prompt. Coordination dependencies:
- "PRD shared" milestone requires `mint-read-only-link` slice to emit the milestone event.
- "PRD version created/updated" milestone requires `create-or-capture-prd-version` slice to emit the milestone event.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| PRD versioning | Feature Area | validated | "First PRD version created" and "PRD version updated" milestones originate from version events |
| `mint-read-only-link` | Scope Slice | exploratory | "PRD shared" milestone originates from link creation |
| `feedback-capture-and-attribution` | Scope Slice | exploratory | Prompt must connect to capture slice to record the response |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

After each of the four defined owner milestone events, the signed-in founder sees a lightweight, skippable feedback prompt; prompts never appear for anonymous visitors; the founder can dismiss the prompt without any consequence; the prompt is only shown at milestone events, not on every product interaction.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated (including empty, dismissed, duplicate-suppression, and anonymous states)
- [x] Business objects named (PrdVersion, ShareLink, Project, user session)
- [x] Credit / payment impact assessed (none)
- [x] Sharing / privacy surface assessed (none — prompt is owner-only)
- [x] Feedback / instrumentation impact assessed (this slice is the feedback entry point)
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set (none open)
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Scaffolded from approved `/feature-area slice owner-milestone-feedback` proposal via `/feature-area scaffold-slices` | — |
| 2026-05-12 | Refined via `/fix` — filled in UX States (5 states: baseline, milestone-fired, dismissed, session-dedupe, anonymous) and Data Touched (session, PrdVersion, ShareLink, Project, client-only session flag); promoted status to `ready-for-user-stories`; all readiness checklist items checked | cloud-agent |
