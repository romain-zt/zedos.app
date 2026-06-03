# Implementation Plan: Capture external PRD at project creation (v0)

## Parent User Story

[Capture external PRD at project creation (v0)](../user-stories/prd-import--capture-external-prd-at-create--v0.md)

## Status

`draft`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Extend **project creation** with an optional **import payload** (paste string or uploaded file parsed server-side). On success, create `Project` + initial `PrdVersion` in one transactional boundary. Do not auto-run full clarify or express generation in iteration 1.

Resolve **OQ-IMP-001/002** at plan approval (size limit; no credit charge for raw persist).

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres — project + PRD version |
| Auth | better-auth `requireUser` |
| Transaction boundary | Single transaction: project + version |
| External dependencies | None for raw paste/upload |

### Surface Blockers

- None

---

## Layers Affected

- [x] `contracts` — create request + validation
- [x] `application` — create project use case branch
- [x] `infrastructure` — repository / file parse helper
- [x] `app` — API route multipart or JSON
- [x] `ui` — create dialog import expander

---

## Touched Files (exact paths)

_To be refined at plan approval; predicted:_

| Path | Operation |
|------|-----------|
| `packages/contracts/src/project/project-contracts.ts` | modify |
| `apps/web/src/application/project/create-project-usecase.ts` | modify |
| `apps/web/app/api/projects/route.ts` | modify |
| `apps/web/app/dashboard/projects/page.tsx` | modify |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| Contract tests | contract | Invalid file type / empty paste rejected |
| Create use case tests | unit | Import creates version body |
| API route test | integration | Multipart happy path |

---

## Rollback

Revert migration only if new columns added; else code-only revert.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Draft plan | doc-sync |
