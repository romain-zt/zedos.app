<!--
  Scope Slice — dashboard-shell: under-construction placeholders
  Scaffolded 2026-05-11 as part of Phase 4 loop restart.
-->

# Scope Slice: Under-construction placeholders

## Parent Feature Area

[Dashboard shell](../feature-areas/dashboard-shell.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A signed-in founder can see exactly which product capabilities exist in v0 and which are planned but not yet available — presented honestly as "under construction" rather than broken links or confusing blank states — so they understand the product's current scope without frustration.

---

## Exact Boundary

### Included Behavior

- **Placeholder cards or sections for deferred roadmap areas** — services/feature split, Cursor packaging, user stories, test-first delivery, architecture analysis, and any other post-PRD pipeline steps that the PRD describes as "under construction."
- **Consistent visual treatment** — placeholders use a clear, non-alarming "under construction" or "coming soon" label; they do not pretend to be interactive features.
- **No navigation to non-existent routes** — clicking an under-construction area does not navigate to a 404; it either shows a tooltip/modal or is non-interactive.
- **v0 clarity** — the overall dashboard communicates that v0 is the PRD path; roadmap placeholders set expectations for what comes after.

### Excluded Behavior

- **Shipping any of the deferred capabilities** — this slice is about honest labeling, not building the features.
- **Waitlist or signup forms for upcoming features** — not required for v0.
- **Animated or elaborate "coming soon" marketing** — simple, honest labels only.
- **Admin or operator toggle** for showing/hiding deferred areas — not a v0 requirement.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Placeholder visible | Founder views the dashboard | Under-construction section(s) visible with clear "coming soon" or "under construction" label; does not suggest the feature is available |
| Placeholder interacted | Founder clicks or hovers on a placeholder | No navigation; optional tooltip confirming it is not yet available; no confusing error |

---

## Data Touched

None — placeholders are static UI; no data reads or writes required for this slice.

---

## Credit / Payment Impact

None.

---

## Sharing / Privacy Impact

None — placeholders are part of the private signed-in surface. No share links involved.

---

## Feedback / Instrumentation Impact

None — placeholder visibility is not a PRD milestone event.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| [Dashboard shell — signed-in home](./dashboard-shell--signed-in-home.md) | Scope Slice | ready-for-user-stories | The home shell must exist before under-construction placeholders can be placed within it; implementation order: signed-in-home first |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder who views the dashboard sees clear under-construction labels for all deferred roadmap areas, can identify what is available in v0 (PRD path), and is not confused by missing or broken links for features that do not yet exist.

---

## Scope Readiness Check

| Check | Result | Notes |
|-------|--------|-------|
| SS-01 · Single user value | PASS | One sentence, no technical language |
| SS-02 · Boundary is exact | PASS | Included and excluded are exhaustive |
| SS-03 · UX states enumerated | PASS | Visible state and interaction state |
| SS-04 · No implementation details | PASS | No components, routes, or framework references |
| SS-05 · Credit / payment impact assessed | PASS | None |
| SS-06 · Sharing / privacy impact assessed | PASS | None |
| SS-07 · Feedback / instrumentation impact assessed | PASS | None |
| SS-08 · Dependencies explicit | PASS | Depends on signed-in-home slice |
| SS-09 · Blockers resolved or flagged | PASS | No blockers |
| SS-10 · Acceptance outcome is behavioral | PASS | Observable behavior described |
| SS-11 · Status reflects readiness | PASS | `ready-for-user-stories` |
| CC-03 · v0 boundary not leaked | PASS | Deferred areas labeled, not shipped |
| CC-04 · NEED_HUMAN propagates | PASS | No NEED_HUMAN |

**Advancement verdict:** CLEAR — ready for user stories.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated
- [x] Business objects named
- [x] Credit / payment impact assessed
- [x] Sharing / privacy surface assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial scaffold — Phase 4 loop restart | local-agent |
