# Scope Slice: Express share disclaimer

## Parent Feature Area

[Fast-track / mode urgent](../feature-areas/fast-track-urgent.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Anyone viewing an **express** PRD version sees explicit copy that it is a **version express — à approfondir**, on both the anonymous share page and the owner’s in-app PRD view.

---

## Exact Boundary

### Included Behavior

- On the **anonymous read-only share surface** (Journey 8), when the resolved shared **PRD version** is classified **express**, show persistent, readable copy: **version express — à approfondir** (PD-002) — visible without scrolling past the full PRD body (e.g. banner or equivalent).
- On the **signed-in owner** in-app PRD view for an **express** version, show the **same** message (equivalent wording; owner-facing tone allowed).
- Disclaimer appears **whenever** that express version is displayed on those surfaces (including re-open and version switch within the project).
- **Standard** (non-express) PRD versions on share and owner views show **no** express disclaimer.

### Excluded Behavior

- Minting, revoking, or enabling share links (read-only-sharing FA).
- Changing what PRD content is included on the anonymous surface beyond existing share rules (no question history, no workspace nav).
- Password-protected or time-limited links (v0 exclusions).
- Classifying or generating express versions (`express-deliverable-generation`).
- Journey mode UI (`declare-express-mode`).
- Anonymous viewer feedback prompts (v0 exclusion).
- Custom branding or alternate disclaimer text per viewer.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Owner — express version | Signed-in owner opens an **express** PRD version in workspace | **version express — à approfondir** visible near the PRD content |
| Owner — standard version | Owner opens a **standard** PRD version | No express disclaimer |
| Share — loading | Anonymous visitor opens valid link; content loading | Neutral loading; no workspace leakage |
| Share — express content | Link points to **express** version | PRD content plus **version express — à approfondir** disclaimer on read surface |
| Share — standard content | Link points to **standard** version | PRD content only; no express disclaimer |
| Share — unavailable | Revoked, disabled, or invalid link | Existing “not available” behavior; disclaimer irrelevant |
| Edge — version re-shared | Owner shares a different express version on same project | Disclaimer follows **currently shared** express version classification |
| Blocked — not owner on private view | Anonymous on share only | Disclaimer on public surface only; no owner tools |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| PRD version | Read | Detect **express** vs **standard** classification for disclaimer gating |
| Share link | Read | Resolve which PRD version the anonymous surface displays |
| Project | Read | Optional context for owner view only — not exposed on anonymous surface |

---

## Credit / Payment Impact

None — no credit or payment interaction in this slice.

---

## Sharing / Privacy Impact

**Yes** — this slice **only** adds disclaimer copy on **express** versions. Anonymous viewers still see **PRD content only** (no question history, workspace nav, or owner tools). **noindex** intent and owner **disable link** behavior unchanged. Standard versions unchanged for viewers.

---

## Feedback / Instrumentation Impact

May correlate with milestone **PRD shared** when owner mints a link for an express version (existing prompt rules). No feedback on anonymous share surface.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `fast-track-urgent--express-deliverable-generation` | Scope Slice | ready-for-user-stories | Express-classified version must exist |
| `read-only-sharing--anonymous-read-surface` | Scope Slice | ready-for-user-stories | Base anonymous read surface (no duplicate) |
| Read-only sharing | Feature Area capability | validated | Mint / read / revoke links |
| PD-002 | Product decision | accepted | Disclaimer wording |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

A visitor with a valid share link to an **express** PRD version sees **version express — à approfondir** on the read-only page; the signed-in owner sees the same message on the in-app express version view; **standard** versions on either surface never show that disclaimer.

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
| 2026-06-03 | Scaffolded from approved `/feature-area slice` proposal via `/feature-area scaffold-slices` | — |
| 2026-06-03 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
