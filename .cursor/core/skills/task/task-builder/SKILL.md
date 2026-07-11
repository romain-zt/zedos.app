---
name: task-builder
description: Drives Task authoring from `ready-for-implementation` Specs when subdivision is needed. `propose` decides whether a Spec needs subdivision (defaults to NO). `scaffold` writes Task markdown from an approved proposal (only when Subdivision needed: yes). `refine` edits implementation sections of one Task. `promote` applies the narrow ready-for-merge transition after CLEAR (TK-01–TK-N, CC-01–CC-05). `check` runs the readiness checker only. Tasks are optional; most Specs do not need them. Never writes application code.
disable-model-invocation: true
---

# Task Builder

Operational skill for subdividing a `ready-for-implementation` Spec into Task files **when, and only when, subdivision is justified**. Drives the `/task` command modes.

Tasks are **optional**. A Spec that fits in one coherent commit or short PR does not need Task files. The default answer to "do we need Tasks?" is **no**.

## 1. Goal

Produce Task files (when justified) that are:

- Grounded in a specific Spec that is already `ready-for-implementation`
- Sized for one commit or short PR
- Trace every change to a specific Spec section
- Carry a Tests list traced to the parent Spec's test plan
- Carry reproducible Verification Steps

Anti-goal: creating Task files for ceremony's sake. Empty Task lists with no per-Task value are forbidden.

## 2. Activation

Activate when the user runs `/task <mode>`.

Before any mode executes:

1. Read `docs/prd/state.md`
2. Read `docs/prd/PRD.md`
3. Read `docs/prd/questions/open-questions.md`
4. Read all `docs/product-decisions/PD-*.md` (PD-001 mandatory)
5. Read the parent Spec file
6. Read the parent User Story linked from the Spec (for cross-reference)
7. Read all existing Task files for the same Spec under `docs/product/tasks/`

If the parent Spec is not at `ready-for-implementation`: stop and recommend `/spec refine` + `/spec promote` first.

No dedicated Lead or Critic agent — Task workflow inherits its context from the parent Spec.

## 3. Mode: propose

Decide whether the parent Spec needs Task subdivision. No file writes.

### Decision criteria

Default: **no subdivision needed**. Set `Subdivision needed: no` and recommend implementing the Spec directly.

Set `Subdivision needed: yes` only when ALL of the following hold:

- The Spec touches multiple distinct technical surfaces (e.g. data migration + UI screen + background job).
- These surfaces cannot land in one coherent commit or short PR.
- Each surface can be implemented and verified independently.
- The team needs separate PR cadence per surface (reviewers, deployment, rollback).

If any of these does not hold, recommend `no`.

### Behavior when yes

For each Task:

- Name (kebab-safe).
- One-line goal that traces to a specific Spec section.
- Spec area (data model / contract / UI / tests / observability / migration).
- Sized for one commit or short PR.
- Immediate blockers or NEED_HUMAN flags.

### Output

Use the output format in `.cursor/core/commands/task.md` Mode: propose.

## 4. Mode: scaffold

Materialize an **approved** Task proposal into files. Governed by `.cursor/core/commands/task.md` Mode: scaffold.

### Pre-conditions

1. Approved proposal in-context with `Subdivision needed: yes`.
2. Parent Spec `ready-for-implementation` and `NEED_HUMAN: false`.

### Behavior

1. Target `docs/product/tasks/<fa-kebab>--<slice-kebab>--US-<NNN>--T-<MMM>--<short-kebab>.task.md` per row.
2. **Skip** if file exists and non-empty.
3. Else instantiate from `.cursor/core/templates/product/task.template.md`.
4. **Fill only**: Parent Spec link, Status (`exploratory`), NEED_HUMAN / NEED_UPDATE, Goal, Scope, Out of Scope, Dependencies (from proposal), Blockers (from proposal), Changelog (one row with today's date).
5. **Leave empty / TBD**: Changes table, Tests, Verification Steps — owned by `refine`.
6. **Do not fill** Readiness for Merge checklist (owned by `promote`).
7. **Do not** modify files outside `docs/product/tasks/`.

## 5. Mode: refine

Edit implementation sections of one Task. Governed by `.cursor/core/commands/task.md` Mode: refine.

### Behavior

1. Resolve `docs/product/tasks/<one file>.task.md`.
2. Complete standard reads (§2).
3. **Allowed edits**: Goal, Scope, Out of Scope, Changes (Area / Change / Notes table), Tests, Verification Steps, Dependencies, Blockers; and NEED_HUMAN / NEED_UPDATE under Status.
4. **Must not** change Status to `ready-for-merge` (use `promote`); edit Readiness for Merge checklist or Verdict; edit Changelog; replace Parent Spec link except to fix.
5. **Tests list** must trace to a parent Spec test plan entry where possible.
6. **Verification Steps** must be reproducible (specific commands, specific checks).
7. **Do not** write application code from this skill.

## 6. Mode: check

Run Part 6 (TK-01..TK-N) + CC-01..CC-05 against one Task file.

## 7. Mode: promote

Apply narrow **ready-for-merge** transition after CLEAR.

### Behavior

1. Standard reads (§2).
2. Gate: file under `docs/product/tasks/`; parent Spec `ready-for-implementation`; current Status `exploratory` (no-op if already `ready-for-merge`; stop if `blocked`/`deferred`); flags false; blockers consistent.
3. Run TK-01..TK-N + CC-01..CC-05. CLEAR required.
4. **Only if CLEAR**, apply only these four edits:
   - Status → `ready-for-merge`
   - Readiness for Merge checklist all `[x]`
   - **Verdict:** → `READY FOR MERGE`
   - Changelog row appended with today's date.

## 8. Handoff to implementation

Tasks at `Status: ready-for-merge` with `NEED_HUMAN: false` are ready to be implemented. This skill does not drive code writing. After merge, the parent Spec's Tasks table status column may be manually updated.

State explicitly when a Task reaches this point:

```txt
Task "<name>" is marked ready-for-merge.
Implementation may proceed.

This skill does not drive code writing.
After merge, update parent Spec's Tasks table.
```

## 9. Anti-patterns

| Anti-pattern | Verdict |
|---|---|
| Scaffolding Tasks when `Subdivision needed: no` | Forbidden |
| Tasks with vague Changes ("update code in module X") | Forbidden |
| Tasks without Verification Steps | Forbidden |
| Tasks without Tests traced to parent Spec test plan | Forbidden |
| Task that exceeds one commit / short PR size | Wrong — split or merge |
| Editing Task files outside `scaffold` / `refine` / `promote` allowed scope | Forbidden |
| Claiming `ready-for-merge` without the file reflecting it | Forbidden — use `/task promote` after CLEAR |
| Writing application code from this skill | Forbidden |

## 10. Guardrails

- **Default no.** Subdivision is the exception, not the rule.
- **Creation vs promotion vs refinement.** `scaffold` creates. `refine` edits body. `promote` applies the predefined ready-for-merge transition.
- **One mode at a time.**
- **Explicit blockers.** Any FAIL blocks advancement.
- **No code writes** from this skill — Tasks describe planned changes; implementation lands elsewhere.
