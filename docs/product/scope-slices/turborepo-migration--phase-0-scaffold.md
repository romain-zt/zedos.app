<!--
  Scope Slice — Turborepo Migration Phase 0: Root Scaffold
  Parent Feature Area: turborepo-migration
  Governed by: .cursor/rules/feature-area-workflow.mdc
-->

# Scope Slice: Turborepo Migration — Phase 0: Root Scaffold

## Parent Feature Area

[Turborepo migration](../feature-areas/turborepo-migration.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

An engineer can run `pnpm install && pnpm dev` from the repository root against `apps/web/` and get a working local dev server — with ESLint, TypeScript, and tests all enforced in CI — replacing the Abacus-container-specific single-app layout that currently prevents safe feature development.

---

## Exact Boundary

### Included Behavior

- Root `package.json` created with `"name": "zedos-workspace"`, `"private": true`, `"packageManager": "pnpm@<pinned>"`, and workspace `scripts` delegating to turbo pipelines (`dev`, `build`, `lint`, `typecheck`, `test`, `test:watch`, `clean`)
- `pnpm-workspace.yaml` created listing `apps/*` and `packages/*`
- `turbo.jsonc` created at root with pipelines: `build` (outputs `dist/**, .next/**`), `dev` (persistent), `lint`, `typecheck`, `test` (outputs `coverage/**`), `test:watch` (persistent), `clean` (no cache)
- `.changeset/config.json` created with `changelog: "@changesets/cli/changelog"`, `commit: false`, `access: "restricted"`, `baseBranch: "main"`
- `.npmrc` created with `auto-install-peers=true` and `strict-peer-dependencies=false`
- `syncpack.config.js` created (semver ranges + version policies for shared deps across workspace)
- `packages/tsconfig/` created with `base.json` (`strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, target `ES2022`, `moduleResolution: bundler`), `nextjs.json`, `node.json`, `test.json`; `packages/tsconfig/package.json` with `"name": "@repo/tsconfig"`
- `packages/eslint-config/` created with `base.cjs`, `next.cjs`, `boundaries.cjs`; `packages/eslint-config/package.json` with `"name": "@repo/eslint-config"`
- `packages/vitestconfig/` created with `base.ts` (shared vitest preset, aliases, coverage config); `packages/vitestconfig/package.json` with `"name": "@repo/vitestconfig"`
- `zedos/nextjs_space/` moved to `apps/web/` — entire directory tree relocated; `apps/web/package.json` updated: `"name": "@repo/web"`, `tsconfig.json` extended from `@repo/tsconfig/nextjs.json`, `vitest.config.ts` extended from `@repo/vitestconfig`
- `apps/web/.eslintrc.json` updated to extend `@repo/eslint-config/next` and `@repo/eslint-config/boundaries`
- `apps/web/next.config.js` patched: `eslint.ignoreDuringBuilds` removed (deleted or set to `false`), TypeScript `ignoreBuildErrors` not set
- `apps/web/prisma/schema.prisma` patched: `output` directive removed, Abacus `binaryTargets` line removed
- `.yarnrc.yml` deleted from `apps/web/` (was Abacus-container-specific)
- `apps/web/tsconfig.tsbuildinfo` deleted; `*.tsbuildinfo` added to root `.gitignore`
- Root `.gitignore` created or updated: covers `.env*` (except `.env.example`), `.next/`, `.turbo/`, `dist/`, `coverage/`, `*.tsbuildinfo`, `node_modules/`, `.pnpm-store`
- `apps/web/.env.example` created documenting all required env vars without real values (replaces the leaked `.env`)
- `.github/workflows/pr-quality.yml` created: trigger `pull_request` on `main`; steps: `pnpm install --frozen-lockfile`, `pnpm -w turbo run lint typecheck test build --affected`; Node.js version pinned; pnpm store cached
- `zedos/.abacus.donotdelete` and `zedos/.project_instructions.md` deleted (Abacus runtime artifacts no longer needed)
- `zedos/` wrapper folder removed after its contents are relocated

### Excluded Behavior

- Extracting any code into `packages/` (no `@repo/contracts`, `@repo/result`, `@repo/db`, `@repo/auth` — those are Phase 1)
- Migrating Prisma → Drizzle (Phase 2)
- Migrating NextAuth → better-auth (Phase 3)
- Changing any application logic, component behavior, or API route behavior
- Fixing the 117 `as any` casts — separate technical-debt slice
- ESLint `no-explicit-any` rule enforcement — separate slice
- Adding Playwright e2e, MSW, Storybook, or Docker — Phase 4
- Changing Prisma schema contents (only the `output` directive and `binaryTargets` are patched)
- Rotating the leaked secrets (user-owned, Phase 0 pre-requisite; this slice only creates `.env.example` and adds `.env*` to `.gitignore`)
- `dependency-cruiser` integration — Phase 1

---

## UX States

This slice has no end-user UX. The observable states are engineering-facing:

| State | When | What the engineer sees / experiences |
|-------|------|---------------------------------------|
| Workspace ready | After `pnpm install` succeeds | `node_modules/.pnpm/` populated; lockfile committed; no Yarn-related errors |
| Dev server running | After `pnpm dev` at root | `apps/web` Next.js dev server starts on port 3000; no `output` path error from Prisma |
| Lint passing | After `pnpm lint` | ESLint runs against `apps/web/` with boundaries plugin; zero ignored build errors |
| Typecheck passing | After `pnpm typecheck` | `tsc --noEmit` passes for `apps/web/`; `strict: true` enabled but not yet enforced in `packages/` (Phase 1) |
| Tests passing | After `pnpm test` | Existing 9 unit tests pass under the new vitest config |
| Build passing | After `pnpm build` | `apps/web` Next.js production build succeeds; no missing env vars (`.env.example` documents them) |
| CI green | After PR targeting `main` | `pr-quality.yml` runs all five steps; all green |
| Secrets safe | After commit | No `.env` file in git tree; `.env.example` present; git log contains no leaked values |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Workspace configuration files | Created | `pnpm-workspace.yaml`, `turbo.jsonc`, `.changeset/config.json`, `.npmrc`, `syncpack.config.js` |
| Root `package.json` | Created | Workspace root manifest; not the app's `package.json` |
| `@repo/tsconfig` package | Created | `packages/tsconfig/` with 4 tsconfig variants |
| `@repo/eslint-config` package | Created | `packages/eslint-config/` with 3 config files |
| `@repo/vitestconfig` package | Created | `packages/vitestconfig/` with shared test preset |
| `apps/web/package.json` | Modified | Renamed from `app` to `@repo/web`; tsconfig + vitest extended from shared packages |
| `apps/web/next.config.js` | Modified | `eslint.ignoreDuringBuilds` removed |
| `apps/web/prisma/schema.prisma` | Modified | `output` directive removed; `binaryTargets` removed |
| `.gitignore` (root) | Created/Updated | Adds `.env*`, `.next/`, `.turbo/`, `*.tsbuildinfo` etc. |
| `apps/web/.env.example` | Created | Documents required env vars; no real values |
| `.github/workflows/pr-quality.yml` | Created | CI pipeline |
| `apps/web/tsconfig.json` | Modified | Extended from `@repo/tsconfig/nextjs.json` |
| `apps/web/vitest.config.ts` | Modified | Extended from `@repo/vitestconfig` |

---

## Credit / Payment Impact

None — no credit or payment interaction in this slice. No application logic is changed.

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
| Secret rotation (HANDOFF §5) | External (user action) | in-progress | Leaked secrets must be rotated before execution. This slice creates `.env.example` and `.gitignore` entries — it does NOT push `.env` to git. |
| Phase 2b PIS approval + merge | Governance | pending | Execution ordering: Phase 2b merges first. Planning this slice is independent. |
| pnpm available locally and in CI | Tooling | ready | Standard; version pinned via `packageManager` field |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| None — all tooling decisions locked | — | false |

---

## Acceptance-Level Outcome

A developer can clone the repository, run `pnpm install` from root, then `pnpm dev` — and `apps/web` starts without error. Running `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` from root all pass. A pull request targeting `main` triggers `.github/workflows/pr-quality.yml` and goes green. No `.env` file containing real secrets exists anywhere in the git tree. The `apps/web/` directory contains the full source previously at `zedos/nextjs_space/`, and the `zedos/` wrapper folder no longer exists. ESLint boundaries run during `pnpm lint` and do not have `ignoreDuringBuilds: true` suppressing them.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated (engineering-facing states fully described)
- [x] Business objects named
- [x] Credit / payment impact assessed (none)
- [x] Sharing / privacy surface assessed (none)
- [x] Feedback / instrumentation impact assessed (none)
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set (none)
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial scaffold from `docs/retro/zedos-monorepo-retro.md` §6 Phase 0 steps P0.1–P0.6 | Cloud Agent |
