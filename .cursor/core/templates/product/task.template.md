<!--
  Task Template (optional artifact)
  Location: .cursor/core/templates/product/task.template.md
  Usage: copy to docs/product/tasks/<fa-kebab>--<slice-kebab>--US-<NNN>--T-<NNN>--<short-kebab>.task.md
  Governed by: .cursor/core/rules/user-story-workflow.mdc
  Decision: docs/product-decisions/PD-001-post-slice-workflow.md

  A Task is OPTIONAL. Create one only when the parent Spec needs to be split
  across multiple coherent commits or short PRs. A Spec that fits in a single
  focused implementation does NOT require Task files.
-->

# Task: <!-- NAME -->

## Parent Spec

<!-- Link to the parent Spec document -->

[<!-- Spec Name -->](../specs/<!-- fa-kebab--slice-kebab--US-NNN--short-kebab.spec -->.md)

## Status

<!-- One of: exploratory | blocked | deferred | ready-for-merge -->

`STATUS`

> **NEED_HUMAN:** <!-- true | false — set true if implementation cannot proceed without a human decision -->
> **NEED_UPDATE:** <!-- true | false — set true if templates, rules, or checkers are missing/incomplete for this task -->

---

## Goal

<!-- One sentence. What does this task accomplish?
     Must trace to the parent Spec without restating the whole spec. -->

---

## Scope

<!-- What is in scope for this single task.
     A task should be sized for one coherent commit or short PR. -->

- 

---

## Out of Scope

<!-- Sibling tasks of the same Spec; future work; explicit non-goals. -->

- 

---

## Changes

<!-- Concrete changes this task will make.
     Files, modules, configuration, fixtures, migrations.
     Be specific enough that a reviewer can predict the diff. -->

| Area | Change | Notes |
|------|--------|-------|
|      |        |       |

---

## Tests

<!-- Tests written or updated by this task.
     Trace each to a Spec test plan entry where possible. -->

- 

---

## Verification Steps

<!-- How to verify the task is correctly implemented.
     Commands, manual checks, log checks. Must be reproducible. -->

1. 
2. 

---

## Dependencies

<!-- Other tasks, services, or external resources this task depends on. -->

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
|            |      |        |       |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
|         |        |            |

---

## Readiness for Merge

<!-- Fill in before marking status = ready-for-merge. -->

- [ ] Goal traces back to parent Spec
- [ ] Scope is sized for one coherent commit or short PR
- [ ] Out of scope explicitly named
- [ ] Changes enumerated with specificity
- [ ] Tests listed and traced to Spec test plan
- [ ] Verification steps reproducible
- [ ] All dependencies named with status
- [ ] All blockers resolved or NEED_HUMAN=true explicitly set

**Verdict:** <!-- NOT READY | READY FOR MERGE | BLOCKED — reason -->

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
|      |        |        |
