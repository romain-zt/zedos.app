<!--
  User Story Template
  Location: .cursor/core/templates/product/user-story.template.md
  Usage: copy to docs/product/user-stories/<fa-kebab>--<slice-kebab>--US-<NNN>--<short-kebab>.md
  Governed by: .cursor/core/rules/user-story-workflow.mdc
  Decision: docs/product-decisions/PD-001-post-slice-workflow.md
-->

# User Story: <!-- NAME -->

## Parent Scope Slice

<!-- Link to the parent Scope Slice document -->

[<!-- Scope Slice Name -->](../scope-slices/<!-- fa-kebab--slice-kebab -->.md)

## Status

<!-- One of: exploratory | blocked | deferred | ready-for-spec -->

`STATUS`

> **NEED_HUMAN:** <!-- true | false — set true if any blocker requires a product decision before a Spec can be written -->
> **NEED_UPDATE:** <!-- true | false — set true if templates, rules, or checkers are missing/incomplete for this user story -->

---

## Story

<!-- Standard form: "As an <X>, I <do Y>, so that <outcome Z>."
     Must be readable by a non-engineer.
     Must map to exactly one acceptance dimension of the parent Scope Slice. -->

---

## Acceptance Criteria

<!-- 2-5 inline ACs. Format: Given / When / Then.
     Each AC must be a single observable behavior.
     No implementation language. No mention of components, routes, or storage. -->

### AC-1 — <!-- short title -->

- **Given** <!-- precondition -->
- **When** <!-- user action or system event -->
- **Then** <!-- observable outcome -->

### AC-2 — <!-- short title -->

- **Given** 
- **When** 
- **Then** 

---

## UX States Covered

<!-- Subset of the parent Scope Slice's UX States that this story addresses.
     Must reference state names exactly as they appear in the parent slice. -->

- 

---

## Out of Scope

<!-- What this story intentionally does NOT cover.
     Reference sibling user stories or future work where relevant. -->

- 

---

## Data Touched

<!-- Product-level objects this story creates, reads, updates, or deletes.
     Inherit from parent Scope Slice; narrow to story scope.
     Name them as product objects. No database tables, no API fields. -->

| Object | Operation | Notes |
|--------|-----------|-------|
|        |           |       |

---

## Credit / Payment Impact

<!-- Inherit framing from parent Scope Slice.
     If none: state "None — no credit or payment interaction in this story." -->

---

## Sharing / Privacy Impact

<!-- Inherit framing from parent Scope Slice.
     If none: state "None — no sharing or privacy boundary changes in this story." -->

---

## Feedback / Instrumentation Impact

<!-- Does this story trigger an owner milestone prompt?
     Does it produce attributable data?
     If none: state "None — no feedback prompt or attribution in this story." -->

---

## Dependencies

<!-- Other user stories, scope slices, feature areas, or product decisions
     that must be in place before a Spec can be written for this story. -->

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
|            |      |        |       |

---

## Blockers

<!-- Unresolved product questions that prevent a Spec from being written.
     Each blocker must state: what it is, why it blocks, and NEED_HUMAN status. -->

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
|         |        |            |

---

## Acceptance-Level Outcome

<!-- One sentence summarizing the observable end state when all ACs are satisfied.
     Behavioral. No implementation language. No test cases. -->

---

## Readiness for Spec

<!-- Fill in before marking status = ready-for-spec. -->

- [ ] Story in standard form ("As X, I do Y, so that Z")
- [ ] 2-5 inline Acceptance Criteria in Given/When/Then form
- [ ] UX states covered are a non-empty subset of the parent Scope Slice
- [ ] Out of scope explicitly named
- [ ] Data touched named as product objects (no implementation detail)
- [ ] Credit / payment impact inherited from parent slice
- [ ] Sharing / privacy impact inherited from parent slice
- [ ] Feedback / instrumentation impact assessed
- [ ] All dependencies named and their status known
- [ ] All blockers resolved or NEED_HUMAN=true explicitly set
- [ ] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** <!-- NOT READY | READY FOR SPEC | BLOCKED — reason -->

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
|      |        |        |
