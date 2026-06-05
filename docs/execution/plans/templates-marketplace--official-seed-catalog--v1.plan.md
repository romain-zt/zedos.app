# Implementation Plan: templates-marketplace--official-seed-catalog (v1)

## Parent User Story

[templates-marketplace--official-seed-catalog (v1)](../user-stories/templates-marketplace--official-seed-catalog--v1.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Static, in-code seed catalog (no DB migration v1) — the scope slice explicitly classifies the templates as "Static seed", and shipping the catalog as a typed module keeps reads zero-RTT, version-controlled, and reviewable diff-by-diff while leaving a clean port if a DB-backed implementation is needed later.

Layering follows hexagonal boundaries:

- `contracts/templates/*` — Zod schemas as the single source of truth for catalog DTOs (slug, title, description, journey mode hint, sections outline, clarify hints, author, fork count, content body).
- `domain/templates/*` — pure domain types + `ITemplateCatalogPort` (read-only).
- `infrastructure/templates/seed-templates.ts` — the 10 typed seeds drawn from `docs/product/templates-marketplace-v1-cadrage.md` (T01–T10).
- `infrastructure/templates/static-template-catalog.ts` — port implementation over the static seeds.
- `application/templates/*` — `ListTemplatesUseCase` + `GetTemplateBySlugUseCase` returning DTOs.
- `app/api/templates/*` — thin route handlers (parse → use case → DTO validate → JSON).
- `app/dashboard/templates/*` — client page (grid + preview dialog) wired to `useI18n`.

PRD seed body for every template is a `PrdVersionContent` matching `GeneratePrdAiResponseSchema` (the broadest accepted shape in `PrdVersionContentSchema`). This makes the same content directly usable as the imported PRD seed for the sibling slice (`use-template-on-create`).

Analytics: two server-side events fire from the catalog route handlers — `template_catalog_viewed` and `template_preview_opened`.

---

## Layers Affected

- [x] `domain`
- [x] `application`
- [x] `contracts`
- [x] `infrastructure`
- [x] `app`
- [x] `ui` (lives in `app/dashboard/templates/_components/` per current v0 carve-out — no new `lib/` files)

---

## Touched Files (exact)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/src/templates/template.ts` | create | Zod schemas: slug, author, journey-mode hint, summary DTO, detail DTO, list response |
| `packages/contracts/src/templates/template.contract.test.ts` | create | Contract tests for the new schemas |
| `packages/contracts/src/templates/index.ts` | create | Barrel re-exports |
| `packages/contracts/src/index.ts` | modify | Add `export * from './templates'` |
| `packages/contracts/package.json` | modify | Add `./templates` export entry |
| `apps/web/src/domain/templates/template.ts` | create | Domain types: `TemplateSummary`, `TemplateDetail` |
| `apps/web/src/domain/templates/template-catalog-port.ts` | create | `ITemplateCatalogPort` interface |
| `apps/web/src/domain/templates/index.ts` | create | Barrel re-exports |
| `apps/web/src/infrastructure/templates/seed-templates.ts` | create | 10 typed seeds (T01–T10) with metadata + PRD content body |
| `apps/web/src/infrastructure/templates/static-template-catalog.ts` | create | Port implementation over the seed array |
| `apps/web/src/infrastructure/templates/index.ts` | create | Barrel re-exports |
| `apps/web/src/application/templates/template-dto.ts` | create | Domain → DTO mappers |
| `apps/web/src/application/templates/list-templates-usecase.ts` | create | `ListTemplatesUseCase` |
| `apps/web/src/application/templates/get-template-usecase.ts` | create | `GetTemplateBySlugUseCase` |
| `apps/web/src/application/templates/list-templates-usecase.test.ts` | create | Unit tests (happy + not-found) |
| `apps/web/src/application/templates/index.ts` | create | Barrel re-exports |
| `apps/web/app/api/templates/route.ts` | create | `GET /api/templates` — list |
| `apps/web/app/api/templates/[slug]/route.ts` | create | `GET /api/templates/[slug]` — detail |
| `apps/web/app/dashboard/templates/page.tsx` | create | Catalog page (grid + preview state) |
| `apps/web/app/dashboard/templates/_components/template-card.tsx` | create | Grid card |
| `apps/web/app/dashboard/templates/_components/template-preview-modal.tsx` | create | Preview modal (sections outline + clarify hints) |
| `apps/web/public/messages/en/dashboard_templates.json` | create | EN copy for the catalog page |
| `apps/web/public/messages/fr/dashboard_templates.json` | create | FR copy for the catalog page |
| `apps/web/public/messages/en/common.json` | modify | Add `nav.templates` |
| `apps/web/public/messages/fr/common.json` | modify | Add `nav.templates` |
| `apps/web/src/i18n/index.tsx` | modify | Register `dashboard_templates` slug |
| `apps/web/app/dashboard/_components/dashboard-shell.tsx` | modify | Add Templates nav entry |
| `apps/web/src/infrastructure/analytics/analytics-events.ts` | modify | Add `TEMPLATE_CATALOG_VIEWED` + `TEMPLATE_PREVIEW_OPENED` |

> Out-of-scope: any change to the project create flow — that's Plan B (`use-template-on-create`).

---

## Contracts Changed

- New: `TemplateSlugSchema`, `TemplateAuthorSchema`, `TemplateCategorySchema`, `TemplateJourneyHintSchema`, `TemplateSummaryDTOSchema`, `TemplateDetailDTOSchema`, `TemplateListResponseSchema`.
- The PRD content body inside `TemplateDetailDTOSchema` reuses `GeneratePrdAiResponseSchema` (already in `@repo/contracts/ai/generate-prd-stream`), so it is interchangeable with `PrdVersionContent` consumers downstream.

---

## Migrations

None — no DB tables added (static seed).

---

## Tests

- `packages/contracts/src/templates/template.contract.test.ts` — accept valid summary/detail, reject malformed.
- `apps/web/src/application/templates/list-templates-usecase.test.ts` — list returns 10 in seed order; get-by-slug returns the right detail; unknown slug returns `NotFoundError`.

---

## Rollback

Delete the listed files, revert the three modified files (`contracts/src/index.ts`, `contracts/package.json`, `analytics-events.ts`, `dashboard-shell.tsx`, `i18n/index.tsx`, both `common.json`). Zero data implication.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Seed body drift vs PRD generation expectations | Reuse `GeneratePrdAiResponseSchema` for the content body so the shape stays compatible with `PrdVersionContent` consumers. |
| Locale fallback for new copy | Both EN/FR files shipped together; `tp()` fallback already handles missing keys. |
| Nav clutter | Single nav entry, kept above the workspace-scoped block (matches existing pattern). |

---

## Verification

- [x] `pnpm --filter @repo/web typecheck`
- [x] `pnpm --filter @repo/contracts typecheck`
- [x] `pnpm --filter @repo/web test -- src/application/templates`
- [x] `pnpm --filter @repo/contracts test -- src/templates`

---

## Blueprint

Generated 2026-06-04. Refined and approved 2026-06-05 for implementation.
