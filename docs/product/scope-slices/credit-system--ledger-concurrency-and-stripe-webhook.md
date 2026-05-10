<!--
  Scope Slice — manually authored from .cursor/templates/product/scope-slice.template.md
  Justification: Phase 2a dogfood; parent FA-credit-system is `exploratory` + `NEED_HUMAN: true` (B-003, B-004)
  on commercial-config decisions (operator-tunable starter X, burn-tier launch commitment) that are
  ORTHOGONAL to this slice's structural-safety scope. See "Parent FA Carve-out" below + friction-log F-01.
-->

# Scope Slice: Make the credit ledger concurrency-safe and route credit grants through a Stripe webhook

## Parent Feature Area

[Credit system](../feature-areas/credit-system.md)

(Cross-FA touch on **[Payments](../feature-areas/payments.md)** for the new Stripe webhook handler — see `Dependencies`.)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false — *with explicit Parent FA Carve-out, see below*
> **NEED_UPDATE:** true — `feature-area-workflow.mdc` does not yet describe a "structural-safety / safety-fix slice" subtype that may carve out a parent FA's commercial-config `NEED_HUMAN: true`. Captured in `docs/retro/phase2a-friction-log.md` F-01.

---

## Parent FA Carve-out (one-time, slice-specific)

`FA-credit-system` carries `NEED_HUMAN: true` for two open blockers:

- **B-003** — Starter credit grant **X** is operator-tunable / TBD (Q-008).
- **B-004** — Directional burn-tier table is product assumption — commitment for launch UX / metering expectations undecided.

**Both are commercial-configuration decisions** (what number, what list price, what UX framing) and are **orthogonal** to whether the existing ledger is concurrency-safe and whether existing credit grants survive a closed browser tab. This slice changes **no product-visible behavior** that depends on either blocker:

- This slice does not pick a value for X (it preserves whatever `STARTER_CREDITS` env var is set to — currently `20`).
- This slice does not commit the burn-tier numbers to launch (it preserves whatever `CREDIT_COST_*` env vars are set to — currently the directional model from PRD Q-018).
- This slice does not touch starter-credit grant logic.
- This slice does not change the user-visible recharge UX, balance display, or grace messaging copy.

**It does change**: when a deduct happens (after AI success vs before AI start), how grants are triggered (Stripe webhook vs `/verify` redirect poll), and how concurrent operations are serialised (transaction + row lock vs unsafe read-then-write).

The user is asked, in the Patch Intent Summary, to explicitly waive CC-04 (NEED_HUMAN propagation) for this slice with the carve-out on the record. If the waiver is refused, this slice cannot proceed and the work routes back to `/feature-area refine-slice` (which would require resolving B-003 + B-004 first — i.e. waiting on commercial decisions before fixing a CRITICAL safety issue).

---

## User Value

A founder who buys credits keeps the credits even if they close the browser tab between Stripe redirect and the verify call; concurrent AI operations against the same balance never silently double-deduct or grant credits twice; AI failures do not consume the founder's credits.

---

## Exact Boundary

### Included Behavior

- **Concurrency-safe deduct.** Two parallel AI operations against the same user account never both succeed past the balance the user actually has. The PRD's first-circuit grace ceiling (≤ 20 credits, one-time) is respected exactly once even under racing requests.
- **Concurrency-safe credit grant.** Two webhook deliveries for the same Stripe event (Stripe retries on 5xx) credit the user exactly once.
- **Webhook-driven credit grants on completed checkout.** Closing the browser tab after Stripe payment success no longer leaves the user with a paid charge and zero credits. Credits are granted when Stripe POSTs `checkout.session.completed` (or the equivalent payment-completion event), not when the browser hits `/dashboard/credits?session_id=…`.
- **AI deduct only on AI success.** When an AI operation (clarification step, PRD generation) is started, credits are deducted only after the AI streamed response completes successfully. If the AI call fails (timeout, provider 5xx, invalid streamed JSON), no credits are consumed.
- **Pre-check gate is preserved exactly.** The PRD's "if projected overage > 20 credits, block before starting" gate runs in the same place it runs today (before the AI call). The change is what happens *after* the gate passes (deduct moves to after success), not the gate itself.
- **`/verify` becomes a UX confirmation only.** The redirect-handler endpoint reports whether the webhook has finalised the purchase yet ("processing" vs "completed"); it never grants credits itself.
- **Single source of truth for the grace decision.** Both the `lib/credits.ts` deduct path (used by AI routes today) and the `src/infrastructure/persistence/credits-repository.ts` deduct path (used by `app/api/credits/route.ts` today) compute the grace decision via the same domain rule (`CreditsDomainService.canOperationProceed` extended), so the two paths cannot disagree on whether grace applies.

### Excluded Behavior

- **No consolidation of the two credit implementations.** `lib/credits.ts` and `src/{domain,application,infrastructure}/credits/*` both continue to exist. Both gain concurrency safety in this slice; neither is deleted. Consolidation lands in a follow-up slice (`credit-system--consolidate-ledger-implementations`, not authored here) — justified because consolidation is a refactor with its own test footprint and would 2× the diff for this slice, and the current dual-implementation safety risk is fully addressed by fixing both paths in place.
- **No re-enabling of `eslint.ignoreDuringBuilds: true`.** That fix lands in a separate slice (`credit-system--reenable-eslint-at-build` or its own `tech-debt-slice`, not authored here) — the diff to clean up resulting lint violations is large and unrelated to ledger / webhook correctness. Reviewer can verify this slice's diff with `npx next lint` run as a separate step (per `verifier.md` layout-notes).
- **No cleanup of the 117 pre-existing `as any` casts.** Frozen until `73-result-rop.mdc` §7's `neverthrow` migration (Phase 1 of monorepo retro). This slice **does not contribute** new `as any` casts (verified in Plan §"Risks") and may incidentally remove a few in touched files, but does not undertake the broader cleanup.
- **No change to starter-grant logic or `grantStarterCredits`.** Out of scope; the function is not on the deduct or grant path that the retro flagged.
- **No change to commercial values.** No new pack sizes, no new burn-rates, no UX copy edits to balance displays or recharge modals (those depend on B-003 / B-004).
- **No consumer-facing UX redesign of the recharge flow.** The `/dashboard/credits` page may show a new "Processing your purchase…" state when the webhook hasn't run yet, but the recharge / pack-selection / Stripe-redirect UX itself is unchanged.
- **No introduction of Drizzle, better-auth, the Turborepo, or `neverthrow`.** All Phase 3 / Phase 1 / Phase 2 monorepo work remains explicitly deferred. The slice ships on Prisma + NextAuth + the legacy `Result<T, E>` type (with `as any` casts at boundaries kept frozen, not added to).
- **No new pricing logic or VAT/tax handling.** Out of scope; PRD-deferred to commercial planning.
- **No anonymous-share-viewer surface change.** Webhook is a server-to-server endpoint; no public read surface introduced.

---

## UX States

This slice is **structural correctness** — no new user-facing UI surface is introduced. The only user-visible deltas are listed below; all happen on already-present pages.

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Normal AI completion | AI streamed response finishes | Identical to today: chat reply rendered. Credit balance decreases by the operation cost (after the response, not before). |
| AI failure (timeout / provider 5xx / invalid JSON) | AI call errors | Identical to today's error path: error message rendered. **Difference**: credit balance is unchanged (no charge for failed work). |
| Pre-check block (projected overage > 20 credits, grace not used) | User starts a costly op with insufficient balance | Identical to today: 402 response with recharge prompt. |
| Pre-check block (balance < cost, grace already used) | User starts any op with insufficient balance after grace | Identical to today: 402 response with recharge prompt. |
| Grace activation (one-time, in-flight completion) | User starts an op where projected overage ≤ 20 and grace not yet used | Identical to today: AI completes, credit balance goes to (≤ 0 within −20), graceUsed flag flips. |
| Stripe checkout success — webhook arrives quickly | Stripe redirects to `/dashboard/credits?session_id=…`; webhook fired within ~1s | New balance shown immediately after the page's verify call returns "completed". (Today's experience.) |
| Stripe checkout success — webhook delayed | Same redirect, but webhook hasn't fired yet (Stripe network lag, retry) | **New state**: page shows "Processing your purchase…" with a polling spinner; resolves to "completed" once webhook lands; falls back to "still processing — your credits will appear shortly" copy after ~10s. |
| Stripe checkout success — user closes tab before / during webhook | User completes payment, closes browser before redirect, returns later | **Difference vs today**: credits are present on next dashboard load (webhook granted them server-side). Today: credits are missing until user manually re-hits `/api/stripe/verify` with the session id, which they have no reliable way to do. |
| Concurrent AI calls from the same user | User opens two tabs, fires both | Each call independently sees the locked, current balance; one wins and deducts, the other is rejected with the same 402 the user would see in single-tab. No double-deduct, no double-grace. |
| Stripe webhook replay (duplicate `event.id`) | Stripe retries delivery | Idempotent: balance is unchanged after the duplicate event; webhook returns 200 to Stripe to stop the retry loop. |
| Webhook signature invalid | Misconfigured `STRIPE_WEBHOOK_SECRET` or attacker-forged request | Webhook returns 400; no credits granted; logged for ops. |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| AI credit balance (`User.creditBalance`, `User.graceUsed`) | Read (with row lock) + Update | All deducts and grants now run inside `prisma.$transaction(async tx => { ... })` with `tx.$queryRawUnsafe('SELECT ... FOR UPDATE', userId)` taken on the user row first (per `75-drizzle.mdc` §7 Prisma transitional rule). |
| Credit ledger (`CreditTransaction`) | Insert (with idempotency key) | Each insert carries a new `correlationId` column; a unique partial index on `(user_id, correlation_id)` makes duplicate inserts no-ops, supporting both AI retry idempotency and webhook idempotency. Reversal entries (for AI failure rollback) are inserted with `correlationId = <original>--reverse`. |
| Stripe webhook event log (`ProcessedWebhookEvent`) | Insert (new table) | New table keyed by `eventId` (Stripe's `event.id`). Insert with ON CONFLICT DO NOTHING; conflict means "already processed", webhook returns 200. Records `eventType` and `processedAt` for ops/audit. |
| Purchase (`Purchase`) | Read + Update (status → completed) | Webhook flips `Purchase.status` from `pending` to `completed` and writes `stripePaymentIntentId`. `/verify` no longer mutates `Purchase`. |
| Question history (`QuestionHistory`) | Insert (unchanged) | Insertion still happens after AI streamed response completes (existing path); the deduct now happens immediately before the question-history insert, both inside the same per-request "post-AI completion" code path. |
| PRD version (`PrdVersion`) | Insert (unchanged) | Same pattern as question history. |

---

## Credit / Payment Impact

This slice **is** the credit/payment correctness fix. Specifically:

- **Credit consumption:** unchanged in semantics (per-operation per the PRD's directional burn tiers), changed in *timing* (deduct after AI success, not before AI start) and changed in *concurrency safety* (transaction + row lock).
- **First-circuit grace:** unchanged in semantics (≤ 20-credit ceiling, pre-check gate, one-time, then block). Computed by the existing `CreditsDomainService.canOperationProceed`, now invoked from inside the transaction with the locked balance + graceUsed.
- **Block at zero (post-grace):** unchanged in semantics, now mechanically enforced inside the transaction (cannot be raced past).
- **Stripe purchase flow:** changed in *trigger* (webhook, not redirect-poll). User-facing UX (pack picker, redirect to Stripe Checkout, return-to-dashboard) is unchanged. The `Purchase` row transitions from `pending` to `completed` via the webhook path; `/verify` becomes a read-only confirmation endpoint.
- **Auto-reload (per PRD Q-020):** **not in scope for this slice**. Auto-reload is a future slice in the Payments FA; this slice ensures the manual-purchase webhook contract exists, which auto-reload will reuse later. Auto-reload's SCA/manual-fallback story is not implemented here.

---

## Sharing / Privacy Impact

None — no share-link issuance, revocation, or anonymous-readable surface changes. The webhook endpoint is server-to-server only (Stripe → app), explicitly excluded from rate limiting (per `security-pii.md` §6) and not exposed via `/share/*` paths.

The webhook does log the user id of the recipient on grant (per `security-pii.md` §2 — using the structured logger which redacts known sensitive fields). It does not log full Stripe payloads, card details, or PII beyond `userId` + `eventId` + `packSize`.

---

## Feedback / Instrumentation Impact

None for the milestone-feedback prompts the PRD lists (first PRD version created, PRD updated after clarification, PRD shared, PRD reopened by owner). This slice does not produce or modify any owner-facing feedback prompts.

It does add one server-side instrumentation point: structured-logger entries for `webhook_received`, `webhook_idempotent_skip`, `credit_grant_applied`, `credit_deduct_applied`, `credit_deduct_reversed`. These power ops/observability, not user-facing feedback.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| [Credit system FA](../feature-areas/credit-system.md) | Parent Feature Area | exploratory + `NEED_HUMAN: true` | Carved out for this slice — see "Parent FA Carve-out" above. Must be explicitly waived in PIS approval. |
| [Payments FA](../feature-areas/payments.md) | Sibling Feature Area (cross-touch) | exploratory + `NEED_HUMAN: false` | This slice creates the Stripe webhook surface that future Payments-FA slices (auto-reload, tax/VAT receipts) will extend. The Payments FA does not need to be `validated` for this slice to ship — the webhook contract exists at the integration boundary, not the product surface. |
| Stripe **provider locked** (per PRD Q-015) + EU/US launch markets | Product constraint | ready | The webhook surface targets Stripe Checkout's documented event shape. |
| `STRIPE_WEBHOOK_SECRET` env var | Operational config | **not yet set** | New env var required to verify webhook signatures. The Plan documents the new env var and the bootstrap step (Stripe Dashboard → Developers → Webhooks → endpoint URL → reveal signing secret → set in `.env`). Phase 0 secret rotation (user-owned) is the natural moment to set this. |
| Pre-migration **NextAuth + Prisma + legacy `Result<T,E>`** stack | Stack constraint | locked for Phase 2 (per task spec) | No migration to Drizzle / better-auth / neverthrow inside this slice. |
| `prisma migrate` baseline / migration tooling | Tooling | partially ready | The repo has `prisma/schema.prisma` but **no `prisma/migrations/` directory** today (per monorepo retro finding #28). The Plan documents bootstrapping the migrations directory for the new `processed_webhook_events` table + `credit_transactions.correlationId` column. This adds a small chunk of "first migration" work but is unavoidable. |
| **Test integration harness** (vitest config + Postgres test container) | Tooling | not present | `78-testing.mdc` §7 mandates a concurrent integration test for ledger code. The harness does not exist (`vitest.config.ts` only includes `*.test.ts`). The Plan ships a minimal `vitest.integration.config.ts` + a Postgres test-container helper as part of PR #2 of the proposed stack (see Plan §"PR Sizing"). |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| User must waive CC-04 (parent FA `NEED_HUMAN` propagation) for this slice — see "Parent FA Carve-out" | Slice promotion to `ready-for-user-stories` (this row's existence prevents auto-promotion via `/feature-area promote-slice` until human says yes) | true (one-time, surfaced in PIS) |
| Operator must set `STRIPE_WEBHOOK_SECRET` in `.env` before Phase 2b code can be exercised end-to-end | Local + production verification of the webhook path | true (operational setup, deferred to Phase 2b) |

The first blocker is the **only** approval gate for this slice. The second is a deployment precondition, surfaced for completeness; it does not block planning or implementation, only the "can we run the webhook end-to-end?" verification step.

---

## Acceptance-Level Outcome

A founder can complete a Stripe purchase, close the browser before the redirect lands on the dashboard, return later, and see the purchased credits already on their balance — because the credit grant happened server-side via Stripe's webhook, not via the founder's browser hitting the verify endpoint. Two parallel AI requests from the same founder against the same balance never both succeed past what the founder actually has, and the first-circuit grace activates exactly once even under racing requests. An AI request that fails (provider error, timeout, invalid streamed JSON) leaves the founder's balance unchanged. A duplicate Stripe webhook delivery (Stripe retries on 5xx) does not double-credit. A request with an invalid Stripe signature is rejected before any side effect. None of the user-facing copy, balance display, recharge modal, or pack-pricing logic changes; the operator-tunable starter X and burn-tier values remain operator-configurable; this slice changes when and how the existing semantics execute, not what they are.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated (including error, empty/processing, edge — webhook delay, replay, signature failure)
- [x] Business objects named (`User.creditBalance`, `CreditTransaction`, new `ProcessedWebhookEvent`, `Purchase`)
- [x] Credit / payment impact assessed
- [x] Sharing / privacy surface assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set (the FA carve-out is `NEED_HUMAN: true`, surfaced in PIS)
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES — *conditional on user waiver of FA carve-out at PIS approval*.

If the user refuses the carve-out at PIS approval, the verdict reverts to BLOCKED on B-003 + B-004 and the slice cannot proceed without first resolving them via `/feature-area refine-slice credit-system` after the operator picks a value for X and commits the burn-tier table.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Manually authored from template (per `feature-area-workflow.mdc` §4 "ordinary human/manual use of the template"). Status set to `ready-for-user-stories` with explicit Parent FA Carve-out justification — see friction-log F-01. | Phase 2a planning worker |
