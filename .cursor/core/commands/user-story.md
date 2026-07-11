# /user-story — User Story Workflow

> **Tier note:** planning and authoring in this command stay in Manager context. Any code or scaffold side-effects must be delegated via `Task(subagent_type: "executor")`. See `.cursor/core/skills/tier-enforcement/SKILL.md`.

## Usage

```txt
/user-story <mode> [argument]
```

## Modes

| Mode | Purpose |
|------|---------|
| `propose <scope-slice-path>` | Read parent Scope Slice + PRD context and propose candidate User Stories — no file writes |
| `scaffold <scope-slice-path>` | After an approved proposal, create User Story files from `.cursor/core/templates/product/user-story.template.md` — User Story markdown only |
| `refine <user-story-path>` | Fill or update **product-level** sections of **one** existing User Story file — no Spec, no Task, no architecture |
| `check <user-story-path>` | Run the User Story readiness checks (US-01–US-N + CC-01–CC-05) against one file |
| `promote <user-story-path>` | After US-01–US-N and CC-01–CC-05 are CLEAR, apply the narrow transition to `ready-for-spec` on **one** User Story file |

**Safety — User Story files:** `/user-story scaffold` is the only mode that may **create** User Story markdown under `docs/product/user-stories/`. `/user-story refine` may **edit product-level sections only** of an existing file. `/user-story promote` is the only mode that may **apply the automated ready-for-spec transition** (Status, Readiness checklist, Verdict, changelog row). All other modes are proposal/check-only.

Governed by: `.cursor/core/rules/user-story-workflow.mdc`
Templates: `.cursor/core/templates/product/user-story.template.md`
Checker: `.cursor/core/checkers/scope-readiness-checker.md` (Part 4 + CC)
Operational skill: `.cursor/core/skills/user-story/user-story-builder/SKILL.md`
Agents: `.cursor/core/agents/user-story/` (User Story Lead, Story Critic)
Underlying decision: `docs/product-decisions/PD-001-post-slice-workflow.md`

---

## Pre-flight (all modes)

Before any mode executes, the User Story Builder skill reads in this order:

1. `docs/prd/state.md`
2. `docs/prd/PRD.md`
3. `docs/prd/questions/open-questions.md`
4. `docs/product-decisions/` — all PD-XXX files (PD-001 is mandatory because it defines this workflow)
5. The parent Scope Slice file (for `propose`, `scaffold`, `refine`, `check`, `promote`)
6. The parent Feature Area linked from the Scope Slice
7. All existing User Story files for the same Scope Slice under `docs/product/user-stories/`

Do not skip steps 3 or 4. Open PRD blockers and PD-001 constraints govern all downstream work.

**Gate (double check, per PD-006):**

1. The parent Scope Slice must be at status **`ready-for-user-stories`**. If not, stop and instruct the user to complete `/feature-area refine-slice` + `/feature-area promote-slice` first.
2. The grandparent Feature Area must be at status **`delivery-ready`**. If status is `validated` (or anything else), stop and instruct the user to run `/feature-area clear-for-vertical <fa-name>` first; this gate is required by `docs/product-decisions/PD-006-per-fa-delivery-readiness-gate.md` to authorize the per-FA vertical chain.

Both gates apply to `propose`, `scaffold`, `refine`, and `promote`. `check` may operate on any User Story file regardless of the parent FA's status (read-only diagnostic).

If the grandparent FA is at `delivery-ready` but a direct dependency of that FA subsequently regressed (per CC-04 / DR-04 drift handling in PD-006), the FA must be reverted to `validated` and re-promoted via `/feature-area clear-for-vertical` before any further User Story / Spec / Task work proceeds.

**User Story Lead pre-flight (`propose`, `scaffold`, `refine`, `check`, `promote`):** On the initial invocation of any of these modes, the User Story Lead agent (`.cursor/core/agents/user-story/user-story-lead.md`) produces a User Story Context Brief. The builder acts only after the brief is available. Do not re-run when the user is responding to an existing proposal. When running `scaffold` immediately after approving a proposal produced in the same conversation, reuse the Brief produced for `propose`.

---

## Mode: propose `<scope-slice-path>`

Reads the parent Scope Slice + PRD context and proposes candidate User Stories. **No file writes.**

### Behavior

1. Read parent Scope Slice; confirm status `ready-for-user-stories`. Read grandparent Feature Area (from the Slice's Parent Feature Area link); confirm status `delivery-ready` per PD-006. If either gate fails, stop and report the missing gate with the corresponding next command (`/feature-area promote-slice` or `/feature-area clear-for-vertical`).
2. Identify distinct acceptance dimensions within the Scope Slice's UX States + Included Behavior + Acceptance-Level Outcome.
3. For each dimension, propose one User Story:
   - Name (kebab-safe, descriptive)
   - "As an X, I do Y, so that Z" statement
   - 2–5 candidate Acceptance Criteria (Given/When/Then bullets)
   - UX states covered (subset of parent slice)
   - Any immediate blockers or NEED_HUMAN flags
4. Cross-check each proposed US against PRD Hard v0 exclusions and the parent Scope Slice's Excluded Behavior.

### Output format

```txt
User Story Proposal — <Scope Slice Name>

| US ID | Story (As X, I Y, so that Z) | UX states covered | Blockers | Tentative status |
|---|---|---|---|---|
| US-001 | <story> | <names from parent slice> | none | exploratory |

Notes:
- <cross-cutting concern: credit, sharing, privacy, feedback inheritance>

Deferred (parent slice exclusion):
- <story candidate deferred with parent reference>

Next step:
- Run `/user-story scaffold <scope-slice-path>` to create User Story files from `.cursor/core/templates/product/user-story.template.md` under `docs/product/user-stories/<fa-kebab>--<slice-kebab>--US-<NNN>--<short-kebab>.md`
- Then run `/user-story refine <path>` on each exploratory file; use `/user-story check` and `/user-story promote` when US-01–US-N and CC checks are CLEAR
```

**Story Critic review:** After the builder produces the proposal, the Story Critic (`.cursor/core/agents/user-story/story-critic.md`) reviews it before it is presented to the user. If the Story Critic returns a REVISE verdict, revise the proposal before presenting.

**Hard rules for propose mode:**
- No file writes.
- No data model, route, framework, or runtime language.
- Do not write Specs or Tasks.
- Each proposed US must map to exactly one acceptance dimension of the parent slice.

---

## Mode: scaffold `<scope-slice-path>`

Creates User Story files from `.cursor/core/templates/product/user-story.template.md` after an **approved** `/user-story propose <scope-slice-path>` in the same conversation. **Writes only** paths matching `docs/product/user-stories/<fa-kebab>--<slice-kebab>--US-<NNN>--<short-kebab>.md`.

### Pre-conditions

1. An approved User Story proposal for this Scope Slice exists in-context. If not, stop and instruct the user to run `/user-story propose <scope-slice-path>` first.
2. Parent Scope Slice exists and is at status `ready-for-user-stories`.
3. Grandparent Feature Area exists and is at status `delivery-ready` per PD-006. If `validated` (or anything else), stop and instruct the user to run `/feature-area clear-for-vertical <fa-name>` first.
4. Parent Scope Slice has `NEED_HUMAN: false`. If `true`, stop and list open blockers.
5. Grandparent Feature Area has `NEED_HUMAN: false` on the FA itself and on every direct dependency listed in its `Dependencies` section (DR-04 propagation). If any of these carry `NEED_HUMAN: true`, stop and surface the dependency that needs resolution.

### Behavior

1. Complete pre-flight reads.
2. For each row in the approved proposal:
   - `<fa-kebab>` = kebab basename of parent Scope Slice's parent Feature Area.
   - `<slice-kebab>` = kebab basename of parent Scope Slice (strip the `<fa-kebab>--` prefix).
   - `<NNN>` = three-digit zero-padded US sequence within this slice (001, 002, …).
   - `<short-kebab>` = kebab-safe short label.
   - Target path: `docs/product/user-stories/<fa-kebab>--<slice-kebab>--US-<NNN>--<short-kebab>.md`.
3. **Skip without overwrite** if the target exists and is non-empty.
4. If target is missing or empty, write from the template (structure preserved).
5. **Fill only** product-level sections: Parent Scope Slice link, Status (`exploratory`), NEED_HUMAN / NEED_UPDATE, Story, Acceptance Criteria (initial Given/When/Then from the proposal), UX States Covered, Out of Scope, Data Touched (inherit narrowing from parent slice), Credit / Sharing / Feedback impacts (inherit framing), Dependencies, Blockers, Acceptance-Level Outcome, Changelog (one row).
6. **Do not fill** Readiness for Spec checklist (owned by `/user-story promote`).
7. **Do not** modify Scope Slice, Feature Area, PRD, or any path outside `docs/product/user-stories/`.

### Output format

```txt
## /user-story scaffold — result

Scope Slice: <fa-kebab>--<slice-kebab> (ready-for-user-stories, NEED_HUMAN=false)

Created:
- docs/product/user-stories/<fa-kebab>--<slice-kebab>--US-001--<short>.md

Skipped (existing non-empty file):
- docs/product/user-stories/<fa-kebab>--<slice-kebab>--US-002--<short>.md

Next recommended command:
/user-story refine <path>   ← per created file (exploratory until refined)
/user-story check <path>    ← after refinement; then /user-story promote when CLEAR
```

**Hard rules for scaffold mode:**
- Only `/user-story scaffold` may create User Story files from an approved proposal.
- No Scope Slice, Feature Area, or PRD mutations.
- No overwrite of non-empty User Story files.
- No Specs or Tasks.

---

## Mode: refine `<user-story-path>`

Refines **one** User Story under `docs/product/user-stories/`.

### Pre-conditions

1. Target resolves to exactly one existing, non-empty file under `docs/product/user-stories/`.
2. Read the User Story Builder skill. Complete pre-flight reads.

### Behavior

1. Read the User Story file, its parent Scope Slice (from link in **Parent Scope Slice**), parent Feature Area, `docs/prd/questions/open-questions.md`, `docs/prd/PRD.md`, and all PD-XXX files.
2. **May edit only**: Story, Acceptance Criteria, UX States Covered, Out of Scope, Data Touched, Credit / Payment Impact, Sharing / Privacy Impact, Feedback / Instrumentation Impact, Dependencies, Blockers, Acceptance-Level Outcome; and NEED_HUMAN / NEED_UPDATE under Status.
3. **Must not:** change Status to `ready-for-spec` (use `/user-story promote`); edit Readiness for Spec checklist or Verdict; edit Changelog; replace Parent Scope Slice link except to fix a broken link.
4. **Allowed product-level terms** only (see scope-readiness-checker.md Allowed product-level terms (PRD)).
5. Do not write Spec or Task content.

### Output format

```txt
## /user-story refine — result

Refined:
- docs/product/user-stories/<path>

Next recommended command:
/user-story check docs/product/user-stories/<path>
```

**Hard rules for refine mode:** Product-level edits on one file. No `ready-for-spec` promotion. No Specs or Tasks.

---

## Mode: check `<user-story-path>`

Runs the User Story readiness checker against one file.

### Behavior

1. Read the file.
2. Detect that path is under `docs/product/user-stories/` → run Part 4 (US-01..US-N) + CC-01..CC-05 from `.cursor/core/checkers/scope-readiness-checker.md`.
3. Output the summary table with advancement verdict.

### Output format

```txt
## Scope Readiness Check — <User Story Name>
## Type: User Story

| Check | Result | Notes |
|-------|--------|-------|
| US-01 | PASS   |       |
| ...   |        |       |
| CC-01 | PASS   |       |

**Advancement verdict:** CLEAR | BLOCKED
**Reason:** <first failing check if blocked>
**NEED_HUMAN:** true | false
**NEED_UPDATE:** true | false

Next recommended command:
- /user-story refine <path> (when product sections need work)
- /user-story promote <path> (after US and CC are CLEAR)
- resolve blockers and re-run check
```

**Hard rules for check mode:** No file writes. Report only.

---

## Mode: promote `<user-story-path>`

Runs the same checker, then only if CLEAR applies a narrow update.

### Pre-conditions (all required)

1. Target file exists and is non-empty under `docs/product/user-stories/`.
2. Parent Scope Slice is at status `ready-for-user-stories`.
3. Grandparent Feature Area is at status `delivery-ready` per PD-006. If the FA has regressed to `validated` or `blocked` since the US was scaffolded, stop and instruct the user to re-run `/feature-area clear-for-vertical <fa-name>` after resolving the regression.
4. Current Status is `exploratory` (if `blocked` or `deferred`, stop; if already `ready-for-spec`, no-op — report only).
5. `NEED_HUMAN: false` and `NEED_UPDATE: false`.
6. No unresolved blocker rows; PRD active question queue does not block this US.
7. US-01..US-N and CC-01..CC-05 must all PASS.

### Behavior — only if CLEAR

1. Set `## Status` value to `ready-for-spec` (replace `exploratory` only on the status line).
2. In `## Readiness for Spec`, set every checklist item to `[x]`.
3. Set **Verdict:** to `READY FOR SPEC`.
4. Append one row to `## Changelog`: `| YYYY-MM-DD | Promoted to ready-for-spec after CLEAR readiness check (\`/user-story promote\`) | — |` with today's date.
5. Do not modify any other sections or files.

### Output format

```txt
## /user-story promote — result

Promoted:
- docs/product/user-stories/<path>

Validation:
- US-01..US-N: CLEAR
- CC-01..CC-05: CLEAR

Not changed:
- PRD files
- Feature Area files
- Scope Slice files
- User Story body sections (Story, ACs, UX States Covered, etc.)

Next recommended command:
/spec propose docs/product/user-stories/<path>
```

If no-op (already `ready-for-spec`):

```txt
## /user-story promote — result

No-op: docs/product/user-stories/<path> is already status `ready-for-spec`. File not modified.
```

**Hard rules for promote mode:** Only the four edits above when CLEAR. No Spec, Task, or architecture writes. If BLOCKED, output check summary and do not write.

---

## Hard rules (all modes)

- No Spec or Task content at User Story level.
- `/user-story scaffold` is the only mode that may **create** User Story files. `/user-story promote` is the only mode that may apply the **ready-for-spec transition** on an existing file.
- Do not skip levels: Scope Slice → User Story → Spec → Task.
- Do not carry "Feature Group" terminology — use "Feature Area" / "Scope Slice" / "User Story" consistently.
- Any `NEED_HUMAN=true` blocks advancement.
- Any `NEED_UPDATE=true` must surface what is missing.
- Do not proceed past a known open blocker in `docs/prd/questions/open-questions.md` without explicit user approval.
