<!--
  Scope Slice Template
  Location: .cursor/templates/product/scope-slice.template.md
  Usage: copy to docs/product/scope-slices/<fa-kebab>--<slice-kebab>.md
  Governed by: .cursor/rules/feature-area-workflow.mdc
-->

# Scope Slice: <!-- NAME -->

## Parent Feature Area

<!-- Link to the parent Feature Area document -->

[<!-- Feature Area Name -->](../feature-areas/<!-- kebab-name -->.md)

## Status

<!-- One of: exploratory | blocked | deferred | ready-for-user-stories -->

`STATUS`

> **NEED_HUMAN:** <!-- true | false — set true if any blocker requires a product decision before user stories can be written -->
> **NEED_UPDATE:** <!-- true | false — set true if templates, rules, or checkers are missing/incomplete for this slice -->

---

## User Value

<!-- One sentence. What does the user get from this slice? 
     Must be understandable without knowing implementation.
     Example: "A founder can answer one clarification question at a time and skip it if unsure,
     without losing their place in the PRD flow." -->

---

## Exact Boundary

### Included Behavior

<!-- Exhaustive list of what this slice covers. Behavioral, not technical.
     Be specific. Vague inclusions block user story writing. -->

- 
- 

### Excluded Behavior

<!-- Exhaustive list of what this slice intentionally does NOT cover.
     Reference PRD exclusions or future slice candidates where relevant. -->

- 
- 

---

## UX States

<!-- List the observable states a user can encounter.
     Include: empty state, loading, success, error, edge cases, blocked/gated states.
     Do not name UI components — describe what the user sees or experiences. -->

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
|       |      |                                  |

---

## Data Touched

<!-- Product-level objects this slice creates, reads, updates, or deletes.
     Name them as product objects. Not database tables, not API fields. -->

| Object | Operation | Notes |
|--------|-----------|-------|
|        |           |       |

---

## Credit / Payment Impact

<!-- Does this slice consume credits? Gate on balance? Trigger purchase flows?
     If none: state "None — no credit or payment interaction in this slice." -->

---

## Sharing / Privacy Impact

<!-- Does this slice affect what anonymous share viewers can see?
     Does it touch share link creation, revocation, or public surfaces?
     If none: state "None — no sharing or privacy boundary changes in this slice." -->

---

## Feedback / Instrumentation Impact

<!-- Does this slice trigger a feedback prompt (owner milestone)?
     Does it produce data that should be attributed to a project/version/step?
     If none: state "None — no feedback prompt or attribution in this slice." -->

---

## Dependencies

<!-- What must be complete before this slice can be worked on?
     Include other Scope Slices, Feature Areas, or external constraints. -->

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
|            |      |        |       |

---

## Blockers

<!-- Unresolved questions or decisions that prevent writing user stories for this slice.
     Each blocker must state: what it is, why it blocks, and NEED_HUMAN status. -->

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
|         |        |            |

---

## Acceptance-Level Outcome

<!-- Describe the observable outcome when this slice is complete.
     Written as: "A user can [do X], and the system [responds with Y], and [invariant Z] holds."
     No implementation details. No test cases. Behavioral description only. -->

---

## Readiness for User Stories

<!-- Fill in before marking status = ready-for-user-stories. -->

- [ ] User value stated without implementation language
- [ ] Exact boundary defined (included + excluded)
- [ ] UX states enumerated (including error and empty states)
- [ ] Business objects named
- [ ] Credit / payment impact assessed
- [ ] Sharing / privacy surface assessed
- [ ] Feedback / instrumentation impact assessed
- [ ] All dependencies named and their status known
- [ ] All blockers resolved or NEED_HUMAN=true explicitly set
- [ ] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** <!-- NOT READY | READY FOR USER STORIES | BLOCKED — reason -->

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
|      |        |        |
