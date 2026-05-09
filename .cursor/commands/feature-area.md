# /feature-area — Feature Area Workflow

## Usage

```txt
/feature-area <mode> [argument]
```

## Modes

| Mode | Purpose |
|------|---------|
| `map` | Read PRD and propose a Feature Area map — no file writes |
| `scaffold` | After an approved Feature Area Map, write initial Feature Area files from template — Feature Area markdown only |
| `validate <feature-area-name>` | Run FA-01–FA-09 checks against an existing Feature Area file |
| `promote <feature-area-name>` | After CLEAR readiness, apply the narrow `exploratory` → `validated` file transition (Status, Readiness Verdict, changelog) — existing Feature Area file only |
| `slice <feature-area-name>` | Propose candidate Scope Slices for a validated Feature Area — no file writes |
| `scaffold-slices <feature-area-name>` | After an approved Scope Slice proposal from `slice`, create or fill Scope Slice files from template — Scope Slice markdown only |
| `refine-slice <artifact-path>` | Fill or update **product-level** sections of **one** existing Scope Slice file — no user stories, specs, tasks, or architecture |
| `promote-slice <artifact-path>` | After SS-01–SS-10 and CC-01–CC-05 are CLEAR, apply the narrow transition to `ready-for-user-stories` on **one** Scope Slice file |
| `check <artifact-path>` | Run the scope-readiness checker against any Feature Area or Scope Slice file |

**Safety — Feature Area files:** `/feature-area scaffold` is the only mode that may **create** Feature Area markdown under `docs/product/feature-areas/`. `/feature-area promote` is the only mode that may **apply the automated validated transition** (status, readiness checklist, verdict line, changelog row) on an existing file. All other modes remain proposal/check-only for those files.

**Safety — Scope Slice files:** `/feature-area scaffold-slices` is the only mode that may **create** or **initially fill** Scope Slice markdown under `docs/product/scope-slices/` from an approved slice proposal. `/feature-area refine-slice` may **edit product-level sections only** of an existing file under `docs/product/scope-slices/`. `/feature-area promote-slice` is the only mode that may **apply the automated ready-for-user-stories transition** (narrow edits only — see Mode: promote-slice). `check`, `map`, `validate`, `promote` (Feature Area), `slice`, and `scaffold-slices` do not perform slice refinement or slice promotion.

Governed by: `.cursor/rules/feature-area-workflow.mdc`
Templates: `.cursor/templates/product/`
Checker: `.cursor/checkers/scope-readiness-checker.md`
Operational skill: `.cursor/skills/feature-area/feature-area-builder/SKILL.md`
Agents: `.cursor/agents/feature-area/` (Feature Area Lead, Scope Critic)

---

## Pre-flight (all modes)

Before any mode executes, the Feature Area Builder skill reads in this order:

1. `docs/prd/state.md` — version, direction, last major change
2. `docs/prd/PRD.md` — active product definition
3. `docs/prd/questions/open-questions.md` — unresolved blockers
4. `docs/product-decisions/README.md` — durable product decisions (if the file exists)
5. `docs/product/feature-areas/` — all existing Feature Area files (if the directory exists)
6. `docs/product/scope-slices/` — all existing Scope Slice files (if the directory exists)

Do not skip step 3. Open blockers constrain all downstream work.

If `docs/prd/PRD.md` is missing or empty, stop and suggest `/prd init` before proceeding.

**Feature Area Lead pre-flight (`map`, `validate`, `promote`, `slice`, `scaffold-slices`, initial `scaffold` only):** On the initial invocation of any of these modes, the Feature Area Lead agent (`.cursor/agents/feature-area/feature-area-lead.md`) produces a Feature Area Context Brief. The builder acts only after the brief is available. Skip for `check`, `refine-slice`, and `promote-slice`. Do not re-run when the user is responding to an existing proposal. When running `scaffold` immediately after approving a Feature Area Map produced in the same conversation, reuse the Context Brief produced for `map` — do not re-run the Lead. When running `scaffold-slices` immediately after approving a Scope Slice proposal produced in **this same conversation**, reuse the Context Brief produced for `slice` — do not re-run the Lead.

---

## Mode: map

Reads the PRD and produces a proposed Feature Area map. **No file writes.**

### Behavior

1. Read the PRD Feature Groups and global product sections.
2. For each PRD Feature Group, determine whether it maps 1-to-1 to a Feature Area or needs to be split into multiple Feature Areas.
3. Apply the split criterion: if a group contains more than ~5 distinct user-value clusters, split it.
4. List existing Feature Area files (if any) and flag overlaps or gaps.
5. Produce the Feature Area Map proposal.

### Output format

```txt
Feature Area Map Proposal

Source PRD version: <version>

| Feature Area | PRD Source (§ section) | Status | Notes |
|---|---|---|---|
| <name> | § | proposed | |

Split decisions:
- <PRD group> → <FA-1>, <FA-2> — reason: <why split>

Existing FA files not covered by this proposal:
- <none | list>

Open blockers that may affect the map:
- <Q-ID> — <question>

Verdict: <N> proposed Feature Areas, <N> require PRD clarification before they can be created.

Next step:
- Run `/feature-area scaffold` to create initial Feature Area files from `.cursor/templates/product/feature-area.template.md`
- Run `/feature-area validate <name>` per area, then `/feature-area promote <name>` after CLEAR, before Scope Slice decomposition
```

**Scope Critic review:** After the builder produces the map proposal, the Scope Critic (`.cursor/agents/feature-area/scope-critic.md`) reviews it before it is presented to the user. If the Scope Critic returns a REVISE verdict, revise the proposal before presenting.

**Hard rules for map mode:**
- No file writes.
- Do not name architecture, services, or runtime boundaries.
- Do not produce Scope Slices or user stories.
- "Feature Group" (PRD language) must be converted to "Feature Area" terminology — do not carry Feature Group naming into the proposal **except** in **PRD Source** citations where the PRD section title is literally *Feature Groups* (cite the § only; do not use "Feature Group" as an artifact or area name elsewhere).

---

## Mode: scaffold

Creates initial Feature Area files from `.cursor/templates/product/feature-area.template.md` after an **approved** Feature Area Map. **Writes only** `docs/product/feature-areas/<kebab-name>.md`; no other paths.

### Pre-conditions

1. Read the Feature Area Builder skill (`.cursor/skills/feature-area/feature-area-builder/SKILL.md`).
2. The Feature Area Map used as input must be **approved by the user in the current conversation** (table of proposed v0 Feature Areas plus any split decisions — not speculative).
3. If no approved map is available in-context, stop and instruct the user to run `/feature-area map`, approve it, then re-run `/feature-area scaffold`.

### Behavior

1. Read mandatory sources in pre-flight order (PRD state, PRD.md, open questions, product-decisions/README if present).
2. Reconcile the approved map with PRD Feature Groups — fill each new file **only from** PRD-aligned content and fields implied by that map (including PRD § references carried from the proposal).
3. For each proposed v0 Feature Area in the approved map:
   - Target path: `docs/product/feature-areas/<kebab-name>.md` (canonical kebab casing from Feature Area naming).
   - If the target file **already exists** and is **non-empty** (trimmed contents length > 0): **skip** — do not modify; record under skipped outputs.
   - If the target is missing **or exists but is empty**, write the file **from `.cursor/templates/product/feature-area.template.md`** (structure preserved; placeholders replaced with scaffolded prose).
   - Set `Status:` to **`exploratory`** in the scaffolded artifact.
   - Copy **`NEED_HUMAN`** and **`NEED_UPDATE`** from the approved map row **verbatim** (`true` / `false`).
   - **Candidate Scope Slices:** populate the table **only with names + one-line descriptions** (+ `exploratory` status per row if the template column is present); no decomposition beyond what the approved map conveyed.
   - Omit or leave minimal template placeholders for sections the map did not imply — pull additional grounding from **`docs/prd/PRD.md`** only where it directly fills those sections (intent, boundaries, journeys, dependencies, blockers-as-known). Never invent specs.
4. **Do not:** create Scope Slice files; run validation; overwrite non-empty Feature Area files; write user stories, specs, tasks, or architecture.

### Output format

```txt
## /feature-area scaffold — result

Created:
- docs/product/feature-areas/<kebab>.md

Skipped (existing non-empty file):
- docs/product/feature-areas/<kebab>.md

Files needing NEED_HUMAN resolution (<NEED_HUMAN=true> preserved from approved map):
- docs/product/feature-areas/<kebab>.md — <why from map/context if known>

Next recommended command:
/feature-area validate <kebab-name>   ← run once per created Feature Area
```

**Hard rules for scaffold mode:**

- **`/feature-area scaffold` is the only `/feature-area` mode that may create Feature Area files.** **`/feature-area promote`** applies only the predefined validated-transition edits on an existing file. All other modes do not modify Feature Area files.
- No Scope Slice file creation (`docs/product/scope-slices/`).
- Do not invoke FA readiness checks inside scaffold — defer to **`/feature-area validate`**.
- No user stories, specs, tasks, architecture, services, APIs, data models.

---

## Mode: validate `<feature-area-name>`

Runs the FA-01–FA-09 checks from `.cursor/checkers/scope-readiness-checker.md` (Part 1) against the Feature Area file at `docs/product/feature-areas/<feature-area-name>.md`.

### Behavior

1. Read the Feature Area file.
2. Read `docs/prd/questions/open-questions.md` to cross-check open blockers.
3. Run every check in Part 1 (FA-01 through FA-09) and Cross-Cutting checks CC-02, CC-03, CC-04, CC-05.
4. Output the summary table.
5. If all checks pass: state that the Feature Area may be marked `validated` via `/feature-area promote <name>` (or manually) and Scope Slices may be proposed via `/feature-area slice <name>` after `validated`.
6. If any check fails: block advancement and state what must be resolved.

### Output format

Use the Summary Output Format defined in `.cursor/checkers/scope-readiness-checker.md`:

```txt
## Scope Readiness Check — <Feature Area Name>

| Check | Result | Notes |
|-------|--------|-------|
| FA-01 | PASS   |       |
| FA-02 | FAIL   | ...   |
| ...   |        |       |
| CC-02 | PASS   |       |
| CC-03 | PASS   |       |
| CC-04 | PASS   |       |
| CC-05 | PASS   |       |

**Advancement verdict:** CLEAR | BLOCKED
**Reason:** <first failing check if blocked>
**NEED_HUMAN:** true | false
**NEED_UPDATE:** true | false
```

**Hard rules for validate mode:**
- No file writes.
- Do not propose Scope Slices inside a validate response.
- Do not mark the Feature Area as `validated` in the file from this mode — after a CLEAR verdict, use `/feature-area promote <name>` (or update the file manually).

---

## Mode: promote `<feature-area-name>`

Runs the same Feature Area readiness checks as `/feature-area validate`, then **only if** the advancement verdict is **CLEAR**, applies a **narrow** update to the Feature Area file. **Does not** create files; **does not** change PRD, Scope Slices, or Feature Area scope content.

### Input

- `<feature-area-name>` → `docs/product/feature-areas/<feature-area-name>.md` (kebab filename as used for `validate` / `slice`).

### Pre-conditions (all required before any write)

1. The Feature Area file exists and is non-empty.
2. Current `Status` is `exploratory` (if already `validated`, **no-op** — do not rewrite; report only).
3. If `Status` is `blocked` or `deferred`, stop — promotion is not allowed; explain.
4. `NEED_HUMAN: false` and `NEED_UPDATE: false` in the file.
5. **Open Blockers:** no unresolved blocker rows (align with FA-06 — no active blockers in the table; cross-check `docs/prd/questions/open-questions.md` as in validate).
6. Run FA-01 through FA-09 and CC-02 through CC-05 from `.cursor/checkers/scope-readiness-checker.md` (same set as validate). If any check does not pass, **stop and do not write**.

### Behavior

1. Read mandatory pre-flight sources (same order as other modes).
2. Read the Feature Area file and `docs/prd/questions/open-questions.md`.
3. Verify pre-conditions (status, flags, Open Blockers).
4. Run FA-01–FA-09 and CC-02–CC-05; require **CLEAR**.
5. **Only if CLEAR:**
   - Set `## Status` value to `validated` (replace `exploratory` only in the status line / backtick line per file convention — do not alter other sections).
   - In `## Readiness Verdict`, set every checklist item to checked: `[x]`.
   - Set `**Verdict:**` to `READY FOR SCOPE SLICES` (replace prior verdict text only on that line).
   - Append one row to `## Changelog`:

     `| YYYY-MM-DD | Promoted to validated after CLEAR readiness check (`/feature-area promote`) | — |`

     Use the current calendar date for `YYYY-MM-DD`.

6. Do not modify: PRD Source, Product Intent, In/Out of Scope, Business Objects, Journeys, Dependencies, Risks, Open Blockers body (except if the template embeds verdict inside Open Blockers — it does not), Candidate Scope Slices, or any other section not listed above.

### Output format

```txt
## /feature-area promote — result

Promoted:
- docs/product/feature-areas/<feature-area-name>.md

Validation:
- FA-01–FA-09: CLEAR
- CC-02–CC-05: CLEAR

Not changed:
- PRD files
- Scope Slice files
- User stories / specs / tasks
- Feature Area scope content

Next recommended command:
/feature-area slice <feature-area-name>
```

If **no-op** (already `validated`):

```txt
## /feature-area promote — result

No-op: docs/product/feature-areas/<feature-area-name>.md is already status `validated`. File not modified.

Next recommended command:
/feature-area slice <feature-area-name>
```

**Hard rules for promote mode:**

- **Only** the four edits above when CLEAR; no other file or section changes.
- No Scope Slice file creation; no user stories, specs, tasks, or architecture.
- If validation is **BLOCKED**, output the same style of summary table as validate (or a concise failure summary) and do not write.

---

## Mode: slice `<feature-area-name>`

Proposes candidate Scope Slices for a Feature Area that has been marked `validated`. **No file writes.**

### Pre-condition gate

Before proposing slices:

1. Read `docs/product/feature-areas/<feature-area-name>.md`.
2. Confirm `Status: validated`. If status is not `validated`, stop and return:

```txt
Cannot propose Scope Slices.

Feature Area "<name>" has status "<current status>".
Scope Slice decomposition requires status = validated.

Run `/feature-area validate <name>` to check what is blocking advancement, then `/feature-area promote <name>` after CLEAR if status is still `exploratory`.
```

3. Confirm `NEED_HUMAN: false`. If `NEED_HUMAN: true`, stop and list the open blockers — do not propose slices until they are resolved.

### Behavior

1. Read the Feature Area's In Scope, Out of Scope, Business Objects Touched, and Candidate Scope Slices sections.
2. Identify distinct user-value clusters within the In Scope section.
3. For each cluster, propose one Scope Slice:
   - Name (kebab-safe, descriptive)
   - One-line user value description
   - Draft boundary (included / excluded)
   - Any immediate blockers or NEED_HUMAN flags
4. Cross-check each proposed slice against the v0 exclusion list in `.cursor/rules/feature-area-workflow.mdc` §6.

### Output format

```txt
Scope Slice Proposal — <Feature Area Name>

| Slice name | User value (one sentence) | Blockers | Tentative status |
|---|---|---|---|
| <kebab-name> | <one sentence> | none | exploratory |

Notes:
- <any cross-cutting concern: credit, sharing, privacy, feedback>

Deferred (v0 exclusion):
- <slice candidate deferred with PRD reference>

Next step:
- Run `/feature-area scaffold-slices <feature-area-name>` to create Scope Slice files from `.cursor/templates/product/scope-slice.template.md` under `docs/product/scope-slices/<feature-area-kebab>--<slice-kebab>.md`
- Then run `/feature-area refine-slice <artifact-path>` on each **exploratory** file to complete product-level sections; use `/feature-area check` and `/feature-area promote-slice` when SS-01–SS-10 and CC checks are CLEAR
```

**Scope Critic review:** After the builder produces the slice proposal, the Scope Critic reviews it before it is presented to the user. If the Scope Critic returns a REVISE verdict, revise the proposal before presenting.

**Hard rules for slice mode:**
- No file writes.
- No architecture, data models, API routes, or technology choices.
- Do not write user stories, specs, or tasks.
- Each proposed slice must deliver user value independently.

---

## Mode: scaffold-slices `<feature-area-name>`

Creates or fills Scope Slice markdown under `docs/product/scope-slices/` from the **most recent user-approved** `/feature-area slice <feature-area-name>` proposal in the current conversation. **Writes only** paths matching `docs/product/scope-slices/<feature-area-kebab>--<slice-kebab>.md`. Does not modify PRD, Feature Area files, or any other paths.

### Pre-conditions

1. Read the Feature Area Builder skill (`.cursor/skills/feature-area/feature-area-builder/SKILL.md`).
2. A Scope Slice proposal for this Feature Area must be **approved by the user in the current conversation** (the table from `/feature-area slice <feature-area-name>`, after any Scope Critic revisions — not speculative). If no approved proposal is available in-context, stop:

```txt
No approved Scope Slice proposal found in this conversation for Feature Area "<feature-area-name>".

Run `/feature-area slice <feature-area-name>` first, review the proposal, approve it explicitly, then run `/feature-area scaffold-slices <feature-area-name>` again.
```

3. Read `docs/product/feature-areas/<feature-area-name>.md` (filename must match the argument). Confirm **`Status: validated`**. If not, stop with the same gate message as Mode: slice (status not validated).
4. Confirm **`NEED_HUMAN: false`** on the parent Feature Area. If `true`, stop and list open blockers — do not create files.

### Behavior

1. Complete mandatory pre-flight reads (PRD state, PRD.md, open questions, product-decisions if present). Use the parent Feature Area file and `docs/prd/PRD.md` only to ground **product-level** text; never invent implementation detail.
2. For **each row** in the approved slice proposal table, resolve:
   - `<feature-area-kebab>` = kebab basename of the parent Feature Area file (same as `<feature-area-name>` in the path).
   - `<slice-kebab>` = kebab-safe slice name from the proposal (must match the row’s slice identity).
   - Target path: `docs/product/scope-slices/<feature-area-kebab>--<slice-kebab>.md`
3. **Skip without overwrite** if the target exists and is **non-empty** (trimmed length > 0). List each skipped path in the output.
4. If the target is **missing** or **empty-only**, write the file from **`.cursor/templates/product/scope-slice.template.md`** (preserve template structure and headings).
5. **Fill only** these sections (product-level prose only; no user stories, specs, tasks, architecture, API routes, data models, or implementation detail):
   - **Parent Feature Area** — correct link to `../feature-areas/<feature-area-kebab>.md` and human-readable name.
   - **Status** — default **`exploratory`** unless the approved proposal row explicitly marked the slice **`blocked`** or **`deferred`** (use that value).
   - **NEED_HUMAN / NEED_UPDATE** — set from proposal + parent Feature Area + PRD grounded gaps. **`NEED_HUMAN: true`** only when missing product truth **blocks** writing user stories for this slice; otherwise `false`. **`NEED_UPDATE: true`** only when templates/rules/checkers are inadequate for this slice; otherwise `false`. Use clear product-level **TBD** in body text where the approved proposal + parent FA + PRD do not supply an answer.
   - **User Value** — from the proposal row (and parent context if needed); no invention.
   - **Exact Boundary** — Included / Excluded behavior lists from the proposal’s boundary + parent FA in/out scope + PRD; use TBD bullets where unknown.
   - **Credit / Payment Impact**, **Sharing / Privacy Impact**, **Feedback / Instrumentation Impact** — from proposal notes/cross-cutting row + parent FA + PRD; if none, use the template’s “None — …” style short statements.
   - **Dependencies** — product-level only (other slices, Feature Areas, or named constraints); TBD table rows if unknown.
   - **Blockers** — from proposal blockers column + open questions affecting this slice; align with NEED_HUMAN.
   - **Acceptance-Level Outcome** — behavioral, from proposal + parent FA when sufficient; otherwise a short product-level TBD.
   - **Changelog** — append one row: current date, scaffolded-from-approved `/feature-area slice` proposal via `/feature-area scaffold-slices`, author `—`.
6. **Do not fill** (leave template placeholders / empty tables as in the template): **UX States**, **Data Touched**, **Readiness for User Stories** checklist, **Verdict** under Readiness — **UX States** and **Data Touched** are owned by **`/feature-area refine-slice`**; Readiness checklist and verdict are owned by **`/feature-area promote-slice`** after **CLEAR** (or manual equivalent).
7. **Do not** modify PRD, Feature Area files, or any file outside `docs/product/scope-slices/<feature-area-kebab>--<slice-kebab>.md`.

### Output format

```txt
## /feature-area scaffold-slices — result

Feature Area: <feature-area-kebab> (validated, NEED_HUMAN=false)

Created:
- docs/product/scope-slices/<feature-area-kebab>--<slice-kebab>.md

Skipped (existing non-empty file):
- docs/product/scope-slices/<feature-area-kebab>--<slice-kebab>.md

Next recommended command:
/feature-area refine-slice docs/product/scope-slices/<feature-area-kebab>--<slice-kebab>.md   ← per created file (exploratory until refined)
/feature-area check <artifact-path>   ← after refinement when verifying readiness; then /feature-area promote-slice when CLEAR
```

**Expectation — post-scaffold Scope Slices:** Files created by `scaffold-slices` default to **`exploratory`**. They are **not** expected to be story-ready until product-level sections are completed via **`/feature-area refine-slice`** and the scope-readiness checker passes SS-01–SS-10 and CC-01–CC-05 (**`/feature-area promote-slice`** applies the status transition only after **CLEAR**).

**Hard rules for scaffold-slices mode:**

- **Only** `/feature-area scaffold-slices` may **create** or **initially populate** Scope Slice files under `docs/product/scope-slices/` from an approved slice proposal. **`/feature-area refine-slice`** performs ongoing **product-level** edits on one existing file; **`/feature-area promote-slice`** applies the **ready-for-user-stories** transition only as defined in Mode: promote-slice.
- No PRD or Feature Area mutations.
- No overwrite of non-empty Scope Slice files.
- No user stories, specs, tasks, architecture, services, APIs, data models.

---

## Mode: refine-slice `<artifact-path>`

Refines **one** Scope Slice at `docs/product/scope-slices/<artifact-path>.md` (path may be relative to repo root or the slice filename under `docs/product/scope-slices/` — resolve to a single file under that directory).

### Pre-conditions

1. Target resolves to exactly one existing, non-empty file under `docs/product/scope-slices/`.
2. Read the Feature Area Builder skill. Complete mandatory pre-flight reads (same order as other modes).

### Behavior

1. Read the Scope Slice file, its parent Feature Area (from link in **Parent Feature Area**), `docs/prd/questions/open-questions.md`, and `docs/prd/PRD.md` only to ground **product-level** text.
2. **May edit only** these sections (headings as in `.cursor/templates/product/scope-slice.template.md`): **User Value**, **Exact Boundary** (Included / Excluded), **UX States**, **Data Touched**, **Credit / Payment Impact**, **Sharing / Privacy Impact**, **Feedback / Instrumentation Impact**, **Dependencies**, **Blockers**, **Acceptance-Level Outcome**; and the **`NEED_HUMAN` / `NEED_UPDATE`** lines under **Status**.
3. **Must not:** change **`Status`** to `ready-for-user-stories` (use **`/feature-area promote-slice`**); edit **Readiness for User Stories** (checklist, **Verdict** line, or status bullets); edit **Changelog**; replace **Parent Feature Area** except to fix a broken link to the correct parent file; create or delete Scope Slice files; modify PRD, Feature Areas, or any path outside the single target file.
4. **Data Touched:** product objects only (per template) — no tables, routes, frameworks, or schemas.
5. Use **PRD-allowed product-level terms** only as defined in `.cursor/checkers/scope-readiness-checker.md` (**Allowed product-level terms (PRD)**).
6. **Do not** write user stories, specs, tasks, architecture, services, APIs, or data models.

### Output format

```txt
## /feature-area refine-slice — result

Refined:
- docs/product/scope-slices/<fa-kebab>--<slice-kebab>.md

Next recommended command:
/feature-area check docs/product/scope-slices/<fa-kebab>--<slice-kebab>.md
```

**Hard rules for refine-slice mode:**

- **Only** product-level section edits on **one** file; no `ready-for-user-stories promotion`.
- No user stories, specs, tasks, architecture.

---

## Mode: promote-slice `<artifact-path>`

Runs Scope Slice readiness checks, then **only if** SS-01–SS-10 and CC-01–CC-05 are **CLEAR**, applies a **narrow** update. **Does not** create files; **does not** change PRD, Feature Area files, or Scope Slice **body** sections (User Value, Boundary, UX States, etc.).

### Input

- `<artifact-path>` → one file under `docs/product/scope-slices/` (resolve as for refine-slice).

### Pre-conditions (all required before any write)

1. Target file exists under `docs/product/scope-slices/` and is non-empty.
2. Parent Feature Area linked from the slice exists and has `Status: validated`.
3. Current **Status** is `exploratory` (if `blocked` or `deferred`, stop — promotion is not allowed until status is `exploratory`; if already `ready-for-user-stories`, **no-op** — do not rewrite; report only).
4. `NEED_HUMAN: false` and `NEED_UPDATE: false` in the slice file.
5. **Blockers:** no unresolved blocker rows that violate SS-09 (cross-check `docs/prd/questions/open-questions.md`).
6. Run SS-01 through SS-10 and CC-01 through CC-05 from `.cursor/checkers/scope-readiness-checker.md` against the slice and parent context. If any check does not **PASS**, **stop and do not write**. (Do **not** treat SS-11 as a pre-write gate — promotion sets the status SS-11 requires.)

### Behavior

1. Complete mandatory pre-flight reads (same order as other modes).
2. Read the Scope Slice file and `docs/prd/questions/open-questions.md`.
3. Verify pre-conditions (status, flags, blockers, parent Feature Area).
4. Run SS-01–SS-10 and CC-01–CC-05; require **CLEAR**.
5. **Only if CLEAR:**
   - Set `## Status` value to `ready-for-user-stories` (replace prior status only on the status line / backtick line per file convention).
   - In `## Readiness for User Stories`, set every checklist item to checked: `[x]`.
   - Set **`**Verdict:**`** to `READY FOR USER STORIES` (replace prior verdict text only on that line).
   - Append one row to `## Changelog`:

     `| YYYY-MM-DD | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |`

     Use the current calendar date for `YYYY-MM-DD`.

6. Do not modify any other sections or files.

### Output format

```txt
## /feature-area promote-slice — result

Promoted:
- docs/product/scope-slices/<fa-kebab>--<slice-kebab>.md

Validation:
- SS-01–SS-10: CLEAR
- CC-01–CC-05: CLEAR

Not changed:
- PRD files
- Feature Area files
- Scope Slice product body sections (User Value, Boundary, UX States, etc.)

Next recommended command:
(user story workflow per product process)
```

If **no-op** (already `ready-for-user-stories`):

```txt
## /feature-area promote-slice — result

No-op: docs/product/scope-slices/<fa-kebab>--<slice-kebab>.md is already status `ready-for-user-stories`. File not modified.
```

**Hard rules for promote-slice mode:**

- **Only** the four edits above when CLEAR; no other file or section changes.
- No user stories, specs, tasks, or architecture.
- If validation is **BLOCKED**, output the same style of summary table as `check` (or a concise failure summary) and do not write.

---

## Mode: check `<artifact-path>`

Runs the full scope-readiness checker against any Feature Area or Scope Slice file.

### Behavior

1. Read the file at `<artifact-path>`.
2. Detect artifact type:
   - Path under `docs/product/feature-areas/` → run Part 1 (FA-01–FA-09) + CC-02–CC-05
   - Path under `docs/product/scope-slices/` → run Part 2 (SS-01–SS-11) + CC-01–CC-05
   - Path under both or ambiguous → ask the user to confirm which part to run
3. Run all applicable checks from `.cursor/checkers/scope-readiness-checker.md`.
4. Output the summary table with advancement verdict.

### Output format

```txt
## Scope Readiness Check — <Artifact Name>
## Type: Feature Area | Scope Slice

| Check | Result | Notes |
|-------|--------|-------|
| ...   |        |       |

**Advancement verdict:** CLEAR | BLOCKED
**Reason:** <first failing check if blocked>
**NEED_HUMAN:** true | false
**NEED_UPDATE:** true | false

Next recommended command:
- Feature Area: /feature-area validate <name> | /feature-area promote <name> (after CLEAR) | /feature-area slice <name>
- Scope Slice: /feature-area refine-slice <path> (when product sections need work) | /feature-area promote-slice <path> (after SS-01–SS-10 and CC-01–CC-05 CLEAR) | resolve blockers and re-run check
```

**Hard rules for check mode:**
- No file writes.
- Do not propose fixes — only report check results and state what must be resolved.

---

## Skill and agent responsibilities

| Operation | Feature Area Lead | Feature Area Builder | Scope Critic |
|-----------|------------------|---------------------|--------------|
| `map` | Context Brief (pre-flight) | Drives proposal | Reviews proposal |
| `scaffold` | Context Brief (reuse from `map` when same-thread; else initial pre-flight) | Writes Feature Area markdown from approved map | Not invoked |
| `validate` | Context Brief (pre-flight) | Runs checker | Not invoked |
| `promote` | Context Brief (pre-flight) | Runs checker; narrow file update if CLEAR | Not invoked |
| `slice` | Context Brief (pre-flight) | Drives proposal | Reviews proposal |
| `scaffold-slices` | Context Brief (reuse from `slice` when same-thread; else initial pre-flight) | Writes Scope Slice markdown from approved proposal | Not invoked |
| `refine-slice` | Not invoked | Edits product-level Scope Slice sections on one file | Not invoked |
| `promote-slice` | Not invoked | Runs SS-01–SS-10 + CC-01–CC-05; narrow ready transition if CLEAR | Not invoked |
| `check` | Not invoked | Runs checker | Not invoked |

Read `.cursor/agents/feature-area/README.md` for the full operating principle.

---

## Hard rules (all modes)

- No task slicing, user stories, specs, or architecture at any point (**`scaffold` included** — it fills template sections from PRD sources only).
- **`/feature-area scaffold` is the only mode that may create** `docs/product/feature-areas/*.md`. **`/feature-area promote`** is the only mode that may apply the automated **validated transition** (status, readiness checklist, verdict, changelog row) on an existing Feature Area file. Do not write or rewrite Feature Area files from map, validate, slice, `scaffold-slices`, check, or promote beyond what promote explicitly allows.
- **`/feature-area scaffold-slices`** may **create** or **initially fill** `docs/product/scope-slices/<feature-area-kebab>--<slice-kebab>.md` only from a user-approved `/feature-area slice` proposal with parent Feature Area gates satisfied. **`/feature-area refine-slice`** may **edit product-level sections** of one existing Scope Slice file (no file creation). **`/feature-area promote-slice`** is the only mode that may apply the automated **ready-for-user-stories** transition on a Scope Slice file (no file creation). No other mode may **create** Scope Slice files.
- Do not skip levels in the hierarchy: PRD → Feature Area → Scope Slice.
- Do not mark a Feature Area `validated` via map, validate, slice, or check — use **`/feature-area promote`** after CLEAR or edit manually. Do not mark Scope Slices `ready-for-user-stories` via map, validate, slice, `scaffold-slices`, check, or **refine-slice** — use **`/feature-area promote-slice`** after CLEAR or edit manually per the template.
- Do not carry "Feature Group" terminology into proposals or narrative — use "Feature Area" exclusively **except** **PRD Source** (or equivalent citation) where the PRD section title is literally *Feature Groups* (§ reference only).
- Any `NEED_HUMAN=true` flag blocks advancement until the user explicitly resolves it.
- Any `NEED_UPDATE=true` flag must surface a description of what is missing before proceeding.
- Do not proceed past a known open blocker in `docs/prd/questions/open-questions.md` without explicit user approval.
