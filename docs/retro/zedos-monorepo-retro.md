---
title: Retro — zedos/ Monorepo (Abacus AI output)
date: 2026-05-10
author: Cursor Agent (Opus 4.7)
status: analysis-only
scope: zedos/nextjs_space (Abacus-generated codebase) vs ZedOS + NextForge baseline
---

# Retro — zedos/ Monorepo (Abacus AI output)

## 1. TL;DR

`zedos/` is **not a monorepo**. It is a single Next.js app at `zedos/nextjs_space/` (`zedos/nextjs_space/package.json:2-3`) that Abacus AI partially refactored toward hexagonal layers, then stopped. The architectural intent is documented in 5 high-quality `.cursor/rules/*.md` files — but the actual code violates those rules in the routes that handle the most valuable PRD primitives (clarification, PRD generation, Stripe payments, sharing, feedback). The hexagonal `src/` tree is partly real, partly aspirational, and partly dead code; the legacy `lib/` tree is what actually runs in production for everything except project CRUD.

Compared to ZedOS (`tree.md` — true Turborepo with `apps/`, `packages/`, `services/`, `pnpm-workspace.yaml`, `turbo.jsonc`, `.changeset/`, `syncpack.config.js`, 9 in-repo rules, 12 agents, 12 commands, 11 skills) and NextForge philosophy (Fast / Cheap / Opinionated / Modern / Safe), this is roughly a **Phase 0** starting point — usable as a feature-discovery harness, **not** as a production foundation. A migration is required before the first feature area ships safely.

**Severity tally (52 findings):**

| Severity | Count | Examples |
|---|---:|---|
| **CRITICAL** | 9 | Real secrets in `.env`, no Stripe webhook, race-condition double-spend on credits, grace ceiling not enforced at deduct, ESLint disabled in build, `as any` cast on auth `apiVersion`, deduct-before-success on AI cost, no transaction across SignUp steps, hardcoded Linux-container Prisma output path |
| **HIGH** | 17 | TS `strict: false`, 117 `as any` casts, no monorepo (no `pnpm-workspace.yaml` / `turbo.jsonc`), no `src/ui/`, dual credit source-of-truth, raw Prisma in 16 routes, raw Stripe SDK in routes, raw `callAI` in routes, no DTO Zod validation on responses, `EventBus` is dead code, env access in application layer, no DI container, no rate limiting, no request IDs, no Stripe idempotency key, single Yarn lockfile pinned to Abacus container, browserslist `ie >= 11` |
| **MEDIUM** | 17 | Massive dep bloat (3 chart libs, S3+Azure, formik+RHF, yup+zod, jotai+zustand, swr+RQ), no testing of routes, no e2e, no Playwright, no Storybook, no MSW, no test fixtures, `vitest.config.ts` does not match `tsconfig.json` paths cleanly, missing `.env.example`, missing `.gitignore` review (need to confirm), no CHANGELOG / `.changeset/`, no syncpack, no release-please, no docker-compose, no `@types/uuid` properly listed in deps not devDeps despite use in src/, AI model literal `'gpt-5.4-mini'` hardcoded in `lib/ai-service.ts:22`, no LLM cost cap or token budget per user, `ABACUSAI_API_KEY` directly read in lib instead of validated config, hardcoded EUR in checkout (PRD says EU + US) |
| **LOW** | 9 | Generic README missing, no CONTRIBUTING, no editorconfig, no prettier config, mixed Yarn `.yarnrc.yml` + standard install in scripts, dead `binaryTargets` line for Linux musl, `productionBrowserSourceMaps: false` (could be true under `experimental.serverSourceMaps`), `incremental: true` with no CI cache strategy, `.next` and `tsconfig.tsbuildinfo` polluting repo (the `.tsbuildinfo` file is 289 KB — checked into git layout), STYLE_GUIDE.md duplicates rules content |

**Top 5 critical issues (ranked by user/business impact):**

1. **Real production-shaped secrets are checked into `zedos/nextjs_space/.env:1-3`** — `DATABASE_URL` (with password), `NEXTAUTH_SECRET`, and `ABACUSAI_API_KEY`. They must be rotated immediately and removed from history before this repo is shared, copied, or pushed to a remote.
2. **No Stripe webhook + deduct-before-success on AI calls** — `app/api/projects/[id]/clarify/route.ts:148` and `.../generate-prd/route.ts:142` deduct credits *before* the AI completes. There is no `app/api/stripe/webhook/route.ts`. The verify endpoint (`app/api/stripe/verify/route.ts`) is poll-on-redirect: a closed browser tab = paid customer with zero credits. Both directions of the payments + AI flow are unsafe.
3. **Credit ledger is concurrency-unsafe** — both `lib/credits.ts:86-120` and `src/infrastructure/persistence/credits-repository.ts:44-100` do `findUnique → compute → $transaction([update,create])`. There is no row lock (`SELECT … FOR UPDATE`) and no optimistic concurrency check on `creditBalance`. Two parallel AI calls can double-deduct, and the first-circuit grace flag (`graceUsed`) can be set by the loser instead of the winner.
4. **Grace-ceiling rule from PRD is not enforced at deduct** — `src/infrastructure/persistence/credits-repository.ts:59` rejects the operation if `creditBalance < amount`, which contradicts both the PRD's "first-circuit grace, overage ≤ 20" and the route-level `lib/credits.ts:checkCredits` allowance. The "src/" version of the credit domain is silently broken.
5. **ESLint disabled at build time** — `next.config.js:11-13` sets `eslint.ignoreDuringBuilds: true`, which means the `eslint-plugin-boundaries` rules that the `.cursor/rules/01-architecture-layers.md` doc treats as the cornerstone of the architecture **never run in CI / production builds**. Every architectural commitment is on the honor system.

**Recommended Phase 0** (foundation before any new feature work — see §6 for full plan):

- Rotate every secret in `.env`, replace with `.env.example`, add `.env*` to `.gitignore` (verify), document the procedure.
- Move from a single Next.js app at `zedos/nextjs_space/` into a Turborepo skeleton at the workspace root: `apps/web/`, `packages/{contracts,domain,application,shared,ui-kit,tsconfig,eslint-config}/`, `pnpm-workspace.yaml`, `turbo.jsonc`, `.changeset/`, `syncpack.config.js`, root `tsconfig.json`, root `package.json` with pinned package manager.
- Re-enable TypeScript `strict: true` in the new `packages/tsconfig/base.json`, fail builds on lint and types in CI, delete the `eslint.ignoreDuringBuilds` flag.
- Replace the legacy `lib/credits.ts` and `lib/ai-service.ts` with proper SDK-wrapper packages (`packages/sdk-stripe`, `packages/sdk-ai`) that return `Result<T,E>` and validate every response with Zod (per the existing `.cursor/rules/03-sdk-wrapping-pattern.md`).
- Add a Stripe webhook endpoint with signature verification and idempotency, move credit grants behind the webhook, decouple them from the redirect flow.
- Wrap credit deduction inside a `prisma.$transaction` with a `SELECT … FOR UPDATE` (or, more cleanly, a Drizzle migration to a transactional upsert) so the ledger is concurrency-safe.

**Path to retro doc:** `docs/retro/zedos-monorepo-retro.md` (this document).

---

## 2. What zedos/ actually is

### 2.1 Inventory (every dir + every config file)

```
zedos/
├── .abacus.donotdelete            # 144 KB binary — Abacus runtime marker
├── .cursor/rules/                 # 5 rules + index, also shipped as .pdf and .docx (!)
│   ├── 01-architecture-layers.md
│   ├── 02-result-type-rOP.md
│   ├── 03-sdk-wrapping-pattern.md
│   ├── 04-no-business-logic-in-routes.md
│   ├── 05-contracts-zod-source-of-truth.md
│   ├── index.md
│   └── .cursor-rules-manifest.json
├── .project_instructions.md       # Abacus AI handoff doc
└── nextjs_space/                  # The actual app (not a workspace)
    ├── .env                       # ⚠ REAL SECRETS in plain text
    ├── .eslintrc.json
    ├── .yarnrc.yml                # ⚠ Points to /opt/hostedapp/node/yarn/global
    ├── app/                       # Next.js App Router (routes + UI pages)
    ├── components/                # Legacy shadcn/ui + project components
    ├── components.json            # shadcn/ui — aliases UI to @/components, NOT src/ui
    ├── hooks/use-toast.ts
    ├── lib/                       # Legacy "fat" modules: ai-service, credits, prisma, …
    ├── next-env.d.ts
    ├── next.config.js             # eslint.ignoreDuringBuilds: true
    ├── package.json               # name: "app", private: true, no workspaces
    ├── postcss.config.js
    ├── prisma/schema.prisma       # output dir hardcoded to /home/ubuntu/…
    ├── public/                    # 2 images (favicon-style)
    ├── scripts/{seed.ts,safe-seed.ts,grant-credits-all-users.ts}
    ├── src/                       # Hexagonal layers (partially populated)
    │   ├── application/{auth,credits,project,prd,adr}/…
    │   ├── contracts/{auth,credits,project,prd,adr}/…
    │   ├── domain/{user,credits,project,prd,adr}/…
    │   ├── infrastructure/{persistence,mappers}/…    # ⚠ no ai/, payments/, auth/
    │   └── shared/{result,errors,observability,events,mappers}/…
    ├── STYLE_GUIDE.md             # Reasonable design-token doc
    ├── tailwind.config.ts
    ├── tsconfig.json              # ⚠ strict: false, target es2020, lib es5
    ├── tsconfig.tsbuildinfo       # ⚠ 289 KB build artifact in repo layout
    ├── types/
    └── vitest.config.ts
```

**Source counts (authored, excluding generated):**

- `src/` TypeScript: 81 files (`Glob zedos/nextjs_space/src/**/*`).
- `app/` Next.js: 42 files including 25 route handlers and 16 pages/components.
- `components/` (shadcn + custom): 61 files.
- `lib/`: 8 files (`ai-service`, `auth-options`, `config`, `credits`, `db`, `prisma`, `types`, `utils`).
- `prisma/schema.prisma`: 191 lines, 10 models.

### 2.2 Stack detected

| Concern | Choice | File |
|---|---|---|
| Framework | Next.js **14.2.28** App Router, React 18.2 | `package.json:99-103` |
| Language | TypeScript 5.2 (`strict: false`) | `package.json:37`, `tsconfig.json:12` |
| ORM | Prisma 6.7 + PostgreSQL | `package.json:31,48`, `prisma/schema.prisma:1-9` |
| Auth | NextAuth 4.24 + bcryptjs (credentials provider) | `lib/auth-options.ts:1-30` |
| Validation | Zod 3.23 | `package.json:124` |
| UI | shadcn/ui + Radix + Tailwind 3.3 | `components.json`, 22 `@radix-ui/*` deps |
| State | TanStack Query 5, Jotai 2.6, Zustand 5, SWR 2.2 (4 libs!) | `package.json:77,94,119,125` |
| Forms | React Hook Form 7.53 + Formik 2.4 (2 libs) + Yup 1.3 + Zod | `package.json:90,108,123-124` |
| Charts | chart.js 4.4, react-chartjs-2, plotly.js, recharts (3 charting libs) | `package.json:80,104,116` |
| Maps | maplibre-gl 4.7 (?!) | `package.json:98` |
| Cloud SDKs | `@aws-sdk/client-s3` and `@azure/storage-blob` (both!) | `package.json:41-43` |
| Payments | Stripe 22 SDK + `@stripe/stripe-js` 9 | `package.json:76,118` |
| LLM | Abacus AI raw HTTP `https://apps.abacus.ai/v1/chat/completions` | `lib/ai-service.ts:3` |
| Tests | Vitest 4 (unit only) | `vitest.config.ts:1-21` |
| Lint | ESLint 9 + `eslint-plugin-boundaries` v6 | `package.json:25-27` |
| Package mgr | Yarn (Berry) via `.yarnrc.yml`; **no lockfile** in tree | `.yarnrc.yml:1-9` |

**Not present** (each one is missing, not just hidden): `turbo.json[c]`, `pnpm-workspace.yaml`, `.changeset/`, `syncpack.config.js`, `release-please*`, `dependency-cruiser*`, `docker-compose.yml`, `Dockerfile`, `.editorconfig`, `.prettierrc*`, `.env.example`, `CONTRIBUTING.md`, `.github/workflows/*`, `playwright.config.ts`, `msw/`, `.storybook/`, `tsconfig.base.json`, `tsconfig.test.json`, `tsconfig.build.json`.

### 2.3 Apparent architecture

The intent (per `zedos/.project_instructions.md:7-22` and `.cursor/rules/01-architecture-layers.md`) is six hexagonal layers inside `src/`:

```
domain        → entities, VOs, ports, domain services
application   → use cases (orchestration), depends on domain + contracts + shared
contracts     → Zod schemas (single source of truth for I/O)
infrastructure → adapters: Prisma repos, wrapped vendor SDKs (Stripe, AI, Auth)
ui            → presentational React; isolated from logic
shared        → Result<T,E>, errors, logger, EventBus, mappers
```

The reality:

| Layer | Status | Evidence |
|---|---|---|
| `src/domain/` | **Real and tested** | 5 contexts (`user`, `credits`, `project`, `prd`, `adr`), 7 `*.test.ts` files |
| `src/application/` | **Real but type-unsafe** | 16 use-case files with rampant `return … as any` (see §4.4) |
| `src/contracts/` | **Real but partial** | 5 contexts; **no contracts for `payments`, `ai`, `share`, `feedback`** despite `.cursor/rules/05-contracts-zod-source-of-truth.md` listing them as required |
| `src/infrastructure/persistence/` | **Real, with bugs** | 5 Prisma repos; concurrency-unsafe credit ops |
| `src/infrastructure/{ai,payments,auth}/` | **EMPTY** | Pass E "deferred" per `.project_instructions.md:40-42` |
| `src/ui/` | **EMPTY** | UI lives in `components/` and `app/dashboard/_components/` instead — direct contradiction with `.cursor/rules/01-architecture-layers.md:157-182` |
| `src/shared/events/` | **Dead code** | `EventBus` defined (`event-bus.ts`), zero `eventBus.publish` callers, zero subscribers |
| `app/` | **Mixed obedience** | Project CRUD routes call use-cases (good); 16 of ~25 routes still call `prisma.*` and `Stripe(…)` directly (bad) |
| `lib/` | **The shadow runtime** | `lib/credits.ts`, `lib/ai-service.ts`, `lib/auth-options.ts`, `lib/config.ts`, `lib/prisma.ts` are imported from 25 places in `app/`, including `app/dashboard/projects/[id]/page.tsx` (a Server Component) |

The codebase is therefore in an **incomplete migration state**: a clean hexagonal `src/` shell sits next to a parallel legacy `lib/` runtime, and the business-critical flows (clarify, generate PRD, Stripe checkout/verify, share, feedback, dashboard server components) run through the legacy path.

---

## 3. World-class baseline (ZedOS + NextForge)

This is what zedos must aim at. References below cite `tree.md` line numbers (the workspace's snapshot of `~/Projects/ZedOS/zedOS`).

### 3.1 Monorepo orchestration

| Concern | ZedOS | Where (`tree.md`) |
|---|---|---|
| Package manager | **pnpm** workspaces with `pnpm-lock.yaml` and `pnpm-workspace.yaml` | `tree.md:26591-26592` |
| Task runner | **Turborepo** (`turbo.jsonc` at root, per-package `turbo.jsonc` overrides — e.g. `packages/api-client/turbo.jsonc` `tree.md:7665`) | `tree.md:26598` |
| Versioning / release notes | **Changesets** (`.changeset/` with **140+ pending changes** + `config.json`) | `tree.md:9-151` |
| Dep version harmony | **syncpack** (`syncpack.config.js`) | `tree.md:26596` |
| Versioned releases | **release-please** (`release-please-config.json`, `.release-please-manifest.json`) | `tree.md:26594-26595, 26585` |
| Architectural lint | **dependency-cruiser** (`.dependency-cruiser.js` + known-violations baseline) | `tree.md:26574-26575` |
| Patches | `patches/serverless.patch` | `tree.md:13458-13459` |
| Root configs | `.editorconfig`, `.prettierrc.js`, `.prettierignore`, `.eslintignore`, `.npmrc`, `.dockerignore`, `docker-compose.yml`, `zedOS.code-workspace`, `vitest.config.mts`, `.ts.eslint.js` | `tree.md:26577-26599` |

NextForge similarly insists on **pnpm + turbo** as the only sane way to keep build/test/lint times sub-linear in a polyrepo-of-one (per its philosophy page).

### 3.2 Package taxonomy

ZedOS separates by **runtime concern**, not by layer:

- **`apps/`** (3): `backoffice`, `hub-partners`, `zedOS` — Next.js apps that compose packages.  (`tree.md:275, 464, 951`).
- **`packages/`** (≈55): everything reusable — `tsconfig`, `eslint-config`, `vitestconfig`, `ui`, `domain`, `drizzle`, `database`, `email`, `eventbridge`, `kms`, `next-auth`, `stripe-client`, `pappers`, `notifications`, `oauth`, `permissions`, `subscriptions`, `telemetry`, `test-helpers`, `pdf-templates`, `zod`, `vat`, etc. (`tree.md:7598-13456`). Note dedicated **per-vendor SDK packages** (`packages/stripe-client`, `packages/bridge`, `packages/pappers`, `packages/mailjet`, `packages/microsoft`, `packages/google`, `packages/cognito-client`, `packages/hubspot`, `packages/datadog-tracing`, …).
- **`services/`** (≈40): deployable runtime units (often Serverless Lambda bundles), each with its own hexagonal `src/`, `component-tests/`, `docs/references/{events-emitted,events-consumed}.md`, `.serverless/` artifact dir, and `scripts/release/` (e.g. `services/accounting/` `tree.md:13474-13649`).

Translated to Zedos's much smaller scope, the equivalent at v0 is roughly:

```
apps/web                 # the Next.js front
packages/contracts       # Zod schemas
packages/domain          # entities, VOs, ports, domain services
packages/application     # use cases (orchestration)
packages/persistence     # Prisma adapters (or split as packages/database + packages/drizzle)
packages/sdk-stripe      # vendor wrapper, Result<T,E>, Zod-validated
packages/sdk-ai          # vendor wrapper for whichever LLM provider
packages/auth            # NextAuth options + adapters (parallels ZedOS packages/next-auth)
packages/shared          # Result, errors, logger, observability, eventbus
packages/ui              # shadcn-ish design system
packages/tsconfig        # base, next, node, test
packages/eslint-config   # base, next, react, boundaries
packages/vitestconfig    # shared vitest preset (matches ZedOS packages/vitestconfig at tree.md:13439)
```

Services as their own runtime are **not yet justified at v0** (PRD §"Out of Scope" — services/feature split is post-v0). Keeping a single app and a fat-package set is fine, and explicitly aligns with NextForge's "ship one app first" stance.

### 3.3 Type safety, contracts, error handling

- **Type safety**: ZedOS `packages/tsconfig` provides a base `strict: true` config consumed by every package (one of the load-bearing details that lets a 50-package monorepo not drift). Every package compiles in isolation under that base.
- **Contracts**: ZedOS has an entire `packages/api-schema/` (`tree.md:7668-7894`) with `src/api/`, `src/endpoints/`, `src/commons/`, `src/analytics.ts`, `src/open-api.ts` — i.e. one Zod-style or schema source of truth, separate per-vertical and per-endpoint. Plus `packages/openapi/`, `packages/purchase-openapi/`, `packages/sales-oai/`, `packages/sales-stp/` for OpenAPI-generated clients (`tree.md:11132, 11277, 11282`). Contracts are **not** mixed with business logic.
- **Error handling**: ZedOS's hexagonal rule (`.cursor/rules/10-hexagonal-boundaries.mdc` referenced at `tree.md:183`) plus its `domain/` package and Drizzle persistence package provide the seam for typed errors (Result-like patterns are common in NestJS hexagonal codebases — ZedOS specifically wires NestJS via `.cursor/rules/30-nest-wiring.mdc`).

Zedos's `.cursor/rules/02-result-type-rOP.md` is conceptually identical to what a ZedOS-grade codebase would write — but Zedos's actual `Result` impl is unsound under TS variance (every use returns `as any`, see §4.4); in ZedOS a similar pattern would never compile.

### 3.4 Testing

- ZedOS: Vitest at root (`vitest.config.mts`, `tree.md:26599`) plus `packages/vitestconfig/` (`tree.md:13439`) plus per-service `component-tests/` (`services/accounting/src/component-tests/` has dozens of `.spec.ts` `tree.md:13564-13646`) plus apps `e2e/` directories (`apps/hub-partners/e2e/` `tree.md:464-490`) plus MSW mocks (`apps/hub-partners/public/mockServiceWorker.js` `tree.md:524`).
- ZedOS CI: `.github/workflows/{e2e.yml, pr-quality.yml, pr-quality-standalone.yml, deploy-app-and-run-e2e.yml, …}` (`tree.md:236-260`) plus dedicated `actions/e2e/{merge-reports, run, setup-tags, upload-report}` (`tree.md:206-213`).
- Zedos: 9 unit tests (`Vitest`), no integration, no e2e, no MSW, no fixtures, **no CI workflows in the repo at all**.

### 3.5 In-repo `.cursor/` rules / agents / commands / skills

ZedOS ships, **inside the repo**, a complete operating model:

| `tree.md` | Path | Count |
|---|---|---|
| 153-165 | `.cursor/agents/` (architect, bugfix, domain-guardian, drizzle-persistence, event-contracts, improver, monorepo-analyst, monorepo-explorer, nest-integration, security-pii, test-runner, verifier) | 12 agents |
| 166-178 | `.cursor/commands/` (ask, commit, explore, fix, implement, improve-config, improve, plan, pr, prompt, rebase, review) | 12 commands |
| 180-189 | `.cursor/rules/` (00-project-context, 05-monorepo-context, 10-hexagonal-boundaries, 20-eventing, 30-nest-wiring, 40-drizzle, 50-testing, 60-pr-sizing, 90-change-policy) | 9 rules |
| 190-201 | `.cursor/skills/` (add-driven-adapter, add-driving-endpoint, add-drizzle-migration, add-eventbridge-dispatch, add-sqs-consumer, add-usecase, explore-monorepo, improve-config, improve-from-review, split-technical-story, sync-contracts) | 11 skills |
| 179 | `.cursor/plans/` | (placeholder) |

This is the deepest difference from zedos. Zedos has 5 `.cursor/rules/*.md` (no agents, no commands, no skills, no plans) **inside `zedos/`**. The workspace root *does* have its own well-developed `.cursor/` for the PRD discovery + execution loop, but it is for product workflow, not for engineering inside the codebase.

### 3.6 Dev experience

ZedOS invests heavily in DX:

- `scripts/dashlane-{download,generate-env}-files.ts` for secret hydration (`tree.md:13464-13465`).
- `scripts/codeowners-git.ts`, `scripts/check-release-please-manifest.ts` (`tree.md:13462-13463`).
- `zedOS.code-workspace` — a multi-root VSCode workspace file (`tree.md:26589`).
- Dedicated `.github/actions/` for `deploy-service`, `e2e/{merge-reports,run,setup-tags,upload-report}`, `install`, `publish`, `setup-cursor` (`tree.md:204-220`).
- Per-package `sonar-project.properties` (e.g. `apps/backoffice/sonar-project.properties` `tree.md:462`).
- `.github/prompts/doc-generation/{document-service-events.md, lookup-nestjs.md, lookup-serverless.md}` — AI-assisted doc generation prompts (`tree.md:222-225`).

Zedos has `scripts/{seed.ts,safe-seed.ts,grant-credits-all-users.ts}` and nothing else.

---

## 4. Gap analysis (the meat)

Each row: **K** = ZedOS / NextForge baseline, **Z** = what zedos has, **Δ** = severity, **Fix** = concrete action, **Dep** = migration dependency.

### 4.1 Workspace orchestration

| # | Concern | K | Z | Δ | Fix | Dep |
|---|---|---|---|---|---|---|
| 1 | Workspace tool | pnpm + workspaces (`tree.md:26591-26592`) | None — single Next.js app at `zedos/nextjs_space/` (`zedos/nextjs_space/package.json:2-3` `"name": "app"`, no `workspaces` field) | **HIGH** | Create root `package.json` + `pnpm-workspace.yaml` listing `apps/*` and `packages/*` | Phase 0 |
| 2 | Task runner | turbo.jsonc + per-package overrides (`tree.md:26598, 7665, 13455`) | None | **HIGH** | Add `turbo.jsonc` with `build`, `dev`, `lint`, `typecheck`, `test`, `test:watch` pipelines; cache outputs | Phase 0, after #1 |
| 3 | Pinned package manager | Implicit via `pnpm-lock.yaml` (`tree.md:26591`) | Yarn Berry config tied to `/opt/hostedapp/node/yarn/global` (`zedos/nextjs_space/.yarnrc.yml:3`); no lockfile present in the layout | **HIGH** | Move to pnpm; declare `"packageManager": "pnpm@<version>"` in root `package.json`; commit `pnpm-lock.yaml` | Phase 0, after #1 |
| 4 | Dep version harmony | syncpack (`tree.md:26596`) | None | MEDIUM | Add `syncpack.config.js`, run `syncpack lint` in CI | Phase 0, after #1 |
| 5 | Changesets | `.changeset/` with 140+ entries + `config.json` (`tree.md:9-151`) | None | MEDIUM | Adopt `@changesets/cli`, gate releases via `release-please` or Changesets Action | Phase 0, after #1 |
| 6 | Dependency-cruiser | `.dependency-cruiser.js` + known-violations baseline (`tree.md:26574-26575`) | ESLint boundaries only (and that's disabled at build, see #7) | MEDIUM | Add dependency-cruiser; treat as second line of defence | Phase 1 |
| 7 | ESLint at build | Lint runs in CI workflow (`.github/workflows/pr-quality.yml` `tree.md:243`) | **`next.config.js:11-13` sets `eslint.ignoreDuringBuilds: true` — the boundaries plugin never runs in build** | **CRITICAL** | Remove `ignoreDuringBuilds`; add a CI lint step independent of `next build`; keep `tsc --noEmit` as a separate job | Phase 0 |
| 8 | TypeScript strictness | base `strict: true` in `packages/tsconfig` | `zedos/nextjs_space/tsconfig.json:12` `"strict": false`; `tsconfig.json:21` `"noImplicitAny": false`; `lib: ["dom","dom.iterable","es5","es2020"]` (`tsconfig.json:4-9` mixes es5+es2020 — meaningless) | **HIGH** | New `packages/tsconfig/base.json` with `strict: true, noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true`. Migrate package by package; the legacy `app/` and `lib/` get a relaxed override only as a temporary bridge | Phase 1 |
| 9 | Browserslist | Inferred from app needs | `package.json:127-132` includes `"ie >= 11"` — meaningless cruft for a 2026 SaaS | LOW | Delete the field; let Next.js pick its default | Phase 1 |
| 10 | Hardcoded container paths | None | `prisma/schema.prisma:4` `output = "/home/ubuntu/zedos/nextjs_space/node_modules/.prisma/client"` is hardcoded for an Abacus container | **CRITICAL** (build-breaking on local) | Remove the `output` directive; let Prisma use its default | Phase 0 |
| 11 | Build artifacts in repo | `.gitignore` covers `.next`, `dist`, `.turbo` etc. (cf. `tree.md` exclude header) | `tsconfig.tsbuildinfo` (289 KB) is at `zedos/nextjs_space/tsconfig.tsbuildinfo`; verify whether it is git-tracked | LOW | Add `*.tsbuildinfo` and `.next/` to `.gitignore`; clean up | Phase 0 |

### 4.2 Package boundaries

| # | Concern | K | Z | Δ | Fix | Dep |
|---|---|---|---|---|---|---|
| 12 | `apps/` separation | 3 apps + per-app config (`tree.md:275-7594`) | Single app at `zedos/nextjs_space/` mounted at the workspace root for no reason | **HIGH** | Move into `apps/web/`. Defer additional apps until they exist | Phase 0 |
| 13 | `packages/` separation by concern | ≈55 packages | Folders inside one app's `src/` (`zedos/nextjs_space/src/{domain,application,…}`) | **HIGH** | Hoist to `packages/{contracts,domain,application,persistence,sdk-stripe,sdk-ai,auth,shared,ui,tsconfig,eslint-config,vitestconfig}` per §3.2 | Phase 1 |
| 14 | UI layer location | `packages/ui` (`tree.md:12743-13425`) | `src/ui/` empty; UI lives in `components/` (61 files) and `app/dashboard/_components/` (`zedos/nextjs_space/components.json:14-18` aliases UI to `@/components`, contradicting `.cursor/rules/01-architecture-layers.md:157`) | **HIGH** | Move shadcn primitives + composed components into `packages/ui` (or `apps/web/src/ui/`) and update `components.json` aliases. Drop the `src/ui` empty directory until used | Phase 2 |
| 15 | Vendor SDK isolation | `packages/{stripe-client, bridge, pappers, mailjet, …}` | `Stripe` instantiated in routes (`zedos/nextjs_space/app/api/stripe/checkout/route.ts:10-12`, `app/api/stripe/verify/route.ts:10-12`); raw `fetch` to Abacus AI in `lib/ai-service.ts:42-49`; raw `bcrypt` + `prisma` in `lib/auth-options.ts:14-23` | **HIGH** (this directly violates `.cursor/rules/03-sdk-wrapping-pattern.md`) | Create `packages/sdk-stripe`, `packages/sdk-ai`, `packages/auth` per §3.2; route handlers may not import `stripe` or `bcrypt` directly | Phase 2 |

### 4.3 Contracts (Zod source of truth)

| # | Concern | K | Z | Δ | Fix | Dep |
|---|---|---|---|---|---|---|
| 16 | Contracts coverage | `packages/api-schema/` covers every endpoint and event (`tree.md:7668-7894`) | `src/contracts/{auth,credits,project,prd,adr}/` (5 contexts); **no contracts for `payments`, `ai`, `share`, `feedback`, `questions`, `dashboard`** despite `.cursor/rules/05-contracts-zod-source-of-truth.md` requiring them | **HIGH** | Create `packages/contracts/{auth,credits,project,prd,adr,payments,ai,share,feedback,questions}` with request, response, and event schemas | Phase 2 |
| 17 | DTO outbound validation | All API responses validated | `app/api/projects/route.ts:25` returns `result.unwrap()` without `.safeParse(…)`; `.cursor/rules/05-contracts-zod-source-of-truth.md:124-133` explicitly recommends validating DTOs before sending. Same in every route | MEDIUM | Add a `respondWithDto(schema, value)` helper in `packages/shared` and use it in every route | Phase 3 |
| 18 | External-response validation | Per `.cursor/rules/03-sdk-wrapping-pattern.md`, wrapper validates response with Zod | `lib/ai-service.ts:42-49` parses no schema; `app/api/stripe/verify/route.ts:31-69` reads `checkoutSession.payment_status` and `checkoutSession.metadata.purchaseId` straight off the SDK type, no validation | **HIGH** | Once `sdk-stripe` and `sdk-ai` exist (#15), every method returns `Result<Schema-validated DTO, ExternalServiceError>` | Phase 2 |
| 19 | AI `responseFormat: { type: 'json_object' }` not enforced in code | n/a | The route asks for JSON from the model but never validates the streamed buffer (`lib/ai-service.ts:115-122`); invalid JSON is silently skipped (`lib/ai-service.ts:121-122`) | **HIGH** | Define `ClarifyResponseSchema` and `PrdGenerationResponseSchema` in `packages/contracts/ai`; parse final buffer; on failure, surface a `ValidationError` and *do not deduct credits* | Phase 2 |

### 4.4 Result type & error handling

| # | Concern | K | Z | Δ | Fix | Dep |
|---|---|---|---|---|---|---|
| 20 | `Result<T,E>` soundness | NestJS-typical typed errors and patterns | The Zedos `Result<T, E = Error>` (`src/shared/result/result.ts:11`) is structurally typed but practically unsafe: every callsite ends with `return … as any` to satisfy the compiler. **117 `as any` casts** found via grep: 73 in `src/`, 41 in `app/`, 3 in `lib/` | **HIGH** | Replace with `neverthrow` (or fix variance — make `Result<T, E>` covariant in `T` and contravariant in `E` and remove the `Result<T, E = Error>` default that erases the error type). Goal: zero `as any` in use cases | Phase 1 |
| 21 | Use-case rollback boundary | NestJS service + Drizzle transaction | `src/application/auth/sign-up-usecase.ts:27-89` runs **6 sequential I/O steps** (validate, check existing user, hash password, create user, grant credits) with **no transaction** and **no compensation**. If credits grant fails, the user account exists with no credits | **CRITICAL** (silent data inconsistency) | Wrap multi-step use-cases in a unit-of-work / `prisma.$transaction`; or apply the Saga pattern with explicit compensations | Phase 3 |
| 22 | EventBus is dead | Domain events drive `eventbridge` package + `services/*/.serverless` consumers (`tree.md:10804`, `13473-26572`) | `src/shared/events/event-bus.ts` is referenced only by its own folder index files (`grep eventBus|EventBus` shows 3 hits, all in `src/shared/events/`); zero `.publish(` callers, zero subscribers | **HIGH** | Either delete the `EventBus` (YAGNI for v0) or actually emit events from use-cases (`UserCreated`, `PrdGenerated`, `CreditsDeducted`, `ShareLinkCreated`). Lean to delete for v0 and re-introduce when a second consumer exists | Phase 1 |
| 23 | Application errors typed | `ApplicationError` hierarchy with codes, status codes, details | Defined in `src/shared/errors/application-error.ts` and **good** — but multiple call sites bypass it: `lib/ai-service.ts:53` `throw new Error(...)`, `lib/credits.ts:129` `throw new Error('User not found')` | MEDIUM | Replace raw `throw new Error` with the existing typed errors; add an ESLint rule to forbid raw `throw new Error` outside of domain entities | Phase 2 |

### 4.5 Persistence

| # | Concern | K | Z | Δ | Fix | Dep |
|---|---|---|---|---|---|---|
| 24 | Concurrency-safe ledger | `packages/database` + Drizzle migrations + service-level transactional handlers | `src/infrastructure/persistence/credits-repository.ts:50-87` and `lib/credits.ts:96-117` both do `findUnique` → compute newBalance → `$transaction([update, create])` with **no row lock**. Concurrent operations can double-spend | **CRITICAL** | Use `prisma.$transaction(async (tx) => { … })` with `tx.$queryRaw('SELECT … FOR UPDATE')` or migrate the ledger to a `creditTransaction` append-only model where the balance is derived (`SUM(amount)`), enforcing constraints at the DB level | Phase 3 |
| 25 | Grace-ceiling enforcement | n/a | `src/infrastructure/persistence/credits-repository.ts:59` rejects deduct if `creditBalance < amount` — this contradicts both PRD §"first-circuit grace, overage ≤ 20" and `lib/credits.ts:60-72` | **CRITICAL** | The grace decision belongs in the domain service (`CreditsDomainService.canOperationProceed` already covers it at `src/domain/credits/credits-service.ts:24-33`), and the repo deduct must accept a "with-grace" flag computed by the use case. Also push the entire flow into a single transaction with #24 | Phase 3 |
| 26 | Single source of truth for credits | Single ledger | **Two** parallel implementations: `lib/credits.ts` (used by `clarify`, `generate-prd`, `stripe/verify` routes) and `src/{domain,application,infrastructure}/credits/*` (used by `app/api/credits/route.ts` only). Their grace semantics diverge | **HIGH** | Delete `lib/credits.ts` after porting `clarify`/`generate-prd`/`stripe/verify` to use `application/credits/*` use cases | Phase 2 |
| 27 | Schema location | `packages/database` | `prisma/schema.prisma` co-located with `nextjs_space/` and emits client into a hardcoded `/home/ubuntu/…` path (`prisma/schema.prisma:4`) | MEDIUM | Move `schema.prisma` to `packages/database/`; remove the `output` directive | Phase 1 |
| 28 | Migrations | Per-service migrations with versioning | None — `prisma/` has only `schema.prisma`, no `migrations/` directory | **HIGH** | Run `prisma migrate dev` to bootstrap a baseline; commit `prisma/migrations/` | Phase 1 |
| 29 | Mappers per layer | Drizzle row → domain mapper packages | `src/infrastructure/mappers/{credit-balance-mapper,user-mapper}.ts` exist for 2 contexts only; `project`, `prd`, `adr` repositories use Prisma rows almost-directly | MEDIUM | Add mappers for every aggregate; forbid `Prisma.<Model>` types from leaking into application/domain | Phase 2 |
| 30 | Queries package | `packages/database-queries` (`tree.md:10093`) | None | MEDIUM | Optional: extract reusable queries; only worth it once 2+ consumers exist | Phase 4 |

### 4.6 Routes / no-business-logic-in-routes

| # | Concern | K | Z | Δ | Fix | Dep |
|---|---|---|---|---|---|---|
| 31 | Thin routes | NestJS controllers; the equivalent in Next.js is a one-screen route handler | `app/api/projects/[id]/clarify/route.ts:64-186` is **123 lines** of business logic: credit check, history fetch, prompt assembly, AI call, credit deduct, stream, persist; same shape in `.../generate-prd/route.ts:85-191` (107 lines); `app/api/stripe/checkout/route.ts:14-82` (raw Stripe), `.../share/create/route.ts:9-49` (raw Prisma + crypto), `.../feedback/route.ts:8-69` (raw Prisma) | **HIGH** | Replace each route body with: `parse → useCase → respond`. Extract `ClarifyConversationUseCase`, `GeneratePrdUseCase`, `CreateCheckoutSessionUseCase`, `VerifyCheckoutSessionUseCase`, `CreateShareLinkUseCase`, `RecordMilestoneFeedbackUseCase` | Phase 3 |
| 32 | Server-component data fetching | Component-level use case calls or RSC-friendly query packages | `app/dashboard/projects/[id]/page.tsx` imports `prisma` directly (per the 25-route grep), violating `.cursor/rules/04-no-business-logic-in-routes.md` for Server Components too | **HIGH** | Same pattern: Server Components call read-only use cases (`GetProjectUseCase`, `ListPrdVersionsUseCase`, …) | Phase 3 |
| 33 | DI / composition root | NestJS modules | Every route does `new Prisma<X>Repository(prisma); new <Y>UseCase(repo)` (e.g. `app/api/projects/route.ts:17-18, 39-40`) | **HIGH** | Add a `composition.ts` (or `container.ts`) per app that exports singletons; wire it from a `getServerCompositionRoot()` helper. Or adopt a tiny IoC like `tsyringe` if the surface gets larger | Phase 2 |

### 4.7 SDK wrapping (rule 03)

| # | Concern | K | Z | Δ | Fix | Dep |
|---|---|---|---|---|---|---|
| 34 | Stripe SDK | `packages/stripe-client` (`tree.md:12635`) | Instantiated at module scope in two routes with `apiVersion: '2025-04-30.basil' as any` (`zedos/nextjs_space/app/api/stripe/checkout/route.ts:10-12`, `app/api/stripe/verify/route.ts:10-12`) | **HIGH** | `packages/sdk-stripe` exposes `createCheckoutSession`, `retrieveSession`, `verifyWebhookSignature`. Pin `apiVersion` to a real published version. No `as any` | Phase 2 |
| 35 | Stripe webhook | Standard | **No webhook endpoint exists**. There is no `app/api/stripe/webhook/route.ts`. Credit grants depend on the user landing on `/dashboard/credits?session_id=…` and POSTing to `/api/stripe/verify` (`app/api/stripe/verify/route.ts:31-69`) | **CRITICAL** | Add `app/api/stripe/webhook/route.ts` with `stripe.webhooks.constructEvent(...)` + `Stripe-Signature` verification + idempotency on `event.id`. Move credit grants behind `checkout.session.completed`. Keep `/verify` only for UX confirmation | Phase 3 |
| 36 | AI SDK | Provider-specific package | `lib/ai-service.ts:1-57` is a thin `fetch` wrapper to `apps.abacus.ai/v1/chat/completions` with model `'gpt-5.4-mini'` hardcoded (`lib/ai-service.ts:22`). Throws raw `Error`; no Zod validation; no timeout, retry, or circuit breaker | **HIGH** | `packages/sdk-ai` with a `Provider` interface (Anthropic / OpenAI / Abacus / …). All responses validated against contracts. Implement timeouts (e.g. 30 s) and a single retry on `5xx`. Token budget per request | Phase 2 |
| 37 | NextAuth | `packages/next-auth` (`tree.md:11055`) | `lib/auth-options.ts:1-54` colocated with the Next app; `(session.user as any).id` is the type-safety escape hatch for the user id (`lib/auth-options.ts:42`); `try {...} catch { return null }` (`lib/auth-options.ts:24-26`) silently masks DB failures as "wrong password" | **HIGH** | Move to `packages/auth/`. Add a NextAuth type augmentation file (`packages/auth/types/next-auth.d.ts`) so `session.user.id` is properly typed. Replace silent catch with logging + proper failure | Phase 2 |

### 4.8 Testing

| # | Concern | K | Z | Δ | Fix | Dep |
|---|---|---|---|---|---|---|
| 38 | Unit tests | Yes, throughout | 9 test files (65 tests), all in `src/` (no route tests, no component tests) | MEDIUM | Add use-case tests once routes are thin (#31) | Phase 3 |
| 39 | Component tests | `services/*/component-tests/` everywhere | None | MEDIUM | Per app: a `__tests__/` next to use-case wiring with MSW + `prisma` test container | Phase 4 |
| 40 | E2E tests | `apps/hub-partners/e2e/`, `.github/actions/e2e/*`, `.github/workflows/e2e.yml` | None | MEDIUM | Adopt Playwright in `apps/web/e2e/`. v0 must cover signup → first PRD → credit deduct → share link | Phase 4 |
| 41 | Test config sharing | `packages/vitestconfig` | `vitest.config.ts` per-app, paths duplicated from `tsconfig.json` (`zedos/nextjs_space/vitest.config.ts:11-19`) | LOW | After #1, share via `packages/vitestconfig` | Phase 1 |
| 42 | Storybook | `deploy-storybook.yml` (`tree.md:235`) implies storybook in apps | None | LOW | Add Storybook to `packages/ui` once it exists (#14) | Phase 4 |

### 4.9 CI / DevOps

| # | Concern | K | Z | Δ | Fix | Dep |
|---|---|---|---|---|---|---|
| 43 | CI workflows | 25+ workflows in `.github/workflows/` (`tree.md:233-260`) | None in this repo. The PRD discovery `.cursor/` lives at the workspace root, but CI is empty | **HIGH** | Minimum: `.github/workflows/pr-quality.yml` running `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` with affected-only via `turbo run --affected` | Phase 1 |
| 44 | Dockerfile | Per-app | None for `zedos/nextjs_space/` | LOW | Optional pre-prod | Phase 4 |
| 45 | Secrets | Dashlane scripts (`tree.md:13464-13465`) | **Real secrets in `.env`** (`zedos/nextjs_space/.env:1-3`) | **CRITICAL** | Rotate all credentials immediately; replace `.env` with `.env.example`; document onboarding | Phase 0 |

### 4.10 Security / PII

| # | Concern | K | Z | Δ | Fix | Dep |
|---|---|---|---|---|---|---|
| 46 | Rate limiting | Edge or service-level | None — neither auth, signup, AI, nor share endpoints are throttled | **HIGH** | Add `@upstash/ratelimit` or middleware in `app/middleware.ts` per route family (signup: 5/min/IP; clarify: 30/min/user; share creation: 10/hour/user) | Phase 3 |
| 47 | Share-link `noindex` | n/a | PRD requires noindex; **no `X-Robots-Tag` header is set anywhere**. `app/share/[token]/page.tsx` has no `metadata.robots` and `app/api/share/[token]/route.ts:23-29` returns JSON without `X-Robots-Tag` | MEDIUM | Add `export const metadata = { robots: { index: false, follow: false } }` in the share page; set `X-Robots-Tag: noindex, nofollow` in `next.config.js` headers config for `/share/*` | Phase 3 |
| 48 | Idempotency on payments | Standard via Stripe `Idempotency-Key` | Not used; checkout session creation has no idempotency key, verify endpoint relies only on `purchase.status === 'completed'` (`app/api/stripe/verify/route.ts:49-53`) | **HIGH** | Combined with #35, add `Idempotency-Key` derived from `purchaseId` to all Stripe requests | Phase 3 |
| 49 | LLM cost cap | Per-request budget + per-tenant ceiling | None — `lib/ai-service.ts:25` defaults `maxTokens = 4000`, and every clarify/generate request runs at provider's whim. `clarify` deducts credits before AI completes (`app/api/projects/[id]/clarify/route.ts:148`), `generate-prd` deducts before AI is called at all (`app/api/projects/[id]/generate-prd/route.ts:142`). A misbehaving prompt = LLM bill spike with no recovery for the user | MEDIUM | (a) Move credit deduction *after* successful streamed completion; refund on AI failure. (b) Hard cap monthly spend per tenant in the SDK wrapper; (c) Track tokens per request | Phase 3 |
| 50 | NextAuth session in JWT | Standard | Fine in itself (`lib/auth-options.ts:30`), but `NEXTAUTH_SECRET` is currently exposed (#45) | n/a (covered by #45) | — | Phase 0 |

### 4.11 Observability

| # | Concern | K | Z | Δ | Fix | Dep |
|---|---|---|---|---|---|---|
| 51 | Logger | `packages/datadog-tracing` (`tree.md:10213`) | A reasonable `Logger` exists at `src/shared/observability/logger.ts:18-74`, but **most routes still use raw `console.error`** (e.g. `app/api/stripe/checkout/route.ts:79`, `app/api/share/create/route.ts:46`) | MEDIUM | Either delete the logger and use only `console.*` (YAGNI), or replace all `console.*` with the logger. Add a request-id middleware so every log entry carries `traceId` | Phase 2 |
| 52 | Metrics + tracing | Datadog + OpenTelemetry | None | LOW | Integrate via the SDK wrappers in #34 / #36 once those exist | Phase 4 |

---

## 5. The 5 `.cursor/rules/` inside `zedos/`

The rules are at `zedos/.cursor/rules/` — and **not** inside `zedos/nextjs_space/.cursor/`, which does not exist. That alone is a packaging issue: the rules document the architecture inside the app, but they live one level above the app. They are also shipped as `.docx` and `.pdf` siblings of the `.md` files (`zedos/.cursor/rules/01-architecture-layers.{md,docx,pdf}`), which is fine for hand-off but adds noise.

| Rule | Status | Coherence with code | Drift |
|---|---|---|---|
| **01 architecture-layers** (`zedos/.cursor/rules/01-architecture-layers.md`) | Excellent doc | **Partial**: domain/application/contracts/infrastructure/persistence layers exist; UI layer is empty (#14); ESLint boundaries are configured (`.eslintrc.json:8-83`) but disabled at build time (#7) | The rule says routes call use cases; 16 routes call `prisma.*` directly (#31). The rule says vendor SDKs live only in `infrastructure/`; Stripe + AI live in routes and `lib/` (#15, #34, #36) |
| **02 result-type-rOP** (`zedos/.cursor/rules/02-result-type-rOP.md`) | Excellent doc | **Implementation is unsound** under TS variance, every callsite needs `as any` (#20). The doc's `Promise<Result<CheckoutSession, PaymentError>>` examples cannot be expressed safely with the current `Result<T, E = Error>` (`src/shared/result/result.ts:11`) | Use cases pretend to return typed errors but actually erase them through `as any` |
| **03 sdk-wrapping-pattern** (`zedos/.cursor/rules/03-sdk-wrapping-pattern.md`) | Excellent doc | **Not followed**. `src/infrastructure/{ai,payments,auth}/` directories do not exist — `.project_instructions.md:40-42` admits "Pass E deferred". Stripe is raw in 2 routes; Abacus AI is raw via `lib/ai-service.ts`; NextAuth is raw via `lib/auth-options.ts` | The rule's example `StripeClient.createCheckoutSession` returning `Result<CheckoutSession, ExternalServiceError>` exists nowhere |
| **04 no-business-logic-in-routes** (`zedos/.cursor/rules/04-no-business-logic-in-routes.md`) | Excellent doc | **Not followed in the high-value routes**. Project CRUD (`app/api/projects/route.ts`) follows it; clarify, generate-prd, stripe checkout/verify, share create/disable, feedback, questions, readiness-score, phase/check, phase/unlock all violate it | The rule says routes are <20 lines; clarify is 187 lines, generate-prd is 192 lines |
| **05 contracts-zod-source-of-truth** (`zedos/.cursor/rules/05-contracts-zod-source-of-truth.md`) | Excellent doc | **Partially followed** for inbound validation (`CreateProjectRequestSchema.safeParse` is used at `app/api/projects/route.ts:34`), **never** for outbound DTOs (#17), **never** for AI responses (#19), **never** for Stripe responses (#18) | Half a rule. The schema for Stripe in §"Contracts for Payments" of the rule does not exist in `src/contracts/` |

### 5.1 Comparison with ZedOS's in-repo rules

ZedOS's 9 rules (per `tree.md:181-189`) cover:

- `00-project-context.mdc` — what the company / product is.
- `05-monorepo-context.mdc` — how to navigate the monorepo.
- `10-hexagonal-boundaries.mdc` — what zedos's #01 covers.
- `20-eventing.mdc` — domain events through EventBridge.
- `30-nest-wiring.mdc` — NestJS module composition.
- `40-drizzle.mdc` — persistence patterns.
- `50-testing.mdc` — testing stance.
- `60-pr-sizing.mdc` — PR ergonomics.
- `90-change-policy.mdc` — what counts as a breaking change.

Plus `12 agents`, `12 commands`, `11 skills`. Zedos has **zero agents, zero commands, zero skills** inside `zedos/.cursor/`. The execution-loop and PRD work happens at the workspace root (`/.cursor/`), which is an entirely different concern.

**Recommended additions** for zedos's eventual `apps/web/.cursor/` (or root `.cursor/` if zedos becomes the root after migration):

- **00-project-context.mdc** — what zedos is (paraphrased from PRD).
- **05-monorepo-context.mdc** — package taxonomy + dependency rules.
- **10-architecture-layers.mdc** — promote the existing 01 to first-class.
- **20-result-type.mdc** — promote the existing 02; tighten with `neverthrow`.
- **30-sdk-wrapping.mdc** — promote 03; add concrete `sdk-stripe` / `sdk-ai` patterns.
- **40-routes-are-thin.mdc** — promote 04.
- **50-contracts-zod.mdc** — promote 05.
- **60-credits-ledger.mdc** — *new*: PRD's grace rules + concurrency-safety + transactional patterns.
- **70-payments.mdc** — *new*: webhook + idempotency + tax/VAT considerations.
- **80-prd-storage.mdc** — *new*: PRD versioning model, share-link semantics, `noindex` behaviour.
- **90-change-policy.mdc** — ZedOS's PR-sizing + change-policy stance, adapted.

---

## 6. Migration plan to top-1% Turborepo

This is **before any new feature work**. Each phase ends with a clear gate.

### Phase 0 — Safety + Foundations (0.5–1 dev-week)

> Goal: stop the bleeding, set up the workspace skeleton, retire Abacus container assumptions.

| # | Step | Notes | Dep |
|---|---|---|---|
| P0.1 | **Rotate every secret** in `zedos/nextjs_space/.env:1-16` | DATABASE_URL credentials, NEXTAUTH_SECRET, ABACUSAI_API_KEY. Replace with `.env.example` | — |
| P0.2 | Add root `package.json`, `pnpm-workspace.yaml`, `turbo.jsonc`, `.changeset/`, `.npmrc` (`auto-install-peers=true`), `.gitignore` (with `*.tsbuildinfo`, `.next/`, `.turbo/`, `dist/`, `coverage/`) | Mirror ZedOS root | P0.1 |
| P0.3 | Move `zedos/nextjs_space/` → `apps/web/`. Remove `zedos/` wrapper folder, push `.cursor/rules/*` up to repo root or `apps/web/.cursor/rules/` | A clean, single-app monorepo at `/Users/romainpiveteau/Projects/ZedTech/zedos.app/` | P0.2 |
| P0.4 | Delete `prisma/schema.prisma:4` `output =` directive; remove `binaryTargets = ["…linux-musl-arm64-openssl-3.0.x"]` unless needed for prod target | Free local Prisma generation | P0.3 |
| P0.5 | Delete `.yarnrc.yml`, `tsconfig.tsbuildinfo`, `.abacus.donotdelete`. Drop `browserslist: ["ie >= 11", …]`. Drop `eslint.ignoreDuringBuilds: true` from `next.config.js:11-13` | Cleanup | P0.3 |
| P0.6 | Add **CI**: `.github/workflows/pr-quality.yml` running `pnpm install`, `pnpm -w lint`, `pnpm -w typecheck`, `pnpm -w test`, `pnpm -w build` | Prevents regressions while migration progresses | P0.2 |

**Gate:** `pnpm install && pnpm dev` works locally for `apps/web`, CI is green, no secret in repo, ESLint runs in CI.

### Phase 1 — Strict TypeScript + Shared Configs + Migrations (1 dev-week)

> Goal: make the existing code provably typed.

| # | Step | Notes | Dep |
|---|---|---|---|
| P1.1 | Create `packages/tsconfig` with `base.json` (`strict: true`, `noUncheckedIndexedAccess: true`), `nextjs.json`, `node.json`, `test.json` | Mirror ZedOS `packages/tsconfig` (`tree.md:12735`) | Phase 0 |
| P1.2 | Create `packages/eslint-config` (`base.cjs`, `next.cjs`, `react.cjs`, `boundaries.cjs`); migrate `apps/web/.eslintrc.json` to extend it | Mirror ZedOS `packages/eslint-config` (`tree.md:10791`) | Phase 0 |
| P1.3 | Create `packages/vitestconfig` shared preset; migrate `vitest.config.ts` to consume it | Mirror ZedOS `packages/vitestconfig` (`tree.md:13439`) | Phase 0 |
| P1.4 | Replace the local `Result<T, E>` (`src/shared/result/result.ts`) with **`neverthrow`** (or fix variance manually). Remove every `as any` cast in `src/` use cases | Closes #20 | Phase 0 |
| P1.5 | Re-enable `strict: true` per package, fix `as any` casts package by package starting with `packages/shared`, `packages/contracts`, `packages/domain` | Block #8, #20 | P1.1, P1.4 |
| P1.6 | Bootstrap `prisma migrate` (commit `prisma/migrations/` baseline) | Closes #28 | Phase 0 |
| P1.7 | Add `syncpack`, `dependency-cruiser`. CI fails on cruiser violations and version drift | Closes #4, #6 | Phase 0 |
| P1.8 | Delete `EventBus` (and `src/shared/events/*`) for v0 — re-introduce when a real consumer exists | Closes #22 | P1.4 |

**Gate:** every package compiles under `strict: true`, CI runs `tsc --noEmit` per package, dependency-cruiser is green, no `as any` in `packages/*`.

### Phase 2 — Vendor Wrappers + Contracts + DI (1.5 dev-weeks)

> Goal: kill the legacy `lib/` runtime; make all SDK calls go through `Result`-returning wrappers.

| # | Step | Notes | Dep |
|---|---|---|---|
| P2.1 | Create `packages/contracts` and migrate `src/contracts/*` into it. Add **missing** contexts: `payments`, `ai`, `share`, `feedback`, `questions` | Closes #16 | Phase 1 |
| P2.2 | Create `packages/sdk-stripe` with `createCheckoutSession`, `retrieveSession`, `verifyWebhookSignature`. Replace direct `Stripe` in `app/api/stripe/checkout/route.ts:10-12` and `verify/route.ts:10-12` | Closes #15 (Stripe), #34 | P2.1 |
| P2.3 | Create `packages/sdk-ai` (`provider: 'abacus' | 'anthropic' | 'openai'`), `chat`, `chatStream`. Replace `lib/ai-service.ts`. Validate streamed JSON with `ClarifyResponseSchema` and `PrdGenerationResponseSchema` | Closes #15 (AI), #18, #19, #36 | P2.1 |
| P2.4 | Create `packages/auth` for NextAuth options, type augmentation (`session.user.id`), and adapter wiring. Migrate `lib/auth-options.ts`. Stop swallowing DB errors | Closes #15 (Auth), #37 | P2.1 |
| P2.5 | Add a tiny composition root in `apps/web/lib/composition.ts` exposing singletons: `repos`, `useCases`, `clients`. Routes consume the singletons (no more `new PrismaXxxRepository(prisma); new YyyUseCase(repo)` per request) | Closes #33 | P2.2, P2.3, P2.4 |
| P2.6 | Move `prisma/schema.prisma` into `packages/database/`; expose typed repositories from `packages/persistence/`. Add per-aggregate mappers | Closes #27, #29 | Phase 1 |
| P2.7 | Move `components/` into `packages/ui` (or `apps/web/src/ui/`); update `components.json` aliases | Closes #14 | Phase 1 |
| P2.8 | Replace direct `prisma.*` calls in remaining routes by use cases or read-only repos via the composition root | Closes #31 read paths | P2.5 |

**Gate:** zero `import { prisma }` in `apps/web/app/**`, zero `new Stripe(`, zero `import … from '@/lib/(ai-service|credits|auth-options|config)'`. ESLint boundaries set to `error` for those imports.

### Phase 3 — Critical Behavior Fixes (1 dev-week)

> Goal: the credit ledger and payments flow are correct under concurrency and partial failure.

| # | Step | Notes | Dep |
|---|---|---|---|
| P3.1 | Replace `findUnique → compute → $transaction([update,create])` with a transactional pattern (Prisma `$transaction(async (tx) => { … })` + `SELECT … FOR UPDATE` raw on `users.credit_balance`, or migrate to append-only `credit_transactions` + derived balance) | Closes #24, #25, #26 | Phase 2 |
| P3.2 | Move credit deduction *after* successful AI completion in `clarify` and `generate-prd`; on AI failure, do **not** charge | Closes #2 | P3.1 |
| P3.3 | Add `app/api/stripe/webhook/route.ts` with `stripe.webhooks.constructEvent` + signature verification + idempotency on `event.id`. Move credit grants behind `checkout.session.completed`. Add `Idempotency-Key` to outbound Stripe calls | Closes #35, #48 | Phase 2 |
| P3.4 | Wrap multi-step use cases in transactions / Sagas. `SignUpUseCase` becomes one transaction across user create + starter credit grant | Closes #21 | P3.1 |
| P3.5 | Add `noindex` on `/share/*` (page metadata + `X-Robots-Tag` header in `next.config.js`) | Closes #47 | — |
| P3.6 | Add rate limiting via `app/middleware.ts` per route family (signup, login, clarify, generate-prd, stripe webhook excluded, share creation) | Closes #46 | — |
| P3.7 | Add request-id middleware; replace remaining `console.*` with the structured logger | Closes #51 | — |

**Gate:** integration tests on the credit ledger pass under concurrent load; Stripe webhook test against the Stripe CLI works; rate limits return 429 above thresholds.

### Phase 4 — Testing Depth + Observability + Storybook (1 dev-week, optional for v0 ship)

| # | Step | Notes |
|---|---|---|
| P4.1 | Playwright e2e: signup → first PRD circuit → credit deduct → share link → noindex check |
| P4.2 | Component tests with MSW + Prisma test container per use case |
| P4.3 | Storybook in `packages/ui` |
| P4.4 | Optional: Datadog or OpenTelemetry tracing, only if a deployment target needs it |

**Gate:** e2e green on PRs, observability integrated where deploy needs it.

### 6.1 Effort summary

| Phase | Engineer-weeks | Risk | Deliverable |
|---|---:|---|---|
| 0 | 0.5–1 | Low | Workspace skeleton, secrets rotated, CI green |
| 1 | 1 | Low | Strict TS, shared configs, migrations baseline |
| 2 | 1.5 | Medium | SDK wrappers, contracts complete, composition root, no more `lib/*` runtime |
| 3 | 1 | High (touches money + AI flow) | Concurrency-safe ledger, Stripe webhook, rate limiting |
| 4 | 1 | Medium | Tests, observability, Storybook |
| **Total** | **5–5.5 weeks** | | A top-1% small Turborepo (small in size, top-1% in hygiene) |

### 6.2 Dependency graph (text)

```
P0.1 ─┐
       ├─► P0.2 ─► P0.3 ─► P0.4 ─► P0.5
                                    │
                                    ├─► P0.6 ─► (CI gate)
                                    │
                                    ▼
                                  P1.1 ── P1.2 ── P1.3 ── P1.4 ── P1.5 ── P1.6 ── P1.7 ── P1.8
                                                                          │
                                                                          ▼
                                                                        P2.1 ── P2.2/P2.3/P2.4 ── P2.5 ── P2.6 ── P2.7 ── P2.8
                                                                                                                          │
                                                                                                                          ▼
                                                                                                                        P3.1 ── P3.2 ── P3.3 ── P3.4 ── P3.5/P3.6/P3.7
                                                                                                                                                         │
                                                                                                                                                         ▼
                                                                                                                                                       P4.x
```

---

## 7. Risks & open questions for the user

These are decisions Cursor cannot safely make alone. Each affects the migration shape.

1. **Migration vs greenfield rebuild.** zedos is small (≈220 source files). A clean greenfield using a Turborepo template (NextForge, `create-turbo`, or a `zedOS-template` extracted by hand) and porting only the schema + the 5 well-formed `.cursor/rules` would likely cost the same as a fix-in-place migration and yield a cleaner result. **Recommendation:** greenfield rebuild, port schema, port the 9 unit-tested domain entities, throw away `lib/*` and 16 of 25 routes. Confirm with user.
2. **Reference template choice.** ZedOS is a NestJS monorepo with Drizzle and EventBridge — a much heavier shape than what v0 zedos needs. NextForge is closer in shape (Next.js + Prisma + Clerk + UI kit) but does not match the hexagonal stance. **Recommendation:** mirror NextForge's package taxonomy (less infra noise) but adopt ZedOS's `.cursor/{agents,commands,rules,skills}` operating model. Confirm.
3. **Persistence: Prisma vs Drizzle.** ZedOS uses Drizzle (`packages/drizzle` `tree.md:10667`). Prisma is good and already wired. **Recommendation:** stay on Prisma for v0; revisit only if a cross-runtime (edge) need appears. Confirm.
4. **Auth: NextAuth v4 vs v5 / Lucia / Clerk.** The codebase pins NextAuth 4.24 and `@next-auth/prisma-adapter` (`package.json:47, 100`). NextAuth v5 (Auth.js) is the maintained line. **Recommendation:** during migration, upgrade to v5 in `packages/auth`. Confirm.
5. **AI provider.** Abacus AI is a hosted aggregator; the model literal `'gpt-5.4-mini'` (`lib/ai-service.ts:22`) suggests Cursor branding. PRD §"AI inference" says "managed; model/provider not named". **Recommendation:** `packages/sdk-ai` with provider abstraction; default to Anthropic or OpenAI. Confirm.
6. **NestJS or not.** ZedOS's rules `30-nest-wiring.mdc` reflect a NestJS shape that does not apply to a Next.js App Router app. **Recommendation:** do **not** introduce NestJS. Use the composition root pattern (P2.5). Confirm.
7. **Things that look broken or incomplete in zedos:**
   - `EventBus` is unreferenced (#22).
   - `src/ui/` is empty despite being declared in ESLint and tsconfig (#14).
   - The grace ceiling is enforced in `lib/credits.ts` but not in the parallel `src/infrastructure/persistence/credits-repository.ts` (#25).
   - `lib/credits.ts` and `src/application/credits/*` are dual sources of truth (#26).
   - No Stripe webhook (#35).
   - `app/api/projects/[id]/clarify/route.ts:148` deducts credits before AI completes; `.../generate-prd/route.ts:142` deducts before AI is even called (#2, #49).
   - `noindex` is in PRD but not in code (#47).
8. **Operator-config from PRD.** PRD §"Configuration Matrix" calls `Starter credits X`, `Pack list prices`, `Credit burn rates` operator-config. Currently they are env vars (`zedos/nextjs_space/.env:4-15`) read directly from `process.env` inside `lib/credits.ts`, `lib/config.ts`, and `src/application/auth/sign-up-usecase.ts:61`. **Recommendation:** introduce a `packages/config` with a single Zod-validated `Config` object, loaded once at the composition root. Confirm.

---

## 8. Recommended "next feature area" candidates

These are the v0 Feature Areas from `docs/prd/PRD.md` (FG-PRD-V0 sub-components) and the parent's `docs/product/feature-areas/` queue, ranked by their **engineering coupling** to the migration above and by what unblocks the most downstream work.

| # | Candidate | PRD anchor | Why this one next | Depends on (engineering) | Unblocks |
|---|---|---|---|---|---|
| 1 | **`FA-account-session`** (Auth shell) | FG-PRD-V0 §Auth shell | Smallest blast radius; touches `packages/auth`, `packages/contracts/auth`, `packages/persistence/user`. Forces P2.4 to land cleanly | P0, P1, P2.4 | Every other FA needs `userId`, so this is the literal foundation |
| 2 | **`FA-dashboard-shell`** (Project workspace + dashboard nav) | FG-PRD-V0 §Project workspace + dashboard shell | Validates `packages/ui` extraction (P2.7) on a real surface. Project CRUD is already the cleanest path in zedos (`app/api/projects/route.ts` is the rule-compliant route) | P2.5, P2.7 | Hosts every other v0 surface |
| 3 | **`FA-prd-versioning`** (Versioning + persistence + browse) | FG-PRD-V0 §PRD versioning | Pure-product, Prisma-only, zero AI-coupling, zero payments-coupling. Lets us prove the use-case-only pattern (P2.5) end-to-end before touching AI | P2.6 | Required by `FA-guided-clarification`, `FA-question-history`, `FA-read-only-sharing` |
| 4 | **`FA-guided-clarification`** + **`FA-question-history`** (clarification loop + structured log) | FG-PRD-V0 §Guided clarification loop | Highest-value flow + highest-risk current code. After P3.2 + P2.3 it becomes auditable. Pair with question-history because they share the same domain object | P2.1 (contracts/ai), P2.3 (sdk-ai), P3.2 (deduct after success) | The product itself |
| 5 | **`FA-credit-system`** + **`FA-payments`** (credits + Stripe, including webhook) | FG-PRD-V0 §Credit system | Can ship in parallel with #4. Webhook + idempotency + ledger fixes (P3.1, P3.3) are all here. Owns the payments tax/VAT product requirement | P3.1, P3.3, P3.4 | Anything that calls AI consumes credits, so this gates `FA-guided-clarification` *operationally* (you can ship clarify with just starter credits, but you cannot ship public signup until purchase works) |

Two minor candidates intentionally **not** in the top five:

- **`FA-read-only-sharing`** — small but blocked by `noindex` (#47) and rate limiting (#46). Worth one PR after P3.5 + P3.6.
- **`FA-owner-milestone-feedback`** — entirely additive; ship after `FA-prd-versioning` exists.

A reasonable ordered ladder is therefore:

```
Phase 0 → Phase 1 → Phase 2 → FA-account-session
                                ↓
                              FA-dashboard-shell
                                ↓
                              FA-prd-versioning
                                ↓
              FA-guided-clarification ─────────┐
                                ↑              │  (parallel)
                              Phase 3 ─────────┤
                                ↓              ▼
                           FA-credit-system + FA-payments
                                ↓
                  FA-read-only-sharing → FA-owner-milestone-feedback → Phase 4
```

---

## Appendix A — Findings index

| # | Finding | File evidence | § |
|---:|---|---|---|
| 1 | No `pnpm-workspace.yaml` / `turbo.json[c]` | `zedos/nextjs_space/package.json:2-3` | 4.1 |
| 2 | No `turbo` task pipelines | absent | 4.1 |
| 3 | Yarn config tied to Abacus container | `.yarnrc.yml:3` | 4.1 |
| 4 | No syncpack | absent | 4.1 |
| 5 | No Changesets | absent | 4.1 |
| 6 | No dependency-cruiser | absent | 4.1 |
| 7 | ESLint disabled at build | `next.config.js:11-13` | 4.1 |
| 8 | TS `strict: false` + `noImplicitAny: false` | `tsconfig.json:12,21` | 4.1 |
| 9 | Browserslist `ie >= 11` | `package.json:127-132` | 4.1 |
| 10 | Hardcoded Linux container Prisma output | `prisma/schema.prisma:4` | 4.1 |
| 11 | `tsconfig.tsbuildinfo` (289 KB) at repo path | `zedos/nextjs_space/tsconfig.tsbuildinfo` | 4.1 |
| 12 | Single app at root, not in `apps/` | layout | 4.2 |
| 13 | `src/{layers}` not promoted to `packages/` | layout | 4.2 |
| 14 | `src/ui` empty, UI is in `components/` | `components.json:14-18`, `components/**` | 4.2 |
| 15 | Vendor SDKs in routes/lib, not `infrastructure/` | `app/api/stripe/checkout/route.ts:10-12`, `lib/ai-service.ts:42-49`, `lib/auth-options.ts:14-23` | 4.2 |
| 16 | Contracts missing for payments, ai, share, feedback, questions | `src/contracts/{auth,credits,project,prd,adr}/` only | 4.3 |
| 17 | Outbound DTOs not Zod-validated | `app/api/projects/route.ts:25` | 4.3 |
| 18 | Stripe responses not Zod-validated | `app/api/stripe/verify/route.ts:31-69` | 4.3 |
| 19 | AI streamed JSON not validated | `lib/ai-service.ts:115-122` | 4.3 |
| 20 | `Result<T,E>` requires `as any` everywhere (117 casts) | grep `as any` in `src/`, `app/`, `lib/` | 4.4 |
| 21 | SignUp has no transaction | `src/application/auth/sign-up-usecase.ts:27-89` | 4.4 |
| 22 | EventBus is dead code | `src/shared/events/event-bus.ts` (no callers) | 4.4 |
| 23 | Raw `throw new Error` in `lib/` | `lib/ai-service.ts:53`, `lib/credits.ts:129` | 4.4 |
| 24 | Concurrency-unsafe credit ledger | `src/infrastructure/persistence/credits-repository.ts:50-87`, `lib/credits.ts:96-117` | 4.5 |
| 25 | Grace ceiling not enforced at deduct (src/) | `src/infrastructure/persistence/credits-repository.ts:59` | 4.5 |
| 26 | Dual credit source of truth | `lib/credits.ts` + `src/{domain,application,infrastructure}/credits/*` | 4.5 |
| 27 | `schema.prisma` co-located + container path | `prisma/schema.prisma:1-9` | 4.5 |
| 28 | No migrations | absent | 4.5 |
| 29 | Mappers only for credits + user | `src/infrastructure/mappers/{credit-balance-mapper,user-mapper}.ts` | 4.5 |
| 30 | No queries package (low priority) | absent | 4.5 |
| 31 | Routes with business logic | `app/api/projects/[id]/{clarify,generate-prd}/route.ts`, `app/api/stripe/{checkout,verify}/route.ts`, `app/api/share/{create,disable,[token]}/route.ts`, `app/api/feedback/route.ts` | 4.6 |
| 32 | Server components do raw `prisma.*` | `app/dashboard/projects/[id]/page.tsx` | 4.6 |
| 33 | No DI / composition root | `app/api/projects/route.ts:17-18, 39-40` | 4.6 |
| 34 | Stripe SDK raw at module scope | `app/api/stripe/checkout/route.ts:10-12`, `verify/route.ts:10-12` | 4.7 |
| 35 | No Stripe webhook | absent | 4.7 |
| 36 | AI SDK raw + hardcoded model | `lib/ai-service.ts:1-57, :22` | 4.7 |
| 37 | NextAuth raw + `as any` for `user.id` + silent error swallow | `lib/auth-options.ts:14-26, :42` | 4.7 |
| 38 | No route tests | absent | 4.8 |
| 39 | No component / integration tests | absent | 4.8 |
| 40 | No e2e / Playwright | absent | 4.8 |
| 41 | Vitest config not shared | `vitest.config.ts:1-21` | 4.8 |
| 42 | No Storybook | absent | 4.8 |
| 43 | No CI workflows | absent | 4.9 |
| 44 | No Dockerfile | absent | 4.9 |
| 45 | Real secrets in `.env` | `zedos/nextjs_space/.env:1-3` | 4.9 |
| 46 | No rate limiting | absent | 4.10 |
| 47 | `noindex` not implemented | `app/share/[token]/page.tsx`, `app/api/share/[token]/route.ts:23-29` | 4.10 |
| 48 | No Stripe `Idempotency-Key` | `app/api/stripe/checkout/route.ts:46-69` | 4.10 |
| 49 | No LLM cost cap; deduct-before-success | `app/api/projects/[id]/clarify/route.ts:148`, `.../generate-prd/route.ts:142`, `lib/ai-service.ts:25` | 4.10 |
| 50 | NEXTAUTH_SECRET exposed (covered by #45) | `.env:2` | 4.10 |
| 51 | Logger exists, not consistently used | `src/shared/observability/logger.ts:18-74` vs `console.error` in routes | 4.11 |
| 52 | No metrics / tracing | absent | 4.11 |

