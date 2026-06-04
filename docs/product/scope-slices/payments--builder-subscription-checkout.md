# Scope Slice: Builder subscription checkout

## Parent Feature Area

[Payments](../feature-areas/payments.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A signed-in founder who has seen product value (share or export) can **subscribe to Builder monthly** via self-serve checkout so exports and included usage unlock without buying credit packs for every session.

---

## Exact Boundary

### Included Behavior

- Owner on **Free** tier can start **Builder Monthly** checkout from pricing page or upgrade modal (export gate, per `docs/product/conversion-export-cursor-spec.md`).
- **Stripe** Checkout Session in **subscription** mode for one Builder product/price (operator-configured).
- On successful subscription activation, account **plan tier** becomes **builder**; **full Cursor export** and Builder entitlements per pricing narrative (coordination with `delivery--export-cursor-conversion-gate`).
- **Stripe Customer Portal** link for cancel / update payment method; cancel at period end → revert to **free** and re-apply export gate.
- Failed renewal / payment: owner sees in-app **update payment** path and receives Stripe lifecycle emails.
- **Coexistence** with existing **one-time credit packs** and ledger (packs = top-up / overage, not replacement of subscription positioning).
- **Tax/VAT** legibility aligned with existing payments FA (`payments--tax-and-vat-legibility` — already shipped).

### Excluded Behavior

- **Pro** plan, annual billing, team/seat billing v1.
- Auto-migration of historical pack-only buyers to subscription without explicit checkout.
- Replacing the internal **credit ledger** entirely with subscription-only metering v1.
- BYOK, unlimited free AI, hidden subscription via auto-reload (auto-reload remains prepaid pack behavior per PRD).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Gated — not signed in | Anonymous or expired session | Cannot start checkout; sign-in required |
| Free — upgrade entry | `planTier=free`, eligible surface | Upgrade CTA visible (pricing / export modal) |
| Checkout — redirect | Owner clicks upgrade | Redirect to Stripe Checkout |
| Checkout — abandoned | Returns without completing | Still free; prior workspace state unchanged |
| Active — builder | Webhook confirms active subscription | Export unlocked; Builder copy on billing surfaces |
| Active — portal manage | Owner opens Customer Portal | Can update card or schedule cancel |
| Cancel — pending end | Cancel at period end | Still builder until period end; messaging shows end date |
| Downgrade — free | Subscription ended | `planTier=free`; export gate returns |
| Payment failed | Invoice/payment failed | Banner or modal to update payment; export may degrade per policy |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Account / owner profile | Read, Update | `planTier`, Stripe customer/subscription identifiers (product-level fields) |
| Subscription entitlement | Create, Update | Reflects Builder active / canceled / past_due |
| Credit balance / ledger | Read | Coexists; packs still purchasable |
| Cursor export entitlement | Read | Gated by plan tier in coordination with delivery slice |

---

## Credit / Payment Impact

**Yes** — introduces **recurring Builder subscription** (Stripe) distinct from one-time packs. Subscription unlocks **included usage** positioning per blueprint; **pack purchases** remain for top-up. Does not remove per-operation ledger burns for AI unless product policy later bundles usage into plan (out of this slice).

---

## Sharing / Privacy Impact

None — subscription state is owner-private; share links and anonymous read surfaces unchanged.

---

## Feedback / Instrumentation Impact

**Yes** — attribute upgrade funnel events: checkout started, subscription activated, canceled (project/account context). Optional owner milestone after first successful Builder activation (product analytics — not blocking v0 stars path).

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `docs/product/stripe-subscription-builder-brief.md` | Product brief | complete | AC source |
| `docs/gtm/pricing-page-copy-en-v1.md` | GTM copy | complete | Builder price/copy |
| FA-payments (pack checkout, tax) | Feature Area | complete | Stripe baseline |
| `delivery--export-cursor-conversion-gate` | Scope Slice | exploratory | Soft/hard gate UX |
| PRD § Payment model — Phase 1 wedge | PRD | complete | Builder sub documented 2026-06-04 |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none — B-SUB-PRD-001 resolved `/prd update` 2026-06-04)_ | — | — |

---

## Acceptance-Level Outcome

A signed-in **free** owner can complete **Builder Monthly** checkout, land back in Zedos with **builder** tier active, export a **full Cursor package** without pack-only friction, manage billing in **Customer Portal**, and after cancel-at-period-end return to **free** with export gating restored — while **one-time credit packs** remain available for top-up.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated (including error and empty states)
- [x] Business objects named
- [x] Credit / payment impact assessed
- [x] Sharing / privacy surface assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-04 | Blueprint scaffold (minimal) | — |
| 2026-06-04 | `/feature-area refine-slice` — full product sections | — |
| 2026-06-04 | Promoted to ready-for-user-stories after `/prd update` (Phase 1 wedge) | — |
