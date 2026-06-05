# Scope Slice: Next action banner

## Parent Feature Area

[Project workspace](../feature-areas/project-workspace.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A signed-in founder always sees **one** clear **next recommended action** in the dashboard or project workspace so they never wonder what to do after clarify, share, or export.

---

## Exact Boundary

### Included Behavior

- **Sticky banner** under project nav (workspace) and equivalent on **dashboard** when zero projects (`S0`) per `docs/product/next-action-banner-spec.md`.
- State machine **S0–S6** with priority: first unsatisfied state in order **S1→S6**, with **S5 override** when `journeyMode=express`.
- States cover: no project, no PRD, clarify in progress, PRD without share, share without export, express post-PRD locked, builder export done.
- Primary and secondary CTAs per state table (EN copy examples in spec).
- **Express rules:** do not push Delivery CTA when post-PRD shell is grayed; prefer share-first (S3/S5).
- Events: `next_action_banner_shown` with `state_id`; `next_action_banner_cta_clicked`.

### Excluded Behavior

- Express **disclaimer** copy (share/PRD surfaces only).
- Replacing full project list or version history UI.
- Drift-specific copy (coordination note only — drift FA may set banner later via data flag; not in v1 slice unless dependency added at implement).
- Multi-line task lists or OKR widgets.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| `S0` | No projects | Create project + see examples |
| `S1` | Project, no PRD version | Open Clarify |
| `S2` | Clarify in progress | Resume Clarify |
| `S3` | PRD v1, no active share | Create share link |
| `S4` | Share exists, standard, export not done | Open Delivery / export |
| `S5` | Express, post-PRD locked | Deepen / switch to standard message |
| `S6` | Builder export completed | Iterate or new project |
| Loading | Project data fetching | Banner hidden or skeleton — no misleading CTA |
| Error | Project load failed | Banner suppressed; existing error UX |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Project | Read | `journeyMode`, clarify session flags |
| PRD version | Read | Exists / latest |
| Share link | Read | Active link present |
| Export / delivery milestone | Read | First export completed (account or project per spec) |
| Plan tier | Read | S6 / export eligibility |

---

## Credit / Payment Impact

None — banner is navigational; clarify/export paths retain their own credit rules.

---

## Sharing / Privacy Impact

None — banner is owner-only signed-in surfaces.

---

## Feedback / Instrumentation Impact

**Yes** — product analytics events for shown state and CTA clicks (attribution: project id, state_id).

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `docs/product/next-action-banner-spec.md` | Spec | complete | State table |
| FA-project-workspace | Feature Area | complete | Surfaces |
| FA-fast-track-urgent | Feature Area | complete | S5 express behavior |
| FA-read-only-sharing | Feature Area | complete | S3 share |
| FA-delivery | Feature Area | complete | S4/S6 |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

A signed-in owner on dashboard or workspace always sees **exactly one** banner state matching their project progress, with a **working primary CTA** to the next step (clarify, share, export, or express-specific guidance), and telemetry records which state was shown.

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
| 2026-06-04 | `/feature-area refine-slice` — full sections | — |
| 2026-06-04 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
