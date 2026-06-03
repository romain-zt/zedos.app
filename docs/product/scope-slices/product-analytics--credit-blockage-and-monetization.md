<!--
  Scope Slice — product-analytics: credit blockage and monetization funnel
-->

# Scope Slice: Credit blockage and monetization funnel

## Parent Feature Area

[Product analytics (PostHog)](../feature-areas/product-analytics.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

When founders hit **“not enough credits”**, the team can see whether they **open the credits page**, **start checkout**, and **complete purchase**—so monetization friction is measurable, not inferred from Stripe alone.

---

## Exact Boundary

### Included Behavior

- **Blockage events** are recorded whenever the product already refuses an AI action for insufficient credits (clarification, PRD generation, feature split, etc.) with:
  - which **action** was blocked (clarification, PRD generation, …)
  - **project** context (id only)
  - optional **surface** (chat, button, stream error toast)
- **Funnel B (monetization)** is measurable:
  1. Any credit blockage event
  2. Credits page viewed (signed-in owner)
  3. Credit pack checkout started
  4. Credit pack checkout completed (successful payment)
- **Auto-reload** preference changes are countable (enabled/disabled) for ops segmentation—not billing logic changes.
- **Balance context** on events is limited to **non-sensitive buckets** (e.g. zero / low / ok) if exact balance is deemed too sensitive for dashboards; exact numbers only if policy allows.

### Excluded Behavior

- **Stripe dashboard replacement** — finance still uses Stripe; this slice is product funnel only.
- **Tax/VAT legibility UX** — Payments FA; no duplicate unless checkout abandoned for tax confusion (optional property later).
- **Subscription or recurring billing** — out of v0 PRD.
- **Refund/chargeback analytics** — finance ops, not v0 slice.
- **Starter credit grant at signup** — counted in activation slice; not duplicated as purchase.

---

## UX States

| State | When | What operators need to see |
|-------|------|----------------------------|
| Blocked — clarify | User sends message, credits = 0 | Spike in clarify blockage; path to credits page |
| Blocked — PRD | User starts generation, credits = 0 | Spike; correlation with activation funnel drop |
| Blocked — no recovery | Blockage without credits page view | Product/copy problem hypothesis |
| Checkout started — not completed | Stripe session abandoned | Funnel leak at payment step |
| Checkout completed | Webhook success | Conversion rate from blockage |
| Auto-reload on | Owner enables auto-reload | Cohort for repeat usage |

Founders still see existing toasts and credits UI; no new UX required for this slice.

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Credit ledger | Read (balance bucket / zero flag) | Policy on exact balance |
| User account | Identify | Owner only |
| Project | Read (id) | Context on blockage |
| Payment session | Write (checkout started/completed events) | Pack id; not full card data |

---

## Credit / Payment Impact

**High** — this slice exists to measure credit and payment behavior. It must **not** change burn rates, grants, or checkout rules; observation only.

---

## Sharing / Privacy Impact

None — signed-in owner monetization only; no share surface.

---

## Feedback / Instrumentation Impact

Instrumentation only. A founder blocked for credits does **not** by itself trigger milestone feedback.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| [Product analytics FA](../feature-areas/product-analytics.md) | Feature Area | validated | Parent |
| Credit system | Feature Area | validated | Blockage error codes |
| Payments | Feature Area | validated | Checkout + webhook |
| Account & session | Feature Area | validated | Identify |
| [Technical annex](../../observability/posthog.md) | Doc | ready | §4.7, Funnel B |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN | Resolution |
|---------|--------|------------|------------|
| B-ANALYTICS-001 (parent FA) | Production tracking enable | false (blocks slice: no) | Prod enable after legal; NEED_HUMAN on blocker = legal only — see `BLOCKERS.md` |

---

## Acceptance-Level Outcome

After a week of production traffic with credit blockages, an operator reports **Funnel B conversion** (blockage → checkout completed) and names the step with the highest drop-off; clarify vs PRD blockage volumes are comparable in one chart.

---

## Scope Readiness Check

| Check | Result | Notes |
|-------|--------|-------|
| SS-01 · Single user value | PASS | Monetization friction visible |
| SS-02 · Boundary is exact | PASS | Stripe/finance excluded |
| SS-03 · UX states enumerated | PASS | Blockage and checkout states |
| SS-04 · No implementation details | PASS | |
| SS-05 · Credit / payment impact assessed | PASS | Observational only |
| SS-06 · Sharing / privacy impact assessed | PASS | Owner-only |
| SS-07 · Feedback / instrumentation impact assessed | PASS | |
| SS-08 · Dependencies explicit | PASS | |
| SS-09 · Blockers flagged | PASS | Legal |
| SS-10 · Acceptance outcome is behavioral | PASS | |
| SS-11 · Status reflects readiness | PASS | |

**Advancement verdict:** CLEAR — ready for user stories.

---

## Readiness for User Stories

- [x] All readiness items satisfied (see activation slice template)

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Initial slice — credit & checkout funnel | — |
| 2026-06-03 | B-ANALYTICS-001 blocker aligned with parent FA (prod-only gate) | — |
