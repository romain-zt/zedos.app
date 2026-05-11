<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/read-only-sharing.md
-->

# Scope Slice: Revoke link and noindex

## Parent Feature Area

[Read-only sharing](../feature-areas/read-only-sharing.md)

## Status

`exploratory`

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
|       |      |                                  |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
|        |           |       |

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
| `mint-read-only-link` | Scope Slice | exploratory | A link must exist before it can be revoked |
| `anonymous-read-surface` | Scope Slice | exploratory | The revocation must prevent the anonymous surface from serving content |

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

- [ ] User value stated without implementation language
- [ ] Exact boundary defined (included + excluded)
- [ ] UX states enumerated (including error and empty states)
- [ ] Business objects named
- [ ] Credit / payment impact assessed
- [ ] Sharing / privacy surface assessed
- [ ] Feedback / instrumentation impact assessed
- [ ] All dependencies named and their status known
- [ ] All blockers resolved or NEED_HUMAN=true explicitly set
- [ ] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** NOT READY

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Scaffolded from approved `/feature-area slice read-only-sharing` proposal via `/feature-area scaffold-slices` | — |
