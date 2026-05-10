<!--
  User Story
  Authored by: Phase 2a planning worker (Architect role per .cursor/agents/execution/architect.md)
  Governed by: .cursor/rules/70-execution-bridge.mdc §3.1
-->

# User Story: Credit ledger concurrency safety + Stripe webhook for credit grants (the Phase 3 retro fixes #2/#3/#4 of the credit system)

## Parent Scope Slice

[Make the credit ledger concurrency-safe and route credit grants through a Stripe webhook](../../product/scope-slices/credit-system--ledger-concurrency-and-stripe-webhook.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false (subject to one-time PIS-time waiver of parent FA `NEED_HUMAN`, see slice "Parent FA Carve-out")
> **NEED_UPDATE:** true — `feature-area-workflow.mdc` lacks a documented "safety-fix slice" subtype (see `docs/retro/phase2a-friction-log.md` F-01); also `vitest.config.ts` lacks an integration-test config (F-06).

---

## Story

As a **solo founder using Zedos**, I want **the credit ledger and Stripe purchase flow to handle browser-tab closures, AI failures, duplicate webhook deliveries, and concurrent operations correctly** so that **I never pay for AI work I didn't receive, never lose credits I paid for, and never get double-credited or double-charged for the same operation**.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 (normal AI) | I have ≥ cost credits | I run an AI clarification step that completes successfully | My balance decreases by exactly the operation cost; one `consumption` row is recorded in `CreditTransaction` with a deterministic `correlationId`; the credit deduction is committed in the same database transaction as recording the row |
| AC-2 (AI failure) | I have ≥ cost credits | I run an AI clarification step and the AI provider returns an error (or times out, or returns invalid JSON) | My balance is unchanged; **no** `consumption` row is recorded for this attempt; an `ai_error` is surfaced to me; if a deduct happened mid-flight (because the row lock had to be acquired before AI), a compensating `reversal` row is recorded with `correlationId = <original>--reverse` and the balance is restored |
| AC-3 (pre-check block, projected overage > 20) | I have 5 credits and grace not used | I attempt a 30-credit op (projected overage = 25, > 20-credit ceiling) | The request returns 402 with the recharge prompt **before** the AI call starts; my balance is unchanged; no `consumption` row recorded; no AI cost incurred to the operator |
| AC-4 (grace activation, in-flight completion) | I have 5 credits and grace not used | I attempt a 15-credit op (projected overage = 10, ≤ 20-credit ceiling) | The op proceeds; the AI completes; my balance becomes −10; my `graceUsed` flag flips to `true`; one `consumption` row is recorded |
| AC-5 (post-grace block at zero) | I have 0 credits and grace already used | I attempt any AI op | The request returns 402 with the recharge prompt **before** the AI call starts; my balance is unchanged |
| AC-6 (concurrent AI calls — same user, sufficient balance for one) | I have 10 credits and grace not used; I open two tabs and fire two 15-credit ops simultaneously | Both requests reach the deduct path concurrently | Exactly one of the two requests completes (deducts 15, balance = −5, grace flips); the other is rejected with 402 (it sees grace already used and balance insufficient post-lock); no double-deduct; no double-grace |
| AC-7 (concurrent AI calls — same user, sufficient balance for both) | I have 30 credits and grace not used; I open two tabs and fire two 15-credit ops simultaneously | Both requests reach the deduct path concurrently | Both complete; balance ends at exactly 0; two `consumption` rows recorded with distinct `correlationId`s; grace not activated |
| AC-8 (Stripe webhook — successful purchase, browser closed) | I complete a Stripe Checkout session for a 100-credit pack and close the browser before the redirect lands | Stripe POSTs `checkout.session.completed` to `/api/stripe/webhook` | My balance increases by 100 server-side; the corresponding `Purchase` row transitions from `pending` to `completed`; one `purchase` row is recorded in `CreditTransaction` with `correlationId = <stripe-event-id>`; the webhook returns 200 |
| AC-9 (Stripe webhook — duplicate event delivery / replay) | A `checkout.session.completed` event was already processed for event `evt_xyz` | Stripe redelivers `evt_xyz` (e.g. on the original 200 being lost in transit) | The duplicate event is detected via `ProcessedWebhookEvent` row conflict; my balance is unchanged; no second `CreditTransaction` row recorded; the webhook returns 200 (so Stripe stops retrying) |
| AC-10 (Stripe webhook — invalid signature) | An attacker (or a misconfigured caller) POSTs a forged event to `/api/stripe/webhook` with a wrong/missing `Stripe-Signature` header | The webhook verifies the signature against `STRIPE_WEBHOOK_SECRET` | The webhook returns 400 ("invalid signature"); no balance change; no `ProcessedWebhookEvent` row created; no `CreditTransaction` row created; an `auth_error` event is logged via the structured logger |
| AC-11 (`/api/stripe/verify` becomes confirmation-only) | I complete a Stripe Checkout session and the redirect lands on `/dashboard/credits?session_id=…` | The dashboard calls `POST /api/stripe/verify` with the session id | If the webhook has already processed the event: the response says `{ status: 'completed', balance: <current> }` and my UI shows the new balance immediately. If the webhook has NOT yet processed the event: the response says `{ status: 'processing' }`; the dashboard polls every ~1s for ~10s, then falls back to a "still processing — your credits will appear shortly" message. **`/verify` never grants credits itself.** |
| AC-12 (Stripe checkout — Idempotency-Key on outbound call) | I click "Buy 100 credits" twice rapidly (network-double-click, retry, etc.) | The dashboard fires two `POST /api/stripe/checkout` requests in quick succession with the same intent | Stripe receives only one Checkout Session creation (because the outbound call carries an `Idempotency-Key` derived from the `Purchase.id` — both attempts see the same key and Stripe collapses them); only one `Purchase` row is created and used (or the duplicate is caught and reused) |
| AC-13 (`src/` deduct path matches PRD grace semantics) | I call `POST /api/credits` (or any consumer of `PrismaCreditsRepository.deductCredits`) with a request that would activate grace | The deduct executes | The `src/` deduct path returns success (with `graceActivated: true`) instead of `InsufficientCreditsError` (which is what it returns today per `credits-repository.ts:59`). The two implementations (`lib/credits.ts` and `src/`) are now mechanically aligned on the grace decision via the shared `CreditsDomainService` |
| AC-14 (no new `as any`, no new `lib/` files, no new throws) | The diff for this story is reviewed | `domain-guardian` is invoked at diff time | Net new `as any` count = 0; net new `lib/<...>.ts` files = 0; net new `throw new Error` outside `domain/` = 0. Pre-existing frozen violations may shift line numbers but the count never increases. |

---

## Test Plan

| ID | Description | Type |
|----|-------------|------|
| T-1 | Domain rule: `CreditsDomainService.canOperationProceed` covers the full PRD matrix (balance ≥ cost, balance < cost & grace not used & overage ≤ 20, balance < cost & grace not used & overage > 20, balance < cost & grace already used) — extend existing `credits-service.test.ts` | unit |
| T-2 | Domain rule: new `CreditsDomainService.computeDeductionDecision(lockedBalance, lockedGraceUsed, cost) → { kind: 'proceed' \| 'proceed-with-grace' \| 'reject', newBalance, willActivateGrace }` returns the expected verdict for each PRD scenario | unit |
| T-3 | Use case `DeductCreditsUseCase.execute` returns `Ok` with new balance + grace flag when deduct succeeds; returns `Err(InsufficientCreditsError)` when domain rejects; returns `Err(DatabaseError)` when repo errors — mocks the repo | unit |
| T-4 | Use case `ReverseCreditsUseCase.execute` (NEW) restores balance and writes the reversal `CreditTransaction` row when given a valid `originalCorrelationId`; returns `Err(NotFoundError)` when the original tx doesn't exist; idempotent on duplicate reversal call (won't double-reverse) | unit |
| T-5 | Use case `ProcessStripeWebhookEventUseCase.execute` (NEW) grants credits + flips Purchase status when given a valid `checkout.session.completed` event; returns `Ok({ idempotent: true })` when the event id was already processed; returns `Err(ValidationError)` when the event payload doesn't match the zod schema | unit |
| T-6 | Repo integration: `PrismaCreditsRepository.deductCredits` under **10 parallel goroutines** racing the same userId with the same starting balance (insufficient for both) → exactly N (the supportable count) succeed, the rest get `Err(InsufficientCreditsError)`. Asserts the row lock is taken correctly and grace is set exactly once | **integration (concurrent)** — mandatory per `78-testing.mdc` §7 |
| T-7 | Repo integration: `PrismaCreditsRepository.deductCredits` with the same `correlationId` twice → second insert is no-op (unique partial index conflict) → balance is debited only once → idempotency verified | **integration** |
| T-8 | Repo integration: `PrismaCreditsRepository.addCredits` (called from webhook path) with same `correlationId` twice → idempotent, balance increases only once | **integration** |
| T-9 | Repo integration: `PrismaCreditsRepository.reverseCredits` (NEW) restores balance after a successful deduct; double-reverse is a no-op (unique index on `<correlationId>--reverse`) | **integration** |
| T-10 | Webhook route: `POST /api/stripe/webhook` with a valid `checkout.session.completed` payload signed with the test secret → 200 + balance grants happen | **integration** |
| T-11 | Webhook route: same valid event delivered twice → 200 both times, balance debited only once, second insert into `ProcessedWebhookEvent` is conflict | **integration** |
| T-12 | Webhook route: invalid signature → 400, no side effects | **integration** |
| T-13 | Webhook route: malformed JSON body → 400 (zod parse fails on the validated event shape after signature verification) | **integration** |
| T-14 | Verify route: `POST /api/stripe/verify` for a `Purchase` whose webhook already ran → returns `{ status: 'completed' }` + current balance, **does not** mutate any row | **integration** |
| T-15 | Verify route: `POST /api/stripe/verify` for a `Purchase` whose webhook has not yet run → returns `{ status: 'processing' }` | **integration** |
| T-16 | Clarify route: pre-check passes, AI succeeds → balance debited exactly once after AI completion; `QuestionHistory` row written | **integration** |
| T-17 | Clarify route: pre-check passes, AI fails (mock provider 5xx) → balance unchanged; reversal `CreditTransaction` row written if a deduct fired before the failure was detected; `QuestionHistory` row NOT written | **integration** |
| T-18 | Generate-PRD route: same shape as T-16 / T-17 for `prd_generation` op type | **integration** |
| T-19 | Contract: `CheckoutSessionCompletedEventSchema` parses a real Stripe sandbox `checkout.session.completed` payload (captured fixture); rejects a payload missing `id`, missing `metadata.purchaseId`, or with `payment_status !== 'paid'` | **contract** |
| T-20 | Contract: `PaymentIntentSucceededEventSchema` parses a real Stripe sandbox `payment_intent.succeeded` payload; rejects missing-field variants | **contract** |
| T-21 | Contract: `WebhookEventEnvelopeSchema` (the discriminated-union outer shape) routes a `checkout.session.completed` to its handler; rejects unknown event types with a typed error | **contract** |
| T-22 | Contract: `DeductCreditsRequestSchema` and `DeductCreditsResponseSchema` round-trip through `safeParse` for a valid input/output and rejects malformed inputs | **contract** |

(E2E covering signup → first PRD circuit → credit deduct → share link is **deferred to a separate slice** per `78-testing.mdc` §2 — Playwright doesn't exist in the repo today; bootstrapping it is its own slice. Documented in Plan §"Out of Scope".)

---

## Touched Files (predicted)

| Path or layer | Reason |
|---------------|--------|
| `zedos/nextjs_space/prisma/schema.prisma` | Add `ProcessedWebhookEvent` model; add `correlationId` (nullable) + unique partial index to `CreditTransaction` |
| `zedos/nextjs_space/prisma/migrations/<NNNN>_add_webhook_idempotency_and_correlation_id/migration.sql` (new) | Forward-only Prisma migration for the schema change above (also bootstraps the `migrations/` directory which doesn't exist today) |
| `zedos/nextjs_space/lib/credits.ts` | Refactor `deductCredits` + `addCredits` to use `prisma.$transaction(async tx => …)` with `tx.$queryRawUnsafe` for `SELECT … FOR UPDATE`; thread `correlationId` through the API; add `reverseCredits(userId, originalCorrelationId)`. Frozen `lib/` zone — modifying existing files is permitted; no new `lib/<...>.ts` files |
| `zedos/nextjs_space/src/infrastructure/persistence/credits-repository.ts` | Same refactor; align grace decision with PRD via shared `CreditsDomainService.computeDeductionDecision`; add `reverseCredits` method to repo + port |
| `zedos/nextjs_space/src/domain/credits/credits-repository.ts` | Add `reverseCredits` to `ICreditsRepository` port; widen `deductCredits` signature to accept `correlationId` (and the optional grace-decision input from domain) |
| `zedos/nextjs_space/src/domain/credits/credits-service.ts` | Add `computeDeductionDecision(lockedBalance, lockedGraceUsed, cost): { kind, newBalance, willActivateGrace }` as the single domain authority on grace + balance check |
| `zedos/nextjs_space/src/domain/credits/credits-service.test.ts` | Extend tests for the new `computeDeductionDecision` matrix |
| `zedos/nextjs_space/src/application/credits/deduct-credits-usecase.ts` | Adapt to the new repo signature; thread `correlationId`; on `Err(...)` from repo, decide whether to call reverse |
| `zedos/nextjs_space/src/application/credits/reverse-credits-usecase.ts` (new) | New use case for AI-failure compensating reversal |
| `zedos/nextjs_space/src/application/credits/process-stripe-webhook-event-usecase.ts` (new) | New use case wrapping zod-validated event → balance grant + Purchase update + ProcessedWebhookEvent insert |
| `zedos/nextjs_space/src/contracts/payments/` (new directory) | New contracts for Stripe webhook event shapes + checkout session response |
| `zedos/nextjs_space/src/contracts/payments/webhook.ts` (new) | `WebhookEventEnvelopeSchema` (discriminated union), `CheckoutSessionCompletedEventSchema`, `PaymentIntentSucceededEventSchema` — derived from Stripe's published types but verified as zod schemas; types via `z.infer` |
| `zedos/nextjs_space/src/contracts/payments/checkout.ts` (new) | `CreateCheckoutSessionRequestSchema` (server-side normalised), `CheckoutSessionResponseSchema` |
| `zedos/nextjs_space/src/contracts/payments/index.ts` (new) | Barrel re-exports |
| `zedos/nextjs_space/src/contracts/payments/__fixtures__/` (new) | Captured Stripe sandbox payloads: `checkout-session-completed.valid.json`, `checkout-session-completed.missing-purchase-id.json`, `payment-intent-succeeded.valid.json`, `webhook-envelope.unknown-type.json` |
| `zedos/nextjs_space/src/contracts/payments/webhook.contract.test.ts` (new) | Contract tests T-19, T-20, T-21 |
| `zedos/nextjs_space/src/contracts/credits/deduct.ts` (new) | `DeductCreditsRequestSchema`, `DeductCreditsResponseSchema` (factored out of `credits-contracts.ts` for the new shape) |
| `zedos/nextjs_space/src/contracts/credits/deduct.contract.test.ts` (new) | Contract test T-22 |
| `zedos/nextjs_space/app/api/stripe/webhook/route.ts` (new) | New Stripe webhook handler — reads raw body, verifies signature, idempotency check, routes via `ProcessStripeWebhookEventUseCase` |
| `zedos/nextjs_space/app/api/stripe/verify/route.ts` | Refactor to confirmation-only (no credit grants); read-only check of `Purchase.status`; returns `{ status: 'processing' \| 'completed' \| 'failed' }` |
| `zedos/nextjs_space/app/api/stripe/checkout/route.ts` | Add `Idempotency-Key` header on `stripe.checkout.sessions.create` (key = `Purchase.id`); add `payment_intent_data.metadata` for webhook routing; no other changes |
| `zedos/nextjs_space/app/api/projects/[id]/clarify/route.ts` | Refactor: pre-check (existing `checkCredits`) → AI call → on success deduct (with correlationId) + write QuestionHistory → on error reverse (no-op if no deduct happened); preserve streaming UX |
| `zedos/nextjs_space/app/api/projects/[id]/generate-prd/route.ts` | Same refactor pattern as clarify route |
| `zedos/nextjs_space/vitest.integration.config.ts` (new) | Minimal integration vitest config (separate from unit `vitest.config.ts`) — required by `78-testing.mdc` §6 |
| `zedos/nextjs_space/src/test-helpers/setup-test-db.ts` (new) | Postgres test-container helper for integration tests (uses `testcontainers/postgresql` if added; otherwise points to a local `postgres` URL via env). Plan picks one of these in the Surface Block. |
| `zedos/nextjs_space/src/infrastructure/persistence/credits-repository.integration.ts` (new) | Concurrent integration tests T-6 / T-7 / T-8 / T-9 |
| `zedos/nextjs_space/app/api/stripe/webhook/route.integration.ts` (new) | Webhook integration tests T-10 / T-11 / T-12 / T-13 |
| `zedos/nextjs_space/app/api/stripe/verify/route.integration.ts` (new) | Verify-route integration tests T-14 / T-15 |
| `zedos/nextjs_space/app/api/projects/[id]/clarify/route.integration.ts` (new) | Clarify integration tests T-16 / T-17 (mocked AI provider) |
| `zedos/nextjs_space/app/api/projects/[id]/generate-prd/route.integration.ts` (new) | Generate-PRD integration tests T-18 |
| `zedos/nextjs_space/.env.example` (new — if absent today) | Documents `STRIPE_WEBHOOK_SECRET` (and any other required env vars) |
| `zedos/nextjs_space/package.json` | Add `test:integration` script and `typecheck` script (per `78-testing.mdc` §6); add **at most one** dependency: `@testcontainers/postgresql` for the integration harness — only if Plan picks the test-container approach (vs. local-Postgres-via-env). Decision recorded in Plan §"Architecture Surface Block" |

(Estimated total: ~28 files / ~700–900 net lines / 5 layers / 1 schema migration. Exceeds `79-pr-sizing.mdc` §2 standard size — see Plan §"PR Sizing / Split Strategy" for the proposed 4-PR stack.)

---

## Out of Scope

- **Consolidation of `lib/credits.ts` and `src/{domain,application,infrastructure}/credits/*`** — kept as parallel implementations; both are made concurrency-safe in this story; consolidation is a separate slice.
- **Re-enabling `eslint.ignoreDuringBuilds: true`** — separate slice; this story does not modify `next.config.js`.
- **Cleanup of pre-existing 117 `as any` casts** — frozen until Phase 1 of monorepo retro (`73-result-rop.mdc` §7). This story does not contribute new casts; it may incidentally reduce the count in touched files.
- **Auto-reload via Stripe (PRD Q-020)** — separate slice in Payments FA. The webhook handler this story ships will be reused by auto-reload later.
- **Tax/VAT receipts (PRD Q-015)** — separate slice in Payments FA.
- **E2E Playwright test for the full purchase flow** — separate slice (Playwright doesn't exist in the repo).
- **Storybook, Datadog, MSW** — out of scope per cursor-setup retro Phase 4.
- **Migration to Drizzle, better-auth, neverthrow, or Turborepo** — out of scope for Phase 2 per task spec.
- **Updates to PRD copy, recharge modal copy, balance display copy** — depend on B-003 (operator X) and B-004 (burn-tier launch commitment); both deferred to commercial planning.
- **Changes to `grantStarterCredits`** — not on the deduct or grant path that the retro flagged.
- **Anonymous-share-viewer surface changes** — none required; webhook is server-to-server only.
- **Rate limiting on `/api/stripe/webhook`** — explicitly excluded per `security-pii.md` §6 (Stripe rate-limits its own retries).

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| OQ-1 | Should the Plan use `@testcontainers/postgresql` (adds 1 dependency) or a local `postgres` URL via env (no dependency, but contributors must run a local Postgres) for the integration test harness? | Test harness setup in Plan §"Tests" | Resolved in Plan §"Architecture Surface Block" — see decision recorded there |
| OQ-2 | When AI fails between deduct and stream-completion, should `reverseCredits` also clear `User.graceUsed = false` (restoring grace) if the deduct activated grace? Or is grace "consumed on attempt"? PRD Q-014/Q-019 are silent on the rollback case. | The reversal-restores-grace decision in Plan §"Approach" | Surfaced as an "Open question" in PIS — recommend defaulting to **grace consumed on attempt** (do not restore graceUsed) for v0 to match the PRD's anti-abuse intent ("grace applies once during the first PRD circuit only"); revisit if reversal becomes common in observed traffic |
| OQ-3 | The `src/contracts/payments/__fixtures__/` files require capturing real Stripe sandbox payloads. Does the user have a Stripe sandbox account ready, or does the Plan need to ship a "TODO: capture real fixtures during Phase 2b" placeholder set? | The contract test corpus | Surfaced in PIS — recommend defaulting to placeholder fixtures derived from Stripe's published API reference docs in Phase 2b plan, with a `TODO:` to swap for real captured payloads before the Foundation PR merges |
| OQ-4 | The AI route refactor (clarify, generate-prd) needs a deterministic `correlationId`. Proposed: `<projectId>--<opType>--<requestId>` where `requestId` is generated server-side and returned in the response so the client can retry idempotently. Does the user want client-supplied request IDs (more idempotent) or server-supplied (simpler)? | The AI-side idempotency contract | Surfaced in PIS — recommend default **server-supplied** for v0 (lower client surface area; fully addresses the in-flight rollback case) |

---

## Decision References

- **PRD §"Payment model"** — first-circuit grace ≤ 20 credits, pre-check gate, post-grace block at zero, no hidden debt / silent retry / negative balance except first-circuit grace.
- **PRD Q-019** — fixed credit ceiling: 20 credits; pre-check gate; one-time during first PRD circuit only.
- **PRD Q-018** — directional burn tiers (1/3/5/10/15) — operator-tunable, not committed in this slice.
- **PRD Q-015** — Stripe locked as v0 provider; FR/EU + US launch markets.
- **PRD Q-016** — pack denominations 100/200/1000; operator-config pricing.
- **PD-NNN** — none; no new product decision is created by this slice. The carve-out justification in the parent Slice serves as the slice-local rationale; if any cross-slice carve-out becomes a recurring pattern, a `PD-001` documenting "safety-fix-slice carve-out criteria" should be created (deferred to friction-log F-01 polish).
- **`docs/retro/zedos-monorepo-retro.md`** findings #2, #3, #24, #25, #26, #35, #48, #49 — the source of the bug shapes this story addresses.
- **`docs/retro/cursor-setup-retro.md`** §6 — context on the execution-side `.cursor/` half being dogfooded.

---

## Readiness for Implementation Plan

- [x] Story expressed in user-value terms (no implementation language in the Story sentence; technical detail confined to AC table where it directly maps to test assertions, per template guidance)
- [x] Acceptance Criteria cover at least one row per UX state from the parent Scope Slice (normal AI, AI failure, pre-check block, grace activation, post-grace block, concurrent calls — both racing-for-one and racing-with-room, webhook success / browser-closed, webhook replay, webhook signature failure, verify-as-confirmation, checkout idempotency, src/-path grace alignment, no-frozen-violations check)
- [x] Test plan names test type for each item (12 unit + 13 integration + 4 contract = 29 tests; all classified)
- [x] Touched Files (predicted) is non-empty (~28 files listed)
- [x] Out of Scope is non-empty (12 items)
- [x] All Open Questions either answered or carry an explicit next action (4 open questions, all routed)
- [x] Decision references resolved (or `none` stated explicitly)

**Verdict:** READY FOR IMPLEMENTATION PLAN — *conditional on user waiver of parent FA carve-out at PIS approval (per parent Slice "Parent FA Carve-out")*.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial authoring from `.cursor/templates/execution/user-story.template.md` per `/plan` Step 1. | Phase 2a planning worker (Architect role) |
