---
name: add-test
description: Adds a Vitest unit, integration, or contract test, or a Playwright e2e test. Colocated per .cursor/rules/78-testing.mdc; coverage floors enforced; concurrency tests mandatory for ledger code.
disable-model-invocation: true
---

# Add Test

Use when the Plan's `Tests` section names a new test file. Match the test type to the layer being tested (per `.cursor/rules/78-testing.mdc` §2).

## When to use

- The Plan's `Tests` table names a new `*.test.ts`, `*.spec.ts`, `*.contract.test.ts`, or `e2e/*.spec.ts`.
- A use case ships without a test (refuse — every new use case ships with at least one unit test).
- Concurrency-critical code ships without a concurrent integration test (refuse).

## Read first

- `.cursor/rules/78-testing.mdc` (canonical conventions)
- `.cursor/rules/73-result-rop.mdc` (Result-returning code is naturally test-friendly)

## Recipe by test type

### Unit test (default for `domain/`, `application/`)

Pure, fast, deterministic. Mocks ports via `vi.fn()` or hand-written stubs.

```typescript
// src/application/credits/purchase-credits.usecase.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ok, err } from '@shared/result';
import { NotFoundError, InsufficientCreditsError } from '@shared/errors';
import { purchaseCreditsUseCase } from './purchase-credits.usecase';

describe('purchaseCreditsUseCase', () => {
  function makeDeps(overrides = {}) {
    return {
      creditPackRepo: { findById: vi.fn().mockResolvedValue(ok({ id: 'p1', name: '100', priceEur: 12 })) },
      purchaseRepo: { save: vi.fn().mockResolvedValue(ok(undefined)) },
      paymentClient: {
        createCheckoutSession: vi.fn().mockResolvedValue(ok({ id: 'cs_1', url: 'https://stripe/test' })),
      },
      ...overrides,
    };
  }

  it('returns NotFoundError when pack does not exist', async () => {
    const deps = makeDeps({ creditPackRepo: { findById: vi.fn().mockResolvedValue(ok(null)) } });
    const result = await purchaseCreditsUseCase({ packId: 'unknown' }, 'user-1', deps);
    expect(result.isErr()).toBe(true);
    expect(result.error).toBeInstanceOf(NotFoundError);
  });

  it('returns sessionUrl on success', async () => {
    const result = await purchaseCreditsUseCase({ packId: 'p1' }, 'user-1', makeDeps());
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().sessionUrl).toBe('https://stripe/test');
  });
});
```

Discipline:

- < 50ms per test. Slow unit test → it's secretly an integration test; relabel.
- One assertion per intent (multiple expects to verify the same behavior is fine).
- No real network, no real DB, no real time (`vi.useFakeTimers()` when time matters).

### Integration test (default for `infrastructure/`, `application/` with real adapters)

Test container or real-ish adapter; one test owns its setup + teardown.

```typescript
// packages/persistence/src/credits/__tests__/credits.integration.ts
import { describe, beforeAll, afterAll, beforeEach, it, expect } from 'vitest';
import { setupTestDb, type TestDb } from '@zedos/test-helpers';
import { CreditsDrizzleRepository } from '../credits-drizzle.repository';

describe('CreditsDrizzleRepository (integration)', () => {
  let testDb: TestDb;
  let repo: CreditsDrizzleRepository;

  beforeAll(async () => { testDb = await setupTestDb(); });
  afterAll(async () => { await testDb.close(); });
  beforeEach(async () => { await testDb.reset(); });

  it('grant + deduct round-trips correctly', async () => {
    await repo.grantCredits({ userId: 'u1', amount: 100, reason: 'seed', correlationId: 'seed-1' });
    const result = await repo.deductCredits({ userId: 'u1', amount: 30, reason: 'op', correlationId: 'op-1' });
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().newBalance).toBe(70);
  });
});
```

### Concurrent integration test (mandatory for credit / payment / quota)

Per `.cursor/rules/75-drizzle.mdc` §5 + `78-testing.mdc` §7:

```typescript
it('two parallel deductions cannot double-spend', async () => {
  await repo.grantCredits({ userId: 'u1', amount: 10, reason: 'seed', correlationId: 'seed' });

  const [r1, r2] = await Promise.all([
    repo.deductCredits({ userId: 'u1', amount: 7, reason: 'A', correlationId: 'a' }),
    repo.deductCredits({ userId: 'u1', amount: 7, reason: 'B', correlationId: 'b' }),
  ]);

  const succeeded = [r1, r2].filter((r) => r.isOk());
  expect(succeeded).toHaveLength(1); // only one wins; the other gets InsufficientCreditsError
});
```

### Contract test (for every schema in `contracts/`)

```typescript
// contracts/credits/purchase.contract.test.ts
import { describe, it, expect } from 'vitest';
import { CreatePurchaseRequestSchema } from './purchase';
import validFixture from './__fixtures__/create-purchase-request.valid.json';

describe('CreatePurchaseRequestSchema', () => {
  it('parses a valid request', () => {
    expect(CreatePurchaseRequestSchema.safeParse(validFixture).success).toBe(true);
  });
});
```

Fixtures must be real — see `add-zod-contract`.

### E2E test (Playwright, for critical user journeys)

```typescript
// apps/web/e2e/credits-purchase.spec.ts
import { test, expect } from '@playwright/test';

test('signup → first PRD → credit deduct → share link', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('input[name="email"]', `e2e-${Date.now()}@example.com`);
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
  // ... continue the journey
  await expect(page.getByText(/share link/i)).toBeVisible();
});
```

E2E tests run pre-PR (per `78-testing.mdc` §2). Stripe in test mode; AI via MSW.

## Coverage floors

Per `.cursor/rules/78-testing.mdc` §4:

| Layer | Statement floor | Branch floor |
|-------|-----------------|--------------|
| `domain/` | 90% | 80% |
| `application/` | 85% | 70% |
| `infrastructure/<vendor>/` | 80% | 60% |
| `infrastructure/persistence/` | 75% | 50% |
| `app/` | 70% | 50% |

New code lands at or above the floor. CI fails if a PR drops below.

## Verify

Route to `verifier`. The verifier runs `pnpm test` plus coverage check.

## Hard rules

- New code ships with tests. A use case without a unit test is incomplete.
- Concurrency-critical code ships with at least one concurrent integration test.
- Every schema in `contracts/` ships with a contract test.
- Tests compile under `strict: true` (no `as any`).
- No real logger calls — `vi.fn()` mocks (except for explicit logging-assertion tests).
- Halt-on-first-failure for unit + integration; E2E may continue past failures (per `verifier`).
