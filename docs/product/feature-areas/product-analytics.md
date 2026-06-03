<!--
  Feature Area — Product analytics (PostHog)
  Cross-cutting: no end-user UI; enables ops/product to see where founders block.
  Technical annex: docs/observability/posthog.md
-->

# Feature Area: Product analytics (PostHog)

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Success Metrics (working metrics need **observable** funnel data beyond in-app milestone prompts)
- `docs/prd/PRD.md` § Learning / feedback (v0) — **complements** owner milestone feedback; does **not** replace it
- `docs/prd/questions/open-questions.md` — Q-010 history (metrics now feedback-led); analytics supports measuring activation and credit conversion hypotheses
- `docs/retro/phase2a-friction-log.md` — qualitative friction; this FA adds **quantitative** drop-off and blockage signals
- `docs/retro/cursor-setup-retro.md` — gap: no observability beyond `EXECUTION_LOG.md`
- Related product decisions: none (operator tooling; legal validation for analytics consent may become PD later)
- Technical annex (implementation contract, event names, env): [docs/observability/posthog.md](../../observability/posthog.md)

---

## Product Intent

Zedos must **see where signed-in founders stop progressing**—before first project, during clarification, when credits run out, at checkout, or when generation fails—so the team can **prioritize fixes** and **validate v0 success hypotheses** without guessing from support tickets alone.

PostHog is the **single product analytics surface** for v0: funnels, cohorts, session replay on friction, and error correlation. **No founder-facing UI** in this area; data is for **operators and product** only.

---

## In Scope

- **Identify every signed-in owner** with a stable analytics identity tied to the account (not email in event payloads).
- **Measure the core PRD activation path**: signup/sign-in → project created → clarification used → PRD generated → (optional) post-PRD steps and delivery export.
- **Detect blockage events** with explicit reasons where the product already exposes them: insufficient credits, auth failure, generation/stream failure, checkout abandonment.
- **Segment by product context** where it affects interpretation: journey mode (standard vs express), locale, project phase, credit balance bucket (not exact balance in shared dashboards if sensitive).
- **Anonymous surfaces (minimal)**: share link viewed — count and funnel only; **no** PRD body, token, or viewer identity in analytics properties.
- **Environment hygiene**: no tracking in E2E/CI; exclude known test accounts from production dashboards.
- **EU-hosted PostHog** as default deployment assumption for GDPR alignment (operator configures project).

## Out of Scope

- **Founder-facing analytics dashboards** inside Zedos (no “your stats” page in v0).
- **Replacing** owner milestone feedback (1–5 / like-dislike prompts) — that remains the **qualitative** v0 success input per PRD.
- **Marketing attribution** (UTM-heavy growth stack, ads pixels) — not v0 unless explicitly added later.
- **Full data warehouse / BI export** (Snowflake, BigQuery sync) — PostHog native insights only for v0.
- **LLM token/cost observability** — separate from product analytics; may use PostHog AI observability later, not this FA.
- **Real-time alerting to founders** — ops alerts only (PostHog dashboards / optional Slack).
- **BYOK or per-tenant analytics** — single Zedos PostHog project for v0.

---

## Business Objects Touched

| Object | Relationship |
|--------|--------------|
| User account | Identified person in analytics (id only; no PII in events) |
| Project | Context on workspace and generation events |
| Credit ledger | Blockage and purchase funnel signals (amounts as policy allows) |
| PRD version | Milestone-style events (created, generation completed) — not full content |
| Share link | Anonymous view counts — no token in properties |

---

## User Journeys Touched

- **Journey 1** — Sign up / sign in (entry and drop-off).
- **Journey 2** — Create or open project (activation).
- **Journey 3** — Clarify (engagement and abandon).
- **Journey 4** — PRD version / generation (core value moment).
- **Journey 6** — Credits depleted → purchase (monetization blockage).
- **Journey 8** — Share (anonymous view only, minimal).
- **Journey 10** — Express mode (segment standard vs express in funnels).

No journey **changes** for the founder; instrumentation is invisible when correctly implemented.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Account & session | validated | Stable `user.id` for identify |
| Project workspace | validated | Tab and journey-mode context |
| Guided clarification | validated | Clarify blockage events |
| PRD versioning | validated | Generation completed / failed |
| Credit system | validated | `insufficient_credits` paths |
| Payments | validated | Checkout completed webhook |
| Read-only sharing | validated | Anonymous view event |
| Privacy policy / consent | pending legal | Analytics may require opt-in banner beyond marketing consent — flag before prod enable |
| Implementation | not started | See annex; no code in repo yet |

---

## Risks

- **Privacy / GDPR**: capturing replay or autocapture without masking may expose PRD/clarification text — require masking rules before enabling replay widely.
- **False conclusions**: low traffic in early pilot → noisy funnels; label dashboards “working hypothesis”.
- **Dual signal confusion**: team conflates PostHog funnels with milestone **feedback** scores — document that feedback = quality, analytics = volume and drop-off.
- **Test pollution**: E2E users skewing funnels if disable flag misconfigured.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN | Resolution |
|---------|--------|------------|------------|
| B-ANALYTICS-001 | Enabling analytics on **production** real users (cookies / consent beyond marketing API) | false | **Does not block** `validated` FA, scope slices, `/plan`, or `/implement`. Approved Plan (2026-06-03) ships with tracking **disabled by default** until legal go-ahead. Operator enables PostHog in prod only after consent stance is decided (OQ-PA-001 → future PD). |
| — | — | — | — |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| [Owner product journey funnels](../scope-slices/product-analytics--owner-product-journey-funnels.md) | Activation path from auth to first PRD; workspace tab usage; express vs standard segments. | ready-for-user-stories |
| [Credit blockage and monetization funnel](../scope-slices/product-analytics--credit-blockage-and-monetization.md) | Insufficient-credit surfaces → credits page → checkout completed. | ready-for-user-stories |
| [Friction replay and error signals](../scope-slices/product-analytics--friction-replay-and-error-signals.md) | Session replay on errors; exception grouping; weekly ops runbook. | exploratory |

---

## Readiness Verdict

- [x] Product intent stated without unnecessary implementation language in this file
- [x] Business objects enumerated
- [x] User journeys identified
- [x] In-scope / out-of-scope explicitly separated
- [x] Complement vs owner feedback clarified
- [x] Candidate Scope Slices are individually small enough
- [x] B-ANALYTICS-001 scoped to prod enable only (implementation path unblocked with default-off tracking)

**Verdict:** READY FOR SCOPE SLICES — prod analytics enable remains gated on legal decision; funnel slice Plan approved for implement.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Feature Area created (PostHog); cross-cutting observability | — |
| 2026-06-03 | B-ANALYTICS-001: NEED_HUMAN cleared for FA validation; prod enable still requires legal (resolution column) | — |
