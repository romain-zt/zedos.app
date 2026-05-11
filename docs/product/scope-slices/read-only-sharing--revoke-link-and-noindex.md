<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/read-only-sharing.md
-->

# Scope Slice: Revoke link and noindex

## Parent Feature Area

[Read-only sharing](../feature-areas/read-only-sharing.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Founder can disable a live share link at any time; pages served at share URLs are treated as non-indexable by search engines.

---

## Exact Boundary

### Included Behavior

- Signed-in owner can disable (revoke) a live share link.
- Once revoked, the link no longer serves the PRD content to any visitor — the URL becomes inactive.
- Share pages carry noindex as a product requirement (enforced at the policy/robots level; not an implementation spec here).
- Noindex applies to all share URLs, regardless of whether the owner has revoked the link.

### Excluded Behavior

- Scheduling link expiry in advance (Hard v0 exclusion: time-based expiry).
- Generating a new replacement link automatically on revocation (founder must mint a new one manually).
- Revoking by expiry timer or external event (only manual owner action in v0).
- Custom noindex configurations per link or per project.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Success — link disabled | Owner submits disable for a share link they own; link was active | Action completes; link is shown as disabled / no longer listed among active links; anonymous visitors see inactive share surface |
| Success — idempotent | Owner repeats disable on an already-disabled link | Same outcome as success; no error; row remains disabled |
| Error — not signed in | No session when calling the owner action | Generic unauthorized; no detail about whether the link exists |
| Error — invalid input | Request body missing or empty `shareLinkId` | Validation error with clear field feedback |
| Error — not found | Link id does not exist, or exists but is not owned by this user | Same not-found outcome (no leak whether id exists vs wrong owner) |
| Anonymous — revoked | Visitor opens share URL after owner disabled link | Inactive / not-found style experience; no PRD content |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Share link | Read + conditional update | `enabled`, `disabled_at`; ownership checked via PRD version → project |
| PRD version | Read (join only) | Ownership path for share link row |
| Project | Read (join only) | Owner user id for authorization |

---

## Credit / Payment Impact

None — revoking a link or noindex configuration does not consume credits.

---

## Sharing / Privacy Impact

This slice terminates the public access established by `mint-read-only-link`. After revocation, the share URL is inactive and the anonymous read surface (`anonymous-read-surface`) no longer serves content. Noindex enforcement prevents search engine indexing of share pages across all states (active or revoked).

---

## Feedback / Instrumentation Impact

None — revoking a link is not a defined owner milestone trigger in PRD v1.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `mint-read-only-link` | Scope Slice | complete | A link must exist before it can be revoked |
| `anonymous-read-surface` | Scope Slice | complete | The revocation must prevent the anonymous surface from serving content |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder can disable a live share link; after revocation, visitors accessing the URL no longer see the PRD content; all share pages — active or revoked — are served with noindex intent so they are not indexed by search engines.

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
| 2026-05-11 | Scaffolded from approved `/feature-area slice read-only-sharing` proposal via `/feature-area scaffold-slices` | — |
| 2026-05-11 | Refined UX states, data touched, dependency statuses; promoted to `ready-for-user-stories` | cloud-agent |
