# User Story: Revoke read-only share link (v0)

## Parent Scope Slice

[Revoke link and noindex](../../product/scope-slices/read-only-sharing--revoke-link-and-noindex.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want to disable an active read-only share link for my PRD version so that anonymous visitors can no longer view that content at the share URL.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I own an active share link for my PRD version | I choose to disable that link | The link becomes inactive; anonymous visitors no longer see the PRD body at that URL |
| AC-2 | The link is already disabled | I invoke disable again for the same link | The outcome is successful and idempotent; the link stays disabled |
| AC-3 | I am not signed in | I try to disable a link | I get an unauthorized outcome without learning whether a link id exists |
| AC-4 | The request references an unknown id, another founder’s link, or malformed input | I try to disable | I get validation or not-found style outcomes without leaking ownership details |

---

## Test Plan

- [ ] Disable share link use case delegates to repository and preserves Result errors (unit)
- [ ] Disable request contract rejects empty or missing `shareLinkId` (contract)
- [ ] Repository revoke path returns not-found when ownership fails (integration-style unit with mocked DB optional — covered via repository tests if present)

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| Owner disable API route (apps/web) | modify | Thin adapter: validate body, auth, call use case, map Result |
| PRD repository port + Drizzle adapter | modify | Implement revoke with ownership check and idempotent disable |
| Share revoke Zod contract package | add / modify | Request shape for disable |
| Application use case for revoke | add | Single delegation to port |

---

## Out of Scope

- Scheduled or automatic link expiry
- Auto-minting a replacement link on revoke
- Per-link or per-project custom robots policies beyond product-wide noindex intent
- Changing anonymous page branding beyond existing inactive / not-found behavior

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| — | — | — | — |

---

## Decision References

- none

---

## Readiness for Implementation Plan

- [x] Story expressed in user-value terms (no implementation language)
- [x] Acceptance Criteria cover at least one row per UX state from the parent Scope Slice
- [x] Test plan names test type for each item (unit / integration / contract / e2e)
- [x] Touched Files (predicted) is non-empty
- [x] Out of Scope is non-empty
- [x] All Open Questions either answered or carry an explicit next action
- [x] Decision references resolved (or `none` stated explicitly)

**Verdict:** READY FOR IMPLEMENTATION PLAN

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Authored from ready Scope Slice | cloud-agent |
