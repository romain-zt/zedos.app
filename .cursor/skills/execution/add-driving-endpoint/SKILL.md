---
name: add-driving-endpoint
description: Wires a driving adapter (route handler, server action, or CLI entry) to an existing application use case. The seam between app/ and application/. Use when a new caller needs to invoke an existing use case.
disable-model-invocation: true
---

# Add Driving Endpoint

Use when the Plan needs a new entry point (route handler, server action, CLI, or background job trigger) that calls an **existing** use case in `application/`. The use case already exists; this skill is about adding the calling surface.

For new use cases, use `add-usecase` first; for new route handlers / actions specifically, prefer `add-route-handler` or `add-server-action` (which already cover the route/action shape end-to-end).

## When to use

- A use case exists in `application/<context>/` and needs an additional caller.
- Examples: an existing use case is now also called from a CLI script, a server action wraps a route's logic, a webhook handler dispatches to an existing use case.

## Read first

- `.cursor/rules/72-hexagonal-boundaries.mdc` (driving adapters live in `app/` or `scripts/` — never in `domain/` / `application/` / `contracts/`)
- `.cursor/rules/74-contracts-zod.mdc` (validate input at the boundary)
- `.cursor/rules/73-result-rop.mdc` (map `Result` to the entry point's return shape)

## Recipe

### Step 1 — Confirm the use case interface

Read the existing use case's signature. The new entry point validates input against the same `<Resource>RequestSchema` from `contracts/` that the use case expects.

### Step 2 — Author the entry point per type

| Caller type | Skill |
|-------------|-------|
| HTTP route | `add-route-handler` |
| Same-app form / button | `add-server-action` |
| Webhook | (custom) — route handler that verifies signature + dispatches |
| CLI script | (custom) — Node script that invokes the composition root and calls the use case directly |
| Cron / background | (out of v0 scope per PRD) |

For a webhook (e.g. Stripe):

```typescript
// app/api/stripe/webhook/route.ts
import { stripeClient } from '@infrastructure/payments';
import { useCases } from '@/lib/composition';

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('missing signature', { status: 400 });

  const rawBody = await req.text(); // raw body required for signature verification
  const eventResult = stripeClient.verifyWebhookSignature(rawBody, sig);
  if (eventResult.isErr()) return new Response('invalid signature', { status: 400 });

  const event = eventResult.unwrap();

  // Idempotency: refuse if event.id already processed.
  const idempotencyResult = await useCases.recordStripeEventIdempotency(event.id);
  if (idempotencyResult.isErr()) {
    if (idempotencyResult.error.code === 'Conflict') {
      return new Response('already processed', { status: 200 }); // idempotent ack
    }
    return new Response('internal', { status: 500 });
  }

  // Dispatch to the existing use case.
  if (event.type === 'checkout.session.completed') {
    const result = await useCases.completePurchase({ sessionId: event.data.object.id });
    if (result.isErr()) return new Response('internal', { status: 500 });
  }

  return new Response('ok', { status: 200 });
}
```

For a CLI script:

```typescript
// scripts/grant-credits.ts
import 'dotenv/config';
import { useCases } from '../apps/web/lib/composition';

async function main() {
  const userId = process.argv[2];
  const amount = Number(process.argv[3]);
  if (!userId || !Number.isFinite(amount)) {
    console.error('usage: tsx scripts/grant-credits.ts <userId> <amount>');
    process.exit(1);
  }

  const result = await useCases.grantCredits({
    userId,
    amount,
    reason: 'manual_grant_via_cli',
    correlationId: `cli-${Date.now()}`,
  });

  if (result.isErr()) {
    console.error(result.error);
    process.exit(2);
  }

  console.log(JSON.stringify(result.unwrap()));
}

main().catch((e) => { console.error(e); process.exit(3); });
```

### Step 3 — Test the entry point

- Webhook → integration test that sends a signed event and asserts the use case was called once (and on duplicate event id, idempotently no-ops).
- CLI → unit test that mocks the use case and asserts argv parsing + exit codes.

### Step 4 — Verify

Route to `verifier`.

## Failure modes

| Failure | Fix |
|---------|-----|
| Webhook bypasses signature verification | Add `stripeClient.verifyWebhookSignature` |
| Webhook missing idempotency table | Use `recordStripeEventIdempotency` use case + dedicated DB table |
| CLI script imports infrastructure directly | Use composition root |
| Entry point duplicates business logic | Refactor; the use case is the source of truth |

## Hard rules

- Driving adapters never duplicate business logic — they call use cases.
- Webhook handlers verify signatures BEFORE parsing JSON.
- Webhook side effects are idempotent on the event id.
- CLI scripts use the composition root (no per-call instantiation of repos / clients).
