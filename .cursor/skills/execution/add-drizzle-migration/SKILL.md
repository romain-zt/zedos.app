---
name: add-drizzle-migration
description: Adds a Drizzle schema change + generates a migration file. Forward-only; one logical change per migration; expand–migrate–contract pattern for column drops/renames. Use when the Plan introduces a schema change.
disable-model-invocation: true
---

# Add Drizzle Migration

Use when the Plan's `Migrations` section names a new schema change. Schema changes ship in PRs that **only** modify schema + generated migration + minimal adapter wiring (per `.cursor/rules/79-pr-sizing.mdc` §6.3).

For pre-migration Prisma changes, the equivalent skill is "add-prisma-migration" (not authored — pre-migration Prisma changes follow the same discipline using `prisma migrate dev`; see `75-drizzle.mdc` §7).

## When to use

- The Plan adds, modifies, or drops a column / table / index.
- The Plan touches `packages/database/src/schema/`.
- The codebase is post-migration (Phase 1+ of `docs/retro/zedos-monorepo-retro.md`).

## Read first

- `.cursor/rules/75-drizzle.mdc` (canonical patterns)
- `.cursor/rules/79-pr-sizing.mdc` §6.3 (one migration per PR)

## Recipe

### Step 1 — Edit the schema file

Schema lives under `packages/database/src/schema/<context>.ts`. Edit per `75-drizzle.mdc` §3 conventions:

```typescript
// packages/database/src/schema/credits.ts
import { pgTable, uuid, integer, timestamp, text, index } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const creditBalances = pgTable('credit_balances', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  balance: integer('balance').notNull().default(0),
  graceUsed: timestamp('grace_used', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const creditTransactions = pgTable(
  'credit_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    reason: text('reason').notNull(),
    correlationId: text('correlation_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUserCreated: index('credit_tx_user_created_idx').on(t.userId, t.createdAt),
    byCorrelation: index('credit_tx_correlation_idx').on(t.correlationId),
  })
);
```

Hard rules:

- Snake-case column names; camelCase TypeScript identifiers.
- `withTimezone: true` on every timestamp.
- `onDelete: 'cascade'` on FKs to user tables.
- Named indexes: `<table-prefix>_<column>_idx`.
- `correlation_id` on every event/transaction table.

### Step 2 — Generate the migration

```bash
cd packages/database
pnpm drizzle-kit generate
```

Produces `packages/database/src/migrations/NNNN_<auto-name>.sql`. Rename `NNNN_<auto-name>.sql` to `NNNN_<descriptive-name>.sql` if the auto-name is generic.

### Step 3 — Inspect the generated migration

Open the SQL file. Verify:

- One logical change.
- No `DROP COLUMN` for a column the code still references.
- No `ALTER COLUMN` that breaks existing data (if data migration is needed, write it as a separate migration step).
- All `CREATE INDEX` statements specify `CONCURRENTLY` for production-sized tables (Drizzle supports this; verify).

For column drops or renames, the **expand–migrate–contract pattern** spans multiple PRs:

| Step | PR | Migration |
|------|-----|-----------|
| Expand | PR #1 | Add new column (nullable) |
| Migrate | PR #2 | Backfill values; deploy code reading new column |
| Contract | PR #3 | Drop old column |

Never collapse expand–migrate–contract into a single migration.

### Step 4 — Apply locally + run tests

```bash
pnpm db:migrate          # applies migrations to local dev DB
pnpm test:integration    # runs persistence integration tests against the new schema
```

If integration tests fail, **fix the migration** (edit the SQL or regenerate) — do not patch tests around a broken migration.

### Step 5 — Test concurrency for ledger / payment / quota changes

Per `75-drizzle.mdc` §5, any change to credit / payment / quota tables ships with at least one concurrent integration test demonstrating the row lock holds:

```typescript
// packages/persistence/src/credits/__tests__/concurrent-deduct.integration.ts
import { describe, it, expect } from 'vitest';

describe('credit ledger concurrency', () => {
  it('two parallel deductions do not double-spend', async () => {
    const repo = new CreditsDrizzleRepository(testDb);
    await repo.grantCredits({ userId: U, amount: 10, reason: 'seed', correlationId: 'seed-1' });

    const [r1, r2] = await Promise.all([
      repo.deductCredits({ userId: U, amount: 7, reason: 'op-A', correlationId: 'a-1' }),
      repo.deductCredits({ userId: U, amount: 7, reason: 'op-B', correlationId: 'b-1' }),
    ]);

    const succeeded = [r1, r2].filter((r) => r.isOk());
    expect(succeeded).toHaveLength(1); // only one of the two can succeed at balance 10 with cost 7
  });
});
```

### Step 6 — Verify

Route to `verifier`.

## Failure modes

| Failure | Fix |
|---------|-----|
| Migration drops a column referenced by code in the same release | Split into expand–migrate–contract |
| Migration mixes multiple logical changes | Split into multiple files |
| Auto-name is too generic | Rename to `NNNN_<descriptive>.sql` |
| Index missing on FK column | Add it explicitly |
| Concurrent test missing for ledger change | Add it before verifier |

## Hard rules

- Forward-only. Down migrations are not maintained in v0.
- One logical change per migration.
- Multi-step expand–migrate–contract for column drops/renames.
- Concurrent integration test mandatory for credit / payment / quota schema changes.
- Schema migration PRs touch only schema + generated migration + minimal adapter wiring.
