# User Story: Declare express journey mode (v0)

## Parent Scope Slice

[Declare express journey mode](../../product/scope-slices/fast-track-urgent--declare-express-mode.md)

## Status

`executed`

> Plan/US **`executed`** only — parent slice remains **`ready-for-user-stories`** (SS-11).

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want to choose **express** or **standard** when creating a project and switch between them later (including **Approfondir** into standard) so that I can work at the right depth without losing my express PRD versions.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I open the new-project dialog | I view the form | **Standard** is pre-selected; I can choose **Express (urgent)** |
| AC-2 | I filled the create form and submit | The request is in flight | The primary action shows loading; I cannot change mode until success or error |
| AC-3 | Create succeeds with a chosen mode | I land in the project workspace | The visible mode indicator matches my choice |
| AC-4 | Create fails (validation or server) | I see the error | I can retry; my mode selection is preserved |
| AC-5 | I am in a project on **standard** mode | I view the workspace | The indicator shows **Standard**; I can switch to express |
| AC-6 | I am in a project on **express** mode | I view the workspace | The indicator shows **Express**; I can switch to standard or use **Approfondir** |
| AC-7 | I am on an existing **standard** project | I activate **express** and confirm | Mode becomes express; prior PRD versions remain; I am directed to the clarify entry (not full minimum-IA flow) |
| AC-8 | I am on an existing **express** project | I switch to **standard** and confirm | Mode becomes standard; copy states new work uses standard depth; express versions stay in history |
| AC-9 | I am on **express** | I choose **Approfondir / Passer en standard** | Mode becomes **standard** without deleting express versions |
| AC-10 | My session expired | I attempt any mode change | I am redirected to sign-in; no mode change occurs |
| AC-11 | The project already has PRD versions | I switch mode either way | Switch succeeds; version list is unchanged |

---

## Test Plan

- [ ] `JourneyModeSchema` + extended project request/DTO schemas accept `standard` | `express` and reject invalid values (contract)
- [ ] `CreateProjectUseCase` persists `journeyMode` from input; default `standard` when omitted (unit)
- [ ] `UpdateProjectJourneyModeUseCase` updates mode for owner; returns not-found for non-owner (unit)
- [ ] `PATCH /api/projects/[id]/journey-mode` validates body and returns updated DTO (integration)
- [ ] `JourneyModeControls` renders indicator + confirm dialogs for mid-project switches (unit)

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/db/src/schema/projects.ts` | modify | `journey_mode` column |
| `packages/db/src/migrations/0012_project_journey_mode.sql` | add | Backfill default `standard` |
| `packages/db/src/types.ts` | modify | Row/update types |
| `packages/contracts/src/project/project-contracts.ts` | modify | Schemas + DTO |
| `packages/contracts/src/project/project.contract.test.ts` | add | Contract fixtures |
| `apps/web/src/domain/project/project.ts` | modify | `JourneyMode` type |
| `apps/web/src/domain/project/project-service.ts` | modify | Create + set mode |
| `apps/web/src/application/project/create-project-usecase.ts` | modify | Pass `journeyMode` |
| `apps/web/src/application/project/update-project-journey-mode-usecase.ts` | add | Mid-project switch |
| `apps/web/src/application/project/project-dto.ts` | modify | Map `journeyMode` |
| `apps/web/src/infrastructure/persistence/project-repository.ts` | modify | Read/write column |
| `apps/web/app/api/projects/route.ts` | modify | Create with mode |
| `apps/web/app/api/projects/[id]/journey-mode/route.ts` | add | PATCH mode |
| `apps/web/app/dashboard/projects/page.tsx` | modify | Mode choice on create |
| `apps/web/app/dashboard/projects/[id]/page.tsx` | modify | Pass initial mode |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | Host controls |
| `apps/web/app/dashboard/projects/[id]/_components/journey-mode-controls.tsx` | add | Badge + switch + Approfondir |
| `apps/web/public/messages/en/dashboard_projects.json` | modify | Create-dialog copy |
| `apps/web/public/messages/fr/dashboard_projects.json` | modify | Create-dialog copy |
| `apps/web/public/messages/en/dashboard_projects_id.json` | modify | Workspace indicator copy |
| `apps/web/public/messages/fr/dashboard_projects_id.json` | modify | Workspace indicator copy |

---

## Out of Scope

- Minimum IA clarify, livrable express generation, version tagging express (slice `express-deliverable-generation`)
- Share disclaimer (slice `express-share-disclaimer`)
- Post-PRD grayed shell (slice `grayed-post-prd-shell`)
- Import external PRD (separate Feature Area)
- Reduced credit pricing or urgent-only packs (PD-002)
- Import placeholder UI on create dialog (may coexist visually later; not implemented here)

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| _(none)_ | — | — | — |

---

## Decision References

- PD-002 — permanent express ↔ standard toggle; trigger at create + mid-project
- Q-024 — fast-track product decisions persisted in PRD

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
| 2026-06-03 | Authored and approved via `/plan` | — |
