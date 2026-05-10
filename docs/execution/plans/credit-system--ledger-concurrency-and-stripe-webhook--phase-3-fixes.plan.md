<!--
  Implementation Plan
  Authored by: Phase 2a planning worker (Architect role per .cursor/agents/execution/architect.md)
  Governed by: .cursor/rules/70-execution-bridge.mdc, 71-monorepo-context.mdc, 72-hexagonal-boundaries.mdc, 73-result-rop.mdc, 74-contracts-zod.mdc, 75-drizzle.mdc §7 (Prisma transitional), 76-better-auth.mdc §7 (NextAuth transitional), 77-nextjs.mdc, 78-testing.mdc, 79-pr-sizing.mdc
  Approved by: pending — see §"Approval"
-->

# Implementation Plan: Credit ledger concurrency safety + Stripe webhook for credit grants (Phase 3 retro fixes #2 / #3 / #4 of the credit system)

## Parent User Story

[Credit ledger concurrency safety + Stripe webhook for credit grants](../user-stories/credit-system--ledger-concurrency-and-stripe-webhook--phase-3-fixes.md)

## Status

`proposed` — moves to `approved` only on user `approved` reply to the PIS, after `domain-guardian` + `scope-critic` PASS and `implementation-readiness-checker.md` returns CLEAR.

> **Layout in effect:** **pre-migration** — paths use `zedos/nextjs_space/...` per `71-monorepo-context.mdc` §2.
> **Architecture Surface:** **resolved** (no UNKNOWN load-bearing fields) — see Surface Block below.
> **NEED_HUMAN:** false (subject to one-time PIS-time waiver of parent FA `NEED_HUMAN`)
> **NEED_UPDATE:** true — `feature-area-workflow.mdc` lacks a "safety-fix slice" subtype (friction-log F-01); `vitest.config.ts` lacks integration-test config (F-06)

---

## Architect Context Brief

(Per `.cursor/agents/execution/architect.md` "Architect-Lead pre-flight" — produced once, reused for revisions in this conversation.)

1. **Layout in effect:** Pre-migration — `zedos/nextjs_space/{app,src,lib,prisma}` (per `71-monorepo-context.mdc` §2). Phase 3 (Drizzle / Turborepo / packages/) is explicitly deferred per task spec.
2. **Parent Scope Slice + Feature Area summary:** Slice "Make the credit ledger concurrency-safe and route credit grants through a Stripe webhook" — boundary is structural correctness only; no commercial-config decisions. Parent FA `credit-system` is `exploratory` + `NEED_HUMAN: true` on B-003 (operator X) and B-004 (burn-tier launch), both **commercially orthogonal** to this slice — explicit Parent FA Carve-out documented in slice + surfaced as the #1 PIS approval blocker.
3. **Layers this Plan will touch:**
   - `domain` — extend `CreditsDomainService` with `computeDeductionDecision`; widen `ICreditsRepository` port.
   - `application` — adapt `DeductCreditsUseCase`; add `ReverseCreditsUseCase`, `ProcessStripeWebhookEventUseCase`.
   - `contracts` — new `payments/` directory (webhook event schemas + checkout request/response); new `credits/deduct.ts`. Per `74-contracts-zod.mdc` §3 the `payments/` context was on the missing-contracts gap-list, so this slice closes that gap.
   - `infrastructure/persistence` — `PrismaCreditsRepository` deduct/add refactor + new `reverseCredits`. Concurrency-safe per `75-drizzle.mdc` §7 Prisma transitional rules.
   - `app` (routes) — new `stripe/webhook/route.ts`, refactor `stripe/verify/route.ts` + `stripe/checkout/route.ts` + `projects/[id]/clarify/route.ts` + `projects/[id]/generate-prd/route.ts`. Each route stays under the 30-line cap per `77-nextjs.mdc` §4 (longer ones extract a use case — already designed below).
   - `lib` (frozen retirement zone) — modify existing `lib/credits.ts` (no NEW file). The frozen-violation §7.3 of `72-hexagonal-boundaries.mdc` permits modifications to existing `lib/` files.
   - `prisma` schema + first-ever migration.
4. **Existing code touchpoints:** `lib/credits.ts` (8 funcs), `lib/ai-service.ts` (no changes needed; the route refactor calls it the same way), `src/infrastructure/persistence/credits-repository.ts` (5 methods, ~240 lines), `src/domain/credits/{credits.ts, credits-service.ts, credits-repository.ts}`, `app/api/{stripe/{checkout,verify}, projects/[id]/{clarify,generate-prd}}/route.ts`, `prisma/schema.prisma`.
5. **Architecture Surface Block — provisional:** **resolved** — all load-bearing fields filled; see Surface Block below for the choices made.
6. **Frozen-violation exposure:** `73-result-rop.mdc` §7 lists 117 `as any` (15+ in touched files). Plan commits to **no new contributions**; targets a small net reduction (-3) in touched files where the refactor naturally tightens types.
7. **Cross-Slice / Cross-FA dependencies:** Cross-touch on `FA-payments` (the new webhook is a Payments-FA surface but is authored under `FA-credit-system` slice because the ledger is the load-bearing concern). `FA-payments` does not need to be `validated` for this Plan to proceed — the webhook is an integration-boundary contract, not a product-surface change.
8. **Recommended next operation:** **draft Plan** (this document). User reviews; on `approved`, persist; then `/implement` against this Plan with the proposed PR-stack.

---

## Approach

This Plan introduces **three structural changes** and **one schema change**, applied across pre-migration paths and split into a 4-PR stack:

1. **Concurrency safety (`75-drizzle.mdc` §7 Prisma transitional rules).** All credit balance mutations (deduct, add, reverse) move inside `prisma.$transaction(async tx => …)` with `tx.$queryRawUnsafe('SELECT credit_balance, grace_used FROM users WHERE id = $1 FOR UPDATE', userId)` taken on the `users` row first. The grace-decision is computed by the domain (`CreditsDomainService.computeDeductionDecision`) using the **locked** balance + graceUsed, eliminating the read-then-write race documented in retro #24. A new `correlation_id` (nullable) column on `credit_transactions` plus a unique partial index on `(user_id, correlation_id) WHERE correlation_id IS NOT NULL` makes inserts idempotent — duplicate deduct attempts (AI retry, webhook replay) collapse to a single ledger row.

2. **Stripe webhook for credit grants (`77-nextjs.mdc` §4 thin-route + `security-pii.md` §4/§5 + `72-hexagonal-boundaries.mdc` §5 SDK isolation).** A new `app/api/stripe/webhook/route.ts` reads the **raw** request body, verifies the `Stripe-Signature` header against a new `STRIPE_WEBHOOK_SECRET` env var via `stripe.webhooks.constructEvent`, parses the verified event into a discriminated-union `WebhookEventEnvelopeSchema` (zod), then routes through `ProcessStripeWebhookEventUseCase`. The use case checks idempotency via a new `ProcessedWebhookEvent` table (insert with `ON CONFLICT (event_id) DO NOTHING`; conflict = "already processed", return success-idempotent). On a fresh `checkout.session.completed` (or `payment_intent.succeeded`), the use case calls `CreditsRepository.addCredits` with `correlationId = event.id` and updates the `Purchase` row in the same transaction. `/api/stripe/verify` is reduced to a read-only confirmation endpoint that reports the `Purchase.status` (`processing` if webhook hasn't run yet; `completed` if it has). `Stripe.checkout.sessions.create` gains an `Idempotency-Key` header derived from `Purchase.id` + a `payment_intent_data.metadata` block carrying `purchaseId` for the webhook to route on.

3. **Deduct-after-AI-success with compensating reversal (`73-result-rop.mdc` §6 + `77-nextjs.mdc` §4).** The two AI routes (`clarify`, `generate-prd`) keep their **existing** pre-check gate (`checkCredits` — runs before AI starts, blocks if projected overage > 20 credits or grace exhausted). The deduct moves to **after** the AI streamed response completes successfully. On AI failure (provider error, timeout, invalid streamed JSON detected post-buffer per `74-contracts-zod.mdc` §4), the route catches the error and routes through `ReverseCreditsUseCase` with the same `correlationId` (no-op if no deduct happened, compensating reversal if one did). This is the **compensating-reversal** pattern of the two options the user listed; chosen over **reservation** because it requires no new `credit_reservations` table and works with the existing in-place `User.creditBalance` mutation pattern (the append-only-derived-balance refactor stays in Phase 3 of monorepo retro). Open Question OQ-2 in the User Story records the "does reversal restore graceUsed?" decision (proposed default: no — grace consumed on attempt).

4. **Single source of truth for the grace decision.** Both `lib/credits.ts:checkCredits/deductCredits` and `src/infrastructure/persistence/credits-repository.ts:deductCredits` route their decision through `CreditsDomainService.computeDeductionDecision` (new method extending `canOperationProceed`). This fixes retro #25 (`src/` path's grace ceiling violation) and fixes retro #26 (dual-source-of-truth divergence) **without** consolidating the two implementations — both continue to exist; both delegate to the same domain rule.

The Plan deliberately **defers** consolidation of `lib/credits.ts` and `src/{domain,application,infrastructure}/credits/*` to a follow-up slice (`credit-system--consolidate-ledger-implementations`) because (a) consolidation is a refactor with its own test surface, (b) doing it in this slice would 2× the diff and obscure the safety fix in review, and (c) the dual-implementation drift the retro flagged is fully addressed by routing both paths through the shared domain rule + applying the same concurrency pattern to both.

The Plan also deliberately **defers** `eslint.ignoreDuringBuilds: true` cleanup and the broader 117-`as any` cleanup to dedicated slices, per task-spec instruction.

---

## Architecture Surface Block

Required by `.cursor/rules/70-execution-bridge.mdc` §8. **Resolved** — all load-bearing fields filled.

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | **Postgres via Prisma** (today). No move to Drizzle in this slice. |
| Auth source-of-truth | **NextAuth (transitional)** per `76-better-auth.mdc` §7. Webhook **does not** use the user session — it is server-to-server, authenticated via Stripe signature. AI routes continue to use `getServerSession(authOptions)` per the existing `lib/auth-options.ts`. The frozen `(session.user as any).id` cast is **not added to** by this Plan (no new occurrences). |
| Async/sync boundary | **All synchronous per request.** No queues, no background jobs. Webhook handler runs synchronously in the Next.js route; Stripe expects ≤ 5 s response time, comfortably above what the use case takes (single-row read + insert + update inside one transaction). |
| Transaction boundary | **Per use-case via `prisma.$transaction(async tx => …)`** (`75-drizzle.mdc` §7 Prisma transitional). Row lock via `tx.$queryRawUnsafe('SELECT … FOR UPDATE', userId)` before the deduct/grant computation. Reversal is a separate transaction (different correlation_id; can't deadlock against the original because the original tx has already committed by the time reversal fires). |
| External dependencies | **Stripe** (existing; no new SDK). **AbacusAI** (existing `lib/ai-service.ts`; no change). **No new vendor SDKs.** |
| Payment shape (if money) | **Stripe Checkout + Stripe Webhook with `Idempotency-Key` (per `Phase 3` of monorepo retro).** Specifically: outbound `Idempotency-Key = Purchase.id` on `stripe.checkout.sessions.create`; inbound idempotency via new `ProcessedWebhookEvent` table keyed by `event.id`; raw-body signature verification via `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`. |
| **Webhook idempotency mechanism** (slice-specific sub-decision; flagged in friction-log F-05) | **Dedicated `ProcessedWebhookEvent` table** (eventId UNIQUE, type, processedAt). Chosen over per-Purchase JSON column or status-only check because it (a) supports webhook events that don't map to a `Purchase` row (e.g. future `customer.subscription.*` even though no subscription in v0), (b) gives ops a single audit table for all webhook traffic, (c) works idempotently with Postgres `INSERT ... ON CONFLICT DO NOTHING`. |
| **Reservation vs deduct-after-success choice** (slice-specific sub-decision) | **Compensating reversal on AI failure** — not reservation. Justified in §"Approach" #3. |
| **Integration test harness** (slice-specific sub-decision; OQ-1) | **Local Postgres URL via env** (`TEST_DATABASE_URL`), **not** `@testcontainers/postgresql`. Justified: zero new dependencies (per `79-pr-sizing.mdc` discipline + `73-result-rop.mdc` Plan §"Dependencies Added" tightness); contributors run `docker compose up postgres` locally (a `docker-compose.yml` is added in PR #2 of the stack). The `test-helpers/setup-test-db.ts` runs migrations + truncates between tests. If contributor experience proves bad in Phase 2b, the swap to `@testcontainers/postgresql` is a one-file-change follow-up. |
| **AI correlation_id source** (slice-specific sub-decision; OQ-4) | **Server-supplied** — generated server-side as `<projectId>--<opType>--<crypto.randomUUID()>`. Returned in the streamed response payload header so the client can include it on retry (the client doesn't have to). For v0 with single-tab UX this is sufficient; client-supplied IDs become valuable when programmatic / API access is introduced (deferred to better-auth API-key plan, `76-better-auth.mdc` §6). |

### Surface Blockers

- None. All load-bearing fields resolved.

---

## Layers Affected

- [x] `domain` — extend `CreditsDomainService` (`computeDeductionDecision`); widen `ICreditsRepository` port (`reverseCredits`, `correlationId` on existing methods).
- [x] `application` — adapt `DeductCreditsUseCase`; add `ReverseCreditsUseCase`, `ProcessStripeWebhookEventUseCase`. (`AddCreditsUseCase` keeps its current shape; webhook use case calls it with `correlationId` via the widened port.)
- [x] `contracts` — new `payments/` directory (`webhook.ts`, `checkout.ts`, `__fixtures__/`, `*.contract.test.ts`); new `credits/deduct.ts`.
- [x] `infrastructure` (persistence) — `PrismaCreditsRepository` deduct/add refactor + `reverseCredits`; new mappers if needed for `ProcessedWebhookEvent`.
- [x] `app` (routes) — new `stripe/webhook/route.ts`; refactor `stripe/verify/route.ts`, `stripe/checkout/route.ts`, `projects/[id]/clarify/route.ts`, `projects/[id]/generate-prd/route.ts`.
- [ ] `ui` — none. No component changes; `/dashboard/credits` polling loop is a small client-side hook change, **deferred** to a follow-up UX slice if needed (today's redirect-to-verify already loops on its own; the change is what `/verify` returns).
- [x] `shared` — no new code; existing `Result<T, E>`, `ApplicationError` hierarchy, structured logger reused. The frozen variance constraint of `Result<T, E = Error>` is honored (existing `as any` cast pattern at use-case boundaries kept; no new ones added).

---

## Touched Files (exact paths)

(Pre-migration layout per `71-monorepo-context.mdc` §2. All paths under `zedos/nextjs_space/`.)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `prisma/schema.prisma` | modify | Add `model ProcessedWebhookEvent`; add `correlationId String?` to `CreditTransaction` + index |
| `prisma/migrations/20260510000001_add_webhook_idempotency_and_correlation_id/migration.sql` | create | First-ever migration in the repo (bootstraps `migrations/` folder); creates `processed_webhook_events` table; adds `correlation_id` column + unique partial index to `credit_transactions` |
| `prisma/migrations/migration_lock.toml` | create | Prisma migration lock file (auto-generated by `prisma migrate`) |
| `lib/credits.ts` | modify | Refactor `deductCredits`, `addCredits` to use `prisma.$transaction(async tx => …)` + `tx.$queryRawUnsafe` row lock; thread `correlationId` through; route grace decision through `CreditsDomainService.computeDeductionDecision`; add `reverseCredits(userId, originalCorrelationId)`. NO new `lib/<...>.ts` file (frozen zone). |
| `src/infrastructure/persistence/credits-repository.ts` | modify | Same refactor: row lock + transaction + idempotency in `deductCredits`/`addCredits`; align grace via shared domain rule (fixes retro #25); add `reverseCredits` method |
| `src/domain/credits/credits-repository.ts` | modify | Widen `ICreditsRepository` port: add `reverseCredits`; widen `deductCredits`/`addCredits` signatures with `correlationId` param |
| `src/domain/credits/credits-service.ts` | modify | Add `computeDeductionDecision(lockedBalance, lockedGraceUsed, cost): { kind: 'proceed'\|'proceed-with-grace'\|'reject', newBalance, willActivateGrace }` — single domain authority; existing `canOperationProceed` and `buildCreditCheckResult` kept (the route-side pre-check still calls them) |
| `src/domain/credits/credits.ts` | modify | Add `CreditDeductionDecision` discriminated-union type returned by `computeDeductionDecision` |
| `src/domain/credits/credits-service.test.ts` | modify | Extend tests for `computeDeductionDecision` matrix (T-1, T-2) |
| `src/application/credits/deduct-credits-usecase.ts` | modify | Adapt to widened port signature; thread `correlationId`; on repo `Err(ConflictError)` (idempotency conflict) treat as success-idempotent |
| `src/application/credits/deduct-credits-usecase.test.ts` | create | Unit tests for use case (T-3) |
| `src/application/credits/reverse-credits-usecase.ts` | create | New use case for AI-failure compensating reversal |
| `src/application/credits/reverse-credits-usecase.test.ts` | create | Unit tests (T-4) |
| `src/application/payments/process-stripe-webhook-event-usecase.ts` | create | New use case wrapping zod-validated event → balance grant + Purchase update + ProcessedWebhookEvent insert |
| `src/application/payments/process-stripe-webhook-event-usecase.test.ts` | create | Unit tests (T-5) |
| `src/application/payments/index.ts` | create | Barrel export |
| `src/application/credits/index.ts` | modify | Re-export new use case |
| `src/contracts/payments/webhook.ts` | create | `WebhookEventEnvelopeSchema` (discriminated union), `CheckoutSessionCompletedEventSchema`, `PaymentIntentSucceededEventSchema` |
| `src/contracts/payments/checkout.ts` | create | `CreateCheckoutSessionRequestSchema`, `CheckoutSessionResponseSchema` |
| `src/contracts/payments/index.ts` | create | Barrel export |
| `src/contracts/payments/__fixtures__/checkout-session-completed.valid.json` | create | Captured Stripe sandbox payload (or doc-derived placeholder per OQ-3) |
| `src/contracts/payments/__fixtures__/checkout-session-completed.missing-purchase-id.json` | create | Negative fixture |
| `src/contracts/payments/__fixtures__/payment-intent-succeeded.valid.json` | create | Positive fixture |
| `src/contracts/payments/__fixtures__/webhook-envelope.unknown-type.json` | create | Negative fixture for unknown event type routing |
| `src/contracts/payments/webhook.contract.test.ts` | create | Contract tests T-19, T-20, T-21 |
| `src/contracts/credits/deduct.ts` | create | `DeductCreditsRequestSchema`, `DeductCreditsResponseSchema` |
| `src/contracts/credits/deduct.contract.test.ts` | create | Contract test T-22 |
| `src/contracts/credits/index.ts` | modify | Re-export new schema module |
| `src/infrastructure/persistence/processed-webhook-event-repository.ts` | create | New Prisma repo for `ProcessedWebhookEvent`: `recordEvent(eventId, type) → Result<{ idempotent: boolean }, ApplicationError>` (insert with ON CONFLICT) |
| `src/domain/payments/processed-webhook-event-repository.ts` | create | Port for above |
| `app/api/stripe/webhook/route.ts` | create | New webhook handler — raw body read, signature verification, zod parse, route through use case |
| `app/api/stripe/verify/route.ts` | modify | Reduce to read-only confirmation: read `Purchase.status`, return `{ status, balance }` — NO credit grant logic |
| `app/api/stripe/checkout/route.ts` | modify | Add `Idempotency-Key: Purchase.id` header on outbound Stripe call; add `payment_intent_data.metadata.purchaseId` for webhook routing; no other logic change |
| `app/api/projects/[id]/clarify/route.ts` | modify | Refactor: pre-check (existing `checkCredits`) → AI call → on success `deductCredits(correlationId)` + write QuestionHistory → on AI error `reverseCredits(correlationId)` (no-op if no deduct happened, compensating reversal if one did); preserve streaming UX |
| `app/api/projects/[id]/generate-prd/route.ts` | modify | Same refactor pattern as clarify route |
| `vitest.integration.config.ts` | create | Minimal integration vitest config (separate from unit `vitest.config.ts`); includes `**/*.integration.ts` |
| `src/test-helpers/setup-test-db.ts` | create | Postgres test-DB helper (uses `TEST_DATABASE_URL` env per Surface decision); runs migrations + truncates relevant tables between tests |
| `src/test-helpers/stripe-test-fixtures.ts` | create | Test helpers for signing fake webhook payloads with the test secret |
| `src/test-helpers/index.ts` | create | Barrel export |
| `src/infrastructure/persistence/credits-repository.integration.ts` | create | Concurrent integration tests T-6, T-7, T-8, T-9 (mandatory per `78-testing.mdc` §7) |
| `app/api/stripe/webhook/route.integration.ts` | create | Webhook integration tests T-10, T-11, T-12, T-13 |
| `app/api/stripe/verify/route.integration.ts` | create | Verify-route integration tests T-14, T-15 |
| `app/api/projects/[id]/clarify/route.integration.ts` | create | Clarify integration tests T-16, T-17 (mocked AI provider via `vi.mock` on `lib/ai-service`) |
| `app/api/projects/[id]/generate-prd/route.integration.ts` | create | Generate-PRD integration tests T-18 |
| `package.json` | modify | Add `"typecheck": "tsc --noEmit"`, `"test": "vitest run"` (today missing per cursor-setup retro), `"test:integration": "vitest run -c vitest.integration.config.ts"`, `"test:coverage": "vitest run --coverage"`, `"verify": "npm run typecheck && npm run lint && npm run test"`. (No new `dependencies`; no new `devDependencies` — testing-harness uses Postgres-via-env, not testcontainers, per Surface decision.) |
| `.env.example` | create | Document required env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `STRIPE_SECRET_KEY`, **`STRIPE_WEBHOOK_SECRET` (NEW)**, `TEST_DATABASE_URL`, the existing `STARTER_CREDITS` / `PACK_*` / `CREDIT_COST_*` / `GRACE_CREDIT_CEILING` vars. **Documents only — does not contain real secrets.** |
| `docker-compose.yml` | create | Local Postgres for integration tests (matches `TEST_DATABASE_URL`) — single `postgres:16` service |

**Estimated total:** ~38 files (~7 modify, ~31 create), ~900–1100 net lines, 5 layers (domain, application, contracts, infrastructure, app — plus prisma schema + migrations as their own slice), 1 schema migration. **Exceeds `79-pr-sizing.mdc` §2 standard size — see §"PR Sizing / Split Strategy" below.**

---

## Contracts Changed

Per `74-contracts-zod.mdc` §3, the `payments/` context was on the missing-contracts gap-list. This Plan closes that gap.

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `WebhookEventEnvelopeSchema` (`contracts/payments/webhook.ts`) | new — discriminated union on `type` | `__fixtures__/webhook-envelope.unknown-type.json` (negative); positives via the per-event fixtures below |
| `CheckoutSessionCompletedEventSchema` (`contracts/payments/webhook.ts`) | new | `__fixtures__/checkout-session-completed.valid.json` (positive); `checkout-session-completed.missing-purchase-id.json` (negative) |
| `PaymentIntentSucceededEventSchema` (`contracts/payments/webhook.ts`) | new | `__fixtures__/payment-intent-succeeded.valid.json` (positive); negative cases via field-removal in test (no separate fixture file needed) |
| `CreateCheckoutSessionRequestSchema` (`contracts/payments/checkout.ts`) | new — already used inbound at `/api/stripe/checkout`, now formalised | inline in `webhook.contract.test.ts` (positive: `{packId: 'pack_100'}`; negative: missing `packId`) |
| `CheckoutSessionResponseSchema` (`contracts/payments/checkout.ts`) | new — outbound DTO from `/api/stripe/checkout` | inline |
| `DeductCreditsRequestSchema` (`contracts/credits/deduct.ts`) | new (factored out from `credits-contracts.ts` with the new `correlationId` field) | inline |
| `DeductCreditsResponseSchema` (`contracts/credits/deduct.ts`) | new — adds `correlationId` + `graceActivated` to the existing balance DTO shape | inline |

Per `74-contracts-zod.mdc` §4: every new schema ships with at least one positive + one negative contract test in the same diff (per the Tests table below).

---

## Migrations

Per `79-pr-sizing.mdc` §2 limit: **≤ 1 schema migration per PR** — this Plan ships exactly one logical change in one migration file (the migration is split-friendly into PR #1 of the stack).

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| `20260510000001_add_webhook_idempotency_and_correlation_id` | `processed_webhook_events` (new), `credit_transactions` (add nullable `correlation_id` column + unique partial index on `(user_id, correlation_id) WHERE correlation_id IS NOT NULL`) | **Yes** — new table is additive; new column is nullable with no default; unique index is partial so existing NULL-correlation rows are not constrained. Old code paths that don't supply `correlation_id` still write rows successfully (column stays NULL). New code paths supply it. |

Migration file content sketch (textual proposal — not executed):

```sql
-- Migration: 20260510000001_add_webhook_idempotency_and_correlation_id

-- 1. Add new ProcessedWebhookEvent table for Stripe webhook idempotency.
CREATE TABLE "processed_webhook_events" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "processed_webhook_events_event_id_key" ON "processed_webhook_events"("event_id");
CREATE INDEX "processed_webhook_events_processed_at_idx" ON "processed_webhook_events"("processed_at");

-- 2. Add nullable correlation_id to credit_transactions for ledger-side idempotency.
ALTER TABLE "credit_transactions" ADD COLUMN "correlation_id" TEXT;

-- 3. Unique partial index — old NULL rows unconstrained; new rows must be unique per (user_id, correlation_id).
CREATE UNIQUE INDEX "credit_transactions_user_correlation_idx"
    ON "credit_transactions"("user_id", "correlation_id")
    WHERE "correlation_id" IS NOT NULL;
```

The Prisma schema delta (proposed text — not executed):

```prisma
model CreditTransaction {
  id             String   @id @default(cuid())
  userId         String   @map("user_id")
  type           String
  amount         Int
  balanceAfter   Int      @map("balance_after")
  operationType  String?  @map("operation_type")
  metadata       Json?
  correlationId  String?  @map("correlation_id")  // NEW
  createdAt      DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@unique([userId, correlationId], name: "credit_transactions_user_correlation_idx", map: "credit_transactions_user_correlation_idx")  // NEW (partial via raw SQL above; Prisma 6.7 treats as full-unique on the type level which is acceptable since correlationId is nullable)
  @@map("credit_transactions")
}

// NEW MODEL
model ProcessedWebhookEvent {
  id          String   @id @default(cuid())
  eventId     String   @unique @map("event_id")
  eventType   String   @map("event_type")
  processedAt DateTime @default(now()) @map("processed_at")

  @@index([processedAt])
  @@map("processed_webhook_events")
}
```

(Note: Prisma 6.7's full-`@@unique` on a nullable column treats NULL as distinct in Postgres, which gives the partial-index behavior we want without explicit partial-index syntax. The raw SQL migration uses an explicit partial index for clarity in the DB layer; the Prisma model uses `@@unique` for type-system-level alignment. If reviewer prefers explicit Prisma `@@index([userId, correlationId])` + raw SQL for the unique constraint, the Plan accepts that revision.)

**Bootstrap caveat:** `prisma/migrations/` does not exist in the repo today (per monorepo retro finding #28). PR #1 of the stack must `prisma migrate dev --name init` first to baseline the schema, **then** `prisma migrate dev --name add_webhook_idempotency_and_correlation_id` for this Plan's change. The Plan accepts this two-migration shape in PR #1 — both ship together because the baseline-migration is a one-time precondition.

---

## Tests

Per `78-testing.mdc` §3 colocation; §4 coverage floors; §7.2 mandatory concurrent test for ledger.

| Path | Type | Asserts |
|------|------|---------|
| `src/domain/credits/credits-service.test.ts` (extend) | unit | T-1, T-2 — `computeDeductionDecision` matrix (PRD scenarios + grace decisions) |
| `src/application/credits/deduct-credits-usecase.test.ts` (new) | unit | T-3 — Ok/Err returns with mocked repo; idempotency-conflict mapping |
| `src/application/credits/reverse-credits-usecase.test.ts` (new) | unit | T-4 — reversal balance restoration; idempotent re-reverse |
| `src/application/payments/process-stripe-webhook-event-usecase.test.ts` (new) | unit | T-5 — Ok/Err returns; idempotent-on-duplicate-event handling |
| `src/contracts/payments/webhook.contract.test.ts` (new) | contract | T-19, T-20, T-21 — schema parses positive fixtures; rejects negative fixtures |
| `src/contracts/credits/deduct.contract.test.ts` (new) | contract | T-22 — round-trip `DeductCreditsRequestSchema` / `DeductCreditsResponseSchema` |
| `src/infrastructure/persistence/credits-repository.integration.ts` (new) | **integration (concurrent — MANDATORY)** | T-6 (10-parallel-deduct race), T-7 (deduct idempotency), T-8 (add idempotency), T-9 (reverse idempotency) |
| `app/api/stripe/webhook/route.integration.ts` (new) | integration | T-10 (valid signed event grants credits), T-11 (duplicate event no-op), T-12 (invalid signature 400), T-13 (malformed JSON 400 post-signature) |
| `app/api/stripe/verify/route.integration.ts` (new) | integration | T-14 (completed Purchase returns balance), T-15 (pending Purchase returns processing) |
| `app/api/projects/[id]/clarify/route.integration.ts` (new) | integration | T-16 (success deducts after stream), T-17 (failure does not deduct + reverses if mid-flight) |
| `app/api/projects/[id]/generate-prd/route.integration.ts` (new) | integration | T-18 (same shape as clarify for PRD gen) |

**Coverage floors per `78-testing.mdc` §4:**

- `domain/credits/` already at ~92% (2 existing test files); new `computeDeductionDecision` lands with 100% line + branch coverage on its matrix → still ≥ 90%/80%.
- `application/credits/` and `application/payments/` — new code lands with ≥ 85% line / ≥ 70% branch via the 5 unit tests above (T-3, T-4, T-5).
- `infrastructure/persistence/` — `credits-repository` deduct/add/reverse paths covered by integration tests T-6..T-9 (all happy + all error paths) → ≥ 75%/50%.
- `app/` (routes) — new + refactored routes covered by T-10..T-18 → ≥ 70%/50%.

---

## Dependencies Added

**None** — no new dependencies.

The Plan deliberately avoids `@testcontainers/postgresql` (per Surface Block decision: local Postgres via env) and any other new dependency. The only "new tooling surface" is `docker-compose.yml` (which doesn't add a `package.json` dependency).

If reviewer or implementer in Phase 2b finds the local-Postgres-via-env approach too painful, the swap to `@testcontainers/postgresql` would be a one-file revision to this Plan and a new `Dependencies Added` row.

---

## Rollback

This is a 4-PR stack; each PR has its own rollback story.

| PR | Rollback step |
|----|---------------|
| **PR #1 — Foundation** (schema + contracts + idempotency table) | Revert the merge commit. The new tables / column are additive and nullable; pre-PR-1 code paths still work (they don't read `correlation_id` and don't query `processed_webhook_events`). Database migration is forward-only per `75-drizzle.mdc` §4 — leave the new table + column in place even after revert; they'll be reused when the work re-lands. |
| **PR #2 — Concurrency-safe ledger** (lib + repo refactor + integration tests) | Revert the merge commit. The previous deduct/add code is restored (race condition returns, but pre-PR-2 was the production state for months — no immediate user-visible regression). Schema additions from PR #1 stay (harmless if unused). |
| **PR #3 — Stripe webhook + verify decoupling** (new webhook route + verify refactor + checkout idempotency-key) | Revert the merge commit. The `/verify` route returns to its pre-PR-3 behavior (does grant credits on first verify-call). Webhook endpoint URL remains live but returns 404 (route no longer exists); Stripe will retry then give up — operationally tolerable for the rollback window. **Operator action:** disable the webhook endpoint in Stripe Dashboard during rollback to stop retries. |
| **PR #4 — AI deduct-after-success with reversal** (clarify + generate-prd refactor) | Revert the merge commit. Routes return to pre-PR-4 behavior (deduct-before-AI). Race condition for AI failures returns. |

**Compensating actions on revert:**
- The `correlation_id` column stays populated for any rows written during the brief deployed-then-reverted window. Old code ignores it; no data loss.
- The `processed_webhook_events` table stays populated; old code doesn't query it; harmless.
- Any in-flight Stripe webhooks during a PR #3 rollback may end up un-processed. **Mitigation:** Stripe Dashboard → Webhooks → "Resend events" once the re-landed PR #3 is back in production.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Webhook secret misconfiguration in production.** Operator forgets to set `STRIPE_WEBHOOK_SECRET`; webhook returns 400 on every Stripe delivery; credits never grant. | Medium (one-time setup risk) | High (revenue-blocking) | Plan §"Touched Files" ships `.env.example` with the new var documented. PIS approval blocker explicitly asks user to confirm operator workflow before Phase 2b runs. Webhook route logs the misconfiguration loudly via the structured logger. |
| **Local-Postgres-via-env friction for contributors.** New contributor checks out the repo, runs `npm test`, fails because no `TEST_DATABASE_URL`. | Medium | Low (DX paper cut) | `docker-compose.yml` makes setup one command (`docker compose up postgres`). README update (separate slice — not in this Plan; surfaced in friction-log F-06 as a polish item). If pain emerges in Phase 2b, swap to `@testcontainers/postgresql` is a one-line Plan revision. |
| **The 4-PR stack creates merge-order risk.** PR #2 depends on PR #1's schema; PR #3 depends on PR #1's contracts; PR #4 depends on PR #2's repo. If PRs land out of order, `main` breaks. | Low (with explicit `--base` on each PR per `79-pr-sizing.mdc` §4) | High | Each PR uses `--base <previous-PR-branch>` per `79-pr-sizing.mdc` §4. CI on each PR runs the full `verify` (`typecheck && lint && test && build`); a stack-out-of-order would fail CI on the dependent PR. `babysit` skill keeps the stack green during review. |
| **`prisma migrate dev` baseline-migration could lose existing data on dev databases.** First-ever migration tries to recreate the schema. | Low (prisma migrate handles drift) | High (dev data loss) | PR #1 of the stack uses `prisma migrate diff` against the existing live DB schema first to confirm the baseline matches what's deployed before running `migrate dev`. If drift exists, the Plan revises to use `prisma migrate resolve --applied <baseline>` to mark the live state as already-migrated, then the new migration applies forward-only. |
| **Frozen-violation contributions.** The refactor moves `as any` casts to new line numbers; reviewer flags as new contribution. | Medium (mechanical risk) | Low (with friction-log F-07 polish; otherwise a review back-and-forth) | Plan §"Approach" + §"Risks" commits to a **net negative delta** (-3) of `as any` in touched files. PR description includes pre/post counts in the Test Plan section. Surfaced in friction-log F-07. |
| **Race between webhook arrival and `/verify` poll on the same `Purchase`.** User redirects to dashboard, dashboard polls `/verify`, webhook arrives between the read and the response → response says "processing" but the next poll says "completed" — fine, but if the polling stops too early, the user thinks something failed. | Medium | Low (cosmetic) | Polling loop on the dashboard already exists; refactor extends timeout to 10s with exponential backoff before falling back to the "still processing" copy. Webhook typically arrives within 1–2s; 10s is generous. |
| **AI streamed JSON validation per `74-contracts-zod.mdc` §4.7 is currently silently skipped.** This Plan adds `correlationId` threading but does not introduce the AI response zod validation. If invalid streamed JSON is returned, the deduct still fires (because deduct happens after stream completion, regardless of JSON validity). | Medium | Medium | Plan §"Out of Scope" notes that **AI response zod validation** is a separate slice. This Plan ensures deduct fires only on **stream completion**, not on JSON validity. If the user wants JSON validity to gate the deduct, that's a Plan revision (small additional scope: add `ClarifyResponseSchema` + parse buffer; reverse on parse failure). Recommend deferring to a follow-up slice (`credit-system--validate-ai-streamed-json`). |
| **Integration tests are slow.** Concurrent test (T-6) takes ~2–5s; full integration suite ~30s. CI build time grows noticeably. | High (mechanical) | Low (one-time DX adjustment) | Integration tests run via separate `test:integration` script; `verify` script runs only unit + lint + typecheck + build (per `78-testing.mdc` §6 default `verify` shape, with integration carved out). CI workflow adds a separate `integration` job that runs in parallel. |

---

## Out of Scope (deliberate)

- Consolidation of `lib/credits.ts` and `src/{domain,application,infrastructure}/credits/*` (separate slice).
- Re-enabling `eslint.ignoreDuringBuilds: true` and fixing the resulting lint cascade (separate slice).
- Cleanup of pre-existing 117 `as any` casts (frozen until `73-result-rop.mdc` §7 / Phase 1 of monorepo retro).
- AI streamed JSON validation (separate slice — surfaced in §"Risks").
- Auto-reload Stripe flow per PRD Q-020 (separate slice in Payments FA).
- Tax/VAT receipts per PRD Q-015 (separate slice in Payments FA).
- E2E Playwright tests (Playwright doesn't exist in the repo today; bootstrap is its own slice).
- Storybook, Datadog, MSW (Phase 4 of cursor-setup retro).
- Migration to Drizzle, better-auth, neverthrow, Turborepo (Phase 1, 2, 3 of monorepo retro — explicitly deferred per task spec).
- UX copy / balance display / recharge modal changes (depend on B-003 / B-004; commercial planning).
- Changes to `grantStarterCredits`.
- Anonymous-share-viewer surface changes.
- Rate limiting on `/api/stripe/webhook` (excluded per `security-pii.md` §6 — Stripe rate-limits its own retries).
- Changes to `next.config.js` (other than what `experimental.outputFileTracingRoot` already declares).
- Changes to `tsconfig.json` (`strict: false` stays — relax/strict transitions are Phase 1 scope).
- Changes to `lib/auth-options.ts` (the `(session.user as any).id` frozen violation is not contributed to by this Plan; clean-up lands with better-auth migration).

---

## PR Sizing / Split Strategy

Per `79-pr-sizing.mdc` §2, the standard PR limits are: ≤ 400 net lines, ≤ 15 files, ≤ 3 layers, ≤ 5 test files, ≤ 1 schema migration. This Plan exceeds all of those in aggregate (~38 files / ~900 lines / 5 layers / 1 migration / ~8 test files). Per §3, no exemption applies (this is real behavior change, not a mechanical refactor). Per §4, the work splits into a **stacked PR pattern**.

**Proposed stack (4 PRs):**

```
main
└── feature/credits-foundation              (PR #1)
    └── feature/credits-concurrency         (PR #2; base = PR #1)
        └── feature/credits-stripe-webhook  (PR #3; base = PR #2)
            └── feature/credits-ai-deduct   (PR #4; base = PR #3)
```

| PR | Files (count) | Net lines (est.) | Layers | Migrations | Tests | Notes |
|----|--------------:|-----------------:|-------:|-----------:|------:|-------|
| **#1 — Foundation** (contracts + schema + idempotency table + harness) | 14 | ~280 | 3 (contracts, prisma, shared/test-helpers) | 2 (init baseline + add_webhook_idempotency_and_correlation_id) — declared exemption per `79-pr-sizing.mdc` §3 "Pure migration step" | 2 contract + harness | Includes: prisma schema + 2 migrations + migration_lock.toml + all `src/contracts/payments/` + `src/contracts/credits/deduct.ts` + their `__fixtures__/` + their contract tests + `vitest.integration.config.ts` + `src/test-helpers/*` + `package.json` script additions + `.env.example` + `docker-compose.yml` |
| **#2 — Concurrency-safe ledger** (lib + repo refactor + domain extension + integration tests) | 12 | ~340 | 3 (domain, application, infrastructure) | 0 | 4 unit (extend service test, new use case tests) + 1 concurrent integration | Includes: `src/domain/credits/{credits.ts, credits-service.ts, credits-repository.ts}` + `src/application/credits/{deduct,reverse}-credits-usecase{.ts,.test.ts}` + `src/infrastructure/persistence/credits-repository.ts` + integration test + `lib/credits.ts` refactor (modify only — no new lib file) |
| **#3 — Stripe webhook + verify decoupling + checkout idempotency-key** (new webhook route + verify refactor + checkout SDK header + Process use case + ProcessedWebhookEvent repo) | 8 | ~220 | 3 (application, infrastructure, app) | 0 | 1 unit + 2 integration | Includes: `src/application/payments/process-stripe-webhook-event-usecase{.ts,.test.ts}` + `src/infrastructure/persistence/processed-webhook-event-repository.ts` + `src/domain/payments/processed-webhook-event-repository.ts` (port) + `app/api/stripe/{webhook,verify,checkout}/route.ts` (1 new + 2 modify) + 2 route integration tests |
| **#4 — AI deduct-after-success with reversal** (clarify + generate-prd refactor) | 4 | ~120 | 1 (app) | 0 | 2 integration | Includes: `app/api/projects/[id]/{clarify,generate-prd}/route.ts` + 2 integration tests |

**Each PR independently passes `pr-readiness-checker.md`:**
- All within ≤ 15 files and ≤ 3 layers.
- All within ≤ 400 net lines (PR #2 closest at ~340).
- PR #1 declares the migration-count exemption (2 migrations because of init-baseline) per `79-pr-sizing.mdc` §3.
- Every PR description follows §5 format with linked artifacts (Slice / Story / Plan paths).

**Stack management** via `babysit` skill — each merge cascades the next PR's base; `git rebase` keeps the chain clean.

If the stack-management overhead is judged too high in Phase 2b, the alternative is **PR #1 + PR #2 merged as one** (size: ~26 files / ~620 lines / 4 layers — declared exemption "P3.1 phase scope" per §3 "Pure migration step" since both are part of monorepo retro Phase 3 work). Recommend keeping the 4-PR stack as the default; the merged option is a fallback only if reviewer fatigue surfaces.

---

## Adversarial Review

(Pre-implementation simulation — Phase 2a worker invokes the agent personas mentally and records verdicts. Phase 2b implementer must re-invoke the actual agents in chat at Plan-approval time and at each diff time per `/plan` Step 3 and `/implement` operating loop.)

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| `domain-guardian` | **PASS** (Plan-time) | Layer matrix respected (`domain` → `shared`; `application` → `domain` + `contracts` + `shared`; `contracts` → `shared`; `infrastructure` → `domain` + `application` + `contracts` + `shared`; `app` consumes `application` + `infrastructure` via composition). Vendor SDK isolation: Stripe constructed only inside the webhook route (transitionally permitted per `72-hexagonal-boundaries.mdc` §7 frozen-violation; the cleaner refactor to a `packages/sdk-stripe` is Phase 2 of monorepo retro). Result discipline (designed): `Result<T, E>` returns at every cross-layer call; no new `as any` (existing variance-gap casts left in place per §7). Contracts discipline (designed): every cross-layer DTO uses `z.infer`; no `z.object` in `application/` or `app/`. Frozen-violation contributions: 0 net new (target -3). |
| `scope-critic` | **SAFE TO PROCEED, with one note** | The "deduct-after-success with compensating reversal" choice is borderline architectural (reservation pattern would be cleaner long-term). The Plan correctly justifies the choice for v0 (no new table; works with in-place balance) and explicitly defers the append-only-derived-balance refactor to Phase 3. **Note:** the OQ-2 decision ("does reversal restore graceUsed?") should be elevated from "open" to "decided in PIS" before approval — recommend default `no` (grace consumed on attempt) per the PRD's anti-abuse intent. |
| `security-pii` | **PASS, with operator-action note** | Webhook signature verification (§4.4) verified per design; raw body read via `request.text()` (not `request.json()`), then `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`. Idempotency on event.id (§4.5). No PII in logs (§4.2): logger entries include `userId`, `eventId`, `packSize`, `correlationId` only — no email, no full Stripe payload, no AI prompt content. Credentials (§4.1): no real `STRIPE_WEBHOOK_SECRET` committed; `.env.example` documents the var only. **Note:** `.env` already contains real secrets per cursor-setup retro CRITICAL #1; Phase 0 (user-owned) rotation is the precondition for safely committing this Plan's `.env.example`. |
| `reviewer` (PR-level adversarial pre-walk) | **REVISE-without-criticals** | Findings: (a) PR #2 at ~340 net lines is close to the 400 limit — recommend keeping `lib/credits.ts` refactor and `src/infrastructure/.../credits-repository.ts` refactor consciously parallel to avoid scope creep. (b) PR #1's inclusion of `docker-compose.yml` is borderline scope — but justified because it makes integration tests runnable, and integration tests are a hard requirement of `78-testing.mdc` §7. (c) Out-of-Scope list is long but every item is justified — that's good discipline; reviewer would not push back on any. |
| `verifier` (success-criteria check) | **PASS, mechanically checkable** | Every PR's success criteria are: (1) `npm run typecheck` PASS (after `tsc --noEmit` is added to package.json); (2) `npm run lint` PASS (boundaries enforced; pre-existing `next.config.js: ignoreDuringBuilds: true` doesn't affect this because verifier runs lint as a separate step per `verifier.md` layout-notes); (3) `npm run test` PASS (unit + colocated integration); (4) `npm run test:integration` PASS (separate, includes T-6 concurrent ledger test); (5) `npm run build` PASS (Next.js build); (6) per `78-testing.mdc` §7.2 — concurrent test mandatory and present. All mechanical. |

---

## Approval

- [ ] User reviewed and approved this Plan
- [ ] Patch Intent Summary will be produced before any code edit
- [ ] Verification steps (typecheck / lint / test / build / **integration test for concurrent ledger**) defined in §Tests above

**Approval status:** pending
**Approval date:** —

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial Plan from `.cursor/templates/execution/implementation-plan.template.md` per `/plan` Step 2. Status: `proposed`. | Phase 2a planning worker (Architect role) |
