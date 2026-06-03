<!--
  Scope Slice — product-analytics: owner product journey funnels
-->

# Scope Slice: Owner product journey funnels

## Parent Feature Area

[Product analytics (PostHog)](../feature-areas/product-analytics.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Operators and product can answer **“where do founders drop off before getting a PRD?”** with a single dashboard—signup to first project to first clarification to first successful PRD—without manual log digging.

---

## Exact Boundary

### Included Behavior

- **Signed-in owners** are counted as one person across sessions (stable account identity in analytics).
- **Funnel A (activation)** is measurable end-to-end:
  1. Account created or sign-in succeeded
  2. At least one project created
  3. At least one clarification message sent in a project
  4. At least one PRD generation completed for that project
- **Workspace engagement** is measurable: which main workspace areas founders open (clarify, PRD, architecture, history) and how often they switch—without recording message or PRD text.
- **Journey mode** is attached to events where relevant (**standard** vs **express**) so express fast-track can be compared to standard activation.
- **Time-to-first-PRD** can be approximated from timestamps between funnel steps (dashboard configuration, not founder UI).
- **Anonymous visitors** on marketing/landing pages may be counted as anonymous only; this slice does **not** require full anonymous product analytics beyond what the parent FA allows for share views (see sharing slice).

### Excluded Behavior

- **Credit purchase funnel** — separate slice (credit blockage and monetization).
- **Session replay and stack traces** — separate slice (friction replay and error signals).
- **In-app milestone feedback** (stars/like) — Owner milestone feedback FA; may be correlated in PostHog later but not owned here.
- **Content analytics** (which PRD sections read longest, AI prompt text) — out of scope; no PRD/clarification body in properties.
- **Founder-visible stats** — no user-facing dashboard.
- **Feature flags or A/B tests** — deferred post-v0 unless added by explicit slice.

---

## UX States

| State | When | What operators need to see |
|-------|------|----------------------------|
| Funnel — healthy | Steady signups | Step-by-step conversion rates with cohort size |
| Funnel — cliff after sign-in | Many accounts, few projects | Drop between sign-in and project create |
| Funnel — cliff after project | Projects created, no clarify | Drop before first clarification |
| Funnel — cliff before PRD | Clarify used, no PRD completed | Generation never finishes or not started |
| Express vs standard | Mixed journey modes | Separate conversion for express cohort |
| Tab never opened | PRD exists but architecture/history never selected | Optional secondary insight (orientation vs depth) |

Founders experience **no new screens**; failures in tracking must not block product use.

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| User account | Read (id for identify) | No email/name in event payloads |
| Project | Read (id, journey mode) | Context only |
| PRD version | Read (version number, completion signal) | Not content |
| Clarification session | Write (event only) | “message sent” / “completed” — not transcript |

---

## Credit / Payment Impact

None for event capture itself. Events may **reference** that an action was blocked for credits, but **purchase** funnel is the other slice.

---

## Sharing / Privacy Impact

- **No share-token or PRD text** in activation events.
- **Identified owners only** for funnel A; anonymous share viewers excluded from this slice’s funnel definition.

---

## Feedback / Instrumentation Impact

This slice **is** instrumentation. It does not trigger owner milestone feedback prompts. Product should avoid duplicating “did user complete PRD?” solely via feedback when funnel data exists.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| [Product analytics FA](../feature-areas/product-analytics.md) | Feature Area | validated | Parent |
| Account & session | Feature Area | validated | Identify after auth |
| Project workspace | Feature Area | validated | Tabs, journey mode |
| Guided clarification | Feature Area | validated | Clarify events |
| PRD versioning | Feature Area | validated | Generation completed |
| [Technical annex](../../observability/posthog.md) | Doc | ready | Event name catalog §4 |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN | Resolution |
|---------|--------|------------|------------|
| B-ANALYTICS-001 (parent FA) | Production tracking on real users | false | Implement with PostHog disabled by default (approved Plan 2026-06-03); legal before prod enable |

---

## Acceptance-Level Outcome

Given production traffic, an operator opens PostHog and sees **Funnel A** with all four steps and can name the **largest drop-off step** within five minutes; express and standard cohorts are filterable.

---

## Scope Readiness Check

| Check | Result | Notes |
|-------|--------|-------|
| SS-01 · Single user value | PASS | Operator visibility on activation |
| SS-02 · Boundary is exact | PASS | Credit/replay/feedback excluded |
| SS-03 · UX states enumerated | PASS | Funnel cliffs + express segment |
| SS-04 · No implementation details | PASS | No SDK/file names in boundary |
| SS-05 · Credit / payment impact assessed | PASS | None here |
| SS-06 · Sharing / privacy impact assessed | PASS | No PII/content |
| SS-07 · Feedback / instrumentation impact assessed | PASS | This slice is instrumentation |
| SS-08 · Dependencies explicit | PASS | |
| SS-09 · Blockers resolved or flagged | PASS | B-ANALYTICS-001 prod-only; resolution documented |
| SS-10 · Acceptance outcome is behavioral | PASS | Operator can read funnel |
| SS-11 · Status reflects readiness | PASS | ready-for-user-stories |
| CC-03 · v0 boundary not leaked | PASS | No founder analytics UI |
| CC-04 · NEED_HUMAN propagates | PASS | Legal blocker noted |

**Advancement verdict:** CLEAR — ready for user stories (implementation when approved).

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated
- [x] Business objects named
- [x] Credit / payment impact assessed
- [x] Sharing / privacy surface assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named
- [x] Blockers flagged (legal)
- [x] Acceptance-level outcome is behavioral

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Initial slice — activation funnel | — |
| 2026-06-03 | B-ANALYTICS-001 blocker aligned with parent FA (prod-only gate) | — |
