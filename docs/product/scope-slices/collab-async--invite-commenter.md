# Scope Slice: Invite commenter

## Parent Feature Area

[Collab async](../feature-areas/collab-async.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

I invite an associate by email to review my PRD without giving edit access to the canonical document.

---

## Exact Boundary

### Included Behavior

- **Post-v0 wedge** async collaboration per **PD-003** (commenter role, not editor/viewer co-editing).
- Owner invites up to **3 active commenters** per project by email.
- Commenter receives **magic link** sign-in path scoped to project comment permissions.
- Commenter has **read-only PRD** body (no content PATCH).
- Hide legacy **Team members** / editor-viewer invite UI promised in PD-003 until this ships.

### Excluded Behavior

- Section **comment threads** (next slice).
- **Editor** or **viewer** workspace roles with edit rights.
- Comments on **anonymous share** page.
- Live co-editing.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Invite — form | Owner opens invite | Email field + send |
| Invite — sent | Success | Pending commenter listed |
| Invite — cap reached | 3 active commenters | Clear cap message |
| Commenter — first link | Magic link | Lands on read-only PRD |
| Commenter — expired link | Token invalid | Request new invite from owner |
| Owner — revoke | Owner removes commenter | Access ends |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Project membership / invite | Create, Read, Delete | Commenter role |
| Commenter session | Create | Magic link |
| PRD version | Read | Read-only for commenter |

---

## Credit / Payment Impact

None for invite flow.

---

## Sharing / Privacy Impact

**Yes** — commenters are **not** anonymous share viewers; they authenticate via invite. Share link semantics unchanged for public read-only URLs.

---

## Feedback / Instrumentation Impact

Optional: `commenter_invited`, `commenter_accepted_invite`.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| PD-003 | Product decision | accepted | Scope authority |
| FA-account-session | Feature Area | complete | Auth |
| PRD § Phase 1 wedge (PD-003) | PRD | complete | Async commenters documented 2026-06-04 |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none — B-COLLAB-PRD-001 resolved `/prd update` 2026-06-04)_ | — | — |

---

## Acceptance-Level Outcome

A project **owner** can invite a **commenter** by email, the commenter accesses a **read-only PRD** via magic link, and the owner can revoke access — without editor roles or share-page comments.

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
| 2026-06-04 | Promoted to ready-for-user-stories after `/prd update` (Phase 1 wedge, PD-003) | — |
