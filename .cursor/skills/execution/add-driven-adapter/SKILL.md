---
name: add-driven-adapter
description: Adds an outbound adapter (DB repository, vendor SDK wrapper, HTTP client) that implements a domain port. Returns Result<T,E>; validates external responses with zod; exposes a single entry per vendor.
disable-model-invocation: true
---

# Add Driven Adapter

Use when the Plan adds a new outbound adapter — a repository implementing a domain port, a vendor SDK wrapper (Stripe, AI provider, email), or an HTTP client to an external service. Driven adapters live in `infrastructure/` (pre-migration) or per-vendor packages (post-migration: `packages/persistence/`, `packages/sdk-stripe/`, `packages/sdk-ai/`, `packages/auth/`).

For Drizzle repositories specifically, route to `add-driven-adapter` for the shape and `add-drizzle-migration` for the schema change.

## When to use

- The Plan adds a file under `infrastructure/persistence/` (pre-migration) or `packages/persistence/src/<context>/` (post-migration).
- The Plan adds a vendor SDK wrapper under `infrastructure/<vendor>/` (pre-migration) or `packages/sdk-<vendor>/` (post-migration).
- The Plan adds a port implementation defined in `domain/<context>/`.

## Read first

- `.cursor/rules/72-hexagonal-boundaries.mdc` §3 (`infrastructure/` import matrix)
- `.cursor/rules/73-result-rop.mdc` (every method returns `Result<T, ApplicationError>`)
- `.cursor/rules/74-contracts-zod.mdc` (every external response validated)
- `.cursor/rules/75-drizzle.mdc` (when persistence is touched)

## Recipe

### Step 1 — Confirm the port

The port lives in `domain/<context>/<resource>.repository.ts` (or `<vendor>.client.ts`). Example:

```typescript
// domain/credits/credits.repository.ts (port)
export interface CreditsRepository {
  getBalance(userId: string): Promise<Result<CreditBalance, ApplicationError>>;
  deductCredits(input: DeductCreditsInput): Promise<Result<{ newBalance: number }, ApplicationError>>;
  // ...
}
```

If the port doesn't exist, add it in `domain/` first.

### Step 2 — Confirm the contracts

Every external response (Stripe, AI, third-party HTTP) needs a zod schema in `contracts/<vendor>/`. Validate before returning.

### Step 3 — Author the adapter

For a Drizzle repository (post-migration target):

```typescript
// packages/persistence/src/credits/credits-drizzle.repository.ts
import { sql } from 'drizzle-orm';
import { ok, err, Result } from '@zedos/shared/result';
import { ApplicationError, ExternalServiceError, InsufficientCreditsError } from '@zedos/shared/errors';

import type { CreditsRepository, DeductCreditsInput } from '@zedos/domain/credits';
import { CreditsDomainService } from '@zedos/domain/credits';
import { creditTransactions, creditBalances } from '@zedos/database';
import { CreditBalanceMapper } from './credit-balance.mapper';

export class CreditsDrizzleRepository implements CreditsRepository {
  constructor(private readonly db: Database) {}

  async deductCredits(input: DeductCreditsInput): Promise<Result<{ newBalance: number }, ApplicationError>> {
    return this.db.transaction(async (tx) => {
      const [locked] = await tx.execute<{ balance: number; grace_used: Date | null }>(
        sql`SELECT balance, grace_used FROM credit_balances WHERE user_id = ${input.userId} FOR UPDATE`
      );
      if (!locked) return err(new ExternalServiceError('database', 'no balance row'));

      if (!CreditsDomainService.canDeduct(locked.balance, input.amount, locked.grace_used)) {
        return err(new InsufficientCreditsError(input.amount, locked.balance));
      }

      await tx.insert(creditTransactions).values({
        userId: input.userId,
        amount: -input.amount,
        reason: input.reason,
        correlationId: input.correlationId,
      });

      await tx.execute(
        sql`UPDATE credit_balances SET balance = balance - ${input.amount}, updated_at = NOW() WHERE user_id = ${input.userId}`
      );

      const [{ balance }] = await tx.execute<{ balance: number }>(
        sql`SELECT balance FROM credit_balances WHERE user_id = ${input.userId}`
      );

      return ok({ newBalance: balance });
    });
  }

  // ... other methods
}
```

For a vendor SDK wrapper (Stripe example):

```typescript
// packages/sdk-stripe/src/stripe-client.ts
import Stripe from 'stripe';
import { ok, err, Result } from '@zedos/shared/result';
import { ExternalServiceError } from '@zedos/shared/errors';
import { CheckoutSessionSchema } from '@zedos/contracts/payments';

export class StripeClient {
  private readonly client: Stripe;

  constructor(secretKey: string, apiVersion: string) {
    this.client = new Stripe(secretKey, { apiVersion: apiVersion as Stripe.LatestApiVersion });
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<Result<CheckoutSession, ExternalServiceError>> {
    try {
      const raw = await this.client.checkout.sessions.create({
        mode: 'payment',
        line_items: [/* ... */],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: input.metadata,
      }, {
        idempotencyKey: input.idempotencyKey, // mandatory per .cursor/rules/72-hexagonal-boundaries.mdc + retro #48
      });

      const validated = CheckoutSessionSchema.safeParse(raw);
      if (!validated.success) {
        return err(new ExternalServiceError('stripe', `invalid session: ${validated.error.message}`));
      }
      return ok(validated.data);
    } catch (e) {
      const message = e instanceof Stripe.errors.StripeError ? e.message : 'unknown error';
      const statusCode = e instanceof Stripe.errors.StripeError ? 402 : 502;
      return err(new ExternalServiceError('stripe', message, statusCode));
    }
  }
}
```

### Step 4 — Author the mapper (persistence adapters)

Per-aggregate mappers convert row → domain entity. Drizzle row types must not leak past the adapter.

```typescript
// packages/persistence/src/credits/credit-balance.mapper.ts
import type { CreditBalance } from '@zedos/domain/credits';

export const CreditBalanceMapper = {
  toDomain(row: typeof creditBalances.$inferSelect): CreditBalance {
    return {
      userId: row.userId,
      balance: row.balance,
      graceUsed: row.graceUsed ?? null,
      updatedAt: row.updatedAt,
    };
  },
};
```

### Step 5 — Tests

Per `78-testing.mdc` §2:

- **Unit + Contract tests** for vendor SDK wrappers (mock the SDK, assert response validation against fixtures).
- **Integration tests** for repositories (real test container per `78-testing.mdc` §5.2).
- **Concurrent integration tests** for credit / payment / quota repositories (mandatory per `75-drizzle.mdc` §5).

### Step 6 — Verify

Route to `verifier`.

## Failure modes

| Failure | Fix |
|---------|-----|
| Adapter throws on SDK error | Wrap in `try`; return `err(new ExternalServiceError(...))` |
| Response not validated | Add `safeParse` against the schema in `contracts/<vendor>/` |
| Stripe call without `idempotencyKey` | Add the key (derived from a stable id) |
| Adapter returns Drizzle row type | Add a mapper |
| No concurrent test for ledger code | Add it before requesting verifier |

## Hard rules

- One vendor wrapper per file. `StripeClient` lives in exactly one place.
- Every method returns `Result<T, ApplicationError>`.
- Every external response is `safeParse`d against a `contracts/` schema.
- Stripe calls carry an `idempotencyKey`.
- Drizzle row types live behind mappers — they do not cross into `domain/` or `application/`.
