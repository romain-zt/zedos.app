<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/read-only-sharing.md
-->

# Scope Slice: Mint read-only link

## Parent Feature Area

[Read-only sharing](../feature-areas/read-only-sharing.md)

## Status

`ready-for-user-stories`

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
| **No link yet** | Owner selected a PRD version and no active share link exists for that version | "Share" action is available; no copy link UI |
| **Loading** | Owner taps Share and the mint request is in flight | Button shows loading; no duplicate requests |
| **Success (new or reused)** | Mint succeeds (creates row or returns existing active link) | Toast confirms success; full URL shown; Copy and Disable available; milestone feedback modal may open |
| **Error (client / network)** | Fetch throws | Toast: failed to create share link |
| **Error (4xx/5xx)** | API returns error JSON | Toast shows server `error` message when present |
| **Invalid response** | 200 OK but body fails contract validation | Toast: invalid share link response |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| **Share link** (read-only artifact) | create (or read if one active link already exists for the PRD version) | One active enabled link per PRD version in v0; ties to stable PRD version id |
| **PRD version** | read (ownership) | Mint authorized only when the PRD version belongs to the signed-in owner’s project |

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
| 2026-05-11 | UX states, data touched, readiness — orchestrator `fa-read-only-sharing--mint-read-only-link` | — |
