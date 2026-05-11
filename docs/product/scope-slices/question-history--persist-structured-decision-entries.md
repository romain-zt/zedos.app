<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/question-history.md
-->

# Scope Slice: Persist structured decision entries

## Parent Feature Area

[Question history](../feature-areas/question-history.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Every product decision made during the clarification flow produces a structured, storable record the founder can reference later — not a raw chat dump.

---

## Exact Boundary

### Included Behavior

- When a product decision moment occurs in the clarification flow, a structured record is produced and stored.
- Each record contains the six fields defined by PRD / Q-017: structured question, available options, founder's answer, optional comment, AI interpretation, PRD impact.
- Records are associated with the project and PRD context in which the decision was made.
- Records are stored in the owner's private workspace — not accessible on the anonymous share surface.

### Excluded Behavior

- Storing raw conversational chat transcripts (PRD: structured log, not raw chat).
- Exposing decision entries on the anonymous share surface (owner-private).
- Manual creation or editing of decision entries by the founder (entries are produced by the clarification flow, not hand-authored).
- Collaboration: other users editing or appending to entries (Hard v0 exclusion).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Clarification turn completes successfully | The guided clarification flow finishes one assistant turn with valid structured JSON | The founder sees the streamed guidance as today; **behind the scenes** a new structured row appears for this project (and optional PRD version context) without storing a raw chat transcript. |
| Clarification request invalid | The client sends a malformed clarify payload | The API responds with **400** and validation details; **no** credit deduction and **no** history row. |
| Insufficient credits | Credit check fails before calling the model | **402** with balance/cost; **no** new history row. |
| AI response invalid (schema) | The model returns JSON that does not match the clarify contract | Stream may still show; **no** credit deduction and **no** `question_history` insert (logged server-side). |
| Question history list (owner GET) | Owner opens data that loads `/api/projects/:id/questions` | Ordered list of structured entries; legacy/invalid `available_options` in DB surfaces as **null** options in the API (coerced), not arbitrary JSON. |
| History list server bug | DB row shape drifts from the outbound contract | **500** generic error; details logged server-side (outbound zod failure). |
| Empty history | New project, no decisions yet | **Empty array** from the list endpoint; clarify flow unchanged. |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| `question_history` (Postgres / Drizzle) | **Insert** on successful clarify turn | Populates structured question, optional **decision UI** JSON (`available_options`), founder answer / decision payload, AI interpretation, PRD impact, `question_type`, optional `prd_version_id`. |
| `question_history` | **Read** for GET list and for clarify context window | List: project-scoped, ascending by `created_at`. Clarify: last N rows feed model context (existing behavior). |
| Credits ledger (existing) | **Deduct** only after valid AI JSON | Deduction runs **after** `ClarifyAiResponseSchema` passes; invalid AI output does not burn credits for that completion path. |
| `prd_versions` (related AI path) | **Insert** after valid generate-PRD JSON | `GeneratePrdAiResponseSchema` validated before deduct + insert (same side-effect ordering rule as clarify). |

---

## Credit / Payment Impact

Persisting the structured row does not define a **new** billable product action — credit checks and deduction remain tied to the **existing** clarification AI call (same step that produces the decision moment). This slice does not introduce standalone pricing for “save row only.” Coordination with the **Credit system** FA stays unchanged.

---

## Sharing / Privacy Impact

Decision entries are owner-private. Zero exposure on the anonymous share surface — coordination with `read-only-sharing` FA required to enforce this boundary.

---

## Feedback / Instrumentation Impact

None — creating a decision record is not itself a milestone trigger. The "PRD version updated after clarification" milestone is triggered at the PRD version level (owned by `prd-versioning` FA), not at the individual decision entry level.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Guided clarification | Feature Area | exploratory (NEED_HUMAN) | Clarification flow produces the decision moments that generate entries; this is a runtime dependency — does not block defining or building the persistence model |
| Project workspace | Feature Area | validated | Entries are scoped to a project and PRD context |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

When a product decision moment occurs in the clarification flow, a structured entry with all six PRD-defined fields is durably stored and associated with the correct project and PRD version; the entry is visible only to the signed-in owner; raw conversational content is not stored as a standalone record.

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
| 2026-05-11 | Scaffolded from approved `/feature-area slice question-history` proposal via `/feature-area scaffold-slices` | — |
| 2026-05-11 | Refined UX States, Data Touched; promoted to `ready-for-user-stories` | cloud-agent |
