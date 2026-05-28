<!--
  Implementation Plan — Turborepo Migration Phase 0: Root Scaffold
  Parent Scope Slice: docs/product/scope-slices/turborepo-migration--phase-0-scaffold.md
  Authored per: .cursor/templates/execution/implementation-plan.template.md
  Governed by: .cursor/rules/70-execution-bridge.mdc, 71-monorepo-context.mdc, 72-hexagonal-boundaries.mdc
  PR exemption: Pure migration step — references retro phases P0.1–P0.6 per .cursor/rules/79-pr-sizing.mdc §3
-->

# Implementation Plan: Turborepo Migration — Phase 0: Root Scaffold

## Parent User Story

> **Note:** This Plan is written at the Scope Slice level for the migration track, which bypasses the standard User Story intermediary per user instruction. The parent Scope Slice is the authoritative scope document.
>
> Scope Slice: [docs/product/scope-slices/turborepo-migration--phase-0-scaffold.md](../../../docs/product/scope-slices/turborepo-migration--phase-0-scaffold.md)

## Status

`approved`

> **Layout in effect:** pre-migration → post-migration (this Plan performs the migration)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

This Plan converts the single-app layout at `zedos/nextjs_space/` into the target monorepo skeleton with `apps/web/` + three shared config packages. The migration follows retro phases P0.1–P0.6 (`docs/retro/zedos-monorepo-retro.md` §6) sequentially within a single PR stack (two PRs: P0-a for workspace init + move, P0-b for CI and cleanup — both declared as pure migration steps per `79-pr-sizing.mdc` §3).

**PR P0-a (workspace init + move):** Creates root `package.json`, `pnpm-workspace.yaml`, `turbo.jsonc`, `.changeset/config.json`, `.npmrc`, `syncpack.config.js`; creates `packages/tsconfig/`, `packages/eslint-config/`, `packages/vitestconfig/`; moves `zedos/nextjs_space/` → `apps/web/` with all internal file updates (tsconfig, eslint, vitest, next.config.js, prisma schema `output` fix); commits `pnpm-lock.yaml`.

**PR P0-b (CI + secrets hygiene):** Adds `.github/workflows/pr-quality.yml`; creates `apps/web/.env.example`; deletes `.yarnrc.yml`, `tsconfig.tsbuildinfo`, `.abacus.donotdelete`, `zedos/.project_instructions.md`, Abacus `binaryTargets`; updates root `.gitignore`. Base: PR P0-a.

Neither PR modifies application logic, component behavior, API routes, or Prisma schema contents. The `infrastructure` and `application` layers are not touched. Layer boundaries per `72-hexagonal-boundaries.mdc` are not crossed — this Plan writes only configuration and workspace files plus the mechanical file relocation. The `75-drizzle.mdc` and `76-better-auth.mdc` rules are not in scope (those are Phases 2–3).

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Prisma (unchanged — Drizzle migration is Phase 2) |
| Auth source-of-truth | NextAuth (unchanged — better-auth migration is Phase 3) |
| Async/sync boundary | Synchronous per request — no async boundary changes in this Plan |
| Transaction boundary | Unchanged — no use-case or persistence changes |
| External dependencies | pnpm, Turborepo, Changesets, syncpack — workspace tooling only; no runtime vendor SDKs added |
| Payment shape | n/a — no Stripe or payment logic touched |

### Surface Blockers

- None. All tooling decisions locked in `docs/state/HANDOFF.md` §6.

---

## Layers Affected

- [ ] `domain` — none
- [ ] `application` — none
- [ ] `contracts` — none
- [ ] `infrastructure` — partial: `apps/web/prisma/schema.prisma` has `output` directive removed (no schema logic change)
- [ ] `app` (routes, server actions, server components) — none
- [ ] `ui` — none
- [x] `shared` — none (no shared runtime code changes; only tooling config packages created)

> **Note:** The hexagonal layers listed above are those of `apps/web/`. The new `packages/tsconfig/`, `packages/eslint-config/`, `packages/vitestconfig/` do not belong to the hexagonal layer model — they are workspace configuration packages, not application packages.

---

## Touched Files (exact paths)

**PR P0-a: Workspace init + move**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `package.json` (root) | Create | Workspace root manifest; `name: "zedos-workspace"`, `private: true`, `packageManager: "pnpm@<version>"`, turbo pipeline scripts |
| `pnpm-workspace.yaml` | Create | Lists `apps/*` and `packages/*`; retro P0.2 |
| `turbo.jsonc` | Create | `build`, `dev`, `lint`, `typecheck`, `test`, `test:watch`, `clean` pipelines; retro P0.2 |
| `.changeset/config.json` | Create | Changesets CLI config; retro P0.2 |
| `.npmrc` | Create | `auto-install-peers=true`, `strict-peer-dependencies=false`; retro P0.2 |
| `syncpack.config.js` | Create | Semver range policy; retro P0.2 |
| `packages/tsconfig/package.json` | Create | `@repo/tsconfig` package manifest |
| `packages/tsconfig/base.json` | Create | `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `target: ES2022`, `moduleResolution: bundler`, `allowJs: false` |
| `packages/tsconfig/nextjs.json` | Create | Extends `base.json`; adds Next.js-specific compiler options |
| `packages/tsconfig/node.json` | Create | Extends `base.json`; `module: NodeNext` |
| `packages/tsconfig/test.json` | Create | Extends `base.json`; adds `types: ["vitest/globals"]` |
| `packages/eslint-config/package.json` | Create | `@repo/eslint-config` package manifest |
| `packages/eslint-config/base.cjs` | Create | ESLint base rules; TypeScript parser |
| `packages/eslint-config/next.cjs` | Create | Extends base + `next/core-web-vitals` |
| `packages/eslint-config/boundaries.cjs` | Create | `eslint-plugin-boundaries` rules mirroring existing `apps/web/.eslintrc.json` zones |
| `packages/vitestconfig/package.json` | Create | `@repo/vitestconfig` package manifest |
| `packages/vitestconfig/base.ts` | Create | Shared vitest config (coverage, aliases, globals) |
| `apps/web/` | Create (directory — moved from `zedos/nextjs_space/`) | Retro P0.3 — entire source tree relocated |
| `apps/web/package.json` | Modify | Rename `app` → `@repo/web`; add workspace deps on `@repo/tsconfig`, `@repo/eslint-config`, `@repo/vitestconfig` |
| `apps/web/tsconfig.json` | Modify | Extend `@repo/tsconfig/nextjs.json`; remove duplicated options now in base |
| `apps/web/vitest.config.ts` | Modify | Extend `@repo/vitestconfig/base`; remove duplication |
| `apps/web/.eslintrc.json` | Modify | Extend `@repo/eslint-config/next` and `@repo/eslint-config/boundaries`; remove inline rules covered by shared config |
| `apps/web/next.config.js` | Modify | Remove `eslint: { ignoreDuringBuilds: true }` — retro P0.5 + retro finding #7 |
| `apps/web/prisma/schema.prisma` | Modify | Remove `output = "/home/ubuntu/…"` directive; remove Abacus `binaryTargets` line — retro P0.4 |
| `apps/web/.yarnrc.yml` | Delete | Abacus-container-specific; retro P0.5 |
| `apps/web/tsconfig.tsbuildinfo` | Delete | Build artifact; retro P0.5 |
| `zedos/.abacus.donotdelete` | Delete | Abacus runtime marker |
| `zedos/.project_instructions.md` | Delete | Abacus handoff doc (content preserved in `docs/retro/zedos-monorepo-retro.md`) |
| `pnpm-lock.yaml` (root) | Create | Generated by `pnpm install`; committed |

**PR P0-b: CI + secrets hygiene (base = PR P0-a)**

| Path | Operation | Rationale |
|------|-----------|-----------|
| `.github/workflows/pr-quality.yml` | Create | CI pipeline: pnpm install → turbo lint typecheck test build --affected; Node.js version pinned; pnpm store cache — retro P0.6 |
| `.gitignore` (root) | Create/Modify | Adds `.env*` (except `.env.example`), `.next/`, `.turbo/`, `dist/`, `coverage/`, `*.tsbuildinfo`, `node_modules/`, `.pnpm-store` — retro P0.5, finding #11 |
| `apps/web/.env.example` | Create | Documents all required env vars without real values: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ABACUSAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STARTER_PRICE_ID`, `STARTER_CREDITS`, `CREDIT_BURN_CLARIFY`, `CREDIT_BURN_GENERATE_PRD` |
| `apps/web/.env` | Verify absent / confirm not tracked | Pre-push check: must not contain real secrets; hook `pre-commit.sh` must pass |

---

## Contracts Changed

None — no Zod schemas are added, modified, or removed by this Plan.

---

## Migrations

None — no schema changes. Prisma `output` directive removal is a config change, not a schema change.

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `apps/web/src/**/*.test.ts` (existing 9 files) | unit | All 9 existing tests must pass after the move and config changes — no new behavior, verify nothing regressed |
| `packages/tsconfig/` (no test file needed) | — | Consumed via `extends` — compile errors would surface in `apps/web/` typecheck |
| `packages/vitestconfig/base.ts` | integration (implicit) | Verified by running `pnpm -w vitest run` from root after workspace setup |

**Concurrent test mandate:** Not applicable — this Plan does not touch credit ledger, payments, or any concurrency-sensitive code.

---

## Dependencies Added

**PR P0-a (root `package.json` devDependencies):**
- `turbo` — task runner; workspace root devDep; required for `pnpm build/lint/test` pipelines
- `@changesets/cli` — versioning and changelogs
- `syncpack` — workspace dep version harmony

**`packages/tsconfig/package.json`:** no runtime dependencies

**`packages/eslint-config/package.json` devDependencies (re-used from `apps/web/.eslintrc.json` existing deps):**
- `eslint` (peer)
- `@typescript-eslint/eslint-plugin` (peer)
- `@typescript-eslint/parser` (peer)
- `eslint-plugin-boundaries` (peer — already in `apps/web/package.json`)
- `eslint-config-next` (peer — already in `apps/web/package.json`)

**`packages/vitestconfig/package.json` devDependencies (re-used):**
- `vitest` (peer)
- `@vitest/coverage-v8` (peer)

**PR P0-b (`.github/workflows/pr-quality.yml`):**
- No new npm packages; GitHub Actions built-in `actions/checkout`, `actions/setup-node`, `pnpm/action-setup` are free

---

## Rollback

- **PR P0-a** is a pure file relocation + config creation. Rollback: revert the PR; `zedos/nextjs_space/` is restored as git tracks the move.
- **PR P0-b** is additive files only (`.gitignore`, `.env.example`, `.github/`). Rollback: revert the PR.
- Neither PR has a schema migration or side-effecting data change. No compensating migration needed.
- The Prisma `output` directive removal is trivially reversible (re-add the line).

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `pnpm install` fails because of workspace resolution issues with existing `apps/web/package.json` | Medium | Blocks PR P0-a from merging | Test `pnpm install --frozen-lockfile` in CI before declaring gate passed |
| Prisma `generate` fails after `output` removal (wrong default path in some CI containers) | Low | Blocks `apps/web/` build | Use `prisma generate --schema=apps/web/prisma/schema.prisma` explicitly in build script or `postinstall` |
| ESLint boundaries plugin config mismatch between old inline config and new `@repo/eslint-config/boundaries.cjs` | Low | Lint regressions or false positives | Copy boundary zones verbatim from `apps/web/.eslintrc.json` into `boundaries.cjs`; do not rearrange zones |
| `.env` file with real secrets exists on disk and `pnpm install` accidentally stages it | Low | Secret leak | `pre-commit.sh` hook must check for `.env` containing real values before any `git add`; hook is already wired per `hooks.json` |
| `tsconfig.tsbuildinfo` deletion causes `incremental` flag to error | Low | Build error | Set `incremental: false` in `apps/web/tsconfig.json` until a CI tsbuildinfo cache strategy is in place (retro finding LOW-#11) |
| turbo caches stale build artifacts in CI | Low | Flaky tests | Cache key on `pnpm-lock.yaml` hash; `turbo --force` as fallback |

---

## Out of Scope (deliberate)

- Extracting `@repo/contracts`, `@repo/result`, `@repo/db`, `@repo/auth` — Phase 1
- Migrating Prisma → Drizzle — Phase 2
- Migrating NextAuth → better-auth — Phase 3
- `dependency-cruiser` integration — Phase 1
- Fixing `as any` casts — separate technical-debt slice
- `packages/ui` extraction — separate slice
- `packages/sdk-stripe`, `packages/sdk-ai` vendor wrappers — separate slices
- Playwright, Storybook, MSW — Phase 4
- Docker / deployment infra — Phase 4

---

## PR Stack Shape

This Plan splits into two stacked PRs to stay within `79-pr-sizing.mdc` §2 limits. Both are declared as **pure migration steps** (retro phases P0.1–P0.6) per `79-pr-sizing.mdc` §3.

```
main
└── cursor/turborepo-phase0a-workspace-init      (PR #1 — workspace root + move + config packages)
    └── cursor/turborepo-phase0b-ci-secrets      (PR #2 — CI workflow + secrets hygiene)
```

| PR | Files | Lines est. | Layers | Exemption |
|----|------:|------------|--------|-----------|
| P0-a | ~25 | ~350 (mostly new JSON/JSONC/yaml/ts config) | 0 (config only) | pure migration step P0.1–P0.3 |
| P0-b | ~4 | ~120 | 0 (CI + dotfiles only) | pure migration step P0.4–P0.6 |

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS / REVISE / BLOCK | (to be filled before approval) |
| scope-critic | PASS / REVISE / BLOCK | (to be filled before approval) |

---

## Approval

- [x] User reviewed and approved this Plan
- [ ] Patch Intent Summary will be produced before any code edit
- [ ] Verification steps (typecheck / lint / test / build) defined in §Tests above

**Approval status:** approved
**Approval date:** 2026-05-28

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial draft from `docs/retro/zedos-monorepo-retro.md` §6 P0.1–P0.6 and `docs/product/scope-slices/turborepo-migration--phase-0-scaffold.md` | Cloud Agent |
| 2026-05-28 | Decision recorded: approved | Product + Engineering lead |
