<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/read-only-sharing.md
-->

# Scope Slice: Anonymous read surface

## Parent Feature Area

[Read-only sharing](../feature-areas/read-only-sharing.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Anyone with the share link can read the shared PRD content — without being able to edit, comment, duplicate, or see any private workspace context or decision history.

---

## Exact Boundary

### Included Behavior

- A visitor with a valid share link can view the shared PRD content.
- The shared view shows only the PRD content the owner intended to share — nothing more.
- No editing, commenting, or duplicating actions are available to the anonymous viewer.
- No workspace context (project details, navigation, owner tools) is shown to the anonymous viewer.
- No question history or private clarification data is exposed on the share surface.
- Access requires only the link — no account required to view.

### Excluded Behavior

- Anonymous viewer feedback or rating prompts on the share surface (Hard v0 exclusion per PRD).
- Any editing or contribution from the viewer.
- Exposing the owner's workspace navigation, project list, or private data.
- PDF export or download from the share surface (export is not a required behavior in v0).
- Custom branding on the share surface (not in v0 scope).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Loading | Anonymous page mounts; PRD payload is being fetched | A neutral branded loading indicator; no workspace or auth prompts |
| Success | Enabled share exists for token | Shared PRD version content (structure from stored JSON): title/summary/sections when present; read-only badges; **no** project name, IDs, workspace nav, edit/comment/export, question history |
| Missing / disabled | Unknown token, revoked link, or disabled row | Friendly “Not available” (or equivalent) without revealing whether another owner’s workspace exists |
| Bad token | Token path violates length/format rules | Minimal validation feedback; no leakage of internal identifiers |
| Server error | Upstream/database failure during read | Safe generic failure message; retry implied by refresh only |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| `share_links` | Read | Resolve token → PRD version; must enforce `enabled` |
| `prd_versions` | Read | Version number, structured content, PRD status, timestamps — **without** joining `projects` |

---

## Credit / Payment Impact

None — anonymous reading does not consume credits and requires no payment.

---

## Sharing / Privacy Impact

This slice **is** the anonymous share surface. The strict privacy boundary — no workspace, no history, no owner tools visible to the viewer — is central to this slice's correctness. Coordination with `question-history` (history must not leak), `project-workspace` (owner nav must not leak), and `mint-read-only-link` (link must be valid and active) required.

---

## Feedback / Instrumentation Impact

None — anonymous viewers do not receive feedback prompts in v0 (Hard v0 exclusion). This slice produces no owner milestone event.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `mint-read-only-link` | Scope Slice | exploratory | A valid share link must exist for the anonymous surface to be reachable |
| PRD versioning | Feature Area | validated | Share surface must reference a versioned content state |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

An anonymous visitor arriving via a valid share link sees the shared PRD content and nothing else; they cannot edit, comment, or access any workspace or private data; no account creation or sign-in is required to view the content.

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

**Verdict:** READY FOR USER STORIES — refined for orchestrator `fa-read-only-sharing--anonymous-read-surface`; promote via `/feature-area promote-slice` when checker CLEAR.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Scaffolded from approved `/feature-area slice read-only-sharing` proposal via `/feature-area scaffold-slices` | — |
| 2026-05-11 | Filled UX states + Data Touched; status → `ready-for-user-stories` for execution bridge | — |
