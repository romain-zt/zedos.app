<!--
  Scope Slice — Turborepo Migration Phase 1: Package Extraction
  Parent Feature Area: turborepo-migration
  Governed by: .cursor/rules/feature-area-workflow.mdc
-->

# Scope Slice: Turborepo Migration — Phase 1: Package Extraction

## Parent Feature Area

[Turborepo migration](../feature-areas/turborepo-migration.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false
> **Note:** Phase 0 is complete (apps/web/ exists, pnpm workspace operational as of 2026-05-10). Blocker resolved. Implementation Plan written at `docs/execution/plans/turborepo-migration--phase-1-package-extraction.plan.md`.

---

## User Value

An engineer can add or change shared contracts, the result type, the database schema, or auth configuration as isolated, versioned packages — with `strict: true` TypeScript enforced per package — rather than editing inside the single `apps/web/src/` tree, reducing the blast radius of each change and making the architecture rules actually enforceable by tooling.

---

## Exact Boundary

### Included Behavior

- `@repo/contracts` package created at `packages/contracts/`; existing `apps/web/src/contracts/*` moved in; missing contexts added as stubs (`payments`, `ai`, `share`, `feedback`, `questions`); package exports typed with `@repo/tsconfig/base.json`
- `@repo/result` package created at `packages/result/`; existing `src/shared/result/result.ts` replaced with `neverthrow` re-export (or a variance-correct wrapper); every callsite in `apps/web/src/` updated to import from `@repo/result`; `as any` casts in use-case return types removed from this package (other callsites in `app/` deferred to `as any` cleanup slice)
- `@repo/db` package created at `packages/db/`; `apps/web/prisma/schema.prisma` moved to `packages/db/prisma/schema.prisma`; Prisma client generated from this new location; `apps/web/` imports `@prisma/client` via `@repo/db` re-export; `prisma migrate dev --name baseline` run to commit `packages/db/prisma/migrations/` baseline
- `@repo/auth` package created at `packages/auth/`; `apps/web/lib/auth-options.ts` moved into `packages/auth/src/`; NextAuth type augmentation file added so `session.user.id` is properly typed (no `as any`); DB error swallowing in credentials provider replaced with structured logging
- `syncpack` lint passes with zero drift violations across workspace
- `dependency-cruiser` config added at root; boundaries checked per `.cursor/rules/72-hexagonal-boundaries.mdc`; cruiser runs in CI via `pr-quality.yml` (new step added)
- `EventBus` dead code deleted from `apps/web/src/shared/events/` (zero callers — finding #22 in retro)

### Excluded Behavior

- Migrating Prisma → Drizzle (Phase 2 — `@repo/db` still uses Prisma in this slice)
- Migrating NextAuth → better-auth (Phase 3 — `@repo/auth` still uses NextAuth in this slice)
- Moving `components/` into `packages/ui` (separate slice, after Phase 0 and Phase 1 are stable)
- Creating `packages/sdk-stripe` or `packages/sdk-ai` vendor wrappers (separate technical slices)
- Fixing all 117 `as any` casts — only the ones in `@repo/result` callsites (use-case return types) are addressed here; `app/` casts deferred
- Application route logic changes — routes continue to call use-cases the same way; only import sources change
- Changing any product-visible behavior

---

## UX States

This slice has no end-user UX. Engineering-facing states:

| State | When | What the engineer sees / experiences |
|-------|------|---------------------------------------|
| Workspace builds | After package extraction | `pnpm build` from root succeeds for all packages and `apps/web` |
| Type-safe contracts | After extraction | `@repo/contracts` imports work from `apps/web/`; TypeScript resolves correctly |
| Result type sound | After `@repo/result` | No `as any` needed for `Result<T,E>` in extracted use-case callsites; neverthrow typings resolve |
| DB package resolves | After `@repo/db` | Prisma client generated from `packages/db/`; `apps/web` builds with new import path |
| Auth package resolves | After `@repo/auth` | Session type augmentation works; `session.user.id` is `string` not `string \| undefined` |
| syncpack clean | After all packages | `pnpm syncpack lint` exits 0 |
| dependency-cruiser clean | After config | `pnpm dependency-cruiser` exits 0 with known-violation baseline |
| Tests passing | After all | All 9+ unit tests pass; `@repo/result` tests pass under new wrapper |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| `@repo/contracts` package | Created | `packages/contracts/`; Zod schemas migrated from `apps/web/src/contracts/` |
| `@repo/result` package | Created | `packages/result/`; neverthrow-based `Result<T,E>` |
| `@repo/db` package | Created | `packages/db/`; Prisma schema moved; migrations baseline committed |
| `@repo/auth` package | Created | `packages/auth/`; NextAuth options + type augmentation |
| `apps/web/src/contracts/` | Deleted | Replaced by `@repo/contracts` |
| `apps/web/src/shared/result/` | Deleted | Replaced by `@repo/result` |
| `apps/web/src/shared/events/` | Deleted | EventBus dead code removed |
| `apps/web/lib/auth-options.ts` | Deleted | Replaced by `@repo/auth` |
| `apps/web/prisma/` | Deleted | Moved to `packages/db/prisma/` |

---

## Credit / Payment Impact

None — no credit or payment interaction in this slice. The credit domain types move to `@repo/contracts` but the credit logic is unchanged.

---

## Sharing / Privacy Impact

None — no sharing or privacy boundary changes in this slice.

---

## Feedback / Instrumentation Impact

None — no feedback prompt or attribution in this slice.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Phase 0 scaffold complete | Scope Slice | pending | `apps/web/` must exist and `pnpm install` must work before packages can be extracted |
| `neverthrow` decision confirmed | Tooling | ready | Locked decision per retro §6 P1.4; no alternative |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| Phase 0 scaffold not yet executed | All sub-steps; user stories cannot be written until Phase 0 is merged | false |

---

## Acceptance-Level Outcome

An engineer can import `Result`, `contracts`, `db`, and `auth` from their respective `@repo/*` packages inside `apps/web/` without TypeScript errors. `pnpm -w turbo run build typecheck lint test` passes end-to-end. `syncpack lint` exits 0. `dependency-cruiser` runs in CI and exits 0 against the boundaries baseline. No `as any` cast exists in `@repo/result` or any use-case file that consumes it.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [ ] UX states enumerated (engineering-facing only — acceptable for a migration slice)
- [x] Business objects named
- [x] Credit / payment impact assessed (none)
- [x] Sharing / privacy surface assessed (none)
- [x] Feedback / instrumentation impact assessed (none)
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral

**Verdict:** NOT READY — depends on Phase 0 executing first. Promote to ready-for-user-stories after Phase 0 merges.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial scaffold from `docs/retro/zedos-monorepo-retro.md` §6 Phase 1 steps P1.1–P1.8 | Cloud Agent |
