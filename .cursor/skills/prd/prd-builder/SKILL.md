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
| `standard` | Full template | Default for most feature groups |
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

To promote to `standard` or `critical`, complete the full template in section 4 and re-run the convergence loop from section 3.1.

## 3.0.5 Product Surface Gate

The most dangerous failure mode of this system is **false convergence**: a clean-looking feature group that hides unresolved product-surface decisions. Surface decisions silently determine scope, dependencies, build cost, and what "done" even means. AI-generated PRD prose is especially good at making absent decisions look present.

The Surface Gate runs *before* the first feature group is drafted for a new PRD, and *again* whenever a feature group surfaces a surface ambiguity that the current PRD has not resolved.

### When to run the gate

The gate does **not** fire during open discovery (`/prd discover`, `/prd note`) or informal PRD conversation. It fires only in `converge`, `prioritize`, and `update` modes, or when the user explicitly asks to validate a feature group.

Within those modes, run the gate before drafting the first WHY/WHO/WHAT/WHEN of a feature group when **any** of:

- `docs/prd/state.md` has no `DIRECTION` set, or it is the scaffold value
- `docs/prd/PRD.md` has no validated feature group yet
- The candidate group introduces a new buyer surface, merchant surface, market, or source-of-truth not already established in the PRD
- Challenger has flagged a `FALSE CONVERGENCE RISK` against the current direction

If none apply, skip the gate — the surface is already established.

### Required surface fields

Ask only the smallest set of product-shaping questions. One short answer per field, or `UNKNOWN — decision needed before implementation`. Never silently infer.

| Field | Question | Why it matters |
|---|---|---|
| Primary market / language | Which market and language is v1 for? | Determines copy, legal, payment rails, support load |
| Buyer entry point | Where does the buyer first encounter the product? | Distribution surface (Shopify page, embed, standalone, link, WhatsApp, …) |
| Buyer-facing surface | Where does the buyer complete the action? | Same surface as entry, or a handoff? |
| Merchant operating surface | Where does the merchant operate it? | Shopify admin, separate admin, calendar, email-only, manual |
| Source of truth (after success) | Which system holds the canonical record after a successful action? | Booking record, Shopify order, calendar event, payment, customer record |
| Confirmation channel | How does the buyer know it worked? | On-screen, email, SMS, WhatsApp, dashboard |
| Payment model (if money) | Deposit, full prepayment, post-pay, free, merchant-configurable? | Determines refund logic, dispute surface, risk |
| Hard v1 exclusions | What surfaces / markets / models are explicitly out of v1? | Caps scope drift |

### Output: Surface Block

Produce one block per gate run. Persisted as part of the active PRD (under "Product Surface" or per feature group, depending on scope).

```md
## Product Surface

- Primary market / language: <answer | UNKNOWN — decision needed before implementation>
- Buyer entry point: <…>
- Buyer-facing surface: <…>
- Merchant operating surface: <…>
- Source of truth: <…>
- Confirmation channel: <…>
- Payment model: <… | n/a>
- Hard v1 exclusions: <list>

## Surface Blockers
- <field>: <what decision is missing> — blocks: <implementation specs | this feature group | none>
```

### Hard rules

- **The gate does not block discussion.** UNKNOWN is a valid, expected answer. Surface ambiguity must be made visible, not resolved by inference.
- **The gate does block implementation readiness.** See section 6 (convergence checks) and section 8 (persistence).
- **Confidence cap.** If `Buyer entry point`, `Buyer-facing surface`, `Merchant operating surface`, `Source of truth`, or `Primary market / language` is UNKNOWN, ICE Confidence for any feature group depending on that field is **capped at 4** (see section 5).
- **No giant questionnaire.** Ask only fields that materially affect the next decision. Skip `Payment model` if money is not in scope. Group fields the user can answer in one breath.
- **No silent inference.** If the user says "I don't know", write `UNKNOWN — decision needed before implementation`. Do not pick the most plausible answer "for now".

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

Then run the **Product Surface Gate** (section 3.0.5) if its activation conditions are met. Do not skip — false convergence almost always starts here. The gate may produce UNKNOWNs; that is fine. What is NOT fine is drafting WHY/WHO/WHAT/WHEN against silently-assumed surface.

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

See section 5. Capture as `Impact,Confidence,Ease`. Require a one-line justification per axis.

### 3.6 Convergence check

Run checks from section 6. If any fail, loop back. Do not paper over weakness with prose.

### 3.7 Explicit user validation

Show the full feature group block (section 4 template). Ask the user to validate four things, one by one:

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
- `/prd update` to persist (section 8 — procedural only, no new discovery)
- Continue to the next feature group (subject to active group limit in section 3)

The skill never writes to `docs/prd/` inline during the convergence loop. Persistence is a separate, gated step.

## 4. Feature Group Template

Standard and critical feature groups use this exact template:

```md
# <Feature Group Name>

## WHY
<3–5 lines: user/business reason. No solutioning.>

## WHO
<Target users — specific roles or segments. Not "everyone".>

## WHAT
<3–5 lines: the capability in user-visible terms. Verbs over nouns.>

## WHEN
<Trigger/context: when in the user's workflow does this matter?>

## Product Surface
<Inherit from PRD-level Surface block, OR list overrides for this group.
Required fields (see section 3.0.5). Use `inherits PRD` if no override.
Any UNKNOWN field caps Confidence at 4 and blocks implementation specs.>

## Definition of Done
- <Observable, user-visible condition 1>
- <Observable, user-visible condition 2>

## ICE
<Impact>,<Confidence>,<Ease>

Impact: <one line>
Confidence: <one line>
Ease: <one line>

Why Confidence is not higher: <required>
What would invalidate this: <required>

## Dependencies
- <Other feature group or external dependency — or "None">

## Out of Scope
- <Explicit exclusion 1>
- <Explicit exclusion 2>

## Open Questions
- <Unresolved question blocking confidence>

## Status
exploratory | validated-with-open-surface | validated | committed

## Validation Metadata
Last validated: YYYY-MM-DD
Stale after: YYYY-MM-DD
```

| Section | Required | Common failure | Correction |
|---|---|---|---|
| WHY | yes | Restates WHAT | Force "so that <outcome>" clause |
| WHO | yes | "All users" | Demand a role or segment |
| WHAT | yes | Implementation language | Strip frameworks and services |
| WHEN | yes | Vague ("anytime") | Anchor to a user moment |
| Product Surface | yes | Silently inferred / missing | Run Surface Gate (3.0.5); UNKNOWN is allowed, silent inference is not |
| DoD | yes | Engineering-shaped | Reject; rewrite as user-observable |
| ICE | yes | Fake confidence | See section 5 |
| Dependencies | optional | Hides scope creep | Each dep must be defined or external |
| Out of Scope | yes | Empty | Block until ≥2 exclusions |
| Open Questions | optional | Dumping ground | Flag if it blocks Confidence ≥ 7 |
| Status | yes | Never updated; `validated` claimed while surface UNKNOWN | Use `validated-with-open-surface` when surface fields are UNKNOWN; update at every /prd update pass |
| Validation Metadata | required for validated/committed | Missing on critical groups | Add at first /prd update after initial draft |

### Status semantics

| Status | Means | May proceed to |
|---|---|---|
| `exploratory` | Shape under discussion; not user-validated | further discovery; not persistence as ready |
| `validated-with-open-surface` | User value, WHAT, DoD agreed; one or more required surface fields are UNKNOWN | persistence (with explicit blockers listed); NOT implementation specs |
| `validated` | All convergence checks pass AND all required surface fields resolved | persistence; implementation specs |
| `committed` | `validated` + the team has decided to build it | implementation |

A group cannot skip from `exploratory` to `committed`. A group cannot be `validated` while any required surface field is UNKNOWN — downgrade to `validated-with-open-surface` instead.

## 5. ICE Scoring

Captured as a flat tuple: `Impact,Confidence,Ease` (e.g. `8,6,7`).

### Scale (1–10 each)

| Axis | 1 | 5 | 10 |
|---|---|---|---|
| **Impact** | Marginal value | Solid value for a real segment | Game-changer for the core problem |
| **Confidence** | Pure guess | Reasonable inference, weak data | Validated with direct user evidence |
| **Ease** | Massive cost, deep unknowns | Real work, known approach | Trivial to ship and operate |

### Formula

```
score = Impact × Confidence × Ease / 100
```

Max score: 10.0. Typical honest range: 0.5–5.0.

Why multiplicative: a weakness in ANY axis drags the entire score down. Low Confidence (C=3) cuts the score by 70% regardless of Impact. High Ease cannot compensate for low Impact.

### Display guidance

The ICE **tuple** (`8,6,7`) is the canonical artifact stored in the PRD and used in discussion. Humans reason well about individual axis values.

The **composite score** (`I × C × E / 100`) is used only for ranking across feature groups (section 7). Do not use the composite score in conversation — it obscures the reasoning. When discussing priority, talk about the axes: "Impact is high but Confidence is low — we need a test before committing."

Never let a single number replace the three-axis discussion.

### Tie-break

Higher Ease first (cheaper to validate), then higher Confidence.

### Hard rules

- Reject any axis at 9–10 without evidence-rooted justification.
- If Confidence ≤ 4, propose the cheapest test that would raise it before recommending build.
- If Ease ≥ 9, ask: "What's the hidden cost — operations, support, edge cases?"
- Never accept 10,10,10.
- Default Confidence for new ideas: 3–4.
- Confidence ≥ 7 requires evidence from Researcher.
- Ease ≥ 8 requires challenge from Challenger.
- "Why Confidence is not higher" and "What would invalidate this" are required in every ICE block. An ICE block without them is not scored.
- Default Confidence for new ideas with no user evidence: 3 (not 5, not 7).
- **Surface cap.** If any of `Buyer entry point`, `Buyer-facing surface`, `Merchant operating surface`, `Source of truth`, or `Primary market / language` is UNKNOWN for this group (per section 3.0.5), Confidence is capped at **4** regardless of evidence quality. The cap is lifted only when the surface field is resolved or the user explicitly waives the uncertainty in writing (recorded in Open Questions).

### Staleness defaults

| Status | Confidence half-life | Stale after |
|---|---|---|
| `exploratory` | 14 days | 14 days from last validated |
| `validated` | 45 days | 45 days from last validated |
| `committed` | 90 days | 90 days from last validated |

A stale group must be re-challenged by Challenger before prioritization or implementation. Do not silently resume stale groups.

## 6. Convergence Checks

A feature group is converged when ALL of:

1. WHY, WHO, WHAT, WHEN are each ≤ 5 lines with no implementation language
2. DoD has ≥ 1 user-observable condition and zero engineering-shaped lines
3. Out of Scope has ≥ 2 explicit exclusions
4. ICE tuple exists with per-axis justification
5. No Open Question blocks Confidence ≥ 7
6. User has explicitly validated the four checkpoints in 3.7
7. Product Surface block exists; every required field (3.0.5) is either resolved or explicitly marked UNKNOWN with the cap and blocker recorded

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

`/prd update` is persistence, not discovery.

Default persistence mode is **Patch Intent Summary**, not full Before/After.

**PRD Lead pre-flight**: confirm a PRD Lead Context Brief exists for this `/prd update` flow (see §2.7) before assessing Patch Intent Summary vs. full PRD Delta Proposal. Do not re-run on `approved`, `preview`, or `cancel`.

### Invariants

- Only persist content that comes from prior discovery notes, answered questions, or an explicit convergence/checkpoint output.
- Do not invent, improve, expand, or editorialize content during persistence.
- Do not discover new content during `/prd update`.
- If new content appears during update, stop and route it to `/prd note` or `/prd converge`.
- Never treat `ok` as persistence approval.
- Never echo full PRD content after writing.
- The PRD file is the document surface; chat is the approval/control surface.

### Answered-queue supersession annotations (`open-questions.md`)

When the persisted PRD/`state.md` delta **supersedes** facts implied by older **Answered** rows, apply matching annotations in `docs/prd/questions/open-questions.md` in the **same** approved write batch (capture artifact only — not a version bump). Edit **Answer** and/or **PRD impact** cells only; use explicit supersession wording per `.cursor/commands/prd-questions.md` (e.g. pointer to newer `Q-NNN` or “persisted PRD”). **Never delete** answered rows.

Include `docs/prd/questions/open-questions.md` under Patch Intent Summary **Files to change** when those annotations are needed; omit when no older answered facts are overridden.

### Default: Patch Intent Summary

Use Patch Intent Summary when all are true:

- content source is prior discovery notes, answered questions, or the immediately preceding convergence proposal
- no version bump
- `history.md` and `archive/` will not be touched
- no content is being deleted
- no group is being promoted to `validated`, `committed`, or implementation-ready
- no risky surface change after persistence
- no implementation specs, tickets, architecture, dependency changes, terminal commands, or code

Patch Intent Summary must be specific enough for approval but must not duplicate full PRD content.

Format:

```txt
Patch Intent Summary

Files to change:
- <file> — <short change>

Files not touched:
- <file/group>

Patch type:
- patch

Content source:
- <notes/questions/convergence/checkpoint>

Safety:
- no status promoted to committed
- no implementation specs/tickets/architecture
- no history/archive update
- unresolved blockers remain listed

Approval required:
Reply `approved` to apply.
Reply `preview` to see the full before/after diff first.
Reply `cancel` to stop.
```

### Full PRD Delta Proposal

Use full Before/After only when:

- user replies `preview`
- version bump
- `history.md` or `archive/` will be touched
- deleting existing content
- replacing already active non-scaffold PRD sections
- promoting status to `validated`, `committed`, or implementation-ready
- changing ICE by more than ±1
- changing source of truth, buyer surface, merchant surface, payment model, or market/language after persistence
- user explicitly asks to review exact wording before write

### Approval behavior

If previous assistant turn contained Patch Intent Summary:

- `approved` applies the summarized patch
- `preview` shows exact Before/After
- `cancel` stops

If previous assistant turn contained full PRD Delta Proposal:

- `approved` applies the exact delta

No Patch Intent Summary or full PRD Delta Proposal in the immediately preceding assistant turn means no write is allowed.

### False-readiness guard

A persistence update must never make a feature group look more ready than it is.

- If required surface fields are UNKNOWN, status must not be `validated` or `committed`.
- Use `validated-with-open-surface` only when user value/scope is agreed but surface blockers remain.
- Do not create implementation specs, tickets, or architecture from `validated-with-open-surface`.
- Do not promote anything to `committed` without explicit user decision.

### After writing

After applying, output only:

```txt
Updated:
- <file> — <short change>

Not touched:
- <file/group>

Remaining open questions:
- <Q-ID> — <question>
or
- None

Next recommended command:
- /prd questions | /prd challenge | /prd converge | /prd prioritize
```

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

- **Chat-first.** Never write docs/prd/ without going through the delta procedure in section 8.
- **One feature group at a time.** No parallel construction.
- **Explicit validation.** The four checkpoints in 3.7 are required every time.
- **No technical content.** Defer implementation discussion.
- **Respect persisted state.** Read PRD.md and state.md before extending.
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
