<!--
  Scope Slice — product-analytics: friction replay and error signals (phase 2)
-->

# Scope Slice: Friction replay and error signals

## Parent Feature Area

[Product analytics (PostHog)](../feature-areas/product-analytics.md)

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

When something **breaks or confuses** a founder (client error, failed stream, cryptic toast), operators can **watch a masked session replay** tied to the error instead of reproducing blindly.

---

## Exact Boundary

### Included Behavior

- **Error tracking** groups client and server exceptions with enough context to prioritize (which product action failed, error code), without PII.
- **Session replay** samples sessions that hit selected friction events (e.g. credit blockage, PRD generation failed, unhandled exception).
- **Masking rules** prevent passwords and clarification/PRD text areas from appearing in replays.
- **Weekly runbook** (documented in technical annex §10): trends on failures, one replay reviewed per top issue.

### Excluded Behavior

- **100% session recording** — cost and privacy; sampled only.
- **AI/LLM trace debugging** — not this slice.
- **Automated fix or retry** for users — observability only.

---

## UX States

| State | When | Operator outcome |
|-------|------|------------------|
| Empty — no errors yet | Period with zero new error groups | Dashboard shows no spike; no replay queue |
| Loading — ingest lag | After deploy or incident; events still arriving | Trends incomplete; wait before prioritizing |
| Exception spike | Deploy or provider outage | Alert or manual trend check; compare to baseline |
| Single-user failure | One founder stuck | Replay + linked funnel events for that session |
| Success — replay reviewed | Operator opened a sampled replay | Repro steps documented for engineering |
| Masking failure | Sensitive text visible in replay | Incident — disable replay until masking fixed |
| Blocked — prerequisites | Funnel / credit slices not shipped | Replay filters unavailable; slice stays exploratory |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Session recording | Write | Masked product UI only |
| Error report | Write | Grouped exception metadata; no founder message content |

---

## Credit / Payment Impact

None.

---

## Sharing / Privacy Impact

**High** — replay is the highest privacy risk in this Feature Area. Prod replay requires parent B-ANALYTICS-001 legal go-ahead **and** masking sign-off (B-ANALYTICS-002) before enable.

---

## Feedback / Instrumentation Impact

Complements milestone feedback: feedback says “bad PRD”; replay shows **what they did** before submitting dislike.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| [Owner product journey funnels](./product-analytics--owner-product-journey-funnels.md) | Scope slice | ready-for-user-stories | Base events must exist first |
| [Credit blockage slice](./product-analytics--credit-blockage-and-monetization.md) | Scope slice | ready-for-user-stories | Blockage events for replay filters |
| Readable error stack traces in groups | Product constraint | pending | Required for actionable error groups before prod enable |
| [Technical annex](../../observability/posthog.md) | Doc | ready | §6 replay, §9 P4 — implementation detail |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN | Resolution |
|---------|--------|------------|------------|
| B-ANALYTICS-001 (parent FA) | Replay **in production** | true (legal prod only) | Same as `BLOCKERS.md`; does not block draft plan or phase-2 implement with replay **off** in prod |
| B-ANALYTICS-002 | Replay without masking review | false | Deferred to `/plan` for this slice: product/ops must sign off masking on clarification and PRD surfaces before prod replay |

---

## Acceptance-Level Outcome

For a known error spike, an operator opens one session replay, confirms the user path leading to failure, and files or prioritizes a fix with **repro steps**—without accessing PRD/clarification body in the recording.

---

## Scope Readiness Check

| Check | Result | Notes |
|-------|--------|-------|
| SS-01 · Single user value | PASS | One operator benefit |
| SS-02 · Boundary is exact | PASS | Sampled replay only |
| SS-03 · UX states enumerated | PASS | Empty, loading, success, error, blocked, masking |
| SS-04 · No implementation details | PASS | No vendor/stack names in body |
| SS-05 · Credit / payment impact assessed | PASS | None |
| SS-06 · Sharing / privacy impact assessed | PASS | High — explicit |
| SS-07 · Feedback / instrumentation impact assessed | PASS | Complements feedback |
| SS-08 · Dependencies explicit | PASS | Funnel slices first |
| SS-09 · Blockers resolved or flagged | PASS | Resolutions on all rows |
| SS-10 · Acceptance outcome is behavioral | PASS | Operator replay workflow |
| SS-11 · Status reflects readiness | PASS | `exploratory` until prerequisites + `/plan` |
| CC-01 · No task slicing from PRD | PASS | — |
| CC-02 · No skipped levels | PASS | Parent FA linked |
| CC-03 · v0 boundary not leaked | PASS | — |
| CC-04 · NEED_HUMAN propagates | PASS | Slice and parent `NEED_HUMAN: false` |
| CC-05 · NEED_UPDATE actioned | PASS | — |

**Advancement verdict:** CLEAR for **`exploratory`** — product spec complete; **implementation** waits on funnel (+ credit) adapter in prod code. Plan draft exists (`docs/execution/plans/product-analytics--friction-replay-and-error-signals--v0.plan.md`).

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated (including error and empty states)
- [x] Business objects named
- [x] Credit / payment impact assessed
- [x] Sharing / privacy impact assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES at product-spec level — status stays **`exploratory`** until funnel slice is **shipped in prod**; then `/feature-area promote-slice` before `/implement` phase 2.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Initial slice — replay/errors phase 2 | — |
| 2026-06-03 | Checker fixes: UX states, product-level Data Touched, blocker resolutions (SS-03/04/09, CC-04) | — |
| 2026-06-03 | Readiness checklist aligned; B-ANALYTICS-001 NEED_HUMAN harmonized; plan draft noted | doc-sync |
