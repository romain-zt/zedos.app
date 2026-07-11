# /prd questions — Human-first PRD question loop

## Purpose

Continue PRD discovery by asking the next unresolved question from `docs/prd/questions/open-questions.md`.

This command is intentionally human-first:
- one question at a time
- notes before PRD
- no PRD file writes
- no implementation
- no architecture

## Templates

Canonical template rules live in `.cursor/core/rules/10-prd-discovery.mdc`.

Use `.cursor/core/templates/prd/` as the only reusable source for generated PRD docs.
Never use `docs/**` files as templates.

## Pre-flight

1. Read `docs/prd/PRD.md`
2. Read `docs/prd/state.md`
3. Read `docs/prd/questions/open-questions.md`
4. Read the latest relevant note in `docs/prd/notes/`

When interpreting **answered** rows in `open-questions.md`, apply **Current truth resolution** (see below) so stale answers are not treated as authoritative.

If `open-questions.md` is missing, create it from `.cursor/core/templates/prd/open-questions.template.md` — it is a capture artifact, not a PRD write.

## Behavior

### Normal path (Active queue has open rows)

1. Find the highest-priority `open` question (lowest priority number, then lowest ID).
2. Ask only that question.
3. Do not include a table unless needed.
4. Do not include more than one follow-up question.
5. Do not propose PRD updates.
6. Wait for the user's answer.

### Empty Active queue — PRD blocker scan (mandatory)

If the **Active queue** has **no** rows with `Status = open` (including when the table is empty or only contains answered moved rows — i.e. nothing left to ask):

1. **Do not** output “no remaining questions” or recommend `/prd converge` yet.
2. **Scan** `docs/prd/PRD.md` for unresolved product blockers in **all** of these sections (headings may be `##` or `#` as in the PRD; match the section title text):

   - `Surface Blockers`
   - `MVP Completeness Checklist`
   - `Open before implementation-readiness` (typically a subsection under MVP Completeness Checklist — scan that heading and its list contents)
   - `Risks & Assumptions`
   - `Success Metrics`
   - `Integration Boundaries`
   - `Configuration Matrix`

3. **Treat as requiring a discovery question** any item that is clearly unresolved, including when the PRD uses language such as:

   - bullets or rows describing **blockers**, **open** decisions, **TBD**, **UNKNOWN**, **provider TBD**, **validation required** / **needs validation**, **not defined**, **not specified**, **not enumerated**, **not yet**, **fragility** / **risk** calling for a product decision, or checklist lines still **unchecked** `[ ]` where the adjacent text states an **open** dependency (e.g. “locking strategy open”, “initiator open”).

4. **Deduplicate:** Before adding a row, compare wording to existing **Active** and **Answered** questions. Do not add a new `open` row if the same blocker is already captured (same intent, even if phrasing differs slightly).

5. **Write capture artifact:** For each distinct unresolved item that lacks a matching queue row, append one row to `docs/prd/questions/open-questions.md` **Active queue** with:

   - `Status`: `open`
   - `Priority`: assign using the scale in `.cursor/core/rules/11-prd-question-loop.mdc` (⛔-style implementation blockers → `1` or `2`; provider/TBD → `2` or `3`; weaker gaps → `3` or `4`)
   - `Question`: one concise product question that resolves that blocker
   - `Source note`: cite the PRD section heading (e.g. `PRD § Surface Blockers`, `PRD § MVP Completeness Checklist`)
   - `Blocks`: short label (e.g. feature group name or “implementation-readiness”)
   - `ID`: next unused `Q-NNN` after scanning all IDs in Active + Answered tables

6. **Ask only one question:** After any repopulation, find the highest-priority `open` question (lowest priority number, then lowest ID) and ask **only** that question.

7. **Only if** the Active queue is still empty **after** this scan and deduplication may you use the “no remaining questions” response format below.

### Hard prohibitions

- **Never** output the exact phrase `No remaining open discovery questions` if `docs/prd/PRD.md` still contains unresolved blockers that map to items in the scanned sections **unless** those items are already represented by answered questions or explicitly deferred/obsolete in the queue with no remaining product gap.
- **Never** tell the user to manually add PRD blockers back into the queue via `/prd note` or similar — repopulation from the PRD is automatic when the Active queue is empty.
- **Never** recommend `/prd converge` until both are true: Active queue has no `open` rows **and** the PRD blocker scan finds nothing that requires a new question.

## Superseded answered questions

When a user answer **changes**, **narrows**, or **contradicts** a fact stated in an earlier **answered** row (same topic, incompatible implications), the older row must **not** remain silently authoritative.

The question loop must **immediately** do **one** of:

- prepend or append to that row’s **Answer** and/or **PRD impact** cell a clear supersession marker and pointer to the newer ID, **or**
- add a short supersession sentence in the same cells referencing the newer `Q-NNN`.

Allowed wording pattern (adapt IDs as needed):

`SUPERSEDED by Q-032 — original answer preserved for history; current PRD truth is the later answer.`

**Never delete** older answered rows; only annotate (see **Hard rules**).

## After user answers

When the user answers a currently open question:

1. Append the raw answer to the active discovery note.
2. Move the question from `Active queue` to `Answered`.
3. Add:
   - answer summary
   - PRD implication
   - remaining ambiguity, if any
4. Apply **Superseded answered questions** (section above) when this answer overrides earlier Answered rows.
5. Add at most one new follow-up question to `Active queue` if the answer creates a new blocker.
6. Run **Behavior** from the top again for the next turn (including empty-queue PRD scan if applicable).

## Response format

When asking the next question (including immediately after repopulating from the PRD):

```txt
Captured.

Interpreted answer:
<1–3 lines — omit this block on first question after PRD repopulation if there was no new user answer this turn; use a one-line note instead e.g. "Repopulated discovery questions from PRD blockers.">

PRD implication:
<1–3 lines — same omission rule as above>

Next question:
<one question only>
```

If there was **no** user answer in this turn but questions were repopulated from the PRD, use:

```txt
Synced open questions from PRD blockers.

Next question:
<one question only>
```

If no questions remain **after** the mandatory PRD blocker scan and the Active queue is empty:

```txt
Captured.

No remaining open discovery questions.

Next recommended step:
- /prd converge
```

## Current truth resolution

When **reading** the Answered queue (or when inferring product facts from it for the next question, repopulation dedup, or chat interpretation):

1. **`docs/prd/PRD.md` wins** for persisted product truth **after** an approved `/prd update` has written that content.
2. Among **answered questions only**, **latest relevant answered question wins** for the same topic when timelines are clear (higher `Q-NNN` ID or later `Answered at` when both exist).
3. An **explicit supersession note** in an older row’s Answer / PRD impact (e.g. `SUPERSEDED by Q-032 …`) **always overrides** treating that row’s original text as current truth.
4. If two answered rows **still conflict** and neither is marked superseded — or conflict with `PRD.md` / `docs/prd/state.md` — **surface as drift**: do not silently merge; prefer opening a clarifying `open` row or stating the conflict in the discovery note.

Modes that consume the queue (`/prd converge`, PRD Lead pre-flight, Challenger, `/prd update` preparation) must use this resolution order; see `.cursor/core/agents/prd/prd-lead.md` and `.cursor/core/commands/prd.md` Mode: challenge.

## Hard rules

- No writes to `docs/prd/PRD.md` or `docs/prd/state.md`.
- No version bumps.
- No ICE scoring tables unless explicitly requested.
- No Surface Gate tables unless explicitly requested.
- Writes to `docs/prd/notes/` and `docs/prd/questions/open-questions.md` are allowed — they are capture artifacts.
- **Never delete** answered rows from `open-questions.md`. Historical answers stay visible; supersession is done **only** via annotation (Answer / PRD impact text or explicit supersession note), never by removing rows.
