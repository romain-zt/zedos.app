# User Story: Revoke link and noindex (v0)

## Parent Scope Slice

[Revoke link and noindex](../../product/scope-slices/read-only-sharing--revoke-link-and-noindex.md)

## Status

`done`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in product owner, I want to disable my live read-only share link and know that share URLs are not indexed by search engines, so that I can cut off public access and reduce discovery risk.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I own the project and an enabled share link exists | I revoke/disable that link | The link is marked inactive in the system and the disable response reflects disabled state |
| AC-2 | The link is revoked | A visitor opens the share URL | They do not see PRD content (inactive / not-found behavior per anonymous-read slice) |
| AC-3 | I am not signed in | I call the disable endpoint | I get unauthorized |
| AC-4 | I pass a share link id I do not own (or that does not exist) | I call disable | I get not-found style response without leaking other tenants |
| AC-5 | Request body is invalid JSON or fails validation | — | I get a validation / bad request response |
| AC-6 | Any visitor loads `/share/<token>` (active or revoked token) | The page is rendered | Metadata expresses noindex / nofollow intent for crawlers |

---

## Test Plan

- [x] Contract: `DisableShareLinkRequestSchema` in `packages/contracts/src/share/disable.test.ts`
- [x] App: `apps/web/app/share/[token]/page.metadata.test.ts` (robots metadata)
- [x] `pnpm typecheck` and `pnpm build` on the tracking branch

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/contracts/src/share/disable.ts` | add | Disable request zod |
| `packages/contracts/src/share/disable.test.ts` | add | Contract tests |
| `apps/web/app/api/share/disable/route.ts` | modify | Inbound + outbound zod validation |
| `apps/web/app/share/[token]/page.tsx` | verify | `metadata.robots` noindex (existing) |
| `apps/web/app/share/[token]/page.metadata.test.ts` | add | Regression on robots |

---

## Out-of-Scope

- Scheduled expiry, auto-remint on revoke, per-link SEO toggles (see parent slice exclusions)
- New owner UI beyond existing PRD viewer disable control

---

## Open Questions

- None

---

## Decision References

- None

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Authored for orchestrator `fa-read-only-sharing--revoke-link-and-noindex` | cloud-agent |
