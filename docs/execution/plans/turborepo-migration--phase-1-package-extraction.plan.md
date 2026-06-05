<!--
  Implementation Plan — Turborepo Migration Phase 1: Package Extraction
  Parent Scope Slice: docs/product/scope-slices/turborepo-migration--phase-1-package-extraction.md
  Authored per: .cursor/templates/execution/implementation-plan.template.md
  Governed by: .cursor/rules/70-execution-bridge.mdc, 71-monorepo-context.mdc, 72-hexagonal-boundaries.mdc
  PR split: one PR per package (4 PRs: contracts → result → db → auth)
  Pre-approved by overnight orchestrator run — see docs/state/status.json
-->

# Implementation Plan: Turborepo Migration — Phase 1: Package Extraction

## Parent Scope Slice

[docs/product/scope-slices/turborepo-migration--phase-1-package-extraction.md](../../product/scope-slices/turborepo-migration--phase-1-package-extraction.md)

## Status

`executed`

> **Layout in effect:** post-migration (apps/web/ exists; pnpm workspace operational)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Extract four shared packages from `apps/web/src/` into `packages/`. Each package is one PR, stacked on the previous. All PRs are pure refactors — no behavior change, no schema change, no API contract change. The app continues to build and all tests pass after each PR.

**Extraction order (dependency order — each package is extracted before its consumers):**

1. **PR-1 `@repo/result`** — extract `Result<T,E>` before contracts (contracts return Results)
2. **PR-2 `@repo/contracts`** — extract Zod schemas (depends on `@repo/result` for typed errors)
3. **PR-3 `@repo/db`** — extract Prisma schema + client (depends on contracts for type alignment)
4. **PR-4 `@repo/auth`** — extract NextAuth options (depends on `@repo/db` for Prisma adapter)

After all 4 PRs merge, `pnpm -w turbo run build typecheck lint test` must pass end-to-end.

**Verification gate after each PR:** `pnpm typecheck && pnpm build` in `apps/web/` must pass before opening the next PR. If it fails, the agent stops and documents the blocker in `docs/state/HANDOFF.md`.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Prisma (unchanged — Drizzle is Phase 2) |
| Auth source-of-truth | NextAuth (unchanged — better-auth is Phase 3) |
| Async/sync boundary | Unchanged — no use-case or route changes |
| Transaction boundary | Unchanged |
| External dependencies | `neverthrow` added to `packages/result/`; no new runtime vendors |
| Payment shape | n/a — no payment logic touched |

### Surface Blockers

- None. Phase 0 is confirmed complete (`apps/web/` exists, `pnpm install` works).

---

## Layers Affected

- [x] `contracts` — `apps/web/src/contracts/*` moved to `packages/contracts/src/`
- [x] `shared` — `apps/web/src/shared/result/*` moved to `packages/result/src/`; `apps/web/src/shared/events/` deleted
- [x] `infrastructure` — `apps/web/prisma/` moved to `packages/db/prisma/`; `apps/web/lib/auth-options.ts` moved to `packages/auth/src/`
- [ ] `domain` — none (repositories are in infrastructure; domain interfaces unchanged)
- [ ] `application` — import paths updated; no logic changes
- [ ] `app` (routes, server actions) — import paths updated; no logic changes
- [ ] `ui` — none

---

## Touched Files (exact paths)

### PR-1: `@repo/result` (base: main)

| Path | Operation | Notes |
|------|-----------|-------|
| `packages/result/package.json` | Create | `"name": "@repo/result"`, `"version": "0.0.1"`, `"private": true`; deps: `neverthrow@^6`; peerDeps: none; exports: `"./index"` |
| `packages/result/tsconfig.json` | Create | `{ "extends": "@repo/tsconfig/base.json", "compilerOptions": { "composite": true, "outDir": "dist", "rootDir": "src", "declarationDir": "dist" }, "include": ["src/**/*"] }` |
| `packages/result/src/index.ts` | Create | Re-exports `Result`, `Ok`, `Err`, `ok`, `err`, `fromThrowable`, `ResultAsync` from `neverthrow`; adds `AppResult<T> = Result<T, AppError>` convenience alias where `AppError` is `import('apps/web/src/shared/errors').ApplicationError` — or re-export `ApplicationError` from this package for clean dependency |
| `packages/result/src/result.ts` | Create | If `ApplicationError` is included here: port `apps/web/src/shared/errors/application-error.ts` verbatim; if kept in `apps/web/src/shared/errors/`, import only from there |
| `tsconfig.base.json` (root) | Modify | Add `"@repo/result": ["packages/result/src/index.ts"]` to `compilerOptions.paths` |
| `turbo.jsonc` | Modify | Ensure `packages/result` is in the pipeline; no new pipeline entries needed if default `build`/`typecheck` are inherited |
| `pnpm-workspace.yaml` | Verify | `packages/*` glob covers `packages/result/` — no change needed if already present |
| `apps/web/package.json` | Modify | Add `"@repo/result": "workspace:*"` to dependencies |
| `apps/web/tsconfig.json` | Modify | Add `"references": [{ "path": "../../packages/result" }]` (if using project references) |
| `apps/web/src/shared/result/result.ts` | Delete | Replaced by `packages/result/src/index.ts` |
| `apps/web/src/shared/result/result-factory.ts` | Delete | Re-exported or inlined in `packages/result/src/index.ts` |
| `apps/web/src/shared/result/result.test.ts` | Move | → `packages/result/src/result.test.ts` |
| `apps/web/src/shared/result/index.ts` | Delete | |
| `apps/web/src/shared/index.ts` | Modify | Remove `result` re-export; keep `errors`, `events`, `mappers`, `observability` |
| `apps/web/src/shared/events/event-bus.ts` | Delete | Zero callers (retro finding #22); dead code |
| `apps/web/src/shared/events/index.ts` | Delete | |
| All `apps/web/src/application/**/*.ts` | Modify | Replace `import { Result, ok, err } from '@/shared/result'` → `import { Result, ok, err } from '@repo/result'` (6 use-case files: sign-in, sign-up, check-credits, deduct-credits, add-credits, project/create, project/delete, project/get, project/list, project/update, adr/* — grep for `@/shared/result`) |
| All `apps/web/src/domain/**/*.ts` | Modify | Same import path update (credits-service.ts, adr-service.ts) |

### PR-2: `@repo/contracts` (base: PR-1)

| Path | Operation | Notes |
|------|-----------|-------|
| `packages/contracts/package.json` | Create | `"name": "@repo/contracts"`, `"version": "0.0.1"`, `"private": true`; deps: `zod@^3`, `@repo/result: workspace:*`; exports per context |
| `packages/contracts/tsconfig.json` | Create | Same pattern as `packages/result/tsconfig.json`; references `packages/result` |
| `packages/contracts/src/auth/index.ts` | Create (move) | Port `apps/web/src/contracts/auth/auth-contracts.ts` verbatim |
| `packages/contracts/src/auth/index.ts` | Create | Re-export barrel |
| `packages/contracts/src/credits/index.ts` | Create (move) | Port `apps/web/src/contracts/credits/credits-contracts.ts`, `deduct.ts` |
| `packages/contracts/src/credits/deduct.contract.test.ts` | Move | `apps/web/src/contracts/credits/deduct.contract.test.ts` → `packages/contracts/src/credits/` |
| `packages/contracts/src/payments/index.ts` | Create (move) | Port `apps/web/src/contracts/payments/checkout.ts`, `webhook.ts` |
| `packages/contracts/src/payments/__fixtures__/` | Move | All 4 fixture JSON files |
| `packages/contracts/src/payments/webhook.contract.test.ts` | Move | |
| `packages/contracts/src/prd/index.ts` | Create (move) | Port `apps/web/src/contracts/prd/prd-contracts.ts` |
| `packages/contracts/src/project/index.ts` | Create (move) | Port `apps/web/src/contracts/project/project-contracts.ts` |
| `packages/contracts/src/adr/index.ts` | Create (move) | Port `apps/web/src/contracts/adr/adr-contracts.ts` |
| `packages/contracts/src/share/index.ts` | Create | Stub: `export {}` — placeholder for read-only sharing FA |
| `packages/contracts/src/feedback/index.ts` | Create | Stub: `export {}` — placeholder for milestone-feedback FA |
| `packages/contracts/src/ai/index.ts` | Create | Stub: `export {}` — placeholder for guided-clarification FA |
| `packages/contracts/src/index.ts` | Create | Barrel re-exporting all sub-contexts |
| `tsconfig.base.json` (root) | Modify | Add `"@repo/contracts": ["packages/contracts/src/index.ts"]` |
| `apps/web/package.json` | Modify | Add `"@repo/contracts": "workspace:*"` |
| `apps/web/tsconfig.json` | Modify | Add reference to `packages/contracts` |
| `apps/web/src/contracts/` | Delete (entire directory) | Replaced by `packages/contracts/src/` |
| All `apps/web/src/**` imports of `@contracts/*` | Modify | → `@repo/contracts/<context>` (grep: `from '@contracts/` and `from '../../contracts/`) |

### PR-3: `@repo/db` (base: PR-2)

| Path | Operation | Notes |
|------|-----------|-------|
| `packages/db/package.json` | Create | `"name": "@repo/db"`, `"version": "0.0.1"`, `"private": true`; deps: `@prisma/client@6.7.0`, `prisma@6.7.0` (devDep); seed script pointer updated |
| `packages/db/tsconfig.json` | Create | Extends `@repo/tsconfig/node.json` (not nextjs — Prisma runs in Node); `composite: true`; includes `src/**`, `prisma/**` |
| `packages/db/prisma/schema.prisma` | Create (move) | Move `apps/web/prisma/schema.prisma` verbatim; update `output` if needed to `../dist/client` or remove (default) |
| `packages/db/prisma/migrations/` | Move | Move `apps/web/prisma/migrations/` if it exists; otherwise generate baseline with `prisma migrate dev --name baseline` note |
| `packages/db/src/client.ts` | Create | `import { PrismaClient } from '@prisma/client'; const globalForPrisma = globalThis as { prisma?: PrismaClient }; export const db = globalForPrisma.prisma ?? new PrismaClient(); if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db; export type { PrismaClient } from '@prisma/client';` |
| `packages/db/src/index.ts` | Create | Re-export `db` and all Prisma types |
| `tsconfig.base.json` (root) | Modify | Add `"@repo/db": ["packages/db/src/index.ts"]` |
| `apps/web/package.json` | Modify | Add `"@repo/db": "workspace:*"`; remove direct `@prisma/client` dep (consumed via `@repo/db`); keep `prisma` in devDeps for CLI access |
| `apps/web/tsconfig.json` | Modify | Add reference to `packages/db` |
| `apps/web/prisma/` | Delete | Moved to `packages/db/prisma/` |
| `apps/web/lib/prisma.ts` | Delete | Replaced by `packages/db/src/client.ts` |
| `apps/web/lib/db.ts` | Modify | Replace with re-export of `db` from `@repo/db`: `export { db } from '@repo/db'` (or delete and update callers directly) |
| `apps/web/src/infrastructure/persistence/user-repository.ts` | Modify | `import { db } from '@repo/db'` |
| `apps/web/src/infrastructure/persistence/project-repository.ts` | Modify | Same |
| `apps/web/src/infrastructure/persistence/prd-repository.ts` | Modify | Same |
| `apps/web/src/infrastructure/persistence/credits-repository.ts` | Modify | Same |
| `apps/web/src/infrastructure/persistence/adr-repository.ts` | Modify | Same |
| `apps/web/src/infrastructure/persistence/index.ts` | Modify | Same |
| `apps/web/src/test-helpers/setup-test-db.ts` | Modify | Import `db` from `@repo/db` |
| `turbo.jsonc` | Modify | Add `generate` pipeline entry: `"generate": { "cache": false }` for `prisma generate` from `packages/db` |

### PR-4: `@repo/auth` (base: PR-3)

| Path | Operation | Notes |
|------|-----------|-------|
| `packages/auth/package.json` | Create | `"name": "@repo/auth"`, `"version": "0.0.1"`, `"private": true`; deps: `next-auth@4`, `@auth/prisma-adapter@1.0.7`, `@repo/db: workspace:*`, `@repo/result: workspace:*` |
| `packages/auth/tsconfig.json` | Create | Extends `@repo/tsconfig/nextjs.json`; `composite: true`; references `packages/db`, `packages/result` |
| `packages/auth/src/auth-options.ts` | Create (move) | Port `apps/web/lib/auth-options.ts` verbatim; update import of `prisma` → `import { db } from '@repo/db'`; fix `adapter: PrismaAdapter(db)`; add `// NOTE: Phase 3 replaces this with better-auth` comment |
| `packages/auth/src/types.ts` | Create | NextAuth type augmentation: `declare module 'next-auth' { interface Session { user: { id: string; name: string; email: string } } interface User { id: string } }` — removes all `as any` casts on `session.user.id` |
| `packages/auth/src/index.ts` | Create | Re-exports `authOptions`, augmented types |
| `tsconfig.base.json` (root) | Modify | Add `"@repo/auth": ["packages/auth/src/index.ts"]` |
| `apps/web/package.json` | Modify | Add `"@repo/auth": "workspace:*"`; remove direct `next-auth`, `@auth/prisma-adapter` deps (now in `@repo/auth`) — or keep as peer |
| `apps/web/tsconfig.json` | Modify | Add reference to `packages/auth` |
| `apps/web/lib/auth-options.ts` | Delete | Moved to `packages/auth/src/` |
| `apps/web/app/api/auth/[...nextauth]/route.ts` | Modify | `import { authOptions } from '@repo/auth'` |
| All `apps/web/` files importing `lib/auth-options` | Modify | → `import { authOptions } from '@repo/auth'` (grep: `from '.*lib/auth-options'` or `from '@/lib/auth-options'`) |
| All `apps/web/` files with `session.user.id as string` | Modify | Remove `as string` casts; type is now properly inferred from augmentation in `@repo/auth/src/types.ts` |
| `apps/web/lib/types.ts` | Verify | Check if any NextAuth type augmentations exist here; if so, move to `@repo/auth/src/types.ts` and delete from lib |

---

## Contracts Changed

None — Zod schemas are moved, not changed. The `@repo/contracts` package exports the same schemas that were in `apps/web/src/contracts/`. No schema content is added or modified in this Plan.

---

## Migrations

None — no database schema changes. The Prisma schema is moved verbatim. `prisma migrate dev` is not required for this Plan; if the migration history is also moved, it must be applied to match the existing schema.

---

## Dependencies Added

| Package | Workspace | Version | Rationale |
|---------|-----------|---------|-----------|
| `neverthrow` | `packages/result` | `^6.0.0` | Locked decision: variance-correct `Result<T,E>` type; replaces hand-rolled result in `apps/web/src/shared/result/` |

---

## Tests

All existing tests must pass after each PR. No new tests are required unless a bug is found during extraction. The existing test suite covers:

- `apps/web/src/shared/result/result.test.ts` → moved to `packages/result/src/result.test.ts` (PR-1)
- `apps/web/src/contracts/credits/deduct.contract.test.ts` → moved to `packages/contracts/src/credits/` (PR-2)
- `apps/web/src/contracts/payments/webhook.contract.test.ts` → moved to `packages/contracts/src/payments/` (PR-2)
- All other unit tests remain in `apps/web/src/` and pass with updated import paths

**Verification gate per PR (run in order; fail = stop and document blocker):**

```bash
# From workspace root
pnpm -w run typecheck     # all packages + apps/web
pnpm -w run build         # apps/web next build must succeed
pnpm -w run test          # apps/web tests pass
```

---

## Out of Scope

- Migrating Prisma → Drizzle (Phase 2)
- Migrating NextAuth → better-auth (Phase 3)
- Moving `components/` to `packages/ui/` (separate slice)
- Creating `packages/sdk-stripe` or `packages/sdk-ai` (separate slices)
- Fixing all 117 `as any` casts — only the `session.user.id` casts fixed in PR-4 via type augmentation
- Any route handler, use-case logic, or product-visible behavior changes
- `syncpack` drift and `dependency-cruiser` CI config (may be added in PR-4 or as a follow-up; not blocking)

---

## PR Stack

```
main
└── cursor/turborepo-phase1-result (PR-1 — @repo/result)
    └── cursor/turborepo-phase1-contracts (PR-2 — @repo/contracts)
        └── cursor/turborepo-phase1-db (PR-3 — @repo/db)
            └── cursor/turborepo-phase1-auth (PR-4 — @repo/auth)
```

Each PR opened as **draft** first. The cascade automation (`pr-cascade.yml`) un-drafts PR-2 when PR-1 merges, and so on.

After PR-4 merges: update `docs/state/status.json` → `phase3.p1 = "complete"` and commit.

---

## Blocker Protocol

If at any point `pnpm typecheck` or `pnpm build` fails after extraction:

1. **Stop** — do not open the next PR
2. Document the error in `docs/state/HANDOFF.md` under "Current Blocker"
3. Set `docs/state/status.json` → `phase3.p1 = "blocked"` and `phase3.blocker = "<one-line summary>"`
4. Commit and push so the orchestrator sees the blocked state

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial — written for overnight pipeline; based on scope slice and actual `apps/web/src/` file tree audit | local-agent |
