<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md
-->

# Feature Area: Credit system

## Status

`exploratory`

> **NEED_HUMAN:** true
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
| Payments FA | pending | Purchases and auto-reload **add** prepaid credits |
| Operator config for starter **X** | blocked | PRD Surface Blocker — numeric grant TBD |

---

## Risks

- **Credit economics / wrong defaults** (PRD): starter grant and regional price points tuned outside PRD — can starve first value or create unsustainable cost.
- **Grace anti-abuse** (PRD): pre-check must run **before** AI operations start, not after.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| **Starter credit grant (X)** — operator-config / TBD in PRD (Q-008) | First-run value and abuse posture until ops chooses X | true |
| **Directional burn tier table** (1 / 3 / 5 / 10 / 15) labeled **product assumption, not final pricing** | Committing UX copy and metering expectations for launch | true |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| Balance visibility | Owner sees credits remaining in context of continuing AI work. | exploratory |
| Per-operation consumption rules | Credits deduct per AI operation with progressive ledger updates per PRD. | exploratory |
| First-circuit grace + pre-check | Enforce 20-credit ceiling, block starts when projected overage > 20, complete in-flight within grace once. | exploratory |
| Post-grace gating | After first circuit, block paid AI at zero unless recharge path succeeds (coordination with Payments / auto-reload). | exploratory |

---

## Readiness Verdict

- [ ] PRD source sections read
- [ ] Product intent stated without technical language
- [ ] Business objects enumerated
- [ ] User journeys identified
- [ ] In-scope / out-of-scope explicitly separated
- [ ] No unresolved PRD open questions affecting this area
- [ ] Deferred behaviors explicitly named
- [ ] Candidate Scope Slices are individually small enough

**Verdict:** BLOCKED — operator **X** and burn-tier commitment need human/ops resolution (`NEED_HUMAN: true`).

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-09 | Initial scaffold from approved Feature Area map (`/feature-area scaffold`) | — |
