# Scope Slice: Adversarial PRD review (red team)

## Parent Feature Area

[AI red team](../feature-areas/ai-red-team.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

I see investor-grade gaps and hype risks in my PRD before sharing externally.

---

## Exact Boundary

### Included Behavior

- **Pro-tier** (or product-equivalent) action **Red team review** on a selected PRD version.
- **Async job** produces structured **findings** per `docs/product/ai-red-team-prd-spec.md`.
- Owner sees **side panel** list of findings with **scroll-to-section** in PRD viewer.
- **Credit burn** at **15-credit** challenge tier (or included Pro quota if policy bundles it — default burn per Q-018).
- Copy avoids legal/financial advice claims.

### Excluded Behavior

- Running on anonymous share surface.
- Auto-editing PRD to fix findings.
- Free-tier unlimited red team.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Gated — not Pro | Free owner | Upgrade or credit message |
| Ready | Eligible version | CTA visible |
| Job — running | Review started | Progress / spinner |
| Job — success | Findings ready | Panel populated |
| Job — failure | AI/error | Retry when credits allow |
| Finding — navigate | Click finding | Scrolls to PRD section |
| Credit — blocked | Insufficient balance | Recharge UX |
| Empty findings | Model returns none | Positive empty state |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| PRD version | Read | Input |
| Red team report / findings | Create, Read | Structured output |
| Credit ledger | Update | 15-credit tier |

---

## Credit / Payment Impact

**Yes** — **15-credit** adversarial pass (Q-018) unless Pro bundle policy zeroes burn (document at implement). Balance gate and grace rules same as other AI operations.

---

## Sharing / Privacy Impact

None — findings owner-private.

---

## Feedback / Instrumentation Impact

**Yes** — `red_team_review_started`, `red_team_review_completed`; optional milestone after completion.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| FA-prd-versioning | Feature Area | complete | Version target |
| FA-credit-system | Feature Area | complete | Burn |
| `docs/product/ai-red-team-prd-spec.md` | Spec | complete | Schema |
| Pro / Builder tier policy | GTM | complete | Gating |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

An eligible owner runs **red team review** on a PRD version, spends the configured **credits**, and receives a **findings panel** that links each issue to the relevant PRD section.

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
| 2026-06-04 | `/feature-area refine-slice` | — |
| 2026-06-04 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
