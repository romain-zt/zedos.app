# User Story: Mint read-only link (v0)

## Parent Scope Slice

[Mint read-only link](../../product/scope-slices/read-only-sharing--mint-read-only-link.md)

## Status

`done`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in product owner, I want to mint a stable read-only share link for the PRD version I am viewing so that I can copy it and share read access without exposing workspace or history.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I own the project and a PRD version is selected | I tap Share | I receive a mint response I can turn into a full URL with my site origin and `/share/<token>` |
| AC-2 | No active link exists yet for that version | Mint completes | A new share link row exists and the token is copyable |
| AC-3 | An active link already exists for that version | I tap Share again | I get the same active link (idempotent); no duplicate enabled links |
| AC-4 | I am not signed in | I call the mint API | I get unauthorized |
| AC-5 | I request mint for a PRD version I do not own | — | I get not found (no leak that it exists elsewhere) |
| AC-6 | Request body is invalid | — | I get validation error |
| AC-7 | Mint succeeds | — | I can copy the link and optional milestone feedback may trigger |

---

## Test Plan

- [x] Unit: `MintReadOnlyShareLinkUseCase` delegates to repository
- [x] Contract: `packages/contracts/src/share/mint.test.ts`
- [x] `pnpm typecheck` and `pnpm build` on the tracking branch

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `apps/web/app/api/share/create/route.ts` | modify | Thin route + zod + use case |
| `apps/web/app/dashboard/projects/[id]/_components/prd-viewer.tsx` | modify | Validate mint response on client |
| `packages/contracts/src/share/mint.ts` | modify / tests | Request/response schemas |

---

## Out-of-Scope

- Anonymous read page (`anonymous-read-surface` slice)
- Disabling / revoke (`revoke-link-and-noindex`)
- Password, expiry, custom domains, multiple concurrent links per version beyond v0 rule

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
| 2026-05-11 | Authored for orchestrator `fa-read-only-sharing--mint-read-only-link` | — |
