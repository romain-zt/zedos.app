---
name: prd-builder
description: Drives PRD discovery, feature group convergence, ICE scoring, and cross-group ranking. Produces validated feature group blocks and gated delta proposals. Only applies PRD file changes in /prd update mode after explicit human approval. Not for technical architecture, implementation, or sprint planning.
disable-model-invocation: true
---

# PRD Builder

Operational workflow for turning a product idea into a small, prioritized PRD organized into feature groups. Drives conversation toward convergence — not documentation volume.

## 1. Goal

Produce a PRD that is:

- Readable in minutes by a human
- Organized as feature groups (not flat feature lists or epics)
- Prioritized via ICE so the team knows what to build first
- Bounded by explicit Out-of-Scope and Definition of Done
- Converged — each feature group validated by the user before persistence

Anti-goal: a long, exhaustive, "complete" PRD. A bloated PRD is a failure.

## 1.5 PRD Completeness Model

`docs/prd/PRD.md` must be readable, but it must not be under-specified.

A good PRD in this workflow has two layers:

1. **Executive readability** — a human can understand the product direction in minutes.
2. **Product completeness** — the main PRD contains the global product picture, core journeys, major flows, business objects, configuration surfaces, and unresolved blockers.

The PRD must not collapse into implementation specs, tickets, architecture, database schemas, framework decisions, or sprint planning.

But it must be detailed enough that a future `/prd converge`, `/prd challenge`, `/prd prioritize`, or implementation-spec handoff can reconstruct the product without rereading every raw discovery note.

### Required global PRD sections

When enough discovery material exists, `docs/prd/PRD.md` should include:

- Product Thesis — one sentence explaining the product bet.
- Global Product Picture — how the product works end-to-end.
- Operating Model — who operates what, where, and when.
- Core User Journeys — buyer, merchant, practitioner, and admin journeys where relevant.
- Flow Inventory — all important product-level flows with actor, trigger, steps, outcome, and blockers.
- Business Objects — product-level objects such as booking, service, practitioner, slot, pack, gift card, store credit, loyalty points, order sync, notification.
- Configuration Matrix — what merchants can configure.
- Integration Boundaries — what external systems participate and what role they play.
- MVP Completeness Checklist — what must be resolved before implementation-ready status.

### Flow Inventory format

Use this format for each flow:

```md
### <Flow name>
Status: candidate | exploratory | validated-with-open-surface | validated
Actor: <buyer | merchant | practitioner | system>
Trigger: <when this flow starts>
Summary: <2-4 lines>

Flow steps:
1. <user-visible or business-level step>
2. <step>
3. <step>

Outcome:
- <observable result>

Open blockers:
- <blocker or none>

Out of scope:
- <explicit exclusion>
```

## 2. Activation

Activate when:

- The user runs `/prd discover` or asks to build/extend/start a PRD
- The user describes a product idea and wants structured capture
- The user asks to define a feature group, scope an MVP, or rank features

Do not activate for technical architecture, implementation, sprint planning, or roadmaps.

Before starting, read `docs/prd/PRD.md` and `docs/prd/state.md` (when present). If missing or empty, recommend `/prd init`. Do not initialize the PRD workspace through `/prd update`.

## Templates

Canonical template rules live in `.cursor/rules/10-prd-discovery.mdc`.

Use `.cursor/templates/prd/` as the only reusable source for generated PRD docs.
Never use `docs/**` files as templates.

## Supporting references

Read on demand — do not preload:

- `surface-gate.md` — Product Surface Gate (§3.0.5): required surface fields, output block, hard rules.
- `feature-group-template.md` — Standard/critical Feature Group template (§4): sections, requirements, status semantics.
- `ice-scoring.md` — ICE scale, formula, hard rules, staleness defaults (§5).
- `persistence.md` — Patch Intent Summary vs full PRD Delta Proposal, approval ladder, post-write format (§8).

## 2.5 Discovery Note Mode

During open discovery (`/prd discover`, `/prd note`, or informal PRD conversation), the default behavior is **capture-first**. Do not run the convergence loop. Do not score ICE. Do not ask for DoD, Out of Scope, or challenge tables. Do not propose a PRD update.

When the user gives an insight, business rule, correction, or clarification:

1. Append it to `docs/prd/notes/YYYY-MM-DD-<topic>-discovery-note.md` (format: see `.cursor/templates/prd/discovery-note.template.md`).
2. Interpret the likely product meaning — 1–3 lines.
3. Identify the PRD implication — 1–3 lines.
4. Ask **at most one** follow-up question. Stop.

**One-question rule.** Never ask more than one question at a time during discovery. Ask the single highest-leverage question and wait for the answer before asking anything else.

**Convergence is explicit.** The convergence loop (§3) activates only when the user invokes `/prd converge`, `/prd prioritize`, `/prd update`, or explicitly says "let's converge", "structure this", or "write it up". Open discovery does not auto-escalate.

## 2.6 Convergence Safety

Convergence is synthesis, not persistence.

When `/prd converge` is invoked:

1. Read discovery notes and answered questions.
2. When interpreting **Answered** queue rows, apply **Current truth resolution** (`.cursor/commands/prd-questions.md`); treat `docs/prd/PRD.md` as authoritative after persistence, prefer later answers for the same topic, and honor explicit `SUPERSEDED by Q-…` markers — do not resurrect stale answered facts.
3. Determine the converge target (see `.cursor/commands/prd.md` Mode: converge):
   - **A — Global PRD Enrichment Proposal**: if required global PRD sections are absent or TBD while notes contain relevant material.
   - **B — Feature-Group Convergence Proposal**: if the global picture is coherent and a feature group is ready to define.
   - Produce one or the other — never both in the same response.
4. For target A: propose the global sections to enrich, cite content sources, list open blockers, ask one validation question. Stop.
5. For target B: draft **at most one** primary feature group candidate, list other possible groups as **candidates only** (names, no full drafts), ask one validation question. Stop.

Do not:
- validate groups automatically
- generate multiple full feature groups in one pass
- produce a build sequence unless 3+ groups were validated in **prior separate turns**
- write files
- update `history.md` or `archive/`
- archive scaffold
- mark content as persisted
- call content "validated" unless the user **explicitly** validated it in the immediately preceding turn
- infer approval from "ok" outside the current checkpoint

**Checkpoint scope.** If the user replies "ok", that validates only the current checkpoint — not the whole PRD, not all groups, and not file persistence. If the user wants to continue, continue one checkpoint or one group at a time.

## 2.7 PRD Lead Pre-flight

`/prd converge`, `/prd prioritize`, and `/prd update` require a current PRD Lead Context Brief before PRD Builder acts.

Rules:
- On the **initial invocation** of `converge`, `prioritize`, or `update`, confirm that a PRD Lead Context Brief has been produced for this command flow (see `.cursor/agents/prd/prd-lead.md`).
- The brief is context reconstruction only — not validation, not a convergence proposal, not persistence approval.
- **Do not re-run PRD Lead** when the user responds `approved`, `preview`, or `cancel` to an existing Patch Intent Summary or PRD Delta Proposal. Those responses resume an active approval flow.
- If no brief exists and the user did not produce one earlier in the session, prompt for it before proceeding.

## 3.0 Group type

Declare at the start of each feature group. Determines required sections.

| Type | Required sections | Use when |
|---|---|---|
| `lightweight` | WHY, WHAT, Out of Scope, rough ICE, Status | Quick idea, early exploration, tangential scope |
| `standard` | Full template (`feature-group-template.md`) | Default for most feature groups |
| `critical` | Full template + Dependencies + Validation Metadata | Core user workflow, high-cost-if-wrong, blockers for other groups |

Default is `standard`. Only declare explicitly if `lightweight` or `critical`.

### Lightweight template

Used for `lightweight` groups only. Exploratory — cannot be committed without promotion to `standard` or `critical`.

```md
# <Feature Group Name>
**Type:** lightweight

## WHY
<1–3 lines: why this matters>

## WHAT
<1–3 lines: the capability in user-visible terms>

## Out of Scope
- <Explicit exclusion 1>

## ICE (rough)
<Impact>,<Confidence>,<Ease> — estimates acceptable, justify Confidence only

## Status
exploratory
```

To promote to `standard` or `critical`, complete the full template (`feature-group-template.md`) and re-run the convergence loop from §3.1.

## 3.0.5 Product Surface Gate

The Surface Gate runs before drafting WHY/WHO/WHAT/WHEN of a feature group when activation conditions in `surface-gate.md` apply. Read `surface-gate.md` for full mechanics, required fields, and the persisted Surface Block format.

In short: ask the smallest set of product-shaping questions; UNKNOWN is a valid answer; never silently infer; UNKNOWN on a required surface field caps Confidence at 4 and downgrades status from `validated` to `validated-with-open-surface`.

## 3. Convergence Loop

**Scope.** This loop applies to **Feature-Group Convergence (target B)** only. When `/prd converge` selects target A (Global PRD Enrichment Proposal), produce the enrichment proposal per `.cursor/commands/prd.md` Mode: converge — do not enter this loop.

**Activation condition.** This loop runs only when the user explicitly invokes `/prd converge`, `/prd prioritize`, `/prd update`, or says "let's converge / structure this / write it up". It does not activate during open discovery or `note` mode. See §2.5.

**Active group limit: 3 maximum** — 1 primary (actively converging), up to 2 exploratory (partially understood, explicitly tagged as `exploratory`). Committed groups are frozen and not "active."

The primary group drives the current loop. Exploratory groups may be named and partially drafted but not scored or persisted until elevated to primary. Exploratory groups dormant for more than 14 days must be re-challenged before reactivation — not resumed silently.

Avoid unlimited parallel discovery — three open fronts is already aggressive.

### 3.0 PRD Lead pre-flight

Confirm a PRD Lead Context Brief exists for this command flow (see §2.7). If missing, request it before proceeding.

### 3.1 Surface the candidate feature group

A feature group = a coherent slice of user value with a single intent. Not a theme, not a single button, not a release.

Ask: "What's the smallest user-visible capability we want to define right now?" If the user names something too large, split before proceeding.

Then run the **Product Surface Gate** (§3.0.5; full mechanics in `surface-gate.md`) if its activation conditions are met. Do not skip — false convergence almost always starts here. The gate may produce UNKNOWNs; that is fine. What is NOT fine is drafting WHY/WHO/WHAT/WHEN against silently-assumed surface.

### 3.2 Draft WHY / WHO / WHAT / WHEN

Co-write in order. 3–5 lines max each. Use the user's words. If a section can't be written without inventing facts, mark `UNKNOWN — needs <signal>` and add to Open Questions.

### 3.3 Force Out of Scope

Ask: "What is explicitly NOT part of this feature group?" Refuse to proceed with empty Out-of-Scope. A group with no exclusions is unbounded.

### 3.4 Define Definition of Done

Ask: "What's true when this is shipped?" Demand observable, user-visible conditions. Reject:

- Internal-only ("code merged")
- Aspirational ("users love it")
- Engineering-shaped ("tests pass")
- Restatements of WHAT

### 3.5 Score ICE

See `ice-scoring.md`. Capture as `Impact,Confidence,Ease`. Require a one-line justification per axis.

### 3.6 Convergence check

Run checks from §6. If any fail, loop back. Do not paper over weakness with prose.

### 3.7 Explicit user validation

Show the full feature group block (template in `feature-group-template.md`). Ask the user to validate four things, one by one:

**Validation scope — only semantic and structural changes trigger these checkpoints:**
- `cosmetic` — wording, formatting, typos. No validation required.
- `structural` — adding/removing sections, reordering. Validation required.
- `semantic` — changes to WHY, WHO, WHAT, DoD, ICE (>±1 on any axis), Out of Scope, Status. Always requires explicit validation.

1. Feature group name and intent
2. Scope (WHAT + Out of Scope)
3. ICE tuple
4. Definition of Done

Silence is NOT approval.

### 3.8 Hand off or continue

Once validated, output the feature group block and recommend either:
- `/prd update` to persist (§8 — procedural only, no new discovery)
- Continue to the next feature group (subject to active group limit in §3)

The skill never writes to `docs/prd/` inline during the convergence loop. Persistence is a separate, gated step.

## 4. Feature Group Template

Standard and critical feature groups use the exact template in `feature-group-template.md`. That document contains the full template, required-section table, common failure modes, corrections, and the four-state status semantics (`exploratory` / `validated-with-open-surface` / `validated` / `committed`).

## 5. ICE Scoring

See `ice-scoring.md` for scale, formula, display guidance, tie-break rules, hard rules (including the surface cap), and staleness defaults.

## 6. Convergence Checks

A feature group is converged when ALL of:

1. WHY, WHO, WHAT, WHEN are each ≤ 5 lines with no implementation language
2. DoD has ≥ 1 user-observable condition and zero engineering-shaped lines
3. Out of Scope has ≥ 2 explicit exclusions
4. ICE tuple exists with per-axis justification
5. No Open Question blocks Confidence ≥ 7
6. User has explicitly validated the four checkpoints in 3.7
7. Product Surface block exists; every required field (`surface-gate.md`) is either resolved or explicitly marked UNKNOWN with the cap and blocker recorded

### Implementation-readiness gate

Convergence ≠ implementation-ready. A group is **implementation-ready** only when, in addition to the 7 checks above:

- No required surface field (Buyer entry point, Buyer-facing surface, Merchant operating surface, Source of truth, Primary market / language) is UNKNOWN.
- Status is `validated` (not `validated-with-open-surface`).

If any required surface field is UNKNOWN, the group may converge to `validated-with-open-surface` and be persisted with explicit blockers — but no implementation spec, ticket, or architecture work may start from it. The user may waive a specific blocker explicitly; record the waiver in Open Questions and keep Confidence capped at 4.

If any check fails, loop back. Narrow scope — don't widen to fill weak sections.

### Drift signals

Pause and report when:

- User adds sub-features mid-loop
- Two groups describe the same user value
- Out of Scope shrinks across iterations
- DoD grows longer than WHAT
- ICE Impact rises while Out of Scope is unchanged

```
DRIFT
- Observed: <what changed>
- Risk: <what this hides>
- Options: tighten current group | split | defer addition
```

## 7. Cross-Group Ranking

After ≥ 3 feature groups are validated, produce a ranking table:

| Feature Group | I | C | E | Score | Decision |
|---|---|---|---|---|---|
| ... | 1–10 | 1–10 | 1–10 | n.nn | KEEP / DEFER / CUT / TEST-FIRST |

Plus:

- Top 3 sequencing recommendation
- Explicit cut list with reasons
- Items needing a test before honest scoring

## 8. Writing PRD Updates

`/prd update` is persistence, not discovery. Default mode is **Patch Intent Summary**, not full Before/After.

See `persistence.md` for: invariants, supersession-annotation rules, Patch Intent Summary triggers and format, full PRD Delta Proposal triggers, approval behavior (`approved` / `preview` / `cancel`, never `ok`), false-readiness guard, and post-write output format.

## 9. Collaboration

| Need | Delegate to | When |
|---|---|---|
| Global PRD coherence before major action | PRD Lead | Before `converge`, `challenge`, `prioritize`, or `update` — produce a PRD Context Brief first |
| Stress-test assumptions | Challenger | Before validating a group with weak WHY or thin evidence |
| Evidence for Confidence | Researcher | When Confidence ≥ 7 is claimed without data |
| Detect drift / inflation | Challenger | When Out of Scope shrinks or groups overlap |

The skill is the construction and persistence surface. The agents provide viewpoints. Don't replicate their work — escalate.

## 10. Anti-Patterns

| Anti-pattern | Verdict | Notes |
|---|---|---|
| Discussing implementation design | Forbidden | Frameworks, services, database structure, architecture, implementation plans |
| Avoiding operational constraints | Wrong — allowed | Operational burden, support complexity, maintenance cost, moderation load, infra constraints affecting scope realism |
| Giant questionnaire | Wrong | Discovery is conversational |
| Filling sections with prose to look complete | Wrong | Bloat ≠ clarity |
| Empty Out of Scope | Wrong | Unbounded group |
| DoD = "tests pass" / "shipped" | Wrong | Not user-observable |
| 10,10,10 ICE | Wrong | Coarse thinking |
| "We'll figure it out later" | Wrong | Becomes Open Question + lowers Confidence |
| Adding a group before current one converges | Wrong | Breaks convergence loop |
| Sprint plans, Jira tickets | Wrong | Not PRD output |
| Drafting WHY/WHO/WHAT/WHEN before running the Surface Gate | Wrong | False convergence; surface gets silently inferred |
| Marking Status `validated` while a required surface field is UNKNOWN | Forbidden | Use `validated-with-open-surface`. Misrepresenting readiness corrupts every downstream decision. |
| Lifting the Confidence cap because the group "feels right" | Wrong | The cap is mechanical — only resolution or explicit waiver lifts it |
| Proposing implementation specs from a `validated-with-open-surface` group | Forbidden | Block until surface resolves or the user waives in writing |
| Treating technical feasibility assumptions as product facts | Forbidden | Examples: "Stripe 0€ session works", "WhatsApp bot delivers all booking states", "Shopify order sync maps cleanly". Record as assumptions/risks unless verified. |
| Saying "all groups validated" when any group is `exploratory`, `validated-with-open-surface`, `unvalidated`, or `candidate` | Forbidden | Use precise status language: "candidate", "drafted", "checkpoint approved", "validated-with-open-surface", "validated", "committed" |
| Inferring "ok" as approval of the whole PRD, all groups, or file persistence | Forbidden | "ok" validates the current checkpoint only |
| Generating a build sequence before 3+ groups are validated in separate prior turns | Forbidden | Premature sequencing hides unresolved surface decisions |
| Printing full PRD content in chat before writing a low-risk patch | Wrong | Use Patch Intent Summary; full content belongs in files |
| Echoing full PRD content after writing | Forbidden | Report changed files only; the file is the source of truth |
| Showing full Before/After for scaffold-to-first-content patches when content source is already in notes or convergence | Wrong | Use Patch Intent Summary unless user explicitly replies `preview` |

## 11. Guardrails

**Anti-governance principle:**

> If governance overhead exceeds the product clarity gained, the governance system is failing.

A PRD is a coordination tool, not a ritual artifact. The goal is faster correct decisions, not more process. When the system starts feeling like work, cut a section — don't add one.

- **Chat-first.** Never write `docs/prd/` without going through the delta procedure in §8 (`persistence.md`).
- **One feature group at a time.** No parallel construction.
- **Explicit validation.** The four checkpoints in 3.7 are required every time.
- **No technical content.** Defer implementation discussion.
- **Respect persisted state.** Read `PRD.md` and `state.md` before extending.
- **Honor SISO.** RED/ORANGE input → clarify before constructing.
- **Smaller wins.** When in doubt, cut.

## 12. PRD Convergence

The PRD is considered converged when:

- Core user workflow is defined
- Top feature groups are validated (ICE scored, DoD set, Out of Scope explicit)
- Out-of-scope is explicit at both feature-group and PRD level
- First implementation sequence is clear (top 3 from cross-group ranking)
- Open questions no longer block MVP execution

At this point: stop discovery, freeze PRD direction, transition to specs/implementation. The PRD Builder skill is no longer the active workflow — further changes require a deliberate `/prd update` with a version bump rationale.

A PRD that never converges is not a PRD — it's a brainstorm.

## 13. Handoff to Feature Area Workflow

PRD Builder owns PRD discovery, convergence, and PRD-level Feature Groups. Its scope ends at the product definition layer.

**Feature Area Workflow** (`.cursor/rules/feature-area-workflow.mdc`) owns execution decomposition: converting PRD Feature Groups into Feature Areas, decomposing Feature Areas into Scope Slices, and advancing Scope Slices toward user stories.

### What PRD Builder must NOT do

PRD Builder must never:

- Create Feature Area files (`docs/product/feature-areas/`)
- Create Scope Slice files (`docs/product/scope-slices/`)
- Write user stories, specs, or tasks
- Decompose a PRD Feature Group into Scope Slices directly (without Feature Area decomposition)
- Use "Feature Group" naming in `docs/product/` artifacts

### When to hand off

Hand off when any of:

- The PRD has converged (§12) and the next step is execution planning
- A PRD Feature Group is too broad to yield Scope Slices without Feature Area decomposition first
- The user asks to start building, planning, or decomposing product scope into work

### How to hand off

State explicitly:

```txt
PRD Feature Group "<name>" is at product-scope convergence.
Execution decomposition requires Feature Area Workflow.

Next step: read `.cursor/rules/feature-area-workflow.mdc` and convert this
Feature Group into Feature Areas before creating any Scope Slices.
```

Do not perform the decomposition. Route clearly and stop.
