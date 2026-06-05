# Implementation Plan: templates-marketplace--use-template-on-create (v1)

## Parent User Story

[templates-marketplace--use-template-on-create (v1)](../user-stories/templates-marketplace--use-template-on-create--v1.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Extend the existing create-project pipeline to accept an optional `templateSlug`. When provided:

1. Resolve the template via `ITemplateCatalogPort` (DI from infrastructure → application).
2. Override `journeyMode` with the template's mode (mapping template `journey hint = "import"` to `journeyMode = "standard"` since the project entity only supports `'standard' | 'express'`).
3. Use the template's PRD content body as the `importedPrdContent` for `EnsureFirstVersion` — same atomic transaction + rollback semantics as the existing import-on-create flow.
4. Mark the resulting project with a returned `templateSlug` field in `ProjectDTO` only when applicable (kept optional to avoid touching existing consumers).

A `templateSlug` and an `importPaste`/`importFile` are mutually exclusive at parse time — the parser rejects both being present in the same request.

UI: the existing `/dashboard/projects` page is the single create surface. The `Use template` CTA on `/dashboard/templates` navigates to `/dashboard/projects?template=<slug>` and the page auto-opens the create dialog with the template chip rendered, the journey mode locked to the template's value, and the import section hidden.

Analytics: `project_created_from_template` fires server-side after the create+ensure-first-version succeeds.

---

## Layers Affected

- [ ] `domain` (no change — reuses existing entity / port)
- [x] `application`
- [x] `contracts`
- [ ] `infrastructure` (no new adapter — reuses Plan A's static catalog)
- [x] `app`
- [x] `ui` (lives in `app/dashboard/**/_components/`)

---

## Touched Files (exact)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/src/project/project-contracts.ts` | modify | Extend `CreateProjectRequestSchema` with optional `templateSlug`; add it to `ProjectDTOSchema` as optional output |
| `packages/contracts/src/project/project.contract.test.ts` | modify | Add tests for `templateSlug` parse + `ProjectDTO` round-trip |
| `apps/web/src/application/project/create-project-usecase.ts` | modify | Accept `templateSlug` + optional `ITemplateCatalogPort`; resolve template; force `journeyMode`; seed first PRD version from template content |
| `apps/web/src/application/project/create-project-usecase.test.ts` | modify | Add: template path happy, unknown slug rejected, mutual exclusion vs import, rollback on PRD seed failure |
| `apps/web/src/application/project/project-dto.ts` | modify | Carry `templateSlug` through DTO mapper (optional) |
| `apps/web/src/domain/project/project.ts` | modify | Add optional `templateSlug` field on domain entity (nullable, default null) |
| `apps/web/src/domain/project/project-service.ts` | modify | Accept `templateSlug` in `createProject` |
| `apps/web/app/api/projects/route.ts` | modify | Inject `StaticTemplateCatalog` into `CreateProjectUseCase`; forward `templateSlug`; emit `project_created_from_template` analytics on success |
| `apps/web/app/api/projects/parse-create-project-request.ts` | modify | Parse `templateSlug` from JSON + FormData; mutual exclusion vs import |
| `apps/web/app/dashboard/projects/page.tsx` | modify | Read `?template=<slug>` query; auto-open dialog; fetch template; show chip; lock journey mode; hide import collapsible; send `templateSlug` in POST body |
| `apps/web/app/dashboard/templates/_components/template-card.tsx` | modify | Add `Use template` CTA → `/dashboard/projects?template=<slug>` |
| `apps/web/app/dashboard/templates/_components/template-preview-modal.tsx` | modify | Add `Use this template` primary action in the modal footer |
| `apps/web/src/infrastructure/analytics/analytics-events.ts` | modify | Add `PROJECT_CREATED_FROM_TEMPLATE` constant |
| `apps/web/public/messages/en/dashboard_projects.json` | modify | Add `templateChip.label`, `templateChip.clear`, `templateChip.journeyLocked` |
| `apps/web/public/messages/fr/dashboard_projects.json` | modify | Idem FR |
| `apps/web/public/messages/en/dashboard_templates.json` | modify | Add `card.use`, `preview.use` |
| `apps/web/public/messages/fr/dashboard_templates.json` | modify | Idem FR |

> All these `templates-*` UI files are first created in Plan A, so the only true "new" files added by Plan B are zero — Plan B only modifies files already brought into existence by Plan A or already in the repo.

---

## Contracts Changed

- `CreateProjectRequestSchema` gains `templateSlug: TemplateSlugSchema.optional()`.
- `ProjectDTOSchema` gains `templateSlug: TemplateSlugSchema.optional()` (back-compat: optional, omitted when absent).
- No breaking change to existing consumers — all new fields are optional.

---

## Migrations

Schema migration on the `projects` table to add `template_slug TEXT NULL` — added in **Plan B** in `packages/db/src/migrations/0016_projects_template_slug.sql` and the corresponding Drizzle schema file, **only if** the running project repository requires it. Pre-migration today uses Prisma in `apps/web` via `PrismaProjectRepository`; in that path we'll add the column via Prisma + Drizzle in parallel.

> Honest cut: in this iteration we **do not** persist `templateSlug` on the projects table. The slice's `Acceptance-Level Outcome` is "lands in a new project whose **journey mode** and starter PRD content match that template without manual re-entry" — that is fully met by mirroring journey mode and seeding the first PRD version, without persisting the slug. Persisting the slug is a follow-up for analytics joins (out of scope here). The DTO field stays optional and undefined for v1; the analytics event carries the slug.

---

## Tests

- `packages/contracts/src/project/project.contract.test.ts` — `templateSlug` parses; absent passes; invalid slug rejected.
- `apps/web/src/application/project/create-project-usecase.test.ts`:
  - happy path: `templateSlug` only → resolves template, uses template's journey mode, persists PRD seed
  - rollback: PRD seed failure deletes the just-created project
  - unknown slug → `NotFoundError`
  - mutual exclusion: both `templateSlug` and `importedPrdContent` → `ValidationError`

---

## Rollback

Revert the modified files. Nothing persisted to DB schema.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Journey mode mismatch (user picked Express, template is Standard) | Template's mode wins; UI locks the radio and shows the explanation copy. |
| Import-on-create + template-on-create collision | Parser rejects with `Cannot combine import and template` (400). |
| PRD body parse failure | Reuse the existing import rollback path: created project is deleted, error returned. |
| Catalog port construction in route handler | Singleton import from `@infrastructure/templates`; no per-request work. |

---

## Verification

- [x] `pnpm --filter @repo/web typecheck`
- [x] `pnpm --filter @repo/contracts typecheck`
- [x] `pnpm --filter @repo/web test -- src/application/project src/application/templates`
- [x] `pnpm --filter @repo/contracts test -- src/project src/templates`

---

## Blueprint

Generated 2026-06-04. Refined and approved 2026-06-05 for implementation alongside Plan A (official-seed-catalog).
