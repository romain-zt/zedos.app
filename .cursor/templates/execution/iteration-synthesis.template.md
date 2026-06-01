<!--
  Iteration Synthesis Template
  Location: .cursor/templates/execution/iteration-synthesis.template.md
  Usage:    chat artifact — emitted by implementer when /implement or /fix loop completes (verifier PASS + reviewer PASS or REVISE-without-criticals)
  Governed by: .cursor/rules/70-execution-bridge.mdc
  Authored by: implementer or bugfix agent — after the final successful iteration, before recommending /commit
-->

# Iteration Synthesis — {{STORY_OR_FIX_NAME}}

## Linked artifacts

- Scope Slice: {{SCOPE_SLICE_PATH_OR_n/a}}
- User Story: {{USER_STORY_PATH_OR_n/a}}
- Implementation Plan: {{PLAN_PATH_OR_Plan-Lite}}
- Iterations completed: {{N}}

---

## What shipped

<!--
  Cumulative summary across all iterations in this loop — not just the last batch.
  Map each bullet to a User Story acceptance criterion (AC-N) or Plan-Lite fix statement.
  User-visible behavior first; implementation detail second.
-->

| AC / Fix | Shipped behavior |
|----------|------------------|
| {{AC-1 or fix}} | {{what the user can now do or observe}} |
| {{AC-2}} | {{…}} |

**Files changed (cumulative):**

- `{{path}}` — {{short change}}
- `{{path}}` — {{short change}}

**Tests added/updated:**

- `{{test-path}}` — {{what it asserts}}

**Deliberately not shipped (Plan Out of Scope / Plan-Lite out of scope):**

- {{item}} — {{why deferred}}

---

## How to QA

<!--
  Actionable validation steps — manual and automated.
  Pull from User Story Test Plan + Implementation Plan Tests section.
  Prefer steps a human can run locally without reading the diff.
-->

### Automated

- [ ] `{{command}}` — {{expected outcome}}
- [ ] {{test file or suite}} — {{expected outcome}}

### Manual

1. {{precondition / setup}}
2. {{action}}
3. {{expected result — observable, user-facing}}

### Edge cases worth spot-checking

- {{edge case}} — {{expected behavior}}

---

## Next steps

<!--
  What to do after merge — not what to do inside this loop.
  Ground in parent Scope Slice Dependencies, remaining AC, sibling User Stories, WORK_QUEUE.
-->

### Immediate (this PR)

- [ ] `/commit` — {{suggested commit scope}}
- [ ] `/pr` — {{branch or PR note if known}}
- [ ] {{any post-merge deploy or env var step}}

### Follow-up work

| Priority | Next item | Type | Why now |
|----------|-----------|------|---------|
| {{P0/P1/P2}} | {{User Story title or Scope Slice slice title}} | {{US / Scope Slice / bug}} | {{unblocks what / completes which AC}} |

### Story / slice status recommendation

- User Story `{{path}}`: {{ready-for-implementation → done | in-implementation → blocked on X}}
- Scope Slice `{{path}}`: {{remaining acceptance-level outcome if any}}

### Suggested next command

`{{/plan … | /implement … | /feature-area refine-slice … | /commit}}`
