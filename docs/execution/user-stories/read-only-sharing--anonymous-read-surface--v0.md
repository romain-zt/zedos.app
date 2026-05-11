# User Story: Anonymous read surface (v0)

## Parent Scope Slice

[Anonymous read surface](../../product/scope-slices/read-only-sharing--anonymous-read-surface.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As an anonymous visitor with a valid share link, I want to read the shared PRD version so that I can review the content without signing in — and without seeing any workspace, project, or owner context.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | A valid enabled share token exists | I open `/share/<token>` | I see the PRD content for that version (title/sections/summary when present) with read-only treatment |
| AC-2 | The share token is unknown, revoked, or disabled | I request the payload | I get a neutral “not available” outcome with no indication that another workspace exists |
| AC-3 | The URL token fails format validation (too long / empty) | — | I get a minimal validation error without internal identifiers |
| AC-4 | The app returns the JSON payload | I inspect keys | There is **no** `projectName`, project id, owner id, or question history |
| AC-5 | A database or validation failure occurs on the server | — | The client receives a safe generic failure message |

---

## Test Plan

- [ ] Contract: `packages/contracts/src/share/anonymous-read.test.ts`
- [ ] Unit: `GetAnonymousSharedPrdUseCase` delegates to repository
- [ ] `pnpm typecheck` and `pnpm build` on the tracking branch

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/contracts/src/share/` | contracts + tests | Anonymous read token + response DTOs |
| `apps/web/src/domain/prd/` | modify | Repository port + snapshot type |
| `apps/web/src/infrastructure/persistence/` | modify | Drizzle read without `projects` join |
| `apps/web/src/application/prd/` | add | Thin use case + unit test |
| `apps/web/app/api/share/[token]/` | modify | Thin route |
| `apps/web/app/share/[token]/` | modify | Anonymous-only UI + loading/error shells |

---

## Out-of-Scope

- Owner revoke / SEO slice (`revoke-link-and-noindex`)
- Viewer feedback prompts (Hard v0 exclusion)
- Password-protected shares, expiry, custom domains

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
