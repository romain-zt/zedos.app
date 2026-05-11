<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/prd-versioning.md
-->

# Scope Slice: Create or capture PRD version

## Parent Feature Area

[PRD versioning](../feature-areas/prd-versioning.md)

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Founder establishes a new PRD version line and the document state for that version is persisted in-app as the canonical record — not contingent on any export.

---

## Exact Boundary

### Included Behavior

- A new PRD version is established within a project (either explicitly by the founder, or captured automatically when the first PRD output is produced).
- The PRD content for that version is persisted in-app as the authoritative record.
- "Done" for a version is not gated on Markdown or PDF export — in-app persistence is sufficient.
- The version is identified and distinguishable from other versions in the same project.

### Excluded Behavior

- Markdown export or PDF export as a mandatory completion step (Hard v0 exclusion per PRD).
- Co-editing or version branching with collaborators (Hard v0 exclusion).
- Browsing or switching between existing versions (that is `browse-and-switch-prd-versions`).
- Diffing versions or showing a change history view.

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

None — creating or capturing a PRD version does not itself consume credits (AI credit consumption happens in the clarification/generation flow, not in version persistence).

---

## Sharing / Privacy Impact

This slice defines the stable "what is shown" semantics for a PRD version — the `read-only-sharing` FA's share surface must reference a version established here. No public content is exposed by this slice itself; it is the upstream prerequisite for sharing.

---

## Feedback / Instrumentation Impact

This slice maps to two owner milestone triggers defined in PRD v1:
- "First PRD version created" — triggers the first owner feedback prompt.
- "PRD version updated after clarification" — triggers a feedback prompt on subsequent updates.

Coordination with `owner-milestone-feedback` FA is required.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Project workspace | Feature Area | validated | Versions attach to a project container |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder working in a project can establish a PRD version and have its content persisted in-app; the version is accessible and identifiable within the project; "done" is declared when the content is saved in-app, regardless of whether any file export has occurred.

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
| 2026-05-11 | Scaffolded from approved `/feature-area slice prd-versioning` proposal via `/feature-area scaffold-slices` | — |
