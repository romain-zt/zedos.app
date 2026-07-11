# /spec — Implementation Spec Workflow

> **Tier note:** planning and authoring in this command stay in Manager context. Any code or scaffold side-effects must be delegated via `Task(subagent_type: "executor")`. See `.cursor/core/skills/tier-enforcement/SKILL.md`.

## Usage

```txt
/spec <mode> [argument]
```

## Modes

| Mode | Purpose |
|------|---------|
| `propose <user-story-path>` | Read parent User Story + chain context and propose one or more Spec candidates — no file writes |
| `scaffold <user-story-path>` | After an approved proposal, create Spec files from `.cursor/core/templates/product/spec.template.md` — Spec markdown only |
| `refine <spec-path>` | Fill or update product + implementation sections of **one** existing Spec file — no Task content |
| `check <spec-path>` | Run the Spec readiness checks (SP-01–SP-N + CC-01–CC-05) against one file |
| `promote <spec-path>` | After SP-01–SP-N and CC-01–CC-05 are CLEAR, apply the narrow transition to `ready-for-implementation` on **one** Spec file |

**Safety — Spec files:** `/spec scaffold` is the only mode that may **create** Spec markdown under `docs/product/specs/`. `/spec refine` may **edit product + implementation sections** of an existing file. `/spec promote` is the only mode that may **apply the automated ready-for-implementation transition** (Status, Readiness checklist, Verdict, changelog row). All other modes are proposal/check-only.

**This is the first level in the chain where stack, schema, framework, routes, and runtime decisions may appear.** Spec Critic stress-tests for premature architectural commitment, gold-plating, missing tests, missing observability, and leakage out of the parent User Story's boundary.

Governed by: `.cursor/core/rules/user-story-workflow.mdc`
Templates: `.cursor/core/templates/product/spec.template.md`
Checker: `.cursor/core/checkers/scope-readiness-checker.md` (Part 5 + CC)
Operational skill: `.cursor/core/skills/spec/spec-builder/SKILL.md`
Agents: `.cursor/core/agents/spec/` (Spec Lead, Spec Critic)
Underlying decision: `docs/product-decisions/PD-001-post-slice-workflow.md`

---

## Pre-flight (all modes)

Before any mode executes, the Spec Builder skill reads in this order:

1. `docs/prd/state.md`
2. `docs/prd/PRD.md`
3. `docs/prd/questions/open-questions.md`
4. `docs/product-decisions/` — all PD-XXX files (PD-001 mandatory)
5. The parent User Story file
6. The parent Scope Slice linked from the User Story
7. The grandparent Feature Area linked from the Scope Slice
8. All existing Spec files for the same User Story under `docs/product/specs/`

**Gate (double check, per PD-001 + PD-006):**

1. The parent User Story must be at status **`ready-for-spec`**. If not, stop and instruct the user to complete `/user-story refine` + `/user-story promote` first.
2. The chain-grandparent Feature Area (via Scope Slice) must be at status **`delivery-ready`**. If status has regressed since the parent User Story was promoted, stop and instruct the user to re-run `/feature-area clear-for-vertical <fa-name>` after resolving the regression.

Both gates apply to `propose`, `scaffold`, `refine`, and `promote`. `check` may operate on any Spec file regardless of the FA's status (read-only diagnostic).

**Spec Lead pre-flight (`propose`, `scaffold`, `refine`, `check`, `promote`):** On the initial invocation, the Spec Lead agent (`.cursor/core/agents/spec/spec-lead.md`) produces a Spec Context Brief. The builder acts only after the brief is available. Reuse the Brief for `scaffold` immediately after approving a proposal in the same conversation.

---

## Mode: propose `<user-story-path>`

Reads the parent User Story + chain and proposes Spec candidates. **No file writes.**

### Behavior

1. Read parent User Story; confirm status `ready-for-spec`.
2. Decide: does this User Story resolve to **one** Spec or **multiple** Specs?
   - One Spec is the default. Multiple Specs only when distinct technical surfaces are involved (e.g. backend job + frontend screen, or two unrelated services).
3. For each candidate Spec, propose:
   - Name (kebab-safe, descriptive)
   - One-sentence summary tracing to the User Story's Acceptance-Level Outcome
   - Coverage map across the parent User Story's ACs
   - Major technical surfaces involved (data, contract, UI, observability)
   - Any immediate blockers or NEED_HUMAN flags
4. Cross-check each proposal against PRD Hard v0 exclusions and the parent User Story's Out of Scope.

### Output format

```txt
Spec Proposal — <User Story Name>

| Spec name | Summary | AC coverage | Surfaces | Blockers | Tentative status |
|---|---|---|---|---|---|
| <kebab-name> | <one sentence> | AC-1, AC-2 | data, contract | none | exploratory |

Notes:
- <cross-cutting concern>

Deferred (parent US exclusion):
- <spec candidate deferred>

Next step:
- Run `/spec scaffold <user-story-path>` to create Spec files from `.cursor/core/templates/product/spec.template.md`
- Then run `/spec refine <path>` on each exploratory file; use `/spec check` and `/spec promote` when SP and CC checks are CLEAR
```

**Spec Critic review:** After the builder produces the proposal, the Spec Critic (`.cursor/core/agents/spec/spec-critic.md`) reviews it before it is presented to the user. If REVISE, revise before presenting.

**Hard rules for propose mode:**
- No file writes.
- May name technical surfaces but not commit to specific schemas / routes / frameworks at proposal stage.
- No Task content.

---

## Mode: scaffold `<user-story-path>`

Creates Spec files from `.cursor/core/templates/product/spec.template.md` after an **approved** `/spec propose` in the same conversation.

### Pre-conditions

1. Approved Spec proposal for this User Story in-context.
2. Parent User Story at status `ready-for-spec`, `NEED_HUMAN: false`.

### Behavior

1. Complete pre-flight reads.
2. For each row in the approved proposal:
   - Target path: `docs/product/specs/<fa-kebab>--<slice-kebab>--US-<NNN>--<short-kebab>.spec.md` (US-NNN matches the parent User Story).
   - If multiple Specs per US, append a `--A`, `--B` discriminator before `.spec.md`.
3. **Skip without overwrite** if target exists and is non-empty.
4. If missing or empty, write from the template.
5. **Fill only** what the proposal + parent chain conveys: Parent User Story link, Status (`exploratory`), NEED_HUMAN / NEED_UPDATE, Summary, Acceptance Criteria Trace, Out of Scope (from proposal + parent US), Dependencies (from proposal), Blockers (from proposal), Changelog (one row).
6. **Leave empty** (placeholders / TBD): Data Model, Contract, UI Surface, Tests, Observability, Implementation notes, Tasks — these are owned by `/spec refine`.
7. **Do not fill** Readiness for Implementation checklist (owned by `/spec promote`).
8. **Do not** modify other files.

### Output format

```txt
## /spec scaffold — result

User Story: <path> (ready-for-spec, NEED_HUMAN=false)

Created:
- docs/product/specs/<fa-kebab>--<slice-kebab>--US-NNN--<short>.spec.md

Skipped:
- ...

Next recommended command:
/spec refine docs/product/specs/<path>
```

**Hard rules for scaffold mode:** Only `/spec scaffold` may create Spec files. No mutations to PRD, FA, Slice, User Story, or files outside `docs/product/specs/`. No Task content.

---

## Mode: refine `<spec-path>`

Refines **one** Spec file. This is where implementation detail lands.

### Pre-conditions

1. Target resolves to exactly one existing, non-empty file under `docs/product/specs/`.
2. Pre-flight reads complete.

### Behavior

1. Read the Spec file, parent User Story, parent Scope Slice, parent Feature Area, PRD, open questions, PD-XXX.
2. **May edit only**: Summary, Acceptance Criteria Trace, Data Model, Contract (Inputs / Outputs / Errors), UI Surface, Tests (Unit / Integration / Acceptance / Non-functional), Observability, Implementation notes, Dependencies, Blockers, Out of Scope, Tasks; and NEED_HUMAN / NEED_UPDATE under Status.
3. **Must not:** change Status to `ready-for-implementation` (use `/spec promote`); edit Readiness for Implementation checklist or Verdict; edit Changelog; replace Parent User Story link except to fix.
4. **Tests section is mandatory** — at least one test must be listed per layer that applies (unit/integration/acceptance). Non-functional may state "None — not applicable at this layer" with reason.
5. Architecture freedom: stack, schema, framework, routes, runtime allowed here per PD-001.

### Output format

```txt
## /spec refine — result

Refined:
- docs/product/specs/<path>

Next recommended command:
/spec check docs/product/specs/<path>
```

**Hard rules for refine mode:** Product + implementation edits on one file. No `ready-for-implementation` promotion. No Task content.

---

## Mode: check `<spec-path>`

Runs SP-01..SP-N + CC-01..CC-05 from `.cursor/core/checkers/scope-readiness-checker.md` Part 5.

### Output format

```txt
## Scope Readiness Check — <Spec Name>
## Type: Spec

| Check | Result | Notes |
|-------|--------|-------|
| SP-01 | PASS   |       |
| ...   |        |       |
| CC-01 | PASS   |       |

**Advancement verdict:** CLEAR | BLOCKED
**Reason:** ...
**NEED_HUMAN:** ...
**NEED_UPDATE:** ...

Next recommended command:
- /spec refine <path> (when sections need work)
- /spec promote <path> (after SP and CC CLEAR)
- resolve blockers and re-run check
```

**Hard rules for check mode:** No file writes.

---

## Mode: promote `<spec-path>`

Runs the checker and applies the narrow update only when CLEAR.

### Pre-conditions

1. Target exists, non-empty, under `docs/product/specs/`.
2. Parent User Story at status `ready-for-spec`.
3. Current Status `exploratory` (if `blocked` or `deferred`, stop; if already `ready-for-implementation`, no-op).
4. `NEED_HUMAN: false`, `NEED_UPDATE: false`.
5. No unresolved blockers; PRD active questions do not block this Spec.
6. SP-01..SP-N and CC-01..CC-05 all PASS.

### Behavior — only if CLEAR

1. Status → `ready-for-implementation`.
2. Readiness for Implementation checklist all `[x]`.
3. **Verdict:** → `READY FOR IMPLEMENTATION`.
4. Append changelog row: `| YYYY-MM-DD | Promoted to ready-for-implementation after CLEAR readiness check (\`/spec promote\`) | — |`.
5. No other edits.

### Output format

```txt
## /spec promote — result

Promoted:
- docs/product/specs/<path>

Validation:
- SP-01..SP-N: CLEAR
- CC-01..CC-05: CLEAR

Next recommended command:
- If Tasks subdivision needed: /task propose docs/product/specs/<path>
- Otherwise: proceed to implementation per spec body
```

If no-op:

```txt
## /spec promote — result

No-op: docs/product/specs/<path> is already status `ready-for-implementation`. File not modified.
```

**Hard rules for promote mode:** Only the four edits above when CLEAR. No Task content. If BLOCKED, output check summary and do not write.

---

## Hard rules (all modes)

- No Task content at Spec level (use `/task` for subdivision).
- `/spec scaffold` is the only mode that may create Spec files. `/spec promote` is the only mode that may apply the **ready-for-implementation transition**.
- Do not skip levels: User Story → Spec → Task.
- Any `NEED_HUMAN=true` blocks advancement.
- Any `NEED_UPDATE=true` must surface what is missing.
- Do not proceed past a known open blocker in `docs/prd/questions/open-questions.md` without explicit user approval.
- No code writes from this command — Spec is a description, not an implementation artifact.
