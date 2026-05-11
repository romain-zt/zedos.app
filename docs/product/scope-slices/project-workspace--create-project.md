<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/project-workspace.md
-->

# Scope Slice: Create project

## Parent Feature Area

[Project workspace](../feature-areas/project-workspace.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Founder creates a named project container and can immediately start PRD work inside it.

---

## Exact Boundary

### Included Behavior

- Founder can initiate creation of a new project from the dashboard.
- Founder provides a name for the project (required).
- A new project is created and scoped to the signed-in owner's account.
- Founder is placed inside the new project context, ready to begin PRD or clarification work.

### Excluded Behavior

- Project templates or pre-filled content (not in v0).
- Duplicating or cloning existing projects.
- Import/export of project data as a creation path.
- Inviting collaborators at creation time (Hard v0 exclusion: multi-user).
- Setting project visibility or sharing settings at creation (that is the read-only-sharing FA).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Projects list loading | First paint before API returns | Skeleton placeholders |
| Empty projects | Owner has no projects yet | Empty state with CTA to create |
| Create dialog | User taps New Project | Modal: required name, optional description |
| Validation error | Name missing or invalid on submit | Inline toast / message; no navigation |
| Creating | Submit in flight | Primary button loading |
| Success | Create API succeeds | Toast success; navigate to new project workspace |
| Create failure | API error | Error toast; user can retry |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Project | Create | New row with `userId` = signed-in owner, required `name`, optional `description` |
| User account | Read (auth) | Owner identity for scoping |

---

## Credit / Payment Impact

None — project creation does not consume credits or trigger any payment interaction.

---

## Sharing / Privacy Impact

None — newly created projects are owner-private by default; no share surface is created or modified in this slice.

---

## Feedback / Instrumentation Impact

None — project creation is not a defined milestone trigger in PRD v1.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Account & session | Feature Area | complete | better-auth session required (`fa_account_session` complete) |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder can create a new project by providing a name; the project is immediately accessible in their workspace and scoped exclusively to their account; they can begin PRD work inside it without any additional steps.

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
| 2026-05-11 | Scaffolded from approved `/feature-area slice project-workspace` proposal via `/feature-area scaffold-slices` | — |
| 2026-05-11 | Refined UX states, data touched, dependency status; promoted to `ready-for-user-stories` for orchestration `fa-project-workspace--create-project` | cloud-agent |
