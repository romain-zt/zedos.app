<!--
  Implementation Plan — Turborepo Migration Phase 1: Package Extraction
  Parent Scope Slice: docs/product/scope-slices/turborepo-migration--phase-1-package-extraction.md
  Authored per: .cursor/templates/execution/implementation-plan.template.md
  Governed by: .cursor/rules/70-execution-bridge.mdc, 71-monorepo-context.mdc, 72-hexagonal-boundaries.mdc
  PR exemption: Pure migration step — references retro phases P1.1–P1.8 per .cursor/rules/79-pr-sizing.mdc §3
-->

# Implementation Plan: Turborepo Migration — Phase 1: Package Extraction

## Parent User Story

> **Note:** This Plan is written at the Scope Slice level for the migration track, which bypasses the standard User Story intermediary per user instruction. The parent Scope Slice is the authoritative scope document.
>
> Scope Slice: [docs/product/scope-slices/turborepo-migration--phase-1-package-extraction.md](../../../docs/product/scope-slices/turborepo-migration--phase-1-package-extraction.md)

## Status

`proposed`

> **Layout in effect:** post-Phase-0 — `apps/web/` exists; `packages/tsconfig/`, `packages/eslint-config/`, `packages/vitestconfig/` exist; `pnpm-workspace.yaml` and `turbo.jsonc` are at root. Source files referenced below are the **expected** post-Phase-0 paths; this Plan is invalid if Phase 0 has not merged.
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

This Plan extracts four cross-cutting concerns from `apps/web/src/` into independent workspace packages: `@repo/result`, `@repo/contracts`, `@repo/db`, and `@repo/auth`. Each extraction follows the same mechanical pattern: (1) create the package under `packages/<name>/` with its own `package.json`, `tsconfig.json`, and `src/index.ts`; (2) move or replace the originating files; (3) update all `apps/web/` import paths; (4) verify typecheck + build before proceeding to the next package. The four PRs are strictly sequenced because `@repo/auth` depends on `@repo/db` (Prisma client), and correctness of `@repo/result` must be confirmed before contracts and use-cases can compile against the new type. No application logic changes — only import sources and file locations change. The `shared` layer (`src/shared/observability/`, `src/shared/errors/`) remains in `apps/web/src/shared/` for this phase; only `result/` and `events/` are removed from it. The `EventBus` dead code (`src/shared/events/`) is deleted in PR P1-a per retro finding #22 (zero callers). A `dependency-cruiser` config and a `syncpack` lint pass are added in PR P1-d, completing retro P1.7, so that boundary enforcement runs in CI after all packages exist. Per `73-result-rop.mdc`, `neverthrow` replaces the locally-defined `Result<T,E>` variance-unsafe implementation; every `as any` cast in use-case return types that existed to paper over the variance bug is removed. This Plan does **not** migrate Prisma→Drizzle or NextAuth→better-auth; those are Phases 2 and 3.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Prisma (unchanged — Drizzle migration is Phase 2) |
| Auth source-of-truth | NextAuth (unchanged — better-auth migration is Phase 3) |
| Async/sync boundary | Synchronous per request — no async boundary changes in this Plan |
| Transaction boundary | Unchanged — no use-case or persistence changes |
| External dependencies | `neverthrow` (new runtime dep in `@repo/result`); `prisma` CLI (devDep in `@repo/db`); `@prisma/client` (runtime dep, moved from `apps/web` to `@repo/db`); `dependency-cruiser` (root devDep, added in P1-d) |
| Payment shape | n/a — no Stripe or payment logic touched |

### Surface Blockers

- None. All tooling decisions locked in `docs/state/HANDOFF.md` §6.

---

## Layers Affected

- [ ] `domain` — none; domain entities already in `apps/web/src/domain/`, not moved in this phase
- [x] `application` — import paths updated (`@/src/shared/result/result` → `@repo/result`; `@/src/contracts/**` → `@repo/contracts`); `as any` casts on use-case return types removed (they masked `Result<T,E>` variance bugs)
- [x] `contracts` — moved from `apps/web/src/contracts/` to `packages/contracts/src/`; stub contexts added
- [x] `infrastructure` — import paths updated in persistence repos (result + contracts imports); `@/lib/prisma` → `@repo/db`
- [x] `app` (routes, server actions, server components) — import paths updated (`@/lib/auth-options` → `@repo/auth`; `@/lib/prisma` → `@repo/db`; `@/src/contracts/**` → `@repo/contracts`)
- [ ] `ui` — none
- [x] `shared` — `src/shared/result/result.ts` deleted (replaced by `@repo/result`); `src/shared/events/` deleted (EventBus dead code removed)

> **Note:** The hexagonal layers listed above are those of `apps/web/`. The new `packages/result/`, `packages/contracts/`, `packages/db/`, `packages/auth/` are workspace-level packages that map to the `shared`, `contracts`, `infrastructure`, and `infrastructure/auth` layers respectively per `72-hexagonal-boundaries.mdc` §2.

---

## Touched Files (exact paths)

### PR P1-a — `@repo/result` + EventBus deletion (retro P1.4, P1.8)

**New files — `packages/result/`**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/result/package.json` | Create | `@repo/result` workspace package manifest (see §Package Manifests) |
| `packages/result/tsconfig.json` | Create | Extends `@repo/tsconfig/node.json`; compiles `src/` to `dist/` with `strict: true` |
| `packages/result/src/index.ts` | Create | `neverthrow` re-export; the single import surface for `Result`, `ok`, `err`, `ResultAsync`, `combine` |
| `packages/result/src/result.test.ts` | Create | Unit test: `ok`/`err` construction, `map`, `mapErr`, `combine`; asserts no `as any` needed |
| `packages/result/.eslintrc.json` | Create | Extends `@repo/eslint-config/base`; `boundaries` plugin zone for `result` |

**Modified — `apps/web/`**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/package.json` | Modify | Add `"@repo/result": "workspace:*"` to `dependencies` |
| `apps/web/tsconfig.json` | Modify | Add `{ "path": "../../packages/result" }` to `references` array |
| `apps/web/src/application/**/*.ts` (~16 files) | Modify | `import … from '@/src/shared/result/result'` → `from '@repo/result'`; remove `as any` on use-case return types that masked variance bug (retro finding #20) |
| `apps/web/src/domain/**/*.ts` (~7 test files) | Modify | Same import rename where result is imported |
| `apps/web/src/infrastructure/persistence/**/*.ts` (~5 files) | Modify | Same import rename |

**Deleted — `apps/web/`**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/src/shared/result/result.ts` | Delete | Replaced by `@repo/result`; retro P1.4 |
| `apps/web/src/shared/result/index.ts` | Delete | Barrel no longer needed |
| `apps/web/src/shared/events/event-bus.ts` | Delete | Zero callers — retro finding #22; retro P1.8 |
| `apps/web/src/shared/events/index.ts` | Delete | Barrel for dead code |

**Misc**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `pnpm-lock.yaml` (root) | Modify | Updated by `pnpm install` after adding `neverthrow` |

**Verification gate (P1-a):** `pnpm -w turbo run typecheck build test --filter=@repo/result --filter=apps/web` exits 0. Zero `as any` in any modified `application/**` file. ESLint boundaries pass.

---

### PR P1-b — `@repo/contracts` (retro P2.1 partial — existing contexts moved + stubs added)

Base: PR P1-a.

**New files — `packages/contracts/`**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/package.json` | Create | `@repo/contracts` workspace package manifest (see §Package Manifests) |
| `packages/contracts/tsconfig.json` | Create | Extends `@repo/tsconfig/base.json`; compiles `src/` to `dist/` with `strict: true` |
| `packages/contracts/src/index.ts` | Create | Barrel re-exporting all context indices |
| `packages/contracts/src/auth/index.ts` | Create | Moved from `apps/web/src/contracts/auth/` — all existing Zod schemas |
| `packages/contracts/src/credits/index.ts` | Create | Moved from `apps/web/src/contracts/credits/` |
| `packages/contracts/src/project/index.ts` | Create | Moved from `apps/web/src/contracts/project/` |
| `packages/contracts/src/prd/index.ts` | Create | Moved from `apps/web/src/contracts/prd/` |
| `packages/contracts/src/adr/index.ts` | Create | Moved from `apps/web/src/contracts/adr/` |
| `packages/contracts/src/payments/index.ts` | Create | Stub — `// TODO: add Stripe session, webhook, checkout schemas`; exports empty object for now (retro #16) |
| `packages/contracts/src/ai/index.ts` | Create | Stub — `// TODO: add ClarifyResponseSchema, PrdGenerationResponseSchema` (retro #16, #19) |
| `packages/contracts/src/share/index.ts` | Create | Stub — `// TODO: add ShareLinkSchema, ShareTokenSchema` (retro #16) |
| `packages/contracts/src/feedback/index.ts` | Create | Stub — `// TODO: add MilestoneFeedbackSchema` (retro #16) |
| `packages/contracts/src/questions/index.ts` | Create | Stub — `// TODO: add QuestionHistoryEntrySchema` (retro #16) |
| `packages/contracts/src/contracts.test.ts` | Create | Unit test: one Zod `safeParse` round-trip per existing context (auth, credits, project, prd, adr); stubs export without error |
| `packages/contracts/.eslintrc.json` | Create | Extends `@repo/eslint-config/base`; `boundaries` plugin zone for `contracts` |

**Modified — `apps/web/`**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/package.json` | Modify | Add `"@repo/contracts": "workspace:*"` to `dependencies` |
| `apps/web/tsconfig.json` | Modify | Add `{ "path": "../../packages/contracts" }` to `references` |
| `apps/web/src/application/**/*.ts` (~16 files) | Modify | `import … from '@/src/contracts/…'` → `from '@repo/contracts'` or `from '@repo/contracts/<context>'` |
| `apps/web/src/infrastructure/persistence/**/*.ts` (~5 files) | Modify | Same import rename for any contract types used in persistence layer |
| `apps/web/app/api/**/*.ts` (~10 route files that validate against Zod schemas) | Modify | Same import rename |

**Deleted — `apps/web/`**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/src/contracts/auth/` | Delete (entire dir) | Moved to `packages/contracts/src/auth/` |
| `apps/web/src/contracts/credits/` | Delete | Moved |
| `apps/web/src/contracts/project/` | Delete | Moved |
| `apps/web/src/contracts/prd/` | Delete | Moved |
| `apps/web/src/contracts/adr/` | Delete | Moved |
| `apps/web/src/contracts/index.ts` | Delete | Replaced by `@repo/contracts` barrel |

**Verification gate (P1-b):** `pnpm -w turbo run typecheck build test --filter=@repo/contracts --filter=apps/web` exits 0. Zero `import … from '@/src/contracts'` remaining in `apps/web/`. ESLint boundaries pass.

---

### PR P1-c — `@repo/db` + Prisma baseline migration (retro P1.6, P2.6 partial)

Base: PR P1-b.

**New files — `packages/db/`**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/db/package.json` | Create | `@repo/db` workspace package manifest (see §Package Manifests); `postinstall: "prisma generate"` |
| `packages/db/tsconfig.json` | Create | Extends `@repo/tsconfig/node.json`; compiles `src/` to `dist/`; includes `src/**` |
| `packages/db/prisma/schema.prisma` | Create (moved from `apps/web/prisma/schema.prisma`) | Schema relocated; `output` directive already removed in Phase 0 (P0.4) |
| `packages/db/prisma/migrations/` | Create | Populated by running `prisma migrate dev --name baseline --schema packages/db/prisma/schema.prisma`; the migration SQL baseline is committed; retro P1.6, finding #28 |
| `packages/db/src/client.ts` | Create | Global Prisma singleton (replaces `apps/web/lib/prisma.ts`) |
| `packages/db/src/index.ts` | Create | Re-exports `PrismaClient`, `Prisma` from `@prisma/client`; re-exports `prisma` singleton from `./client` |
| `packages/db/.eslintrc.json` | Create | Extends `@repo/eslint-config/base`; `boundaries` plugin zone for `db` |

**Modified — `apps/web/`**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/package.json` | Modify | Add `"@repo/db": "workspace:*"` to `dependencies`; remove `"@prisma/client"` direct dep (now consumed transitively via `@repo/db`) |
| `apps/web/tsconfig.json` | Modify | Add `{ "path": "../../packages/db" }` to `references` |
| `apps/web/src/infrastructure/persistence/**/*.ts` (~5 repo files) | Modify | `import { PrismaClient } from '@prisma/client'` → `from '@repo/db'`; `import prisma from '@/lib/prisma'` → `import { prisma } from '@repo/db'` |
| `apps/web/app/api/**/*.ts` (any routes that import prisma directly) | Modify | `import prisma from '@/lib/prisma'` → `import { prisma } from '@repo/db'`; these are drift-violating routes already flagged in retro; import fix only — no logic change |
| `apps/web/scripts/**/*.ts` (seed scripts) | Modify | Update prisma import to `@repo/db` |

**Deleted — `apps/web/`**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/prisma/schema.prisma` | Delete | Moved to `packages/db/prisma/schema.prisma` |
| `apps/web/prisma/` | Delete (directory) | Empty after schema move |
| `apps/web/lib/prisma.ts` | Delete | Replaced by `packages/db/src/client.ts` |

**Root / CI**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `.github/workflows/pr-quality.yml` | Modify | Add `prisma generate --schema=packages/db/prisma/schema.prisma` step before build; ensures generated client is available in CI before typecheck |

**Verification gate (P1-c):** `pnpm -w turbo run typecheck build test --filter=@repo/db --filter=apps/web` exits 0. `prisma migrate status --schema=packages/db/prisma/schema.prisma` returns no pending migrations. Zero `import prisma from '@/lib/prisma'` or `import … from '@prisma/client'` remaining in `apps/web/app/` or `apps/web/src/`. ESLint boundaries pass.

---

### PR P1-d — `@repo/auth` + syncpack + dependency-cruiser (retro P1.5, P1.7, retro finding #37)

Base: PR P1-c.

**New files — `packages/auth/`**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/auth/package.json` | Create | `@repo/auth` workspace package manifest (see §Package Manifests); depends on `next-auth`, `@repo/db`, `bcryptjs` |
| `packages/auth/tsconfig.json` | Create | Extends `@repo/tsconfig/nextjs.json`; compiles `src/` to `dist/` |
| `packages/auth/src/auth-options.ts` | Create (moved from `apps/web/lib/auth-options.ts`) | Import `prisma` from `@repo/db` (not `@/lib/prisma`); replace `(session.user as any).id` with properly-typed `session.user.id`; replace silent `catch { return null }` with `catch (e) { logger.error('credentials:db-error', e); return null }` — structured logging fix (retro #37) |
| `packages/auth/src/types/next-auth.d.ts` | Create | Module augmentation: `Session.user.id: string`; `User.id: string`; ensures `session.user.id` is `string` not `string \| undefined` across the workspace (retro #37) |
| `packages/auth/src/index.ts` | Create | Barrel: re-exports `authOptions` and the augmented types |
| `packages/auth/.eslintrc.json` | Create | Extends `@repo/eslint-config/base` and `@repo/eslint-config/next`; `boundaries` plugin zone for `auth` |

**Modified — `apps/web/`**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/package.json` | Modify | Add `"@repo/auth": "workspace:*"` to `dependencies`; remove `"bcryptjs"` direct dep if it moves cleanly to `@repo/auth` |
| `apps/web/tsconfig.json` | Modify | Add `{ "path": "../../packages/auth" }` to `references` |
| `apps/web/app/api/auth/[...nextauth]/route.ts` | Modify | `import { authOptions } from '@/lib/auth-options'` → `import { authOptions } from '@repo/auth'` |
| `apps/web/app/**/*.ts` (any other files importing `authOptions` or casting `session.user as any`) | Modify | Same import rename; remove `as any` casts on `session.user.id` now that the type augmentation resolves it |

**Deleted — `apps/web/`**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/lib/auth-options.ts` | Delete | Replaced by `packages/auth/src/auth-options.ts` |
| `apps/web/lib/` | Delete (if empty after auth-options removed) | Only delete if no other files remain; `lib/composition.ts` is a Phase 2 artifact (out of scope here) |

**Root — syncpack + dependency-cruiser**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `.dependency-cruiser.js` | Create | Boundary rules mirroring `72-hexagonal-boundaries.mdc §3` import matrix; known-violations baseline for existing drift (routes importing prisma directly — frozen, not new violations); retro P1.7, finding #6 |
| `syncpack.config.js` | Modify | Add `@repo/result`, `@repo/contracts`, `@repo/db`, `@repo/auth` to `customTypes` peer groups if needed; ensure `neverthrow` version is pinned consistently across workspace |
| `.github/workflows/pr-quality.yml` | Modify | Add `pnpm syncpack lint` step; add `pnpm dependency-cruiser --validate .dependency-cruiser.js apps/web/src packages/*/src` step; both fail CI on violations |
| `pnpm-lock.yaml` (root) | Modify | Updated by `pnpm install` after adding `dependency-cruiser` to root devDeps |

**Verification gate (P1-d):** `pnpm -w turbo run typecheck build test --filter=@repo/auth --filter=apps/web` exits 0. `pnpm syncpack lint` exits 0. `pnpm dependency-cruiser --validate .dependency-cruiser.js apps/web/src packages/*/src` exits 0 against the baseline. Zero `import … from '@/lib/auth-options'` remaining in `apps/web/`. Zero `(session.user as any).id` casts. ESLint boundaries pass.

---

## Package Manifests (exact `package.json` per package)

### `packages/result/package.json`

```json
{
  "name": "@repo/result",
  "version": "0.0.1",
  "private": true,
  "description": "neverthrow-backed Result<T,E> for zedos — single workspace import surface",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "neverthrow": "^8.0.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "@repo/eslint-config": "workspace:*",
    "@repo/vitestconfig": "workspace:*",
    "typescript": "^5.2.0",
    "vitest": "^4.0.0"
  }
}
```

### `packages/contracts/package.json`

```json
{
  "name": "@repo/contracts",
  "version": "0.0.1",
  "private": true,
  "description": "Zod contracts — single source of truth for all I/O schemas across zedos",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js"
    },
    "./auth": {
      "types": "./dist/auth/index.d.ts",
      "require": "./dist/auth/index.js"
    },
    "./credits": {
      "types": "./dist/credits/index.d.ts",
      "require": "./dist/credits/index.js"
    },
    "./project": {
      "types": "./dist/project/index.d.ts",
      "require": "./dist/project/index.js"
    },
    "./prd": {
      "types": "./dist/prd/index.d.ts",
      "require": "./dist/prd/index.js"
    },
    "./adr": {
      "types": "./dist/adr/index.d.ts",
      "require": "./dist/adr/index.js"
    },
    "./payments": {
      "types": "./dist/payments/index.d.ts",
      "require": "./dist/payments/index.js"
    },
    "./ai": {
      "types": "./dist/ai/index.d.ts",
      "require": "./dist/ai/index.js"
    },
    "./share": {
      "types": "./dist/share/index.d.ts",
      "require": "./dist/share/index.js"
    },
    "./feedback": {
      "types": "./dist/feedback/index.d.ts",
      "require": "./dist/feedback/index.js"
    },
    "./questions": {
      "types": "./dist/questions/index.d.ts",
      "require": "./dist/questions/index.js"
    }
  },
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "@repo/eslint-config": "workspace:*",
    "@repo/vitestconfig": "workspace:*",
    "typescript": "^5.2.0",
    "vitest": "^4.0.0"
  }
}
```

### `packages/db/package.json`

```json
{
  "name": "@repo/db",
  "version": "0.0.1",
  "private": true,
  "description": "Prisma client + singleton + schema for zedos — single database access point",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "prisma generate --schema ./prisma/schema.prisma && tsc --project tsconfig.json",
    "generate": "prisma generate --schema ./prisma/schema.prisma",
    "migrate:dev": "prisma migrate dev --schema ./prisma/schema.prisma",
    "migrate:deploy": "prisma migrate deploy --schema ./prisma/schema.prisma",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "postinstall": "prisma generate --schema ./prisma/schema.prisma",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@prisma/client": "^6.7.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "@repo/eslint-config": "workspace:*",
    "prisma": "^6.7.0",
    "typescript": "^5.2.0"
  }
}
```

> **Note on `postinstall`:** `prisma generate` runs automatically on `pnpm install` so the generated client is always present before `apps/web` compiles. CI must run `pnpm install` before `turbo run typecheck` — this is already the case in the Phase 0 `pr-quality.yml`.

### `packages/auth/package.json`

```json
{
  "name": "@repo/auth",
  "version": "0.0.1",
  "private": true,
  "description": "NextAuth options, type augmentation, and adapter wiring for zedos",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@repo/db": "workspace:*",
    "next-auth": "^4.24.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "@repo/eslint-config": "workspace:*",
    "typescript": "^5.2.0",
    "@types/bcryptjs": "^2.4.6"
  },
  "peerDependencies": {
    "next": ">=14.0.0"
  }
}
```

---

## `tsconfig.json` per Package

### `packages/result/tsconfig.json`

```json
{
  "extends": "@repo/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "composite": true
  },
  "include": ["src"]
}
```

### `packages/contracts/tsconfig.json`

```json
{
  "extends": "@repo/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "composite": true
  },
  "include": ["src"]
}
```

### `packages/db/tsconfig.json`

```json
{
  "extends": "@repo/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "composite": true
  },
  "include": ["src"]
}
```

### `packages/auth/tsconfig.json`

```json
{
  "extends": "@repo/tsconfig/nextjs.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "composite": true
  },
  "include": ["src"]
}
```

### `apps/web/tsconfig.json` additions (all 4 PRs accumulate)

After all 4 PRs, `apps/web/tsconfig.json` gains the following `references` array:

```json
{
  "references": [
    { "path": "../../packages/tsconfig" },
    { "path": "../../packages/result" },
    { "path": "../../packages/contracts" },
    { "path": "../../packages/db" },
    { "path": "../../packages/auth" }
  ]
}
```

---

## Turbo Pipeline Entries

The root `turbo.jsonc` (created in Phase 0) already has pipelines for `build`, `typecheck`, `lint`, `test`, `clean`. All four new packages participate automatically since they live under `packages/*`, which is declared in `pnpm-workspace.yaml`.

**No new root pipeline entries are required** for `@repo/result`, `@repo/contracts`, or `@repo/auth`.

**One new root pipeline entry is required for `@repo/db`** — a `generate` task that runs `prisma generate` and is a build prerequisite:

```jsonc
// turbo.jsonc — additions in PR P1-c
{
  "pipeline": {
    // ...existing entries from Phase 0...
    "generate": {
      "cache": true,
      "inputs": ["prisma/schema.prisma"],
      "outputs": ["node_modules/.prisma/client/**", "node_modules/@prisma/client/**"]
    },
    "build": {
      // existing dependsOn: ["^build"] stays; @repo/db's package.json build script
      // runs `prisma generate && tsc` so generate is implicit in build for that package
      "dependsOn": ["^build", "generate"]
    }
  }
}
```

> **Implementation note:** `dependsOn: ["generate"]` (without `^`) means the `build` task of a package waits for that *same* package's `generate` task. Since only `@repo/db` defines a `generate` script, this only affects `@repo/db`. Other packages' `build` tasks are unaffected.

---

## Files Moving from `apps/web/` into Each Package

### Into `packages/result/`

| Source (post-Phase-0 path) | Destination | Notes |
|---------------------------|-------------|-------|
| `apps/web/src/shared/result/result.ts` | `packages/result/src/index.ts` | Content replaced with `neverthrow` re-export; variance-bug implementation discarded |

### Into `packages/contracts/`

| Source (post-Phase-0 path) | Destination | Notes |
|---------------------------|-------------|-------|
| `apps/web/src/contracts/auth/*.ts` | `packages/contracts/src/auth/index.ts` | Content preserved verbatim; filename normalized to `index.ts` |
| `apps/web/src/contracts/credits/*.ts` | `packages/contracts/src/credits/index.ts` | Same |
| `apps/web/src/contracts/project/*.ts` | `packages/contracts/src/project/index.ts` | Same |
| `apps/web/src/contracts/prd/*.ts` | `packages/contracts/src/prd/index.ts` | Same |
| `apps/web/src/contracts/adr/*.ts` | `packages/contracts/src/adr/index.ts` | Same |

> **Note:** If the source contracts directories contain multiple files (e.g. `schemas.ts`, `types.ts`), they are merged into a single `index.ts` with re-exports, or kept as separate files with an `index.ts` barrel — whichever preserves all existing named exports without a public API break.

### Into `packages/db/`

| Source (post-Phase-0 path) | Destination | Notes |
|---------------------------|-------------|-------|
| `apps/web/prisma/schema.prisma` | `packages/db/prisma/schema.prisma` | Verbatim copy; `output` directive already removed in Phase 0 |
| `apps/web/lib/prisma.ts` | `packages/db/src/client.ts` | Content preserved (global singleton pattern); import path from `@prisma/client` unchanged since `@prisma/client` is now a dep of `@repo/db` |

### Into `packages/auth/`

| Source (post-Phase-0 path) | Destination | Notes |
|---------------------------|-------------|-------|
| `apps/web/lib/auth-options.ts` | `packages/auth/src/auth-options.ts` | Content preserved; two targeted fixes: (1) `import prisma from '@/lib/prisma'` → `import { prisma } from '@repo/db'`; (2) `(session.user as any).id` → `session.user.id` once `next-auth.d.ts` augmentation is in place; (3) silent catch → structured error log |

---

## Import Path Changes in `apps/web/` After Extraction

### After PR P1-a — `@repo/result`

| Old import (in `apps/web/`) | New import | Scope of change |
|-----------------------------|------------|-----------------|
| `from '@/src/shared/result/result'` | `from '@repo/result'` | All `src/application/**`, `src/domain/**`, `src/infrastructure/**` |
| `import { Result, ok, err } from '../../../shared/result/result'` | `from '@repo/result'` | Relative imports where they exist |
| `return … as any` on use-case return types | Remove cast; rely on `neverthrow` correct variance | All `src/application/**/*.ts` use cases |

### After PR P1-b — `@repo/contracts`

| Old import (in `apps/web/`) | New import | Scope of change |
|-----------------------------|------------|-----------------|
| `from '@/src/contracts/auth'` (or `/schemas`, `/types`) | `from '@repo/contracts/auth'` | `src/application/auth/**`, `app/api/auth/**` |
| `from '@/src/contracts/credits'` | `from '@repo/contracts/credits'` | `src/application/credits/**`, `app/api/credits/**` |
| `from '@/src/contracts/project'` | `from '@repo/contracts/project'` | `src/application/project/**`, `app/api/projects/**` |
| `from '@/src/contracts/prd'` | `from '@repo/contracts/prd'` | `src/application/prd/**`, `app/api/projects/[id]/generate-prd/**` |
| `from '@/src/contracts/adr'` | `from '@repo/contracts/adr'` | `src/application/adr/**` |

> **Disambiguating context imports:** If the existing code imports by sub-path (e.g. `@/src/contracts/auth/schemas`), the new path becomes `@repo/contracts/auth` and the specific export name is used directly. If a named export moved into a barrel, the import adjusts accordingly. No contract schema names change.

### After PR P1-c — `@repo/db`

| Old import (in `apps/web/`) | New import | Scope of change |
|-----------------------------|------------|-----------------|
| `import prisma from '@/lib/prisma'` | `import { prisma } from '@repo/db'` | `src/infrastructure/persistence/**`, any route that imports directly (drift — import fix only) |
| `import { PrismaClient } from '@prisma/client'` | `import { PrismaClient } from '@repo/db'` | `src/infrastructure/persistence/**` |
| `import { type Prisma } from '@prisma/client'` | `import { type Prisma } from '@repo/db'` | Same scope |
| `import prisma from '@/lib/prisma'` in scripts | `import { prisma } from '@repo/db'` | `apps/web/scripts/*.ts` |

### After PR P1-d — `@repo/auth`

| Old import (in `apps/web/`) | New import | Scope of change |
|-----------------------------|------------|-----------------|
| `import { authOptions } from '@/lib/auth-options'` | `import { authOptions } from '@repo/auth'` | `app/api/auth/[...nextauth]/route.ts`, any server component using `getServerSession(authOptions)` |
| `(session.user as any).id` | `session.user.id` | Any file using `getServerSession` that cast the id — now typed by `packages/auth/src/types/next-auth.d.ts` |

---

## Contracts Changed

None — no Zod schemas are added, modified, or semantically changed. The stub contexts (`payments`, `ai`, `share`, `feedback`, `questions`) export empty objects — they are future extension points, not new contracts.

The existing schemas in `auth`, `credits`, `project`, `prd`, `adr` are relocated without modification.

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| All existing schemas in `src/contracts/{auth,credits,project,prd,adr}` | Moved (relocated, no content change) | Existing callsite tests in `apps/web/src/**/*.test.ts` implicitly verify schemas parse correctly |
| Stub contexts (`payments`, `ai`, `share`, `feedback`, `questions`) | Added (empty exports) | `packages/contracts/src/contracts.test.ts` imports each stub and asserts no runtime error |

---

## Migrations

### PR P1-c: Prisma baseline migration

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| `baseline` (generated by `prisma migrate dev --name baseline`) | All 10 existing tables (User, Project, PRD, ADR, CreditBalance, CreditTransaction, CreditPurchase, Session, VerificationToken, ADRRevision — exact names from `schema.prisma`) | Yes — the schema content is unchanged; this only commits the migration history that was previously absent (retro finding #28). Running `prisma migrate deploy` against an existing production DB is safe because Prisma detects the schema is already applied and marks the baseline as applied. |

> **Pre-existing DB caution:** The baseline migration must be applied with `prisma migrate resolve --applied baseline` on any pre-existing database that was created with `prisma db push` rather than `prisma migrate`. This is documented in `packages/db/README.md` (to be created).

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/result/src/result.test.ts` | unit | `ok(value).isOk() === true`; `err(e).isErr() === true`; `ok(1).map(x => x + 1)` returns `ok(2)`; `combine([ok(1), ok(2)])` returns `ok([1,2])`; `combine([ok(1), err('e')])` returns `err('e')`; no `as any` needed for typed `Result<number, string>` |
| `packages/contracts/src/contracts.test.ts` | unit | One `safeParse` round-trip per existing context (auth: valid + invalid input; credits: valid + invalid; project: valid + invalid; prd: valid; adr: valid); stub contexts import without throwing |
| `apps/web/src/**/*.test.ts` (existing 9 files) | unit | All 9 must pass after each PR — no regressions; import renames must not break test setup |
| `packages/db` | — (no unit test for generated client) | Prisma client generates without error; verified by `pnpm --filter=@repo/db build` exit 0 |
| `packages/auth` | — (no unit test for NextAuth options in this phase) | Type augmentation verified by `pnpm --filter=@repo/auth typecheck` exit 0; `session.user.id: string` resolves without cast |

**Concurrent test mandate:** Not applicable — this Plan does not touch credit ledger, payments, or any concurrency-sensitive code.

---

## Dependencies Added

**PR P1-a:**

- `neverthrow@^8.0.0` — runtime dep in `packages/result/package.json`. Replaces the locally-defined variance-unsafe `Result<T,E>`. Pinned to `^8` (latest stable as of plan date); `syncpack` will enforce this version across the workspace if any other package later depends on it.

**PR P1-b:**

- No new dependencies. `zod` is already in `apps/web/package.json`; it moves to `packages/contracts/package.json` as a direct dep. `apps/web` retains `zod` as a peer or drops it once all Zod imports route through `@repo/contracts`.

**PR P1-c:**

- `prisma@^6.7.0` — devDep in `packages/db/package.json` (CLI for generate/migrate). Version matches the existing `apps/web` devDep — `syncpack` enforces no drift.
- `@prisma/client@^6.7.0` moves from `apps/web` direct dep to `packages/db` direct dep. `apps/web` drops it from direct deps and receives it transitively.

**PR P1-d:**

- `dependency-cruiser@^16.0.0` — root devDep. Added to root `package.json` devDependencies. Runs in CI via `pr-quality.yml` new step (retro P1.7, finding #6).
- `@types/bcryptjs@^2.4.6` — devDep in `packages/auth/package.json`. Moves from `apps/web` (if present) to `packages/auth`.

---

## Rollback

- **PR P1-a:** Revert the PR. The `result.ts` file is restored in git history; `neverthrow` is removed from the workspace; import paths in `apps/web/src/**` revert to the old form. The `as any` casts return. No schema migration, no data change.
- **PR P1-b:** Revert the PR. Contract files are restored in `apps/web/src/contracts/`. No schema migration, no data change.
- **PR P1-c:** Revert the PR. `schema.prisma` is restored in `apps/web/prisma/`. The Prisma baseline migration has no data effect (it records schema history only); reverting the package does not require a compensating migration. The `packages/db/prisma/migrations/` directory is removed by the revert. Any DB that had the baseline applied via `prisma migrate resolve` must be manually un-marked — acceptable since production was not yet running against this layout.
- **PR P1-d:** Revert the PR. `lib/auth-options.ts` is restored in `apps/web/`. The `dependency-cruiser` config and `syncpack` CI step are removed.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `neverthrow` type signatures differ subtly from the local `Result<T,E>` causing unexpected type errors in use-cases | Medium | Build failure | Run `tsc --noEmit` in `apps/web` immediately after switching imports; fix per-callsite; the `as any` removal is intentional and any new compile error reveals a real type mismatch that was hidden before |
| `apps/web/src/contracts/**` files have sub-module imports (e.g. `schemas.ts`, `types.ts` separate) that don't map cleanly to a single `index.ts` | Low | Import path mismatch in 1–3 call sites | Inspect actual contracts directory during P1-b implementation; preserve file structure if needed; the `exports` field supports sub-path exports |
| Prisma `postinstall` runs in all packages during `pnpm install`, but `packages/db/prisma/schema.prisma` doesn't exist yet on first install | Low | Install failure on a fresh clone before Phase 1 merges | `postinstall` references an explicit `--schema` path; on a clone where Phase 1 is not yet on disk, `postinstall` is irrelevant. Risk only applies post-merge |
| `prisma migrate dev --name baseline` on a non-empty DB marks the baseline as a new migration, confusing the DB state | Medium | Migration drift on dev DB | Use `prisma migrate resolve --applied baseline` on any pre-existing dev DB; documented in `packages/db/README.md` |
| `dependency-cruiser` flags more violations than the known-violations baseline captures, causing CI to fail immediately | Medium | CI red on merge | Run `dependency-cruiser --output-type err-long` before committing the config; capture all current violations in the baseline `--ignore-path`; only newly-introduced violations fail CI |
| `@repo/auth` depending on `@repo/db` creates a circular chain if `apps/web` later has an infrastructure import from `auth` that flows back through `db` | Low | Architectural drift | `dependency-cruiser` config will detect this; it is not a risk at this extraction step since no circular dep is introduced |
| `bcryptjs` is used in `packages/auth` but Next.js middleware (edge runtime) cannot run it | Low | Edge-runtime crash if auth is called from middleware | `authOptions` is only invoked from `app/api/auth/[...nextauth]/route.ts` (Node.js runtime); never from `middleware.ts`. No edge-runtime usage today. Out of scope for this Plan. |

---

## Out of Scope (deliberate)

- Migrating Prisma → Drizzle (`@repo/db` still uses Prisma; Phase 2 scope)
- Migrating NextAuth → better-auth (`@repo/auth` still wraps NextAuth; Phase 3 scope)
- Moving `components/` into `packages/ui` (Phase 2 — separate slice)
- Creating `packages/sdk-stripe` or `packages/sdk-ai` vendor wrappers (Phase 2 — separate slices)
- Fixing all 117 `as any` casts — only the ones in `@repo/result` use-case callsites are removed; `app/` route casts and `lib/` casts are deferred
- `lib/credits.ts`, `lib/ai-service.ts`, `lib/config.ts` — remain in `apps/web/lib/` in this phase; removal is Phase 2
- `packages/domain`, `packages/application`, `packages/persistence` — separate migration slice (Phase 2+)
- Fixing raw `prisma.*` calls inside `app/api/` business-logic routes — the import rename fixes the `lib/prisma` source only; the structural violation (raw Prisma in routes) is a Phase 2 fix
- Route-handler refactoring (thin adapter pattern) — Phase 3
- Storybook, Playwright, MSW — Phase 4
- `dependency-cruiser` eliminating known violations — known violations are frozen in baseline; elimination is a separate technical-debt slice

---

## PR Stack Shape

All four PRs are declared as **pure migration steps** (retro phases P1.4, P1.5, P1.6, P1.7, P1.8) per `79-pr-sizing.mdc §3`. File counts exceed the 15-file standard limit due to workspace-wide import renames, which is the defining characteristic of a pure package extraction.

```
main
└── cursor/turborepo-phase1a-result-8fb2        (PR #1 — @repo/result + EventBus deletion)
    └── cursor/turborepo-phase1b-contracts-8fb2 (PR #2 — @repo/contracts + stub contexts)
        └── cursor/turborepo-phase1c-db-8fb2    (PR #3 — @repo/db + prisma baseline)
            └── cursor/turborepo-phase1d-auth-8fb2 (PR #4 — @repo/auth + syncpack + dep-cruiser)
```

| PR | New pkg files | Modified `apps/web` files | Exemption |
|----|:------------:|:------------------------:|-----------|
| P1-a | ~5 | ~30 (import renames across `src/`) | pure migration step P1.4, P1.8 |
| P1-b | ~15 | ~30 (import renames across `src/` + `app/`) | pure migration step P2.1 (extraction portion) |
| P1-c | ~6 | ~15 (import renames in persistence + routes + scripts) | pure migration step P1.6, P2.6 |
| P1-d | ~6 | ~5 (auth-options import + session casts) + 3 root config files | pure migration step P1.5, P1.7 |

**Turbo affected-build benefit:** Because each PR only changes files within one package's boundary plus `apps/web` import sites, `turbo run --affected` in CI will build and test only the changed package + `apps/web`, not the full workspace. This keeps CI times sub-linear.

---

## Verification Gates (per PR)

### After P1-a (`@repo/result`)

```bash
pnpm install                                                      # installs neverthrow
pnpm --filter=@repo/result typecheck                              # strict: true compile
pnpm --filter=@repo/result test                                   # result.test.ts passes
pnpm --filter=apps/web typecheck                                  # apps/web still compiles
pnpm --filter=apps/web test                                       # existing 9 tests still pass
# Manual: grep -r "as any" apps/web/src/application/ → 0 results
# Manual: grep -r "from '@/src/shared/result" apps/web/src/ → 0 results
```

### After P1-b (`@repo/contracts`)

```bash
pnpm --filter=@repo/contracts typecheck
pnpm --filter=@repo/contracts test                                # contracts.test.ts passes
pnpm --filter=apps/web typecheck
pnpm --filter=apps/web test                                       # existing 9 tests still pass
# Manual: grep -r "from '@/src/contracts" apps/web/ → 0 results
```

### After P1-c (`@repo/db`)

```bash
pnpm install                                                      # triggers @repo/db postinstall → prisma generate
pnpm --filter=@repo/db build                                      # prisma generate + tsc
pnpm --filter=apps/web typecheck
pnpm --filter=apps/web test
prisma migrate status --schema=packages/db/prisma/schema.prisma   # no pending migrations
# Manual: grep -r "from '@/lib/prisma'" apps/web/ → 0 results
# Manual: grep -r "from '@prisma/client'" apps/web/src/ → 0 results (all via @repo/db)
```

### After P1-d (`@repo/auth`)

```bash
pnpm --filter=@repo/auth typecheck
pnpm --filter=apps/web typecheck
pnpm --filter=apps/web test
pnpm syncpack lint                                                 # exits 0 — no drift
pnpm dependency-cruiser --validate .dependency-cruiser.js \
  apps/web/src packages/result/src packages/contracts/src \
  packages/db/src packages/auth/src                               # exits 0 vs baseline
# Manual: grep -r "from '@/lib/auth-options'" apps/web/ → 0 results
# Manual: grep -r "(session.user as any)" apps/web/ → 0 results
# Full workspace build:
pnpm -w turbo run build typecheck lint test                        # all green
```

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS / REVISE / BLOCK | (to be filled before approval) |
| scope-critic | PASS / REVISE / BLOCK | (to be filled before approval) |

---

## Approval

- [ ] User reviewed and approved this Plan
- [ ] Patch Intent Summary will be produced before any code edit in each PR
- [ ] Verification gates (typecheck / lint / test / build) defined per PR in §Verification Gates above

**Approval status:** pending
**Approval date:** —

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial draft from `docs/product/scope-slices/turborepo-migration--phase-1-package-extraction.md`, `docs/retro/zedos-monorepo-retro.md` §6 P1.1–P1.8, and `docs/execution/plans/turborepo-migration--phase-0-scaffold.plan.md` | Cloud Agent |
