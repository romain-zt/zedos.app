---
name: add-zod-contract
description: Adds a new zod schema in contracts/ as the single source of truth for a cross-layer DTO. Includes a contract test with valid + invalid fixtures captured from real responses where applicable. Use when a Plan introduces or modifies any cross-layer type.
disable-model-invocation: true
---

# Add Zod Contract

Use when the Plan introduces a request, response, DTO, or event type that crosses a layer or runtime boundary. Anchor: `.cursor/rules/74-contracts-zod.mdc`.

## When to use

- The Plan's `Contracts Changed` lists a schema add, modify, or remove.
- A new HTTP endpoint, server action, vendor SDK call, or AI streamed response shape is introduced.
- A domain event is added (post-EventBus reactivation — currently dead per `73-result-rop.mdc` §7 / `74-contracts-zod.mdc` §3).

## Read first

- `.cursor/rules/74-contracts-zod.mdc` (canonical conventions)

## Recipe

### Step 1 — Decide the file location

One file per operation, not one mega-file per resource:

```
contracts/<context>/<operation>.ts
```

Examples:

```
contracts/credits/purchase.ts        // CreatePurchaseRequestSchema, PurchaseDTOSchema
contracts/credits/grant.ts           // GrantCreditsRequestSchema
contracts/credits/balance.ts         // CreditBalanceDTOSchema
contracts/payments/checkout.ts       // CreateCheckoutSessionInputSchema, CheckoutSessionResponseSchema
contracts/payments/webhook.ts        // StripeEventSchema (discriminated union over event.type)
contracts/ai/clarification.ts        // ClarifyRequestSchema, ClarifyResponseSchema
```

### Step 2 — Author the schema

```typescript
// contracts/credits/purchase.ts
import { z } from 'zod';
import { IdSchema } from '../shared/common';

// Request: arrives from the client (route handler / server action validates)
export const CreatePurchaseRequestSchema = z.object({
  packId: IdSchema,
});

// DTO: returned to the client (validated before Response.json)
export const PurchaseDTOSchema = z.object({
  id: IdSchema,
  packId: IdSchema,
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
  sessionUrl: z.string().url().optional(),
  createdAt: z.coerce.date(),
});

// Inferred types
export type CreatePurchaseRequest = z.infer<typeof CreatePurchaseRequestSchema>;
export type PurchaseDTO = z.infer<typeof PurchaseDTOSchema>;
```

For events (discriminated union):

```typescript
// contracts/payments/webhook.ts
import { z } from 'zod';

const CheckoutSessionCompleted = z.object({
  type: z.literal('checkout.session.completed'),
  data: z.object({
    object: z.object({
      id: z.string(),
      payment_status: z.literal('paid'),
      metadata: z.record(z.string()),
    }),
  }),
});

const PaymentIntentSucceeded = z.object({
  type: z.literal('payment_intent.succeeded'),
  data: z.object({ object: z.object({ id: z.string() }) }),
});

export const StripeWebhookEventSchema = z.discriminatedUnion('type', [
  CheckoutSessionCompleted,
  PaymentIntentSucceeded,
]);

export type StripeWebhookEvent = z.infer<typeof StripeWebhookEventSchema>;
```

### Step 3 — Re-export from the context's `index.ts`

```typescript
// contracts/credits/index.ts
export * from './purchase';
export * from './grant';
export * from './balance';
```

### Step 4 — Add the contract test

Every schema ships with at least one valid + one invalid fixture in `__fixtures__/`:

```typescript
// contracts/credits/purchase.contract.test.ts
import { describe, it, expect } from 'vitest';
import { CreatePurchaseRequestSchema, PurchaseDTOSchema } from './purchase';
import validRequest from './__fixtures__/create-purchase-request.valid.json';
import invalidRequest from './__fixtures__/create-purchase-request.invalid.json';
import validDto from './__fixtures__/purchase-dto.valid.json';

describe('CreatePurchaseRequestSchema', () => {
  it('parses a valid request', () => {
    expect(CreatePurchaseRequestSchema.safeParse(validRequest).success).toBe(true);
  });
  it('rejects a request with missing packId', () => {
    expect(CreatePurchaseRequestSchema.safeParse(invalidRequest).success).toBe(false);
  });
});

describe('PurchaseDTOSchema', () => {
  it('parses a valid DTO', () => {
    expect(PurchaseDTOSchema.safeParse(validDto).success).toBe(true);
  });
});
```

Fixtures must be **real** (captured from staging / sandbox). Hand-rolled fixtures are forbidden — see `.cursor/agents/execution/event-contracts.md`.

### Step 5 — (Optional) Update the consumers

If the Plan modifies an existing schema, update every consumer (route, action, use case, adapter) in the same iteration. The verifier catches uncovered call sites via `tsc`.

### Step 6 — Verify

Route to `verifier`. The contract test must PASS; `tsc` must compile every `z.infer` consumer.

## Failure modes

| Failure | Fix |
|---------|-----|
| `z.object` defined outside `contracts/**` | Move to `contracts/<context>/<operation>.ts` |
| Hand-written `interface` for a cross-layer DTO | Replace with `z.infer<typeof Schema>` |
| Schema imports `@domain` | Remove the import; `contracts/` may import only `@shared` |
| Contract test missing | Add one valid + one invalid fixture |
| Hand-rolled fixture | Capture from a real response |

## Hard rules

- One file per operation under `contracts/<context>/`.
- Types are `z.infer<typeof Schema>`; no hand-written DTOs.
- `contracts/` may import only `@shared` (specifically `shared/result`, `shared/errors`).
- Every schema ships with a contract test.
- Fixtures are real captures, not invented.
