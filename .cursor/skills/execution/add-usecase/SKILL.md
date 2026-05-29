---
name: add-usecase
description: Adds a use case in the application layer with explicit injected ports, Result<T,E> return type, and unit + integration test colocation. Use when implementing new application logic that crosses domain ↔ infrastructure boundaries.
disable-model-invocation: true
---

# Add Use Case

Use when the Plan adds a use case under `application/<context>/<operation>.usecase.ts`. Use cases are the orchestration layer; they call ports, run domain logic, and return `Result<T, E>`.

## When to use

- The Plan's `Layers Affected` includes `application`.
- The Plan's `Touched Files` lists a new `*.usecase.ts` file.
- A route, action, or page needs to perform a multi-step operation with side effects.
- **Phase 4:** Workspace/project flows (`FA-project-workspace`) and clarification pipelines (`FA-guided-clarification`) almost always land here before adding endpoints — pair with `.cursor/agents/execution/fa-project-workspace.md` or `fa-guided-clarification.md` at Plan time.

## Read first

- `.cursor/rules/72-hexagonal-boundaries.mdc` (`application/` import matrix)
- `.cursor/rules/81-critical-flow-extraction.mdc` (multi-step flows belong here, not inline in handlers)
- `.cursor/rules/73-result-rop.mdc` (Result discipline)
- `.cursor/rules/74-contracts-zod.mdc` (input/output types via `z.infer`)
- `.cursor/rules/75-drizzle.mdc` §5 (transactions, when persistence is touched)

## Recipe

### Step 1 — Define the input type via the contract

Use cases accept **already-validated** input (route handlers do the parsing). Type the input via `z.infer<typeof RequestSchema>` from `contracts/`.

If the contract doesn't exist, route to `add-zod-contract` first.

### Step 2 — Identify ports

The use case calls ports defined in `domain/<context>/`. Ports are interfaces — not implementations. If a needed port doesn't exist, define it in `domain/` first; the implementation comes via `add-driven-adapter`.

### Step 3 — Author the use case

```typescript
// src/application/credits/purchase-credits.usecase.ts
import { ok, err, Result } from '@shared/result';
import { ApplicationError, NotFoundError, InsufficientCreditsError } from '@shared/errors';
import { CreatePurchaseRequest } from '@contracts/credits';

import type { CreditPackRepository, PurchaseRepository } from '@domain/credits';
import type { PaymentClient } from '@domain/payments';

interface Deps {
  creditPackRepo: CreditPackRepository;
  purchaseRepo: PurchaseRepository;
  paymentClient: PaymentClient;
}

export async function purchaseCreditsUseCase(
  input: CreatePurchaseRequest,
  userId: string,
  deps: Deps,
): Promise<Result<{ sessionUrl: string }, ApplicationError>> {
  const packResult = await deps.creditPackRepo.findById(input.packId);
  if (packResult.isErr()) return packResult;
  const pack = packResult.unwrap();
  if (!pack) return err(new NotFoundError(`pack ${input.packId} not found`));

  const sessionResult = await deps.paymentClient.createCheckoutSession({
    productName: pack.name,
    amountInCents: pack.priceEur * 100,
    metadata: { userId, packId: pack.id },
  });
  if (sessionResult.isErr()) return sessionResult;

  const session = sessionResult.unwrap();
  const saveResult = await deps.purchaseRepo.save({
    id: crypto.randomUUID(),
    userId,
    packId: pack.id,
    stripeSessionId: session.id,
    status: 'pending',
    createdAt: new Date(),
  });
  if (saveResult.isErr()) return saveResult;

  return ok({ sessionUrl: session.url });
}
```

Hard rules:

- Input type is `z.infer<typeof RequestSchema>` from `contracts/`. Do not redefine the type.
- Returns `Promise<Result<T, E>>` where `E` is a typed `ApplicationError` subclass.
- Imports only from `@domain`, `@contracts`, `@shared`. No `@infrastructure` imports — adapters arrive via `Deps`.
- No `throw` — failures return `err(...)`.
- Multi-step operations with persistence side effects wrap in a transaction (per `75-drizzle.mdc` §5) when atomicity matters.

### Step 4 — Author the unit test

```typescript
// src/application/credits/purchase-credits.usecase.test.ts
import { describe, it, expect, vi } from 'vitest';
import { purchaseCreditsUseCase } from './purchase-credits.usecase';
import { ok, err } from '@shared/result';
import { NotFoundError } from '@shared/errors';

describe('purchaseCreditsUseCase', () => {
  const mockDeps = {
    creditPackRepo: { findById: vi.fn() },
    purchaseRepo: { save: vi.fn() },
    paymentClient: { createCheckoutSession: vi.fn() },
  };

  it('returns NotFoundError when pack does not exist', async () => {
    mockDeps.creditPackRepo.findById.mockResolvedValueOnce(ok(null));
    const result = await purchaseCreditsUseCase({ packId: 'pack-x' }, 'user-1', mockDeps);
    expect(result.isErr()).toBe(true);
    expect(result.error).toBeInstanceOf(NotFoundError);
  });

  it('returns sessionUrl on success', async () => { /* ... */ });
});
```

### Step 5 — (Optional) Add an integration test

When the use case wires real adapters, add a `.integration.ts`:

```typescript
// src/application/credits/purchase-credits.usecase.integration.ts
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { setupTestDb } from '@zedos/test-helpers';
// ...
```

Required when the Plan's `Layers Affected` includes `infrastructure/persistence/` and the use case crosses into it.

### Step 6 — Verify

Route to `verifier`.

## Failure modes

| Failure | Fix |
|---------|-----|
| Use case imports `@infrastructure` directly | Inject port via `Deps`; call from composition root |
| Use case throws | Replace with `err(new ApplicationError(...))` |
| Input typed manually | Use `z.infer<typeof RequestSchema>` |
| No unit test | Add it before requesting verifier |
| Multi-step persistence without transaction | Wrap in `db.transaction(...)` per `75-drizzle.mdc` §5 |

## Hard rules

- Application use cases never import `@infrastructure`. Ports come from `@domain`; implementations arrive via `Deps`.
- Returns `Result<T, E>` with typed `E`. No raw `throw`.
- Tests colocated as `*.usecase.test.ts` (unit) and optionally `*.usecase.integration.ts` (integration).
- One use case per file; one operation per use case.
