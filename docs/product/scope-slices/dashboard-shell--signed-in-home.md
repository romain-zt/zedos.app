<!--
  Scope Slice — dashboard-shell: signed-in home orientation
  Scaffolded 2026-05-11 as part of Phase 4 loop restart.
-->

# Scope Slice: Signed-in home orientation

## Parent Feature Area

[Dashboard shell](../feature-areas/dashboard-shell.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A signed-in founder arrives at a clear home base after sign-in that routes them toward PRD work and sets honest expectations about what is available in v0 versus what is coming later — so they never feel confused or misled about the product's current scope.

---

## Exact Boundary

### Included Behavior

- **Post-sign-in landing page (`/dashboard`)** — the destination after successful sign-up or sign-in; requires a valid session.
- **Navigation entry points** — visible links or cards routing toward project creation and PRD workflows (the v0 core path).
- **Under-construction signaling** — non-PRD roadmap areas (services/feature split, Cursor packaging, user stories, test-first delivery, etc.) are visibly labeled as "under construction" or "coming soon" so founders understand v0 scope.
- **v0 orientation clarity** — the shell reinforces that the PRD slice is the current product; no confusion about deferred roadmap items being available now.
- **Session-guarded route** — accessing `/dashboard` without a session redirects to sign-in (handled by the session-persistence slice middleware; this slice defines the page, not the redirect logic).

### Excluded Behavior

- **Project listing or creation UI** — that is the Project Workspace FA; the dashboard may link to it but does not own the project CRUD surface.
- **PRD editor or versioning** — the PRD versioning FA; linked from dashboard but not owned here.
- **Question history, credit balance, notifications** — each belongs to its respective FA; this slice provides navigation anchors only.
- **Multi-user or team features** — PRD Hard v0 exclusion.
- **Marketing or onboarding tour** — not a v0 requirement; founders arrive directly at the signed-in shell.
- **User account settings / profile** — deferred to a future scope slice (pending Q-023 decision: deferred).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Dashboard — initial load | Signed-in founder navigates to `/dashboard` | Home base with navigation toward projects/PRD and clear "under construction" labels for deferred areas |
| No projects yet | First-time founder with no projects created | Prompt or empty state inviting the founder to create their first project; under-construction areas visible but labeled |
| Projects exist | Returning founder with existing projects | List or summary of recent projects with PRD workflow entry points |
| Under-construction area accessed | Founder clicks a non-v0 area | Label or placeholder that communicates "coming soon" — does not navigate away or throw an error |
| Session missing | Unauthenticated request to `/dashboard` | Redirect to `/sign-in?from=/dashboard` (handled by middleware, not this page) |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| User account | Read (display signed-in context) | Name or email to confirm signed-in state; no edit in this slice |
| Project list | Read (for dashboard overview) | Minimal list — count or recent items; full CRUD is Project Workspace FA |

---

## Credit / Payment Impact

None — the dashboard shell displays no credit balance or payment prompts in this slice. Credit display is a Credit System FA concern.

---

## Sharing / Privacy Impact

None in this slice. The dashboard is the private signed-in surface. Share links are a Read-only Sharing FA concern. This slice does not generate or expose share links.

---

## Feedback / Instrumentation Impact

None — the dashboard landing is not a PRD milestone event per the PRD Success Metrics. Feedback prompts fire after PRD-specific actions (first PRD generated, PRD updated, PRD shared, PRD reopened). Navigation landing does not trigger a prompt.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| [Dashboard shell FA](../feature-areas/dashboard-shell.md) | Feature Area | validated | Parent scope |
| [Account & session FA](../feature-areas/account-session.md) | Feature Area | validated | Session must exist before dashboard is meaningful; middleware (session-persistence slice) handles the redirect |
| Phase 3 Turborepo migration | Technical prerequisite | complete | Post-migration layout (`apps/web/`) is the implementation target |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder who navigates to `/dashboard` sees a home base that clearly routes toward projects and PRD workflows, and clearly labels any non-v0 areas as under construction — so there is no ambiguity about what the product delivers today versus later.

---

## Scope Readiness Check

| Check | Result | Notes |
|-------|--------|-------|
| SS-01 · Single user value | PASS | One sentence, no technical language |
| SS-02 · Boundary is exact | PASS | Included and excluded are exhaustive |
| SS-03 · UX states enumerated | PASS | Empty, initial, with-projects, under-construction, no-session states |
| SS-04 · No implementation details | PASS | No routes, components, DB tables, or framework references |
| SS-05 · Credit / payment impact assessed | PASS | None, with reason |
| SS-06 · Sharing / privacy impact assessed | PASS | None, with reason |
| SS-07 · Feedback / instrumentation impact assessed | PASS | None, with reason |
| SS-08 · Dependencies explicit | PASS | All named with status |
| SS-09 · Blockers resolved or flagged | PASS | No blockers |
| SS-10 · Acceptance outcome is behavioral | PASS | Observable behavior described |
| SS-11 · Status reflects readiness | PASS | `ready-for-user-stories` |
| CC-03 · v0 boundary not leaked | PASS | Under-construction areas are labeled, not shipped |
| CC-04 · NEED_HUMAN propagates | PASS | No NEED_HUMAN; parent FA has none |

**Advancement verdict:** CLEAR — ready for user stories.

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
- [x] Acceptance-level outcome is behavioral

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial scaffold — Phase 4 loop restart; FA validated; slice ready-for-user-stories | local-agent |
