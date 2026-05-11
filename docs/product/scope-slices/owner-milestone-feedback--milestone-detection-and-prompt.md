<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/owner-milestone-feedback.md
-->

# Scope Slice: Milestone detection and prompt

## Parent Feature Area

[Owner milestone feedback](../feature-areas/owner-milestone-feedback.md)

## Status

`exploratory`

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
|       |      |                                  |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
|        |           |       |

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
