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
| Loading | Page opened, share API in flight | Spinner and “Loading PRD…” |
| Success (content) | Valid enabled token; PRD JSON loads | Read-only header, document title from shared content (or default), version badge, sections or raw JSON fallback — no project name, workspace nav, or owner tools |
| Error (not found) | Token unknown, link disabled, or server 404-equivalent | “Not available” card with generic message |
| Error (bad token path) | Malformed or empty token segment | Validation error surfaced as not available / invalid link |
| Error (network / parse) | Network failure or response does not match contract | Generic load failure |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Read-only share link (`share_links` + linked `prd_versions`) | Read | Resolve token → enabled link → load `versionNumber` + `content` JSON only; no join to `projects`; no question history |
| Anonymous HTTP API | Read | `GET` returns contract-validated `{ versionNumber, content }` only |
| Public `/share/[token]` page | Read | Renders stored PRD payload; robots noindex (existing) |

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
| `mint-read-only-link` | Scope Slice | complete (`fa-read-only-sharing--mint-read-only-link`) | A valid enabled share token must exist to reach this surface |
| PRD versioning | Feature Area | validated | Share resolves to a persisted PRD version row |

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
- [x] Business objects named (share link, PRD version content)
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
| 2026-05-11 | Scaffolded from approved `/feature-area slice read-only-sharing` proposal via `/feature-area scaffold-slices` | — |
| 2026-05-11 | Refined UX states, data touched, dependencies; promoted to `ready-for-user-stories` | cloud-agent |
