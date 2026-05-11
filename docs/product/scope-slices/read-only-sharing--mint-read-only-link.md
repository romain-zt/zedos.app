<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/read-only-sharing.md
-->

# Scope Slice: Mint read-only link

## Parent Feature Area

[Read-only sharing](../feature-areas/read-only-sharing.md)

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Founder generates a public link they can share with anyone, giving that person read access to the intended PRD content.

---

## Exact Boundary

### Included Behavior

- Signed-in owner can generate a share link for a PRD within their project.
- The generated link is visible to and copyable by the owner.
- The link grants anonymous read-only access to the shared PRD content (access boundary enforced by `anonymous-read-surface` slice).
- The share link is tied to a specific PRD version/content state as defined by the `prd-versioning` FA.

### Excluded Behavior

- Password protection on the generated link (Hard v0 exclusion: advanced share controls).
- Time-based expiry on the link (Hard v0 exclusion).
- Custom URLs or branded share domains.
- Multiple simultaneous share links per project (v0 behavior TBD — default: one active link per project/version).
- Revoking or disabling the link (that is `revoke-link-and-noindex`).

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

None — generating a share link does not consume credits.

---

## Sharing / Privacy Impact

This slice creates the share artifact. It is the origin point of the public read surface. Strict boundary: only PRD content is shared — no workspace data, question history, or private context leaks to the anonymous surface. Coordination with `anonymous-read-surface` and `question-history` FA required.

---

## Feedback / Instrumentation Impact

Minting a read-only link maps to the "PRD shared" milestone defined in PRD v1 — this triggers the owner feedback prompt. Coordination with `owner-milestone-feedback` FA (`milestone-detection-and-prompt` slice) required.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| PRD versioning | Feature Area | validated | Share link must reference a stable version; `create-or-capture-prd-version` establishes the content to be shared |
| Account & session | Feature Area | pending | Owner identity required to authorize link creation |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder can generate a share link for their PRD; the link is immediately copyable and, when accessed by anyone with the URL, shows only the intended PRD content; workspace data, question history, and private context are never exposed through the link.

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
