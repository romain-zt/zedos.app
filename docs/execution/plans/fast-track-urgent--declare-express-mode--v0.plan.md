# Implementation Plan: Declare express journey mode (v0)

## Parent User Story

[Declare express journey mode (v0)](../user-stories/fast-track-urgent--declare-express-mode--v0.md)

## Status

`executed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Persist **`journeyMode`** (`standard` | `express`) on **`Project`** end-to-end: Drizzle migration → domain entity → repository → zod contracts → use cases → API routes → UI.

- **Create path:** extend `CreateProjectRequestSchema` with optional `journeyMode` (default **`standard`**). `CreateProjectUseCase` and `ProjectDomainService.createProject` accept the mode.
- **Switch path:** new `UpdateProjectJourneyModeUseCase` (owner-only via existing repository); dedicated route `PATCH /api/projects/[id]/journey-mode` to avoid mixing rename/description with mode changes.
- **UI:** Standard/Express radio in the create dialog; `JourneyModeControls` in the workspace header (badge + switch menu + **Approfondir**). Modal confirmations for mid-project switches. After switch to **express**, focus the **clarify** tab and show express-path toast (minimum IA not implemented in this slice).
- **Rules cited:** `72-hexagonal-boundaries` (domain → application → infrastructure; thin routes), `73-result-rop` (`Result` on use cases), `74-contracts-zod` (shared DTOs), `75-drizzle` (migration + schema), `76-better-auth` (`requireUser`), `77-nextjs` (App Router, targeted client components).

No credit, sharing, or post-PRD logic in this plan.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`projects.journey_mode`) |
| Auth source-of-truth | better-auth (`requireUser` on routes) |
| Async/sync boundary | Synchronous per HTTP request |
| Transaction boundary | Single-row update per use case (no multi-aggregate transaction) |
| External dependencies | None |
| Payment shape | n/a |
| ↳ Webhook idempotency mechanism | n/a |
| ↳ Webhook signature secret source | n/a |
| ↳ Reservation vs deduct-after-success | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [x] `domain` — `JourneyMode`, `Project`, `ProjectDomainService`
- [x] `application` — create + `UpdateProjectJourneyModeUseCase`
- [x] `contracts` — request/DTO schemas + contract tests
- [x] `infrastructure` — `DrizzleProjectRepository` mapping
- [x] `app` — API routes
- [x] `ui` — create dialog + `JourneyModeControls` (under `app/.../_components/` per current layout)
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/db/src/schema/projects.ts` | modify | `journeyMode` column |
| `packages/db/src/migrations/0012_project_journey_mode.sql` | add | DDL + default `standard` |
| `packages/db/src/types.ts` | modify | Insert/update row types |
| `packages/contracts/src/project/project-contracts.ts` | modify | `JourneyModeSchema`, extend create/DTO |
| `packages/contracts/src/project/project.contract.test.ts` | add | Contract fixtures |
| `apps/web/src/domain/project/project.ts` | modify | Type export |
| `apps/web/src/domain/project/project-service.ts` | modify | Create + `setJourneyMode` |
| `apps/web/src/domain/project/project-service.test.ts` | modify | Domain tests |
| `apps/web/src/application/project/create-project-usecase.ts` | modify | Input `journeyMode` |
| `apps/web/src/application/project/create-project-usecase.test.ts` | modify | Default + express create |
| `apps/web/src/application/project/update-project-journey-mode-usecase.ts` | add | Switch use case |
| `apps/web/src/application/project/update-project-journey-mode-usecase.test.ts` | add | Unit tests |
| `apps/web/src/application/project/project-dto.ts` | modify | DTO mapping |
| `apps/web/src/application/project/index.ts` | modify | Export new use case |
| `apps/web/src/infrastructure/persistence/project-repository.ts` | modify | Persist/read column |
| `apps/web/app/api/projects/route.ts` | modify | Parse `journeyMode` on POST |
| `apps/web/app/api/projects/[id]/journey-mode/route.ts` | add | PATCH handler |
| `apps/web/app/dashboard/projects/page.tsx` | modify | Mode selector on create |
| `apps/web/app/dashboard/projects/[id]/page.tsx` | modify | Pass `initialJourneyMode` |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | Integrate controls |
| `apps/web/app/dashboard/projects/[id]/_components/journey-mode-controls.tsx` | add | Badge, switches, Approfondir |
| `apps/web/app/dashboard/projects/[id]/_components/journey-mode-controls.test.tsx` | add | Component unit tests |
| `apps/web/public/messages/en/dashboard_projects.json` | modify | Create copy |
| `apps/web/public/messages/fr/dashboard_projects.json` | modify | Create copy |
| `apps/web/public/messages/en/dashboard_projects_id.json` | modify | Workspace copy |
| `apps/web/public/messages/fr/dashboard_projects_id.json` | modify | Workspace copy |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `JourneyModeSchema` | add | `standard`, `express`, reject invalid |
| `CreateProjectRequestSchema` | modify | optional `journeyMode`; default behavior |
| `UpdateProjectJourneyModeRequestSchema` | add | `{ journeyMode: 'express' }` |
| `ProjectDTOSchema` | modify | includes `journeyMode` |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| `0012_project_journey_mode` | `projects` | Yes — `NOT NULL DEFAULT 'standard'` |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/project/project.contract.test.ts` | contract | Schema validation |
| `apps/web/src/domain/project/project-service.test.ts` | unit | Create defaults; set mode |
| `apps/web/src/application/project/create-project-usecase.test.ts` | unit | Express on create |
| `apps/web/src/application/project/update-project-journey-mode-usecase.test.ts` | unit | Owner switch; not found |
| `apps/web/app/dashboard/projects/[id]/_components/journey-mode-controls.test.tsx` | unit | Indicator + confirm flows |

---

## Dependencies Added

- None

---

## Rollback

1. Revert code commits.
2. Ship follow-up migration dropping `journey_mode` if deploy must be undone (forward-only).
3. Existing rows remain valid with default `standard` until drop.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Pre-migration projects missing column | Low | Medium | Migration default `standard` |
| Express vs standard confusion without copy | Medium | Medium | Modal confirmations + EN/FR i18n |
| GET `/api/projects/[id]` bypasses zod DTO validation | Low | Low | Align PATCH response with `ProjectDTOSchema`; GET alignment optional |

---

## Out of Scope (deliberate)

- `express-deliverable-generation`, `express-share-disclaimer`, `grayed-post-prd-shell`
- External PRD import
- Analytics attribution for mode switches
- Playwright E2E for this slice

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | Dedicated use case; no `lib/` additions; thin routes; `Result` preserved |
| scope-critic | PASS | Slice boundary respected; no minimum IA or credits; Approfondir = standard only |

---

## Approval

- [x] User reviewed and approved this Plan
- [x] Patch Intent Summary will be produced before any code edit
- [x] Verification steps (typecheck / lint / test / build) defined in §Tests above

**Approval status:** approved
**Approval date:** 2026-06-03

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Approved via `/plan`; persisted after user `approved` | — |
