<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md
-->

# Feature Area: PRD versioning

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Feature Groups (FG-PRD-V0 — PRD versioning); § Core User Journeys (4); § Product Surface (Source of truth); § Business Objects (PRD version); § MVP Completeness Checklist; § Q-006 spirit (done ≠ export)
- Related open questions: none (active queue empty)
- Related product decisions: none

---

## Product Intent

Within a project, the founder maintains a **versioned PRD** where the **in-app** document state is authoritative. They can move between versions so iteration is traceable and “complete” for a version **does not** depend on exporting a file.

---

## In Scope

- Persist **PRD version** state in-app as the canonical record for that version.
- Browse / move between **multiple PRD versions** within the same project (distinct navigation job from switching projects).
- Align product meaning of “done” for a version with PRD: **not** gated on Markdown or PDF export.

## Out of Scope

- Markdown export or PDF export as **mandatory** completion criteria for a version (PRD: export not required for “done”; PDF not v0-critical).
- **Markdown export v0.1** is **Phase 1 wedge** (gated), not v0 launch — see slice `prd-versioning--export-markdown-v0-1`.
- Co-editing or version branching with collaborators (Hard v0 exclusions).

---

## Business Objects Touched

| Object | Relationship |
|--------|----------------|
| PRD version | Create/persist/browse versioned document state in-app |
| Project | Versions are scoped per project container |

---

## User Journeys Touched

- Journey 4 — Version the PRD and move between versions within a project.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Project workspace | complete | Versions attach to a project |

---

## Risks

- If version history is confusing, founders lose trust in the PRD as source of truth — contradicts Product Surface commitment.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| Create or capture PRD version | Founder can establish a version line and persist PRD content for that version in-app. | complete |
| Browse and switch PRD versions | Founder moves between versions inside a project without losing context of which version is active. | complete |
| `prd-versioning--export-markdown-v0-1` | Optional Markdown export for stakeholders (Phase 1 ordre #5; gates A + B). | ready-for-user-stories |

---

## Readiness Verdict

- [x] PRD source sections read
- [x] Product intent stated without technical language
- [x] Business objects enumerated
- [x] User journeys identified
- [x] In-scope / out-of-scope explicitly separated
- [x] No unresolved PRD open questions affecting this area
- [x] Deferred behaviors explicitly named
- [x] Candidate Scope Slices are individually small enough

**Verdict:** READY FOR SCOPE SLICES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-09 | Initial scaffold from approved Feature Area map (`/feature-area scaffold`) | — |
| 2026-05-11 | Promoted to validated after CLEAR readiness check (`/feature-area promote`) | — |
| 2026-05-11 | Marked "Create or capture PRD version" slice **complete** after orchestrated delivery | cloud-agent |
| 2026-05-11 | Marked "Browse and switch PRD versions" slice **complete** after orchestrated delivery (PR #46) | cloud-agent |
| 2026-06-04 | Added Phase 1 slice `prd-versioning--export-markdown-v0-1` (ready, `WORK_QUEUE`) | — |
