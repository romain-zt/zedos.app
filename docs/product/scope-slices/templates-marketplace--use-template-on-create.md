# Scope Slice: Use template on create

## Parent Feature Area

[Templates marketplace](../feature-areas/templates-marketplace.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

I start a new project from a template in one click with the right journey mode and starter metadata.

---

## Exact Boundary

### Included Behavior

- **Create project** flow offers **Use template** with slug selection from catalog slice.
- Pre-fills **journey mode** (express vs standard vs import-oriented) and template metadata on the new project.
- Creates project + initial PRD scaffold per template content (product-level: version or seed sections — not full AI generation in this slice unless spec says seed only).

### Excluded Behavior

- Browsing catalog (prior slice).
- UGC templates.
- Applying template to **existing** project v1.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Picker | Create project | Template slug picker |
| Creating | Submit | Loading |
| Success | Project created | Lands in workspace with template context |
| Error | Validation failed | Inline error |
| No template | Standard create | Unchanged default create path |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Project | Create | Template slug + journey mode |
| PRD version | Create | Seed from template body |
| Template catalog entry | Read | Selected slug |

---

## Credit / Payment Impact

None for project creation from template; subsequent clarify/generate uses normal tiers.

---

## Sharing / Privacy Impact

None.

---

## Feedback / Instrumentation Impact

**Yes** — `project_created_from_template` with template slug.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `templates-marketplace--official-seed-catalog` | Scope Slice | ready-for-user-stories | Slugs exist |
| FA-project-workspace | Feature Area | complete | Create flow |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

From create project, an owner selecting a **template slug** lands in a new project whose **journey mode** and starter PRD content match that template without manual re-entry.

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
| 2026-06-04 | Blueprint scaffold (minimal) | — |
| 2026-06-04 | `/feature-area refine-slice` | — |
| 2026-06-04 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
