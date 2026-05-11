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
| Idle / no milestone | Owner has not hit a tracked milestone yet | Normal workspace; no feedback modal |
| Milestone triggered | Backend or UI detects one of four owner milestones | Lightweight modal with stars + optional comment + Skip |
| Prompt skipped or dismissed | Owner closes modal or taps Skip without stars | Prompt closes; session key marks “seen” for that milestone + version pair |
| Prompt submitted | Owner picks 1–5 stars (required to submit) and optional comment | Modal closes after POST; toast thanks; session key marked seen |
| Stream incomplete / invalid telemetry | SSE completion missing `prdVersionId`/`prdGenerationKind` | No clarification milestone prompt from stream (silent; PRD refresh still runs) |
| Error (share/network) | Share mint fails | Toast error only; no share milestone prompt |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| PRD generation SSE `completed` event | Read (client parse) | `GeneratePrdStreamCompletedEnvelope`: `prdVersionId`, `prdGenerationKind`, `result` buffer |
| `sessionStorage` | Read/write (client only) | Keyed by project + milestone + optional `prdVersionId` (`owner-milestone-prompt-session.ts`) |
| `POST /api/feedback` | Write (thin route) | `MilestoneFeedbackPostBody`; persistence unchanged vs prior feedback route |


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
| `mint-read-only-link` | Scope Slice | validated | "PRD shared" milestone originates from link creation |

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
- [x] UX states enumerated (including error and empty states)
- [x] Business objects named
- [x] Credit / payment impact assessed
- [x] Sharing / privacy surface assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Scaffolded from approved `/feature-area slice owner-milestone-feedback` proposal via `/feature-area scaffold-slices` | — |
