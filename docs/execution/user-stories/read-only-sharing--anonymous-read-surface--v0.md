# User Story: Anonymous read surface (v0)

## Parent Scope Slice

[Anonymous read surface](../../product/scope-slices/read-only-sharing--anonymous-read-surface.md)

## Status

`done`

> **NEED_HUMAN:** false  
> **NEED_UPDATE:** false

---

## Story

As an anonymous visitor with a read-only share link, I want to open the shared URL and read the PRD version the owner chose to share so that I can review it without signing in and without seeing any workspace or private context.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | A valid enabled share token exists | I open `/share/<token>` | I see the PRD content (title/sections or equivalent) in a read-only layout without project name, workspace navigation, or owner tools |
| AC-2 | The link is disabled or the token is unknown | I open `/share/<token>` | I see a clear “not available” style message with no data that reveals workspace identity |
| AC-3 | The link is valid | The page loads | I am not prompted to sign in to view the shared PRD |
| AC-4 | The link is valid | The share API responds | The response contains only `versionNumber` and document `content` aligned with the contracts package — no `projectName`, PRD `status`, timestamps, or IDs in the payload |
| AC-5 | The token path is invalid (empty or out of bounds) | I request the share API | I get a client error (validation) without leaking whether a resource exists |
| AC-6 | The link is valid | I view the page | I do not see question history or clarification data that belongs to the owner workspace |

---

## Test Plan

- [x] Contract: `packages/contracts/src/share/anonymous-read.test.ts`
- [x] `pnpm typecheck` and `pnpm build` on the tracking branch

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/contracts/src/share/anonymous-read.ts` | new | Token + anonymous response schemas |
| `apps/web/app/api/share/[token]/route.ts` | modify | Thin route + use case + outbound zod |
| `apps/web/app/share/[token]/_components/shared-prd-view.tsx` | modify | Parse response with contract schema; strip workspace hints from UI |

---

## Out-of-Scope

- Revoking links, expiry, password protection (`revoke-link-and-noindex` slice)
- PDF export / download requirement
- Anonymous viewer feedback prompts
- Custom branding on the share page

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
| 2026-05-11 | Authored for orchestrator `fa-read-only-sharing--anonymous-read-surface` | — |
