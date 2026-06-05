<!--
  Implementation Plan — Turborepo Migration Phase 2: Prisma → Drizzle ORM
  Parent Scope Slice: docs/product/scope-slices/turborepo-migration--phase-2-drizzle.md
  Authored per: .cursor/templates/execution/implementation-plan.template.md
  Governed by: .cursor/rules/70-execution-bridge.mdc, 75-drizzle.mdc
  Prisma schema source: apps/web/prisma/schema.prisma (moved to packages/db/prisma/ in Phase 1)
  PR split: ~3 PRs (schema+config → repositories → cleanup+verification)
-->

# Implementation Plan: Turborepo Migration — Phase 2: Drizzle ORM

## Parent Scope Slice

[docs/product/scope-slices/turborepo-migration--phase-2-drizzle.md](../../product/scope-slices/turborepo-migration--phase-2-drizzle.md)

## Status

`executed`

> **Layout in effect:** post-Phase-1 (packages/db/ exists with Prisma schema; all persistence repos import from @repo/db)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Replace Prisma with Drizzle ORM inside `packages/db/`. The Prisma schema (moved to `packages/db/prisma/schema.prisma` in Phase 1) is translated to equivalent Drizzle table definitions. Repository adapters in `apps/web/src/infrastructure/persistence/` are rewritten from Prisma to Drizzle. No application layer, use-case, or route handler changes.

**PR split:**

- **PR-1 (schema + config):** Add Drizzle schema files + `drizzle.config.ts` to `packages/db/`; generate baseline migration; keep Prisma client in parallel temporarily
- **PR-2 (repository rewrites):** Rewrite all 6 persistence adapters from Prisma → Drizzle; `CreditRepository` gets `SELECT FOR UPDATE` transaction; delete `apps/web/lib/prisma.ts`
- **PR-3 (cleanup + verification):** Remove `@prisma/client` from `packages/db/package.json`; remove `prisma` from `apps/web/package.json` devDeps; update `turbo.jsonc` to remove `generate` entry; final `pnpm build` + `pnpm typecheck` green; update `docs/state/status.json`

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (replacing Prisma) |
| Auth source-of-truth | NextAuth (unchanged — better-auth is Phase 3) |
| Async/sync boundary | Unchanged |
| Transaction boundary | `CreditRepository` gains explicit Drizzle transaction + row-level lock (`SELECT ... FOR UPDATE`) |
| External dependencies | `drizzle-orm`, `drizzle-kit`, `postgres` (or `pg`) driver |
| Payment shape | n/a |

---

## Layers Affected

- [ ] `domain` — none (interfaces unchanged; Prisma types replaced by Drizzle-inferred types at infrastructure boundary)
- [ ] `application` — none (use-cases unchanged)
- [ ] `contracts` — none
- [x] `infrastructure` — all 6 persistence adapters rewritten
- [ ] `app` (routes, server actions) — none
- [ ] `ui` — none
- [x] `shared` — `apps/web/lib/prisma.ts` deleted; `apps/web/lib/db.ts` updated

---

## Drizzle Schema Translation (from packages/db/prisma/schema.prisma)

The following Drizzle schema files are created under `packages/db/src/schema/`. Each maps exactly to its Prisma model with no semantic changes.

### `packages/db/src/schema/users.ts`

```typescript
import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:                    text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email:                 text('email').notNull().unique(),
  passwordHash:          text('password_hash').notNull(),
  name:                  text('name').notNull(),
  creditBalance:         integer('credit_balance').notNull().default(0),
  starterCreditsGranted: boolean('starter_credits_granted').notNull().default(false),
  graceUsed:             boolean('grace_used').notNull().default(false),
  createdAt:             timestamp('created_at').notNull().defaultNow(),
  updatedAt:             timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### `packages/db/src/schema/projects.ts`

```typescript
import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const projects = pgTable('projects', {
  id:                    text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:                text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:                  text('name').notNull(),
  description:           text('description'),
  phase:                 text('phase').notNull().default('intake'),
  architectureStartedAt: timestamp('architecture_started_at'),
  createdAt:             timestamp('created_at').notNull().defaultNow(),
  updatedAt:             timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (t) => [index('projects_user_id_idx').on(t.userId)]);
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
```

### `packages/db/src/schema/prd-versions.ts`

```typescript
import { pgTable, text, integer, json, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const prdVersions = pgTable('prd_versions', {
  id:            text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId:     text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  content:       json('content'),
  status:        text('status').notNull().default('draft'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
  updatedAt:     timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (t) => [
  unique('prd_versions_project_version_unique').on(t.projectId, t.versionNumber),
  index('prd_versions_project_id_idx').on(t.projectId),
]);
```

### `packages/db/src/schema/question-history.ts`

```typescript
import { pgTable, text, json, timestamp, index } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { prdVersions } from './prd-versions';

export const questionHistory = pgTable('question_history', {
  id:                  text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId:           text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  prdVersionId:        text('prd_version_id').references(() => prdVersions.id, { onDelete: 'set null' }),
  structuredQuestion:  text('structured_question').notNull(),
  availableOptions:    json('available_options'),
  founderAnswer:       text('founder_answer'),
  optionalComment:     text('optional_comment'),
  aiInterpretation:    text('ai_interpretation'),
  prdImpact:           text('prd_impact'),
  questionType:        text('question_type').notNull().default('clarification'),
  createdAt:           timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('question_history_project_id_idx').on(t.projectId),
  index('question_history_prd_version_id_idx').on(t.prdVersionId),
]);
```

### `packages/db/src/schema/credits.ts`

```typescript
import { pgTable, text, integer, json, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const creditTransactions = pgTable('credit_transactions', {
  id:            text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:        text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:          text('type').notNull(),
  amount:        integer('amount').notNull(),
  balanceAfter:  integer('balance_after').notNull(),
  operationType: text('operation_type'),
  metadata:      json('metadata'),
  correlationId: text('correlation_id'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('credit_transactions_user_id_idx').on(t.userId),
  index('credit_transactions_created_at_idx').on(t.createdAt),
  unique('credit_transactions_user_correlation_idx').on(t.userId, t.correlationId),
]);

export const processedWebhookEvents = pgTable('processed_webhook_events', {
  id:          text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId:     text('event_id').notNull().unique(),
  eventType:   text('event_type').notNull(),
  processedAt: timestamp('processed_at').notNull().defaultNow(),
}, (t) => [index('processed_webhook_events_processed_at_idx').on(t.processedAt)]);
```

### `packages/db/src/schema/purchases.ts`

```typescript
import { pgTable, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const purchases = pgTable('purchases', {
  id:                     text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:                 text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  packSize:               integer('pack_size').notNull(),
  amountEur:              integer('amount_eur').notNull(),
  stripePaymentIntentId:  text('stripe_payment_intent_id'),
  stripeSessionId:        text('stripe_session_id'),
  status:                 text('status').notNull().default('pending'),
  createdAt:              timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('purchases_user_id_idx').on(t.userId),
  index('purchases_stripe_session_id_idx').on(t.stripeSessionId),
]);

export const autoReloadPreferences = pgTable('auto_reload_preferences', {
  id:                     text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:                 text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  enabled:                boolean('enabled').notNull().default(false),
  packSize:               integer('pack_size').notNull().default(100),
  thresholdCredits:       integer('threshold_credits').notNull().default(5),
  stripePaymentMethodId:  text('stripe_payment_method_id'),
  stripeCustomerId:       text('stripe_customer_id'),
  createdAt:              timestamp('created_at').notNull().defaultNow(),
  updatedAt:              timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});
```

### `packages/db/src/schema/feedback.ts`

```typescript
import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';
import { prdVersions } from './prd-versions';

export const milestoneFeedback = pgTable('milestone_feedback', {
  id:            text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:        text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId:     text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  prdVersionId:  text('prd_version_id').references(() => prdVersions.id, { onDelete: 'set null' }),
  milestoneType: text('milestone_type').notNull(),
  ratingType:    text('rating_type').notNull().default('stars'),
  ratingValue:   integer('rating_value'),
  comment:       text('comment'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
}, (t) => [index('milestone_feedback_user_milestone_idx').on(t.userId, t.milestoneType)]);
```

### `packages/db/src/schema/share.ts`

```typescript
import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { prdVersions } from './prd-versions';

export const shareLinks = pgTable('share_links', {
  id:           text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  prdVersionId: text('prd_version_id').notNull().references(() => prdVersions.id, { onDelete: 'cascade' }),
  token:        text('token').notNull().unique(),
  enabled:      boolean('enabled').notNull().default(true),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  disabledAt:   timestamp('disabled_at'),
}, (t) => [index('share_links_token_idx').on(t.token)]);
```

### `packages/db/src/schema/adrs.ts`

```typescript
import { pgTable, text, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const adrs = pgTable('adrs', {
  id:         text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId:  text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  adrNumber:  integer('adr_number').notNull(),
  title:      text('title').notNull(),
  content:    text('content').notNull(),
  status:     text('status').notNull().default('draft'),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
  updatedAt:  timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (t) => [
  unique('adrs_project_adr_number_unique').on(t.projectId, t.adrNumber),
  index('adrs_project_id_idx').on(t.projectId),
]);
```

> **Note:** The `integer` import is missing from the `adrs` schema above — add it to the import line: `import { pgTable, text, integer, timestamp, unique, index } from 'drizzle-orm/pg-core';`

---

## Touched Files (exact paths)

### PR-1: Drizzle schema + config (base: main post-Phase-1)

| Path | Operation | Notes |
|------|-----------|-------|
| `packages/db/package.json` | Modify | Add deps: `drizzle-orm@^0.38`, `postgres@^3` (or `pg@^8`); add devDeps: `drizzle-kit@^0.28` |
| `packages/db/drizzle.config.ts` | Create | `{ schema: './src/schema/index.ts', out: './src/migrations', dialect: 'postgresql', dbCredentials: { url: process.env.DATABASE_URL! } }` |
| `packages/db/src/schema/users.ts` | Create | See Drizzle schema above |
| `packages/db/src/schema/projects.ts` | Create | See above |
| `packages/db/src/schema/prd-versions.ts` | Create | See above |
| `packages/db/src/schema/question-history.ts` | Create | See above |
| `packages/db/src/schema/credits.ts` | Create | See above |
| `packages/db/src/schema/purchases.ts` | Create | See above |
| `packages/db/src/schema/feedback.ts` | Create | See above |
| `packages/db/src/schema/share.ts` | Create | See above |
| `packages/db/src/schema/adrs.ts` | Create | See above |
| `packages/db/src/schema/index.ts` | Create | Barrel: `export * from './users'; export * from './projects'; ... (all 9 files)` |
| `packages/db/src/client.ts` | Modify | Add Drizzle client alongside Prisma (temporarily parallel): `import { drizzle } from 'drizzle-orm/postgres-js'; import postgres from 'postgres'; const queryClient = postgres(process.env.DATABASE_URL!); export const drizzleDb = drizzle(queryClient, { schema });` |
| `packages/db/src/migrations/0000_baseline.sql` | Create | Generated by `drizzle-kit generate` — document command: `cd packages/db && pnpm drizzle-kit generate` |
| `packages/db/src/index.ts` | Modify | Export `drizzleDb` as `db` alias; keep `prismaDb` re-export during transition |

### PR-2: Repository rewrites (base: PR-1)

| Path | Operation | Notes |
|------|-----------|-------|
| `apps/web/src/infrastructure/persistence/user-repository.ts` | Rewrite | Replace all `prisma.user.*` calls with `db.select().from(users)`, `db.insert(users)`, `db.update(users)`, `db.delete(users)` using Drizzle; `eq(users.email, email)` predicates |
| `apps/web/src/infrastructure/persistence/project-repository.ts` | Rewrite | Same pattern for `projects` table |
| `apps/web/src/infrastructure/persistence/prd-repository.ts` | Rewrite | `prdVersions` table; include `questionHistory` join for version queries |
| `apps/web/src/infrastructure/persistence/credits-repository.ts` | Rewrite | **Critical**: `deductCredits` must use `db.transaction(async (tx) => { await tx.execute(sql\`SELECT id FROM users WHERE id = ${userId} FOR UPDATE\`); ... deduct ... })` pattern; this directly fixes retro finding #24 (credit double-spend); also rewrite `addCredits`, `getBalance`, `recordTransaction` |
| `apps/web/src/infrastructure/persistence/adr-repository.ts` | Rewrite | `adrs` table |
| `apps/web/src/infrastructure/persistence/index.ts` | Modify | Import `db` from `@repo/db` (Drizzle client, not Prisma) |
| `apps/web/lib/prisma.ts` | Delete | No longer needed |
| `apps/web/lib/db.ts` | Modify | `export { db } from '@repo/db'` (re-export Drizzle client for any `lib/db` callers) |
| `apps/web/src/test-helpers/setup-test-db.ts` | Modify | Replace Prisma test setup with Drizzle test setup (migrate on test DB connection) |

### PR-3: Prisma cleanup + verification (base: PR-2)

| Path | Operation | Notes |
|------|-----------|-------|
| `packages/db/package.json` | Modify | Remove `@prisma/client`, `prisma` deps; bump version to `0.1.0` |
| `packages/db/prisma/` | Delete | Entire directory (schema and migrations moved/replaced by Drizzle) |
| `packages/db/src/client.ts` | Modify | Remove all Prisma references; export only Drizzle `db` |
| `packages/db/src/index.ts` | Modify | Export only Drizzle; remove `prismaDb` alias |
| `apps/web/package.json` | Modify | Remove `@prisma/client` dep; remove `prisma` devDep (moved to `packages/db`) |
| `apps/web/prisma/` | Delete (if still exists) | Should already be deleted in Phase 1; verify |
| `turbo.jsonc` | Modify | Remove `generate` pipeline entry (no longer needed for Prisma); add `db:migrate` entry: `"db:migrate": { "cache": false, "dependsOn": [] }` |
| `packages/db/README.md` | Create | Document: `pnpm drizzle-kit generate`, `pnpm drizzle-kit migrate`, `pnpm drizzle-kit studio` |
| `docs/state/status.json` | Modify | Set `phase3.p2 = "complete"` and commit |

---

## Contracts Changed

None — Zod schemas in `@repo/contracts` are unchanged. Repository adapters implement the same domain interfaces with Drizzle instead of Prisma.

---

## Migrations

`packages/db/src/migrations/0000_baseline.sql` — Drizzle migration baseline generated from the Drizzle schema. This SQL must produce the **exact same tables** as the existing Prisma schema. Before applying, verify with:

```bash
cd packages/db
pnpm drizzle-kit check  # must exit 0 against the existing database
```

If `drizzle-kit check` reports drift, reconcile before marking this plan complete.

---

## Dependencies Added

| Package | Workspace | Version | Rationale |
|---------|-----------|---------|-----------|
| `drizzle-orm` | `packages/db` | `^0.38.0` | Locked decision: replace Prisma |
| `drizzle-kit` | `packages/db` (devDep) | `^0.28.0` | Migration generation and schema inspection |
| `postgres` | `packages/db` | `^3.4.0` | Postgres driver for Drizzle (lightweight, compatible with Node.js + edge) |

---

## Tests

Existing tests must pass after each PR. New test:

- `apps/web/src/infrastructure/persistence/credits-repository.integration.test.ts` — **concurrent deduction integration test**: spin up a test DB; insert a user with 10 credits; fire 2 concurrent `deductCredits(5)` calls; assert final balance is 0 (not negative) and exactly 2 transactions recorded. This verifies the `SELECT FOR UPDATE` serialization.

---

## Verification Gates

```bash
# PR-1 gate
pnpm -w run typecheck     # schema types compile; no Drizzle type errors
pnpm -w run build         # apps/web builds (Prisma still active in parallel)

# PR-2 gate
pnpm -w run typecheck
pnpm -w run test          # all unit tests pass; new integration test passes
pnpm -w run build

# PR-3 gate (final)
pnpm -w run typecheck     # no Prisma imports remain in apps/web or packages/db
pnpm -w run build
node -e "require('@repo/db')"   # runtime import succeeds; no prisma bootstrap error
```

---

## Out of Scope

- NextAuth → better-auth migration (Phase 3)
- Adding new tables or schema columns (new slices)
- Changing purchases or Stripe event idempotency tables (credits/payments slice)
- Changing any route handlers, use-case logic, or application contracts

---

## Blocker Protocol

If `drizzle-kit check` reports schema drift, or if `pnpm typecheck` fails after any PR:

1. **Stop** — do not open the next PR
2. Document in `docs/state/HANDOFF.md` under "Current Blocker"
3. Set `docs/state/status.json` → `phase3.p2 = "blocked"` + `phase3.blocker = "<summary>"`
4. Commit and push

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial — Drizzle schema translated from `apps/web/prisma/schema.prisma` (12 Prisma models → 10 Drizzle table files); written for overnight pipeline | local-agent |
