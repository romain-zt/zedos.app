---
name: add-route-handler
description: Adds a Next.js App Router route handler that obeys the thin-route rule, validates with zod on inbound and outbound, returns Result<T,E>-mapped HTTP responses, and consumes use cases from the composition root. Use when implementing a new API endpoint under app/api/.
disable-model-invocation: true
---

# Add Route Handler

Use when the Implementation Plan adds a new file under `app/api/<resource>/route.ts` (pre-migration: `zedos/nextjs_space/app/api/...`; post-migration: `apps/web/app/api/...`).

## When to use

- The Plan's `Layers Affected` includes `app` and `infrastructure`.
- The Plan's `Touched Files` includes a new `route.ts` file.
- The Plan does not also add a server action for the same operation (use one or the other; see `.cursor/rules/77-nextjs.mdc` §3).

## Read first

- `.cursor/rules/77-nextjs.mdc` (canonical thin-route shape)
- `.cursor/rules/74-contracts-zod.mdc` (request + response validation)
- `.cursor/rules/73-result-rop.mdc` (Result-to-Response mapping)

## Recipe

### Step 1 — Confirm the contract

The Plan's `Contracts Changed` must list a `<Resource>RequestSchema` and a `<Resource>DTOSchema` for this operation. If they're missing, route to `add-zod-contract` first.

### Step 2 — Confirm the use case

The Plan must list a use case in `application/<context>/<operation>.usecase.ts`. If it's missing, route to `add-usecase` first.

### Step 3 — Author the route

Use this skeleton. Adjust import paths to the layout in effect (`71-monorepo-context.mdc`).

```typescript
// app/api/credits/purchase/route.ts
import { CreatePurchaseRequestSchema, PurchaseDTOSchema } from '@contracts/credits';
import { useCases } from '@/lib/composition';
import { requireSession } from '@infrastructure/auth';
import { resolveError } from '@shared/http';

export async function POST(req: Request) {
  const session = await requireSession(req.headers);
  if (session.isErr()) return resolveError(session.error);

  const parsed = CreatePurchaseRequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await useCases.createPurchase(parsed.data, session.unwrap().user.id);
  if (result.isErr()) return resolveError(result.error);

  const validated = PurchaseDTOSchema.safeParse(result.unwrap());
  if (!validated.success) {
    // Server bug — DTO doesn't match the schema.
    console.error('purchase_dto_validation_failed', validated.error);
    return Response.json({ error: 'internal' }, { status: 500 });
  }

  return Response.json(validated.data);
}
```

Hard caps:

- ≤ 30 lines. If you can't fit, the use case is doing too little — push more into `application/`.
- No `prisma.*` calls.
- No vendor SDK construction (`new Stripe(...)`).
- No business logic (no `if (user.isVip) { ... }` style branches).

### Step 4 — Add the integration test

Per `78-testing.mdc` §3, the route ships with at least one integration test next to it (or under `__tests__/` per project convention):

```typescript
// app/api/credits/purchase/route.integration.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { POST } from './route';

describe('POST /api/credits/purchase', () => {
  it('returns 400 on invalid input', async () => {
    const res = await POST(new Request('http://localhost/api/credits/purchase', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: TEST_SESSION_COOKIE },
      body: JSON.stringify({}),
    }));
    expect(res.status).toBe(400);
  });

  it('returns 401 when no session', async () => { /* ... */ });
  it('returns 200 with PurchaseDTO on success', async () => { /* ... */ });
});
```

### Step 5 — Verify

Route to `verifier`. Required PASS: typecheck, lint (boundaries enforced), test, build.

## Failure modes

| Failure | Fix |
|---------|-----|
| Route exceeds 30 lines | Extract logic into the use case |
| Vendor SDK construction inside the route | Move to `infrastructure/<vendor>/` and consume from composition root |
| Outbound DTO not validated | Add `safeParse` before `Response.json` |
| Auth derived from request body | Use `requireSession(req.headers)` — never trust `body.userId` |
| Test missing | Add the integration test before requesting verifier |

## Hard rules

- Routes are adapters. They never contain business logic.
- Composition consumed from `lib/composition.ts`. Never `new <X>Repository(prisma)` per request.
- Auth from the verified session, never from the body.
- Inbound and outbound zod validation.
- One operation per route file. `route.ts` exports one function (`GET` / `POST` / `PUT` / `DELETE` — pick one operation; combine only when REST semantics require).
