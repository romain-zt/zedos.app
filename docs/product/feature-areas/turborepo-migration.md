<!--
  Feature Area — Turborepo migration (Phase 3)
  Scaffolded manually from approved migration plan: docs/retro/zedos-monorepo-retro.md §6
  Governed by: .cursor/rules/feature-area-workflow.mdc
-->

# Feature Area: Turborepo migration

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/retro/zedos-monorepo-retro.md` §6 (Migration plan to top-1% Turborepo — the authoritative source for every step in this area)
- `docs/state/HANDOFF.md` §6 (Locked decisions table)
- Related open questions: none — all tooling decisions locked
- Related product decisions: none (locked via HANDOFF.md §6, not a product-level decision)

---

## Product Intent

The codebase lives today as a single unstructured Next.js app that makes it unsafe to ship any new product feature area: secrets are exposed, ESLint never runs in CI, there is no lockfile, and the hexagonal architecture rules are honored only in documentation. Moving to a pnpm + Turborepo + Changesets workspace with properly separated packages (`@repo/contracts`, `@repo/result`, `@repo/db`, `@repo/auth`) and replacing the Abacus-container-specific Prisma + NextAuth setup with Drizzle + better-auth means that every subsequent feature area can be built, tested, and merged in a governed, reproducible environment — on a codebase that actually enforces its own rules.

This area has no direct end-user UI change. Its output is an engineering foundation that unblocks every other Feature Area in the product roadmap (`FA-account-session` → `FA-dashboard-shell` → etc.).

---

## In Scope

- Root workspace skeleton: `pnpm-workspace.yaml`, `turbo.jsonc`, `.changeset/config.json`, `.npmrc`, root `package.json` with pinned `packageManager` field, `syncpack.config.js`
- Shared config packages: `@repo/tsconfig` (strict base), `@repo/eslint-config`, `@repo/vitestconfig`
- Moving source from `zedos/nextjs_space/` → `apps/web/`
- Extracting four packages: `@repo/contracts` (Zod schemas), `@repo/result` (neverthrow-based `Result<T,E>`), `@repo/db` (Drizzle schema + client + migrations), `@repo/auth` (better-auth server + client + guards)
- Prisma → Drizzle migration: schema conversion, migration baseline, repository adapter rewrites
- NextAuth → better-auth migration: replacing `lib/auth-options.ts` with `packages/auth/` package, re-typing session, removing `as any` on `session.user.id`
- CI baseline: `.github/workflows/pr-quality.yml` (pnpm install → lint → typecheck → test → build, with `--affected` via turbo)
- Secrets hygiene: removing the Abacus-container `output` directive from Prisma schema, deleting `.yarnrc.yml` and `tsconfig.tsbuildinfo`, adding `.env.example`, verifying `.gitignore` covers `.env`, `.next/`, `.turbo/`, `dist/`, `coverage/`, `*.tsbuildinfo`

## Out of Scope

- Any new product-visible UI feature (no new pages, no new user journeys)
- Phase 4 Feature Areas (`FA-account-session`, `FA-dashboard-shell`, etc.) — these are unblocked by this migration but are separate Feature Areas
- Playwright e2e tests, Storybook, MSW mocks — deferred to Phase 4 per retro §6
- Datadog / OpenTelemetry tracing — deferred to Phase 4 per retro §6
- `packages/sdk-ai` vendor wrapper — the AI provider abstraction is a separate technical slice outside this migration; `apps/web` may continue to use the existing `lib/ai-service.ts` pattern until a dedicated slice lands
- `packages/sdk-stripe` vendor wrapper — similarly deferred to a dedicated slice; Phase 3 only fixes the Webhook + idempotency structural issues, not the full SDK extraction
- 117 `as any` cleanup across all files — separate technical-debt slice (locked decision in HANDOFF.md)
- ESLint `as any` rule enforcement — separate slice

---

## Business Objects Touched

| Object | Relationship |
|--------|-------------|
| Workspace configuration | Created (pnpm workspace, turbo pipeline, changeset config) |
| Shared package registry | Created (`@repo/tsconfig`, `@repo/eslint-config`, `@repo/vitestconfig`, `@repo/contracts`, `@repo/result`, `@repo/db`, `@repo/auth`) |
| Database schema | Migrated (Prisma → Drizzle — same tables, new tool) |
| Auth session | Migrated (NextAuth → better-auth — same user model, typed session) |
| CI pipeline | Created (`.github/workflows/pr-quality.yml`) |

---

## User Journeys Touched

- No end-user journey is directly changed by this migration.
- All existing journeys (signup, clarification, PRD generation, credits, sharing, feedback) continue to work after migration; they are not modified by this area.
- This area unblocks Journey 1 (onboarding), Journey 2 (project workspace), Journey 3 (clarify), Journey 6 (credits) from being built correctly in later Feature Areas.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Secret rotation (Phase 0) | in-progress (user-owned) | `DATABASE_URL`, `NEXTAUTH_SECRET`, `ABACUSAI_API_KEY` must be rotated before `apps/web/.env.example` is committed. Does NOT block planning; blocks execution of P0.1. |
| Phase 2b PIS approval (5 blockers) | pending | Phase 3 migration may be planned independently. Execution ordering: Phase 2b merges → Phase 3 executes. |
| pnpm available in CI environment | ready | Standard; `packageManager` field in root `package.json` pins the version. |

---

## Risks

- **App fails to start after move**: `zedos/nextjs_space/` → `apps/web/` changes all absolute imports and the Prisma `output` path. Gate: `pnpm dev` green before any package extraction begins.
- **Drizzle migration loses data**: converting from Prisma requires a careful schema diff and a backward-compatible baseline migration. Gate: `drizzle-kit generate` + manual diff review + `better-auth migrate` before any data migration runs in prod.
- **better-auth session incompatibility**: existing NextAuth sessions are invalidated on cutover. Acceptable for a dev environment; must be communicated for any shared staging environment.
- **CI becomes the bottleneck**: running `pnpm install` from scratch on every PR is slow. Mitigation: cache `~/.pnpm-store` and `.turbo` in CI.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| None — all tooling decisions locked | — | false |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| `turborepo-migration--phase-0-scaffold` | Root workspace skeleton: pnpm-workspace, turbo.jsonc, .changeset, .npmrc, tsconfig base, eslint-config, vitestconfig, CI workflow, secrets hygiene, move `zedos/nextjs_space/` → `apps/web/` | ready-for-user-stories |
| `turborepo-migration--phase-1-package-extraction` | Extract `@repo/contracts`, `@repo/result`, `@repo/db` (Prisma-only, pre-Drizzle), `@repo/auth` (NextAuth-wrapper, pre-better-auth); strict TypeScript per package; syncpack; dependency-cruiser | exploratory |
| `turborepo-migration--phase-2-drizzle` | Migrate Prisma → Drizzle: new `packages/database/` with Drizzle schema + migration baseline; replace Prisma repositories in `apps/web/src/infrastructure/persistence/` with Drizzle adapters | exploratory |
| `turborepo-migration--phase-3-better-auth` | Migrate NextAuth → better-auth: `packages/auth/` with better-auth server + client + Drizzle adapter + typed session; API-key plugin scaffold (off by default) for v2/v3 | exploratory |

---

## Readiness Verdict

- [x] PRD source sections read (retro §6 is the authoritative source)
- [x] Product intent stated without technical language (engineering foundation enabling all Feature Areas)
- [x] Business objects enumerated
- [x] User journeys identified (none directly changed; all unblocked)
- [x] In-scope / out-of-scope explicitly separated
- [x] No unresolved PRD open questions affecting this area (all tooling locked)
- [x] Deferred behaviors explicitly named (SDK wrappers, e2e, observability, `as any` cleanup)
- [x] Candidate Scope Slices are individually small enough

**Verdict:** READY FOR SCOPE SLICES — Phase 0 slice is ready-for-user-stories; Phases 1–3 are exploratory pending Phase 0 execution.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial scaffold from `docs/retro/zedos-monorepo-retro.md` §6 and HANDOFF.md locked decisions | Cloud Agent |
