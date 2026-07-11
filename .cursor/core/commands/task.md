# /task — Task Workflow (optional artifact)

> **Tier Enforcement (MANDATORY):** Read `.cursor/core/skills/tier-enforcement/SKILL.md` before proceeding.
>
> When a Task reaches `ready-for-merge`, implementation fires **Executor Tasks only** — never inline code:
> 1. Each brick from the Task's Changes section → one `Task(subagent_type: "executor", model: "composer-2.5-fast")`.
> 2. Wait for each to complete and verify before firing the next.
> 3. Run tests in a final Executor Task.
>
> Inline `StrReplace`/`Write` on application files is a SISO ORANGE violation.


## Usage

```txt
/task <mode> [argument]
```

Tasks are **optional**. Create one only when the parent Spec needs to be split across multiple coherent commits or short PRs. A Spec that fits in a single focused implementation does **not** require Task files.

## Modes

| Mode | Purpose |
|------|---------|
| `propose <spec-path>` | Decide whether the parent Spec needs Task subdivision and propose Task candidates if so — no file writes |
| `scaffold <spec-path>` | After an approved proposal, create Task files from `.cursor/core/templates/product/task.template.md` |
| `refine <task-path>` | Fill or update implementation sections of **one** existing Task file |
| `check <task-path>` | Run the Task readiness checks (TK-01–TK-N + CC-01–CC-05) against one file |
| `promote <task-path>` | After TK and CC checks are CLEAR, apply the narrow transition to `ready-for-merge` on **one** Task file |

**Safety — Task files:** `/task scaffold` is the only mode that may **create** Task markdown under `docs/product/tasks/`. `/task refine` may **edit implementation sections only**. `/task promote` is the only mode that may **apply the automated ready-for-merge transition**.

Governed by: `.cursor/core/rules/user-story-workflow.mdc`
Templates: `.cursor/core/templates/product/task.template.md`
Checker: `.cursor/core/checkers/scope-readiness-checker.md` (Part 6 + CC)
Operational skill: `.cursor/core/skills/task/task-builder/SKILL.md`
Agents: none (Tasks inherit context from parent Spec, per PD-001)
Underlying decision: `docs/product-decisions/PD-001-post-slice-workflow.md`

---

## Pre-flight (all modes)

Before any mode executes, the Task Builder skill reads in this order:

1. `docs/prd/state.md`
2. `docs/prd/PRD.md`
3. `docs/prd/questions/open-questions.md`
4. `docs/product-decisions/` — all PD-XXX files (PD-001 mandatory)
5. The parent Spec file
6. The parent User Story linked from the Spec
7. All existing Task files for the same Spec under `docs/product/tasks/`

**Gate (double check, per PD-001 + PD-006):**

1. The parent Spec must be at status **`ready-for-implementation`**.
2. The chain-grandparent Feature Area (via User Story → Scope Slice → Feature Area) must be at status **`delivery-ready`**. If the FA has regressed since the parent Spec was promoted, stop and instruct the user to re-run `/feature-area clear-for-vertical <fa-name>`.

Both gates apply to `propose`, `scaffold`, `refine`, and `promote`. `check` may operate on any Task file regardless of the FA's status.

No dedicated Lead or Critic agent — Tasks inherit context entirely from their parent Spec.

---

## Mode: propose `<spec-path>`

Reads the parent Spec and decides whether Task subdivision is needed. **No file writes.**

### Behavior

1. Read parent Spec; confirm status `ready-for-implementation`.
2. Decide: does this Spec need to be split into multiple Tasks?
   - Default: **no**. A Spec that fits in one focused commit or short PR does not need Tasks; proceed directly to implementation per the Spec body.
   - Yes only when the Spec touches multiple distinct technical surfaces that cannot land in one coherent commit (e.g. migration + UI + background job).
3. If yes, propose Task candidates:
   - Name (kebab-safe, descriptive)
   - One-line goal tracing to a Spec area (data model / contract / UI / tests / observability)
   - Sized for one commit or short PR
   - Any immediate blockers or NEED_HUMAN flags

### Output format

```txt
Task Proposal — <Spec Name>

Subdivision needed: yes | no

If no:
- Reason: <one sentence; recommend implementing the Spec directly without Task files>

If yes:

| Task name | Goal (one line) | Spec area | Blockers | Tentative status |
|---|---|---|---|---|
| <kebab-name> | <one line> | data | none | exploratory |

Next step:
- (no): proceed to implementation per Spec body
- (yes): /task scaffold <spec-path>
```

**Hard rules for propose mode:**
- No file writes.
- Default to "no subdivision" unless explicitly justified.
- No Task scaffolding if Subdivision needed = no.

---

## Mode: scaffold `<spec-path>`

Creates Task files after an **approved** `/task propose` in the same conversation.

### Pre-conditions

1. Approved Task proposal in-context **with Subdivision needed: yes**.
2. Parent Spec at status `ready-for-implementation`, `NEED_HUMAN: false`.

### Behavior

1. Complete pre-flight reads.
2. For each row in the approved proposal:
   - Target path: `docs/product/tasks/<fa-kebab>--<slice-kebab>--US-<NNN>--T-<MMM>--<short-kebab>.task.md` (MMM = three-digit zero-padded task sequence within this Spec).
3. **Skip without overwrite** if target exists and is non-empty.
4. If missing or empty, write from the template.
5. **Fill only** what the proposal + parent Spec conveys: Parent Spec link, Status (`exploratory`), NEED_HUMAN / NEED_UPDATE, Goal, Scope, Out of Scope, Dependencies, Blockers, Changelog (one row).
6. **Leave empty / TBD**: Changes table, Tests list, Verification Steps — these are owned by `/task refine`.
7. **Do not fill** Readiness for Merge checklist (owned by `/task promote`).

### Output format

```txt
## /task scaffold — result

Spec: <path> (ready-for-implementation, NEED_HUMAN=false)

Created:
- docs/product/tasks/<fa-kebab>--<slice-kebab>--US-NNN--T-MMM--<short>.task.md

Next recommended command:
/task refine docs/product/tasks/<path>
```

**Hard rules for scaffold mode:** Only `/task scaffold` may create Task files. No mutations to higher-level artifacts.

---

## Mode: refine `<task-path>`

Refines **one** Task file with implementation-detail content.

### Pre-conditions

1. Target resolves to exactly one existing, non-empty file under `docs/product/tasks/`.

### Behavior

1. Read the Task file, parent Spec, parent User Story, parent Scope Slice (transitively).
2. **May edit only**: Goal, Scope, Out of Scope, Changes, Tests, Verification Steps, Dependencies, Blockers; and NEED_HUMAN / NEED_UPDATE under Status.
3. **Must not:** change Status to `ready-for-merge` (use `/task promote`); edit Readiness for Merge checklist or Verdict; edit Changelog; replace Parent Spec link except to fix.
4. Implementation freedom: stack, file paths, commands allowed here.

### Output format

```txt
## /task refine — result

Refined:
- docs/product/tasks/<path>

Next recommended command:
/task check docs/product/tasks/<path>
```

**Hard rules for refine mode:** Implementation edits on one file. No `ready-for-merge` promotion. No code writes via this command.

---

## Mode: check `<task-path>`

Runs TK-01..TK-N + CC-01..CC-05 from `.cursor/core/checkers/scope-readiness-checker.md` Part 6.

### Output format

```txt
## Scope Readiness Check — <Task Name>
## Type: Task

| Check | Result | Notes |
|-------|--------|-------|
| TK-01 | PASS   |       |
| ...   |        |       |
| CC-01 | PASS   |       |

**Advancement verdict:** CLEAR | BLOCKED
**Reason:** ...
**NEED_HUMAN:** ...
**NEED_UPDATE:** ...
```

**Hard rules for check mode:** No file writes.

---

## Mode: promote `<task-path>`

### Pre-conditions

1. Target exists, non-empty, under `docs/product/tasks/`.
2. Parent Spec at status `ready-for-implementation`.
3. Current Status `exploratory` (if `blocked` or `deferred`, stop; if already `ready-for-merge`, no-op).
4. `NEED_HUMAN: false`, `NEED_UPDATE: false`.
5. No unresolved blockers.
6. TK and CC checks all PASS.

### Behavior — only if CLEAR

1. Status → `ready-for-merge`.
2. Readiness for Merge checklist all `[x]`.
3. **Verdict:** → `READY FOR MERGE`.
4. Append changelog row: `| YYYY-MM-DD | Promoted to ready-for-merge after CLEAR readiness check (\`/task promote\`) | — |`.
5. No other edits.

### Output format

```txt
## /task promote — result

Promoted:
- docs/product/tasks/<path>

Validation:
- TK-01..TK-N: CLEAR
- CC-01..CC-05: CLEAR

Next recommended command:
- proceed to implementation per task body
- after merge, manually update parent Spec's Tasks table status
```

If no-op:

```txt
## /task promote — result

No-op: docs/product/tasks/<path> is already status `ready-for-merge`. File not modified.
```

**Hard rules for promote mode:** Only the four edits above when CLEAR. No code writes. If BLOCKED, output check summary and do not write.

---

## Hard rules (all modes)

- Tasks are **optional** — never scaffold without explicit "Subdivision needed: yes" approval.
- `/task scaffold` is the only mode that may create Task files. `/task promote` is the only mode that may apply the **ready-for-merge transition**.
- Do not skip levels: Spec → Task.
- Any `NEED_HUMAN=true` blocks advancement.
- Any `NEED_UPDATE=true` must surface what is missing.
- No code writes from this command — Tasks describe planned changes, the actual code lands via implementation step (out of governance scope until a future explicit decision).
