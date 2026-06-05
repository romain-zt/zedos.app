# Implementation Plan: team-data-room--bundle-export-zip (v1)

## Parent User Story

[team-data-room--bundle-export-zip (v1)](../user-stories/team-data-room--bundle-export-zip--v1.md)

## Status

`executed`

> **NEED_HUMAN:** true (parent slice carries B-TEAM-PRICE-001 — pricing not signed off)
> **NEED_UPDATE:** false

---

## Approach

Build the technical bundle assembler behind the `planTier === 'team'` gate. Pricing/marketing/launch decisions remain blocked on **B-TEAM-PRICE-001** and **GATE-MRR-500** in the parent slice; this plan ships the **mechanical zip** so that, once pricing lands, only the env flip and Stripe price ID is required.

Bundle composition (matches scope slice + `plan-team-data-room-spec.md`):

- `README.md` — disclaimer, generation timestamp, express-section flags
- `prd/v{n}.md` — latest PRD as markdown (uses existing `prd-print-html.ts` HTML, falls back to JSON dump if needed)
- `prd/v{n}.json` — raw PRD content
- `decisions/index.md` + `decisions/index.json` — uses existing `buildDecisionsExportJson`
- `adrs/ADR-{n}.md` — one file per ADR
- `user-stories/index.md` — corpus listing (titles + status)
- `share-links/index.md` — minted share link inventory (token redacted; only `id`, `enabled`, `createdAt`, expiry)
- `MANIFEST.json` — list of files + counts

Hexagonal layout:

- `domain/data-room/bundle.ts` — `DataRoomBundle` value object, gate helper
- `domain/data-room/data-room-repository.ts` — port (insert bundle generation row)
- `application/data-room/build-data-room-bundle-usecase.ts` — orchestrator (reads PRD, decisions, ADRs, stories, share links)
- `infrastructure/data-room/data-room-zip-assembler.ts` — markdown + archiver zipping
- `infrastructure/persistence/data-room-bundle-repository.ts` — Drizzle adapter (records each generation)
- `app/api/projects/[id]/data-room/bundle/route.ts` — POST returns zip stream

---

## Layers Affected

- [x] `domain`
- [x] `application`
- [x] `contracts`
- [x] `infrastructure`
- [x] `app`
- [ ] `ui`

---

## Touched Files

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/db/src/schema/data-room.ts` | new | `data_room_bundles` audit table |
| `packages/db/src/schema/index.ts` | edit (covered) | Re-export |
| `packages/contracts/src/data-room/bundle.ts` | new | Zod request/response + bundle metadata |
| `packages/contracts/src/data-room/index.ts` | new | Aggregate |
| `packages/contracts/src/index.ts` | edit | Add `./data-room` re-export |
| `apps/web/src/domain/data-room/bundle.ts` | new | Pure value object |
| `apps/web/src/domain/data-room/data-room-repository.ts` | new | Port |
| `apps/web/src/domain/data-room/data-room-assembler-port.ts` | new | Port |
| `apps/web/src/domain/data-room/index.ts` | new | Re-exports |
| `apps/web/src/application/data-room/build-data-room-bundle-usecase.ts` | new | Orchestrator |
| `apps/web/src/infrastructure/data-room/data-room-zip-assembler.ts` | new | archiver zipping (matches existing cursor pattern) |
| `apps/web/src/infrastructure/persistence/data-room-bundle-repository.ts` | new | Drizzle adapter |
| `apps/web/app/api/projects/[id]/data-room/bundle/route.ts` | new | POST returns zip (< 30 LOC) |

---

## Verification

- [x] `pnpm --filter @repo/web typecheck`
- [ ] `pnpm --filter @repo/web test`
- [ ] `pnpm --filter @repo/web build`

---

## Out of Scope (deferred to product unblock)

- Pricing copy / public marketing surface (B-TEAM-PRICE-001)
- Team-plan Stripe price ID / checkout (B-TEAM-PRICE-001)
- SSO, custom domain (per slice §Excluded Behavior)
- MRR gate enforcement (GATE-MRR-500) — endpoint is operator-gated by `planTier === 'team'`

---

## Blueprint

Generated 2026-06-04. Approved + filled 2026-06-05 with NEED_HUMAN preserved.
