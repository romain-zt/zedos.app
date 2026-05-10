# Migration Readiness Checker

Governed by: `.cursor/rules/71-monorepo-context.mdc`, `docs/retro/zedos-monorepo-retro.md` §6 (phased migration plan)

Run this checker **before each phase** of the Turborepo migration. Each phase has explicit pre-conditions; this checker enumerates them so the migration cannot start blind.

This checker is one-shot per phase boundary — not part of the per-PR loop. It complements:

- `.cursor/checkers/implementation-readiness-checker.md` — gates `/implement` for every Plan
- `.cursor/checkers/pr-readiness-checker.md` — gates `/pr` for every PR

---

## How to use

For each check, answer **PASS**, **FAIL**, or **SKIP (with reason)**.

A single **FAIL** blocks the phase advance. Resolve and re-run.

The checker is grouped by phase. Run only the phase you are about to enter.

---

## Phase 0 — Foundations + Secret rotation

Per `docs/retro/zedos-monorepo-retro.md` §6 Phase 0.

### M0-01 · Secrets rotated and removed from history

> Every credential that was committed to `zedos/nextjs_space/.env` (DATABASE_URL, NEXTAUTH_SECRET, ABACUSAI_API_KEY, Stripe keys) has been **rotated** AND **purged from git history**.

**FAIL signals:**
- `.env` still contains real credentials at HEAD
- `.env` contains real credentials at any historical SHA accessible without `--filter-repo`

### M0-02 · `.env.example` exists and `.env` is gitignored

> `zedos/nextjs_space/.env.example` (or post-restructure equivalent) lists every required variable with placeholder values. `.gitignore` covers `.env`, `.env.local`, `.env.*.local`.

### M0-03 · Hardcoded container paths removed

> `prisma/schema.prisma` does not contain a hardcoded `output = "/home/ubuntu/..."` directive. Default Prisma output is used.

### M0-04 · ESLint runs in CI separately from `next build`

> `next.config.js` no longer sets `eslint.ignoreDuringBuilds: true`, OR a CI workflow exists that runs `next lint` independently as a hard gate.

### M0-05 · Yarn-Berry container assumption removed

> `.yarnrc.yml` either deleted or no longer references container-specific paths (`/opt/hostedapp/...`).

### M0-06 · Build artifacts gitignored

> `.gitignore` covers `*.tsbuildinfo`, `.next/`, `.turbo/`, `dist/`, `coverage/`. The repo HEAD does not contain `tsconfig.tsbuildinfo`.

### M0-07 · `.abacus.donotdelete` and other vendor markers removed

> Files that exist solely to mark the Abacus container have been removed.

### M0-08 · Phase 0 PR(s) merged green

> The PR(s) implementing Phase 0 changes have merged with green CI (or, if CI is not yet configured at Phase 0 entry, with a documented manual verification log).

---

## Phase 1 — Strict TypeScript + Shared configs + Migrations

### M1-01 · Workspace skeleton in place

> `pnpm-workspace.yaml` exists at repo root. Root `package.json` declares `"packageManager": "pnpm@<version>"`. `turbo.jsonc` (or `turbo.json`) at root.

### M1-02 · `apps/web/` mounted

> `zedos/nextjs_space/` has been moved to `apps/web/` (or stays at the old location with explicit cross-references that hold). New code goes in `apps/web/`.

### M1-03 · Shared tsconfig package exists with `strict: true`

> `packages/tsconfig/base.json` declares `"strict": true, "noUncheckedIndexedAccess": true`. Each app and package extends it.

### M1-04 · `Result<T, E>` migration path ready

> `neverthrow` is installed as a dependency, OR the local `Result<T, E>` has been audited for variance soundness AND a deprecation plan is in place. The 117 `as any` count from `docs/retro/zedos-monorepo-retro.md` finding #20 has a tracked remediation Plan.

### M1-05 · Prisma migrations baseline committed

> `prisma/migrations/` directory exists with a baseline migration. `prisma migrate dev` succeeds locally.

### M1-06 · Shared eslint-config + vitestconfig packages exist

> `packages/eslint-config/` (with `boundaries.cjs`) and `packages/vitestconfig/` exist and are consumed by `apps/web` and any new package.

### M1-07 · `EventBus` decision recorded

> Either `EventBus` is deleted (per the retro recommendation for v0) OR a Plan exists to actually publish events from at least two use cases. The dead code (per `docs/retro/zedos-monorepo-retro.md` finding #22) is no longer ambiguous.

---

## Phase 2 — Vendor wrappers + Contracts + DI + Auth migration

### M2-01 · `packages/contracts/` complete

> `packages/contracts/` covers all 10 contexts: `auth`, `credits`, `project`, `prd`, `adr`, `payments`, `ai`, `share`, `feedback`, `questions`. Per finding #16.

### M2-02 · `packages/sdk-stripe/` exists and replaces raw Stripe

> No `import Stripe from 'stripe'` exists outside `packages/sdk-stripe/`. The wrapper returns `Result<T, ExternalServiceError>` and validates responses with zod.

### M2-03 · `packages/sdk-ai/` exists and replaces `lib/ai-service.ts`

> No raw `fetch` to AI providers exists outside `packages/sdk-ai/`. Streamed JSON is validated against `contracts/ai/` schemas.

### M2-04 · `packages/auth/` exists and replaces NextAuth-in-`lib/`

> better-auth is installed and configured under `packages/auth/`. NextAuth has been removed (or is in active replacement with a documented cutover date). `(session.user as any).id` casts are gone (finding #37).

### M2-05 · Composition root in `apps/web/lib/composition.ts`

> Routes consume singletons from a composition root. No `new <X>Repository(prisma); new <Y>UseCase(repo)` per request (finding #33).

### M2-06 · `packages/persistence/` exists with mappers per aggregate

> Per-aggregate mappers exist for every domain object (finding #29). `Prisma.<Model>` types do not leak past `packages/persistence/`.

### M2-07 · `packages/ui/` exists or `apps/web/src/ui/` adopts

> UI primitives moved out of `apps/web/components/` into `packages/ui/` or `apps/web/src/ui/`. `components.json` aliases corrected.

### M2-08 · ESLint boundaries set to `error` for cross-layer violations

> `boundaries/no-crossing` is `"error"` for the import matrix in `72-hexagonal-boundaries.mdc` §3. CI fails on any violation.

---

## Phase 3 — Critical behavior fixes (concurrency-safe ledger + Stripe webhook)

### M3-01 · Drizzle migration of credit ledger ready

> A Plan exists describing the move from `lib/credits.ts` + `src/infrastructure/persistence/credits-repository.ts` to a single Drizzle-backed `creditTransactions` append-only ledger (per `75-drizzle.mdc` §5). Concurrency tests are written.

### M3-02 · `prisma.$transaction` + `SELECT … FOR UPDATE` (transitional) deployed if Phase 3 is partial

> If Phase 3 ships in two parts (Prisma fix first, Drizzle migration second), the Prisma transaction + row lock is deployed and proven under concurrent load before any new feature work hits credit paths.

### M3-03 · Stripe webhook endpoint live

> `app/api/stripe/webhook/route.ts` (or post-migration equivalent) exists with `stripe.webhooks.constructEvent` + signature verification + idempotency on `event.id`. Credit grants are gated on `checkout.session.completed`.

### M3-04 · `Idempotency-Key` set on outbound Stripe calls

> Every `stripe.<resource>.create` call is invoked with an explicit `Idempotency-Key` derived from a stable id (purchase id / event id / user-action id).

### M3-05 · Deduct-after-success on AI calls

> Credit deduction in clarify and generate-prd flows happens **after** AI completion succeeds, not before. AI failures do not charge.

### M3-06 · Rate limiting middleware

> `middleware.ts` (or post-migration equivalent) enforces rate limits per route family (signup, login, clarify, generate-prd, share creation), webhook excluded.

### M3-07 · `noindex` enforced on share pages

> `/share/*` carries `metadata.robots = { index: false, follow: false }` and `X-Robots-Tag: noindex, nofollow` header.

### M3-08 · SignUp transactional

> User creation + starter credit grant runs in a single transaction (or Saga with explicit compensations).

---

## Cross-phase

### XC-01 · Approved by user

> The user has explicitly approved entry into the phase. Migration phases are not autonomous — each phase entry requires a deliberate decision (per `.cursor/rules/00-siso.mdc` and `.cursor/rules/80-change-policy.mdc`).

### XC-02 · Roll-back path documented

> Each phase has a documented roll-back path (which migrations to roll back, which package versions to pin, which feature flags to disable).

### XC-03 · Discovery work paused on phase boundary

> No active `/feature-area scaffold-slices` or `/implement` runs during the phase boundary. Discovery resumes after the phase merges.

---

## Summary output

```txt
## Migration Readiness Check — Phase <N>

| Check | Result | Notes |
|-------|--------|-------|
| M<N>-01 | PASS  |      |
| M<N>-02 | FAIL  | <reason> |
| ...     |       |      |
| XC-01   | PASS  |      |

**Advancement verdict:** CLEAR | BLOCKED
**First failing check (if BLOCKED):** <ID> — <reason>

Next recommended action:
- CLEAR → start Phase <N> implementation Plans
- BLOCKED → resolve <first failing check> before phase entry
```

---

## Hard rules

- No file writes — checker output is chat-only.
- A FAIL on any check blocks the phase. Per-PR `pr-readiness-checker.md` does not substitute.
- Phase 0 (`M0-01`) is the most consequential check in this entire framework — secret rotation must be irrefutably complete before any further work touches the credentialed services.
- Migration phases run in order: Phase 0 → Phase 1 → Phase 2 → Phase 3. Skipping a phase is forbidden.
