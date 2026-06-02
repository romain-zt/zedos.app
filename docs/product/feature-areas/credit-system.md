<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md
-->

# Feature Area: Credit system

## Status

`complete`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Feature Groups (FG-PRD-V0 — Credit system); § Core User Journeys (6); § Payment model (ledger, grace, block-at-zero, auto-reload interaction); § Business Objects; § Configuration Matrix (starter X, burn rates, grace ceiling); § Surface Blockers (starter credit grant X); § Integration Boundaries (Credits); § Risks (credit economics, grace anti-abuse)
- Related open questions: Q-008 (answered — X stays operator-config / TBD); Q-018 (answered — directional burn tiers)
- Related product decisions: none

---

## Product Intent

The founder always understands **how many credits they have**, how **AI work consumes** credits **per operation**, and what happens in the **first PRD circuit grace** (20-credit ceiling, pre-check before starting heavy spend) versus **after** that circuit (**block at zero** unless a separate **opt-in auto-reload** purchase succeeds — purchase mechanics live in **Payments**). Zedos holds the authoritative **internal ledger** semantics described in the PRD: **no hidden debt, no silent retry loop, no negative balance except first-circuit grace.**

---

## In Scope

- Show credit **balance** meaningful to the owner for planning AI work.
- Apply **per-operation** deductions against the internal ledger per PRD semantics.
- Enforce **first PRD circuit** grace: pre-check blocks starting work if projected overage **> 20 credits**; allow one-time in-flight completion up to **20 credits** overage; then surface recharge path messaging.
- After first circuit: **paid AI blocked at zero** unless an allowed recharge path (see Payments FA) adds credits.
- Communicate **overage / coverage-once** copy after grace per PRD.

## Out of Scope

- Subscription plans, unlimited free AI, BYOK (Hard v0 exclusions).
- Implementing **checkout UI** and **Stripe** flows as the primary definition of this area (owned by **Payments** FA) — this area consumes the **credit outcome** of purchases.
- Final commercial **pricing tables** fixed in the PRD (list prices remain operator-config).

---

## Business Objects Touched

| Object | Relationship |
|--------|----------------|
| AI credit balance | Display and enforce gating consistent with balance rules |
| Credit ledger | Authoritative record of consumption and first-circuit grace semantics per PRD |

---

## User Journeys Touched

- Journey 6 — Credits: balance visibility, progressive consumption, grace, recharge UX handoff, post-grace block-at-zero, auto-reload success path vs manual fallback (coordination with Payments).

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Payments FA | complete | Purchases and auto-reload are implemented and feed prepaid credits |
| Starter credits value (`STARTER_CREDITS`) | complete | PRD and code align on default `20`, operator-tunable via env |

---

## Risks

- **Credit economics / wrong defaults** (PRD): starter grant and regional price points tuned outside PRD — can starve first value or create unsustainable cost.
- **Grace anti-abuse** (PRD): pre-check must run **before** AI operations start, not after.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| Balance visibility | Owner sees credits remaining in context of continuing AI work. | complete |
| Per-operation consumption rules | Credits deduct per AI operation with progressive ledger updates per PRD. | complete |
| First-circuit grace + pre-check | Enforce 20-credit ceiling, block starts when projected overage > 20, complete in-flight within grace once. | complete |
| Post-grace gating | After first circuit, block paid AI at zero unless recharge path succeeds (coordination with Payments / auto-reload). | complete |

---

## Readiness Verdict

- [x] PRD source sections read
- [x] Product intent stated without technical language
- [x] Business objects enumerated
- [x] User journeys identified
- [x] In-scope / out-of-scope explicitly separated
- [x] No unresolved PRD open questions affecting this area
- [x] Deferred behaviors explicitly named
- [x] Candidate Scope Slices are individually small enough

**Verdict:** COMPLETE — implemented and aligned with current PRD defaults (`NEED_HUMAN: false`).

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-09 | Initial scaffold from approved Feature Area map (`/feature-area scaffold`) | — |
| 2026-06-02 | Reconciled status with shipped implementation and PRD default (`STARTER_CREDITS=20`) | — |
