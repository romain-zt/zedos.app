<!--
  User Story Template
  Location: .cursor/templates/execution/user-story.template.md
  Usage:    copy to docs/execution/user-stories/<fa-kebab>--<slice-kebab>--<story-kebab>.md
  Governed by: .cursor/rules/70-execution-bridge.mdc
  Authored by: architect agent (`.cursor/agents/execution/architect.md`)
-->

# User Story: {{STORY_NAME}}

## Parent Scope Slice

[{{SCOPE_SLICE_NAME}}](../../product/scope-slices/{{FA_KEBAB}}--{{SLICE_KEBAB}}.md)

## Status

<!-- One of: draft | ready-for-implementation | in-implementation | done | blocked -->

`{{STATUS}}`

> **NEED_HUMAN:** {{NEED_HUMAN}} <!-- true | false — set true if any answer below is missing and blocks implementation -->
> **NEED_UPDATE:** {{NEED_UPDATE}} <!-- true | false — set true if rules / templates / checkers are insufficient for this story -->

---

## Story

As a {{USER_ROLE}}, I want to {{CAPABILITY}} so that {{OUTCOME}}.

<!-- One sentence. The shape is canonical: As a X, I want Y so that Z. -->

---

## Acceptance Criteria

<!--
  One row per testable behavior. Maps directly onto Vitest / Playwright assertions.
  At least one row per UX state from the parent Scope Slice's UX States table.
  No implementation language. No file paths. No framework names.
-->

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 |       |      |      |
| AC-2 |       |      |      |

---

## Test Plan

<!--
  Required tests for this story. The Implementation Plan refines exact paths.
  Mark each as: unit | integration | contract | e2e.
-->

- [ ] {{TEST_DESCRIPTION_1}} ({{TEST_TYPE_1}})
- [ ] {{TEST_DESCRIPTION_2}} ({{TEST_TYPE_2}})

---

## Touched Files (predicted)

<!--
  Best-effort list. Implementation Plan refines to exact paths under the layout in effect.
  Use layer names, not file paths, when uncertain.
-->

| Path or layer | Reason |
|---------------|--------|
|               |        |

---

## Out of Scope

<!--
  Behaviors deliberately excluded from this story.
  Carry over Excluded Behavior from the parent Scope Slice that applies here.
-->

- 
- 

---

## Open Questions

<!--
  Questions that block this story but did not surface during Scope Slice refinement.
  Each question must be assigned a next action: /prd questions, /feature-area refine-slice,
  or "answered before /plan".
-->

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
|    |          |        |             |

---

## Decision References

<!--
  Product or architecture decisions this story depends on or codifies.
  Format: PD-NNN (product) or ADR-NNN (architecture, if introduced post-Phase 3).
-->

- 
- 

---

## Readiness for Implementation Plan

<!-- Fill in before status = ready-for-implementation. -->

- [ ] Story expressed in user-value terms (no implementation language)
- [ ] Acceptance Criteria cover at least one row per UX state from the parent Scope Slice
- [ ] Test plan names test type for each item (unit / integration / contract / e2e)
- [ ] Touched Files (predicted) is non-empty
- [ ] Out of Scope is non-empty
- [ ] All Open Questions either answered or carry an explicit next action
- [ ] Decision references resolved (or `none` stated explicitly)

**Verdict:** <!-- NOT READY | READY FOR IMPLEMENTATION PLAN | BLOCKED — reason -->

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
|      |        |        |
