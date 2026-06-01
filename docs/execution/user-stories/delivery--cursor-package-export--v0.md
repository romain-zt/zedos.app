# User Story: Cursor package export (v0)

## Parent Scope Slice

[Cursor package export](../../product/scope-slices/delivery--cursor-package-export.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want to select export-ready story bundles, preview what will ship, and download one Cursor-ready package (stories, ordered tasks, and per-task prompts) so I can continue implementation in my own repository without manual reformatting.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | No locked export-ready bundle exists for the project | I open the Delivery export surface | I see empty / gated copy pointing me to complete and lock task splitting upstream |
| AC-2 | At least one export-ready bundle exists | I open the export surface | I see a list with story identifiers, task counts, and export-ready indicators; I can select one or many (default: all eligible) |
| AC-3 | I have selected at least one bundle | I open preview | I see a read-only summary (ordered stories, nested tasks, prompt excerpts); I cannot edit upstream content |
| AC-4 | Preview is open | I confirm export | I see a packaging loading state; duplicate export requests are prevented |
| AC-5 | Packaging succeeds | The download is ready | I receive a single archive download plus brief guidance to copy it into my repo and open in Cursor |
| AC-6 | Packaging fails retryably | — | I see a recoverable error with retry; upstream bundles remain locked |
| AC-7 | A hard prerequisite is missing (bundle unlocked, wrong project) | — | I see blocked messaging with a correction path toward test-first workflows |
| AC-8 | I attempt export with zero bundles selected | — | I see inline validation before packaging starts |
| AC-9 | I am not authenticated | I call delivery export APIs | I receive unauthorized responses |
| AC-10 | I target another user's project | — | I receive not-found style responses without leaking existence |

---

## Test Plan

- [x] Contract: eligible list, preview request/response, export request schemas (unit)
- [x] Unit: `buildDeliveryPackageUseCase` with mocked `IDeliveryExportRepository` — PD-001 shape (`WORK_QUEUE` rows + per-story files)
- [x] Unit: `cursor-package-assembler` — ZIP contains expected paths (integration-light)
- [x] `pnpm typecheck` and `pnpm build` on the implementation branch

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/contracts/src/delivery/` | new | HTTP + export DTOs |
| `apps/web/src/domain/delivery/` | new | Port + domain types |
| `apps/web/src/application/delivery/` | new | List, preview, build use cases |
| `apps/web/src/infrastructure/delivery/` | new | Drizzle read adapter + ZIP assembler |
| `apps/web/app/api/projects/[id]/delivery/**/route.ts` | new | Eligible, preview, export |
| `apps/web/app/dashboard/projects/[id]/delivery/**` | new | Owner export workspace UI |
| `apps/web/app/dashboard/_lib/deferred-roadmap-placeholders.ts` | modify | Remove Delivery from deferred placeholders |

---

## Out of Scope

- Running agents or executing tasks inside Zedos
- Editing stories, tasks, or prompts during export
- CI/CD setup or architecture diagram documents in the package
- Markdown/PDF PRD export
- Public share links or multi-user export
- AI credit consumption for deterministic packaging

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| OQ-1 | `task_split_*` tables are not yet on `main` while this slice assumes **locked** bundles | Exportable data | Before `/implement`: merge or implement `test-first-workflows--task-splitting-with-prompts--v0.plan.md`; this Plan adds read port + assembler only |

---

## Decision References

- PD-001 — `.cursor/` folder structure + `WORK_QUEUE.md`-compatible entries

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-29 | Authored from approved `/plan` for `delivery--cursor-package-export` | — |
