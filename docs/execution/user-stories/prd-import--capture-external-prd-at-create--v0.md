# User Story: Capture external PRD at project creation (v0)

## Parent Scope Slice

[Capture external PRD at project creation](../../product/scope-slices/prd-import--capture-external-prd-at-create.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want to **paste or upload** my existing PRD when I create a project so that Zedos stores it as my first in-app version without forcing me through a full clarification loop first.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I open the new-project dialog | I expand **Import existing PRD** | I can paste text or choose a file |
| AC-2 | I provide valid paste content | I submit create with import | A project is created and the first PRD version contains my pasted content |
| AC-3 | I upload an allowed file under the size limit | I submit | Content is stored as the first PRD version |
| AC-4 | I upload a disallowed type or oversize file | I submit | I see a clear error; no partial orphan project without recovery |
| AC-5 | I create with import **and** express mode | Submit succeeds | Project is express; imported version is visible (express generation rules apply separately) |
| AC-6 | I create with import only (standard mode) | Submit succeeds | I reach workspace with imported version; I am not forced through full clarify before viewing |
| AC-7 | My session expired | I attempt import create | Redirect sign-in; no import persisted |

---

## Test Plan

- [ ] Contract: create-with-import request schema accepts paste vs file metadata
- [ ] Unit: import path creates project + version atomically or rolls back
- [ ] Integration: POST create with multipart / JSON paste
- [ ] E2E: paste → workspace shows imported body

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/contracts/src/project/` | modify | Create-with-import request |
| `apps/web/app/api/projects/route.ts` | modify | Import branch on create |
| `apps/web/app/dashboard/projects/page.tsx` | modify | Import UI on create dialog |
| PRD version persistence layer | modify | Seed version from import payload |

---

## Out of Scope

- Notion/API sync
- Post-create import on existing projects
- Express 12-section generation (fast-track slice)
- Optional IA restructure (may be follow-up task inside same plan iteration 2)

---

## Open Questions

| ID | Question | Blocks |
|----|----------|--------|
| OQ-IMP-001 | Max file size (MB) for v0? | AC-4 messaging |
| OQ-IMP-002 | Does raw import consume credits? | Credit copy on create |

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Draft US for Q-028 slice | doc-sync |
