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
| Idle / no prompt | Between milestones; user on anonymous share surface; or milestone already had feedback for same (user, project, milestone type, optional version) | Normal product UI; no feedback chrome |
| Prompt visible | Immediately after a detected owner milestone | Lightweight modal or overlay with optional star rating and comment; clear dismiss / close without submitting |
| Submitting | User chose to send feedback | Short in-flight affordance; control disabled or loading |
| Submit success | Server accepted feedback | Confirmation toast or inline success; prompt closes |
| Submit error (transient) | Network or server failure | Recoverable error message; user can retry or dismiss |
| Submit duplicate | Same milestone feedback already recorded for this user | Non-blocking acknowledgment; prompt can close (no second row required) |
| Reopen throttled | `prd_reopened` already prompted once this browser session | No second reopen prompt until a new session (session-scoped suppression only) |
| Post-generate suppress | User just finished “Generate PRD” and lands on PRD tab | No immediate `prd_reopened` prompt (avoid double prompt with `prd_created` / `prd_updated_after_clarification`) |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| **Project** (business) | read (implicit) | Milestones are scoped to `projectId`; owner session only |
| **PRD version** (business) | read | Optional `prdVersionId` on submission; used for create/update/reopen/shared context |
| **Milestone feedback row** (`milestone_feedback`) | insert (downstream of prompt) | Persisted only when owner submits via capture path tied to this slice’s API; duplicate key / constraint yields duplicate response — full persistence semantics belong to `feedback-capture-and-attribution` |
| **Read-only share link** (business) | read | `prd_shared` fires when owner mints a new share link for a version |
| **Browser session** (`sessionStorage`) | read / write | Optional key per project to limit `prd_reopened` noise within a session |

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
| `mint-read-only-link` | Scope Slice | complete | "PRD shared" milestone originates from link creation |
| `feedback-capture-and-attribution` | Scope Slice | exploratory | Durable attribution and capture polish; this slice only detects milestones + surfaces the prompt and posts to existing feedback API |

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
| 2026-05-11 | Refined UX states, data touched, dependency status (`mint-read-only-link` complete); promoted to `ready-for-user-stories` | cloud-agent (orchestrator) |
