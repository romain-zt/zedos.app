# Scope Slice: Capture external PRD at project creation

## Parent Feature Area

[Import external PRD](../feature-areas/prd-import.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

At project creation, a founder can **paste or upload** an existing PRD so Zedos stores it as the first in-app version instead of starting from an empty clarify loop.

---

## Exact Boundary

### Included Behavior

- On the **new project** flow, an optional **Import existing PRD** path (distinct from **standard** / **express** mode choice but on the same step).
- **Paste:** multiline text area; submit persists content as a **PRD version** for the new project.
- **Upload:** file picker with allowed extensions defined at implementation (v0 minimum: `.md`, `.txt`; max size enforced server-side).
- After successful import, owner lands in the project workspace with the imported version **readable** and listed in version history.
- Product may **offer** optional IA “restructure for Zedos sections” — skippable; not required for v0 success.
- Clarify may be **skipped or reduced** when import is the primary entry (owner can still open clarify manually later).
- Works when combined with **express** or **standard** `journeyMode` (import does not imply express).

### Excluded Behavior

- Notion/API connectors.
- Import on an **existing** project without creation (defer).
- Full **12-section express livrable** auto-generation from import only (express generation slice).
- Share disclaimer (express-share-disclaimer).
- Credit pack checkout changes (existing credit FA).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Create — no import | Default create | Standard / express choice only; import optional expander |
| Create — paste active | Owner expands import | Paste area + confirm; validation errors inline |
| Create — upload active | Owner picks file | Progress / error for oversize or bad type |
| Success | Import persisted | Workspace with imported PRD version visible |
| Failure | Validation / server error | Actionable message; project not left half-created without recovery |
| Blocked — not signed in | Session expired | Redirect sign-in |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Project | Create | With chosen `journeyMode` |
| PRD version | Create | Body from paste or parsed file |

---

## Credit / Payment Impact

**Optional** — if owner runs optional IA restructure or later clarify, normal burn tiers apply. Import persistence itself does not consume credits unless product adds an IA normalize step (default: **no** charge for raw paste/upload persist only — confirm at `/plan`).

---

## Sharing / Privacy Impact

None in this slice.

---

## Feedback / Instrumentation Impact

May trigger **first PRD version created** milestone if imported version counts as first version (align with owner-milestone-feedback FA at `/plan`).

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Project workspace | Feature Area | validated | Create project API/UI |
| PRD versioning | Feature Area | validated | Version persistence |
| Q-028 | PRD | answered | v0 scope |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

A signed-in founder can create a project by **pasting or uploading** an external PRD, see it as the **first in-app version**, and continue in the workspace without being forced through a full standard clarify loop first.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined
- [x] UX states enumerated
- [x] Dependencies named
- [x] Acceptance-level outcome is behavioral

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Scaffolded for Q-028 / PRD Planned v0 | doc-sync |
