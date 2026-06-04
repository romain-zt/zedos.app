# Scope Slice: Connect GitHub repository

## Parent Feature Area

[PRD drift (GitHub)](../feature-areas/prd-drift-github.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

I link my product repository to a project so Zedos can later compare shipped signals to my PRD.

---

## Exact Boundary

### Included Behavior

- Project settings: **Connect GitHub** via OAuth (read-only scope per `prd-drift-github-v1-spec.md`).
- Persist **connection status**, owner name, repository name on the project.
- **Disconnect** clears linkage and stops future evaluations for that project.
- Owner-only settings surface.

### Excluded Behavior

- Drift **evaluation**, inbox, weekly email (`prd-drift-github--evaluate-and-weekly-digest`).
- **Webhooks** (`prd-drift-github--webhook-realtime`).
- Auto-editing PRD from repository events.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Disconnected | No repo linked | Connect CTA in settings |
| OAuth — in progress | User authorizes | External GitHub consent |
| Connected | Link saved | Repo name shown + Disconnect |
| OAuth — denied | User cancels | Remains disconnected with message |
| Error — token invalid | Revoked access | Reconnect prompt |
| Gated — not owner | Non-owner | Settings action hidden |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Project | Update | GitHub linkage fields |
| GitHub connection | Create, Delete | Product-level connection record |

---

## Credit / Payment Impact

None.

---

## Sharing / Privacy Impact

None — repository metadata is owner-private; not exposed on anonymous share page.

---

## Feedback / Instrumentation Impact

Optional: `github_repo_connected` event with project id.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| FA-project-workspace | Feature Area | complete | Settings host |
| `docs/product/prd-drift-github-v1-spec.md` | Spec | complete | OAuth scope |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

A project **owner** can **connect** one GitHub repository, see it listed in settings, and **disconnect** — without drift alerts until evaluation slice ships.

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
