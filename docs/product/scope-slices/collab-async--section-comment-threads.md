# Scope Slice: Section comment threads

## Parent Feature Area

[Collab async](../feature-areas/collab-async.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

My associate and I discuss a specific PRD section in threads I can resolve when aligned, without editing the PRD body.

---

## Exact Boundary

### Included Behavior

- **Per-section** comment threads on owner workspace PRD viewer.
- **Commenter** (from invite slice) can post; **owner** can reply and **resolve/archive** thread.
- **In-app notification** to owner on new comment (email optional v1.1).
- Acceptance scenarios in `docs/product/collab-async-v1-acceptance-tests.md` are product QA references.

### Excluded Behavior

- Threads on **anonymous share** surface.
- @mentions v1.
- Editing PRD content from comment UI.
- Editor/viewer roles.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Thread — empty | No comments on section | Add comment affordance |
| Thread — open | Messages exist | Chronological thread |
| Resolved | Owner resolves | Thread collapsed; read-only history |
| Commenter — read-only body | Commenter views PRD | Cannot edit sections |
| Owner — notify | New comment | In-app notification badge |
| Error — post failed | Network/validation | Retry message |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Section comment thread | Create, Read, Update | Per section |
| Comment message | Create | Owner or commenter |
| Notification | Create | Owner alert |

---

## Credit / Payment Impact

None.

---

## Sharing / Privacy Impact

**Yes** — comments exist only on **authenticated** owner/commenter workspace, not on public share URLs.

---

## Feedback / Instrumentation Impact

Optional: `section_comment_created`, `thread_resolved`.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `collab-async--invite-commenter` | Scope Slice | ready-for-user-stories | Roles exist |
| PD-003 | Product decision | accepted | Intent |
| PRD § Phase 1 wedge (PD-003) | PRD | complete | 2026-06-04 |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none — B-COLLAB-PRD-001 resolved `/prd update` 2026-06-04)_ | — | — |

---

## Acceptance-Level Outcome

After the invite slice ships, an **owner** and **commenter** can exchange messages on a **section thread**, the owner can **resolve** it, and **share viewers** still cannot comment.

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
| 2026-06-04 | Promoted to ready-for-user-stories after `/prd update` (Phase 1 wedge) | — |
