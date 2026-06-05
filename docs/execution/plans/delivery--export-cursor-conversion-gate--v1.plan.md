# Implementation Plan: delivery--export-cursor-conversion-gate (v1)

## Parent User Story

[delivery--export-cursor-conversion-gate (v1)](../user-stories/delivery--export-cursor-conversion-gate--v1.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Soft gate at the export endpoint based on `users.planTier`. Builders / Pro / Team pass through to the existing zip flow unchanged. Free users hit a soft preview-only gate; the existing preview endpoint already returns the structural view. The new `GET /api/projects/[id]/delivery/conversion-gate` returns a decision payload (`{ decision: 'allow' | 'soft-gate', planTier, hasAttempted }`) so the UI can render the upgrade modal. The export `POST` returns **402 with a structured body** for free-tier callers, mirroring the upgrade modal copy. Repeat-visit behavior: lighter nudge (spec default) — we record `has_attempted_export` on `users` so the UI can downgrade subsequent prompts.

Hexagonal layout:

- `domain/delivery/conversion-gate.ts` — pure `evaluateConversionGate(planTier, hasAttempted)`
- `application/delivery/evaluate-export-conversion-gate-usecase.ts` — reads plan tier + attempt flag
- Gate check wired into `BuildDeliveryPackageUseCase` via constructor injection (no direct env access in usecase)
- `app/api/projects/[id]/delivery/conversion-gate/route.ts` — read decision
- `app/api/projects/[id]/delivery/export/route.ts` — 402 short-circuit before zip

---

## Layers Affected

- [x] `domain`
- [x] `application`
- [x] `contracts`
- [ ] `infrastructure`
- [x] `app`
- [ ] `ui`

---

## Touched Files

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/db/src/schema/users.ts` | edit (covered in payments plan) | Add `hasAttemptedExport` column |
| `packages/contracts/src/delivery/conversion-gate.ts` | new | Zod for gate decision + 402 body |
| `packages/contracts/src/delivery/index.ts` | new | Aggregate index (re-exports existing + new) |
| `packages/contracts/src/delivery/delivery-contracts.ts` | (no edit) | Existing schemas reused |
| `apps/web/src/domain/delivery/conversion-gate.ts` | new | Pure evaluator |
| `apps/web/src/application/delivery/evaluate-export-conversion-gate-usecase.ts` | new | Reads tier + attempt flag |
| `apps/web/app/api/projects/[id]/delivery/conversion-gate/route.ts` | new | GET decision (< 30 LOC) |
| `apps/web/app/api/projects/[id]/delivery/export/route.ts` | edit | Gate check before zip; 402 with structured body for free tier |
| `apps/web/src/infrastructure/analytics/analytics-events.ts` | edit | `CURSOR_EXPORT_GATE_SHOWN`, `CURSOR_EXPORT_GATE_UPGRADE_CLICKED`, `CURSOR_EXPORT_COMPLETED` |

---

## Verification

- [x] `pnpm --filter @repo/web typecheck`
- [ ] `pnpm --filter @repo/web test`
- [ ] `pnpm --filter @repo/web build`

---

## Blueprint

Generated 2026-06-04. Approved + filled 2026-06-05.
