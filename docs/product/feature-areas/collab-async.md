<!--
  Feature Area — Collab async (PD-003)
-->

# Feature Area: Collab async

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/product-decisions/PD-003.md`
- `docs/product/scope-slices/collab-async-v1--section-comments.md` (draft boundary)
- Blueprint ROI #7

---

## Product Intent

Associates **comment on PRD sections** without co-editing — owner keeps canonical PRD control.

---

## In Scope

- Invite **commenter** by email (max 3 active / project v1).
- Section-level comment threads; owner resolve.
- Commenter read-only PRD; no PATCH content.

## Out of Scope

- Editor role / live co-editing (v0 PRD exclusion).
- Comments on anonymous share surface.
- @mentions v1.

---

## Business Objects Touched

| Object | Relationship |
|--------|--------------|
| Project invite | Commenter invitation by email |
| Section comment thread | Async discussion per PRD section |
| PRD version | Read-only for commenters |

---

## Open Blockers

| Blocker | NEED_HUMAN |
|---------|------------|
| _(none — B-COLLAB-PRD-001 resolved 2026-06-04 `/prd update`; Phase 1 wedge)_ | — |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| `collab-async--invite-commenter` | Invite flow + roles | ready-for-user-stories |
| `collab-async--section-comment-threads` | Threads + resolve + notify owner | ready-for-user-stories |

---

## Readiness Verdict

**Verdict:** READY FOR SCOPE SLICES
