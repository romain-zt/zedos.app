# /prd — PRD Discovery Orchestrator

> **Tier note:** planning and authoring in this command stay in Manager context. Any code or scaffold side-effects must be delegated via `Task(subagent_type: "executor")`. See `.cursor/core/skills/tier-enforcement/SKILL.md`.

## Usage

```txt
/prd <mode> [optional context]
```

## Modes

| Mode | Lead | Purpose |
|------|------|---------|
| `init` | PRD Bootstrap | Initialize missing docs workspace from `.cursor/core/templates/prd/` |
| `discover` | PRD Builder skill | Open product discovery, free-form capture |
| `questions` | PRD Question Loop | Ask the next unresolved discovery question |
| `note` | PRD Question Loop | Capture one insight as a discovery note, update question queue |
| `converge` | PRD Lead → PRD Builder skill | Reconstruct product context, then synthesize notes into a proposed PRD delta |
| `challenge` | PRD Lead → Challenger agent | Reconstruct product context, then stress-test assumptions, scope, drift |
| `prioritize` | PRD Lead → PRD Builder skill | Reconstruct product context, then re-rank feature groups using ICE |
| `update` | PRD Lead → PRD Builder skill | Reconstruct product context, then persist an approved delta |

If no mode is given:

1. If `docs/prd/questions/open-questions.md` exists and has an open question, treat the user input as an answer to the current highest-priority open question and run `questions` mode.
2. If the user input looks like a new product insight, correction, or founder note, run `note` mode.
3. If neither applies, ask which mode the user wants.

## Templates

Canonical template rules live in `.cursor/core/rules/10-prd-discovery.mdc`.

Use `.cursor/core/templates/prd/` as the only reusable source for generated PRD docs.
Never use `docs/**` files as templates.

## Pre-flight

1. Before reading `docs/prd/PRD.md` or `docs/prd/state.md`, if either file is missing or empty, suggest `/prd init` instead of assuming the PRD exists.
2. Read `docs/prd/PRD.md` — the active PRD.
3. Read `docs/prd/state.md` — version, direction, last major change.
4. **PRD Lead pre-flight (converge / challenge / prioritize / update only):** On the **initial invocation** of any of these modes, invoke the PRD Lead agent (`.cursor/core/agents/prd/prd-lead.md`) to produce a PRD Context Brief. The mode's lead agent acts only after the brief is available. Skip for `init`, `discover`, `questions`, and `note`. **Do not run pre-flight again when the user responds `approved`, `preview`, or `cancel` to an existing Patch Intent Summary or PRD Delta Proposal** — those responses resume an active approval flow and must not be interrupted.
5. **SISO classification for `/prd update`:** `/prd update` is a structured persistence workflow — not implementation, specs, tickets, or architecture. SISO must not block it as execution. It still requires explicit persistence approval through a Patch Intent Summary or full PRD Delta Proposal (see Mode: update below). In `discover`, `note`, `questions`, and `converge`, all user input is treated as raw discovery material. Never return SISO ORANGE or RED for a product insight given during discovery.

## Mode: init

Initialize or repair the `docs/` PRD workspace from `.cursor/core/templates/prd/`.

- Create missing directories and missing/empty files.
- Never overwrite non-empty project docs.
- Use only `.cursor/core/templates/prd/` as the canonical source.
- Do not run discovery or convergence.

See `.cursor/core/commands/prd-init.md` for the full spec.

## Mode: discover

Open-ended capture. Every user input is treated as a meeting note, not an execution request.

Default behavior per user input:
1. Append insight to `docs/prd/notes/YYYY-MM-DD-<topic>-discovery-note.md` (format: see `.cursor/core/templates/prd/discovery-note.template.md`). Update `docs/prd/questions/open-questions.md` if the insight opens or answers a question.
2. Interpret the likely product meaning in 1–3 lines.
3. Identify the PRD implication in 1–3 lines.
4. Ask **one** follow-up question. Stop.

Do not run the Surface Gate, ICE scoring, DoD, Out-of-Scope, or convergence checks during open discovery. Do not propose a PRD update.

If no direction exists, open with one orienting question — do not launch the full Surface Gate.

**Discovery response shape:**

```txt
Captured as discovery note.

Interpreted insight:
<1–3 lines>

PRD implication:
<1–3 lines>

One question:
<single question, or "None">
```

## Mode: questions

Human-first discovery loop driven by `docs/prd/questions/open-questions.md`.

See `.cursor/core/commands/prd-questions.md` for the full spec. Short version:

1. Read `docs/prd/PRD.md`, `docs/prd/state.md`, `docs/prd/questions/open-questions.md`, and the latest relevant discovery note (see `prd-questions.md` Pre-flight).
2. If the Active queue has no `open` rows, **mandatorily scan** `docs/prd/PRD.md` for unresolved blockers (sections and triggers listed in `prd-questions.md`). Append deduplicated `open` rows to `open-questions.md` for each gap not already in the queue.
3. Find the highest-priority `open` question (lowest priority number, then lowest ID).
4. Ask **only that one question**. No table. No summary.
5. Do not write to `PRD.md`. Do not run convergence, ICE, or Surface Gate.
6. After the user answers, update the discovery note and question file (including **Superseded answered questions** annotations when the answer overrides earlier Answered rows — see `.cursor/core/commands/prd-questions.md`), then repeat from step 2.
7. Recommend `/prd converge` **only when** the Active queue has no `open` rows **and** the mandatory PRD blocker scan finds nothing that requires a new question.
8. Never instruct the user to manually repopulate blockers via `/prd note`.

## Mode: note

Capture user input as a discovery note and update the question queue.

1. Append the raw input to the active discovery note (`docs/prd/notes/YYYY-MM-DD-<topic>-discovery-note.md`).
2. Interpret the likely product meaning in 1–3 lines.
3. Identify the PRD implication in 1–3 lines.
4. If the input opens or answers a question, update `docs/prd/questions/open-questions.md` (including **Superseded answered questions** handling when the insight contradicts an earlier Answered row — see `.cursor/core/commands/prd-questions.md`).
5. Ask **one** follow-up question maximum. Stop.

Do not propose PRD updates.

## Mode: converge

Synthesis mode only. No file writes.

`/prd converge` produces **exactly one** of two outputs per invocation — not both:

### A. Global PRD Enrichment Proposal

Used when `docs/prd/PRD.md` is missing one or more global product completeness sections (Global Product Picture, Operating Model, Core User Journeys, Flow Inventory, Business Objects, Configuration Matrix, Integration Boundaries, MVP Completeness Checklist), **and** discovery notes contain enough material to propose content for at least one of them.

### B. Feature-Group Convergence Proposal

Used after the global product picture is coherent enough to define one feature group at a time.

**Target selection rule:**
- If any required global section is absent or contains only TBD/scaffold content while discovery notes contain relevant material → prefer **A (Global PRD Enrichment Proposal)**.
- If the global picture is coherent and the user names or implies a feature group to define → use **B (Feature-Group Convergence Proposal)**.
- Never produce both in the same response.

`/prd converge` **may not**:
- write files
- update `PRD.md`, `state.md`, `history.md`, or `archive/`
- mark groups as `validated` or `committed`
- generate implementation specs, tickets, or architecture
- produce a full multi-group PRD in one pass
- produce a build sequence unless **at least 3 feature groups were explicitly validated in separate prior turns**

`/prd converge` **may**:
1. Read `docs/prd/PRD.md`, `docs/prd/state.md`, `docs/prd/notes/`, and `docs/prd/questions/open-questions.md`.
2. Synthesize the latest discovery into a proposal, applying **Current truth resolution** when interpreting **Answered** queue rows (see `.cursor/core/commands/prd-questions.md`) so superseded answers are not revived as current facts.
3. Produce either:
   - one **Global PRD Enrichment Proposal** (target A), OR
   - one **Primary Feature Group Candidate** with other candidate groups listed by name only (target B)
4. Identify open blockers and assumptions.
5. Ask **exactly one** validation question.
6. Stop.

**Required output format — Global PRD Enrichment Proposal (target A):**

```txt
Global PRD Enrichment Proposal

1. Synthesized global picture
<short synthesis>

2. Proposed PRD sections to enrich
- <section>
- <section>

3. Content sources
- <notes/questions/decisions used>

4. Open blockers / unresolved details
- <blocker>

5. Safety
- no implementation specs
- no architecture
- no tickets
- no build sequence unless allowed by existing rules
- no status promoted to validated or committed

6. One validation question
<one question only>
```

**Required output format — Feature-Group Convergence Proposal (target B):**

```txt
Convergence Proposal

1. Synthesized insight
<short synthesis>

2. Proposed PRD change
<what would change, but not written>

3. Primary feature group candidate
<one feature group max, draft or summary>

4. Other candidate groups
<names only, no full drafts>

5. Open blockers / assumptions
<short list>

6. One validation question
<one question only>
```

**Hard rule:** The words "validated", "committed", "ready to persist", or "ready to build" must not appear in a converge response unless the user explicitly validated the required checkpoint in the **immediately preceding turn**.

## Mode: challenge

Challenger leads. Reads active PRD and recent discussion. Produces: assumption → risk → test or kill criterion. Flags drift against state.md. Researcher labels evidence quality. No file writes.

**False-convergence checks are mandatory** (see `prd-challenger.md`). For each non-`exploratory` group, Challenger verifies that buyer entry point, buyer-facing surface, merchant operating surface, source of truth, market/language, and confirmation channel are explicitly resolved or marked UNKNOWN with the Confidence cap applied. Any hidden surface assumption — including implementation language smuggled into product wording — is reported as `FALSE CONVERGENCE RISK`.

### Default challenge scope

Every `/prd challenge` run must check **all** of the following, regardless of what the user wrote in the prompt:

**1. Readiness inflation**
Flag when the PRD overstates readiness — e.g. "product surface resolved" while blockers remain in open questions, surface fields are UNKNOWN, or no feature group has passed the Surface Gate. Do not accept clean prose as a proxy for resolved decisions.

**2. Silent decision propagation**
Flag any journey, flow, business object, checklist item, or feature group that implicitly assumes an unresolved decision. Example: a journey titled "Buyer cancels booking" while the cancellation initiator (buyer-only? merchant-only? both?) is still undefined in open questions or marked UNKNOWN.

**3. Nice-to-have contamination in MVP Completeness Checklist**
Scan the MVP Completeness Checklist. Any item that is a nice-to-have (deferred, optional, or not tied to a validated v1 user need) must either be removed from the checklist or explicitly promoted to v1 scope with justification. Flag every contaminated item.

**4. Missing or vague success metrics**
If success metrics are absent or defined as "users are happy" / "adoption grows" / unmeasurable proxies, flag ICE scoring as unreliable. Confidence scores based on missing metrics must be reduced.

**5. Absent monetization model**
If pricing, revenue model, or monetization approach is not defined, flag Impact scoring and scope tradeoffs as weak. A product with no monetization model cannot reliably score Impact.

**6. Scope inflation relative to unresolved blockers**
If v1 scope is wide while open questions remain, flag scope inflation. Produce a cut/defer list: for each feature group or checklist item, recommend `cut`, `defer`, or `keep with constraint` with an explicit reason.

**7. External platform assumptions treated as facts**
Flag any assumption about an external platform that has not been validated. Specific examples to probe:
- Stripe embedded iframe / nested iframe behavior within Shopify
- Shopify iframe / CSP constraints on embedded apps
- Shopify webhook coverage for booking-relevant events
- Shopify gift card API limitations
- Shopify Order API assumptions (what it can and cannot store)
- SMS/email provider deliverability and opt-in compliance assumptions

For each, state why it matters and what validation is needed before it can be treated as resolved.

**8. Build-blocking unknowns without a next PRD action**
Every open question that blocks a feature group from progressing must have an assigned next PRD action: `/prd questions`, `/prd update`, `/prd converge`, or explicit external validation. Flag any blocker that has no assigned action.

**9. Stale answered-question contradictions**
Apply **Current truth resolution** (`.cursor/core/commands/prd-questions.md`). Flag when incompatible implications remain across **Answered** rows without clear temporal/supersession ordering — especially when an older row still reads as definitive.

**10. Answered queue conflicts with PRD.md or state.md**
Flag when persisted `docs/prd/PRD.md` or `docs/prd/state.md` disagrees with facts implied by **Answered** queue cells that lack a supersession annotation or that were never reconciled after `/prd update`.

**11. Missing supersession markers**
Flag when later discovery (newer answered row, discovery note, or persisted PRD change) **changes, narrows, or contradicts** an earlier **Answered** row but that older row was **not** annotated (e.g. `SUPERSEDED by Q-NNN …`). Recommend `/prd questions` (capture pass) or annotating via the next `/prd update` per orchestrator rules — never silent merge.

### Required output format

Every `/prd challenge` response must use this format exactly:

```txt
Challenge Report

1. Readiness verdict
<one of: not ready for feature-group convergence | ready for feature-group convergence with blockers | ready for prioritize | ready for update>

2. False-convergence risks
- <risk or none>

3. Product-surface contradictions
- <contradiction or none>

4. Scope realism
- <main scope issue>
- Recommended cuts / deferrals:
  - <item> — <cut | defer | keep with constraint> — <reason>

5. Missing decision anchors
- Success metrics: <ok | missing | weak>
- Monetization model: <ok | missing | weak>
- Primary v1 pilot constraint: <ok | missing | weak>

6. External platform assumptions to validate
- <assumption> — <why it matters> — <validation needed>

7. Required product questions before next convergence
- <question>

8. Recommended next command
/prd questions | /prd update | /prd converge | /prd prioritize
```

No file writes. Do not propose implementation, architecture, or code inside a challenge response.

## Mode: prioritize

PRD Builder skill enumerates feature groups and scores each on ICE:

- **Impact** (1–10): user + business value
- **Confidence** (1–10): evidence quality (not enthusiasm)
- **Ease** (1–10): realistic cost, inverted (10 = trivial)

Formula: `score = Impact × Confidence × Ease / 100` (max 10.0).

Output: ranked table with KEEP / DEFER / CUT / TEST-FIRST decisions + explicit cut list. No file writes.

## Mode: update

`/prd update` is the only mode allowed to write `docs/prd/PRD.md`, `docs/prd/state.md`, `docs/prd/history.md`, or `docs/prd/archive/`. All other modes must not write to those files. Discovery modes (`discover`, `note`, `questions`) may write to `docs/prd/notes/` and `docs/prd/questions/` — those are capture artifacts (see Discovery artifacts below).

When `/prd update` persists a PRD change that **supersedes** facts previously captured in older **Answered** rows, also update `docs/prd/questions/open-questions.md` **as a capture artifact only**: annotate those older rows (Answer / PRD impact) with a supersession pointer to the governing source (`PRD.md` after write and/or the newer `Q-NNN`). **Never delete** historical Answered rows. This annotation does **not** count as PRD persistence and does **not** require a version bump — include `docs/prd/questions/open-questions.md` in the Patch Intent Summary’s **Files to change** when applicable.

`/prd update` is a structured persistence workflow. It is not implementation, specs, tickets, or architecture — SISO must not block it. It still requires explicit persistence approval through a Patch Intent Summary or full PRD Delta Proposal.

### Default: Patch Intent Summary

For low-risk patches where **all** of the following are true, produce a **Patch Intent Summary** instead of a full PRD Delta Proposal:

- Content to persist is already present in prior discovery notes, answered questions, or the immediately preceding convergence proposal.
- The update is a PRD/status/state patch, not a version bump.
- No group is being promoted to `committed`.
- No implementation specs, tickets, architecture, or code will be created.
- `history.md` and `archive/` will not be touched.
- The patch can be applied mechanically from existing project context.

**Patch Intent Summary format:**

```txt
Patch Intent Summary

Files to change:
- docs/prd/PRD.md — <short description>
- docs/prd/state.md — <short description>
- docs/prd/questions/open-questions.md — <only when supersession annotations are required — short description>

Files not touched:
- docs/prd/history.md
- docs/prd/archive/
- docs/prd/notes/
- docs/prd/questions/open-questions.md — <omit this line when it appears under Files to change>
- docs/product-decisions/

Patch type:
- patch | version bump

Content source:
- <notes file / answered questions / convergence proposal / user-approved checkpoint>

Safety:
- no status promoted to committed
- no implementation specs/tickets/architecture
- no history/archive update
- unresolved blockers remain listed
- answered-queue rows are never deleted — supersession annotations only

Approval required:
Reply `approved` to apply.
Reply `preview` to see the full before/after diff first.
```

**Hard rule:** Do not print full PRD sections in chat during Patch Intent Summary mode.

### When to use full PRD Delta Proposal

Use a full PRD Delta Proposal with exact Before/After only when:

- User explicitly replies `preview`
- Version bump
- `history.md` or `archive/` will be touched
- Deleting existing content
- Replacing an already active non-scaffold PRD section
- Promoting status to `validated`, `committed`, or implementation-ready
- Changing ICE by more than ±1
- Changing source of truth, buyer surface, merchant surface, payment model, or market/language after they were already persisted
- User explicitly asks to review exact wording before write

Otherwise, prefer Patch Intent Summary.

### Approval behavior

If the previous assistant turn contained a **Patch Intent Summary**:
- `approved` — apply the patch described in the summary
- `preview` — show the full PRD Delta Proposal with exact Before/After
- `cancel` — stop the update

If the previous assistant turn contained a **full PRD Delta Proposal**:
- `approved` — apply the exact delta

Never accept `ok` alone as persistence approval.

If no Patch Intent Summary or PRD Delta Proposal exists in the immediately preceding turn, respond:

```txt
No Patch Intent Summary or full PRD Delta Proposal exists yet.

Run `/prd update` with a clear persistence target, or run `/prd converge` first if the content has not been synthesized yet.
```

### Output after writing

After `approved`, write files immediately. Do not reprint the full written content.

**Final response format:**

```txt
Updated:
- <file> — <short change>
- <file> — <short change>

Not touched:
- <file/group>
- <file/group>

Remaining open questions:
- <Q-ID if any> — <question>
or
- None

Next recommended command:
- /prd questions | /prd challenge | /prd converge | /prd prioritize
```

**Hard rule:** Do not echo full PRD content after writing. The file is the source of truth.

### Procedure

0. **PRD Lead pre-flight** — on initial invocation, PRD Lead produces the PRD Context Brief (see Pre-flight step 4). PRD Builder skill acts after the brief is available. Skip on `approved`, `preview`, or `cancel` responses.
1. PRD Builder skill assesses whether Patch Intent Summary or full PRD Delta Proposal is required (see rules above).
2. Produce the appropriate format and wait for approval.
3. Challenger verifies every addition has a paired cut, deferral, or kill criterion.
4. **Surface readiness check** — for any group whose Status is being written or promoted:
   - If any required surface field (buyer entry point, buyer-facing surface, merchant operating surface, source of truth, market/language) is UNKNOWN, Status MUST be `validated-with-open-surface` (not `validated`, not `committed`) and the `Surface Blockers` list MUST be persisted verbatim.
   - Confidence in the persisted ICE tuple MUST respect the surface cap (≤ 4 when applicable).
   - A promotion to `validated` or `committed` requires written confirmation that all required surface fields are resolved.
5. On `approved`, apply the smallest edit. Output only the compact final response format — do not echo file content. If version bump: add a row to `docs/prd/history.md`, copy current PRD.md to `docs/prd/archive/PRD-v<N>.md`, then update PRD.md + state.md. When the persisted delta supersedes older **Answered** queue facts, apply matching **supersession annotations** to `docs/prd/questions/open-questions.md` in the same approval (capture artifact only; never delete rows).

**A PRD patch is not a version bump.** Do not write `docs/prd/history.md` or `docs/prd/archive/` for a patch unless the user explicitly approved those files.

## Discovery artifacts

Writes to `docs/prd/notes/` and `docs/prd/questions/open-questions.md` are **capture artifacts** — they are allowed in `discover`, `note`, and `questions` modes and must not be blocked by SISO. They are not PRD persistence and do not trigger version bumps.

During `/prd update`, edits to `open-questions.md` are limited to **supersession annotations** (and similar reconciliation markers) when persisted PRD changes override older answered-queue facts — still capture artifacts, not a substitute for `PRD.md`.

## Hard rules

- Chat-first, deltas over rewrites.
- No technical architecture or implementation.
- No writes to `PRD.md`, `state.md`, or `history.md` outside `update` mode.
- No version bumps without the triggers in `10-prd-discovery.mdc`.
- Drift between conversation and state.md is surfaced, not silently absorbed.
- Never delete **Answered** rows in `docs/prd/questions/open-questions.md`; supersede via annotation only (see `.cursor/core/commands/prd-questions.md`).
- No persistence of `validated` / `committed` while required surface fields are UNKNOWN. Use `validated-with-open-surface` and persist the blockers.
- No implementation specs, tickets, or architecture work derived from a `validated-with-open-surface` group unless the user has explicitly waived the specific blocker in writing.
