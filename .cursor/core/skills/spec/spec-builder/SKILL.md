---
name: spec-builder
description: Drives Implementation Spec authoring from `ready-for-spec` User Stories. `propose` reads parent US chain and proposes one or more Spec candidates (no writes). `scaffold` writes initial Spec markdown from an approved proposal (only mode that may create Spec files). `refine` edits product + implementation sections of one Spec (this is where stack, schema, framework, routes, and runtime first appear). `promote` applies the narrow ready-for-implementation transition after CLEAR (SP-01–SP-N, CC-01–CC-05). `check` runs the readiness checker only. Never writes Task content or application code.
disable-model-invocation: true
---

# Spec Builder

Operational skill for converting a `ready-for-spec` User Story into Implementation Spec files. Drives the `/spec` command modes.

**This is the first artifact in the chain where stack, schema, framework, routes, and runtime decisions may appear.** Spec Critic stress-tests every proposal and refinement for premature commitment, missing tests, missing observability, and leakage out of the parent User Story's boundary.

## 1. Goal

Produce Spec proposals and files that are:

- Grounded in a specific User Story that is already `ready-for-spec`
- Trace every parent AC to a satisfaction strategy (satisfied here, or explicitly deferred to a sibling Spec)
- Carry a non-empty Tests section across applicable test layers (unit / integration / acceptance / non-functional)
- Name observability signals tied to questions answered in production
- Gated by the scope-readiness-checker Part 5 + CC checks before any status advancement

Anti-goal: gold-plated architecture or premature lock-in. Spec is for what must be decided to ship the parent User Story, not for everything that could be decided.

## 2. Activation

Activate when the user runs `/spec <mode>`.

Before any mode executes:

1. Read `docs/prd/state.md`
2. Read `docs/prd/PRD.md`
3. Read `docs/prd/questions/open-questions.md`
4. Read all `docs/product-decisions/PD-*.md` (PD-001 mandatory)
5. Read the parent User Story file
6. Read the parent Scope Slice linked from the User Story
7. Read the grandparent Feature Area linked from the Scope Slice
8. Read all existing Spec files for the same User Story under `docs/product/specs/`

If `docs/prd/PRD.md` is missing or empty: stop and recommend `/prd init`.

If the parent User Story is not at `ready-for-spec`: stop and recommend `/user-story refine` + `/user-story promote` first.

## 3. Spec Lead Pre-flight

Before executing any mode (except `check` which is mechanical), confirm that a Spec Context Brief has been produced by the Spec Lead (`.cursor/core/agents/spec/spec-lead.md`).

Reuse the Brief from `propose` when running `scaffold` in the same conversation. `refine` and `promote` may reuse the most recent Brief if available; otherwise request one.

## 4. Mode: propose

Propose Spec candidates for one User Story. No file writes.

### Behavior

1. Confirm parent User Story is `ready-for-spec` with `NEED_HUMAN: false`.
2. Read parent User Story sections: Story, Acceptance Criteria, UX States Covered, Out of Scope, Data Touched, all impact sections, Acceptance-Level Outcome.
3. Decide subdivision:
   - **Default: one Spec per User Story.** Most stories fit one Spec.
   - **Multiple Specs** only when distinct technical surfaces cannot land in one coherent implementation (e.g. backend job + frontend screen + shared schema; two unrelated services). State the reason explicitly.
4. For each candidate Spec, propose:
   - Name (kebab-safe).
   - One-sentence summary tracing to the parent User Story's Acceptance-Level Outcome.
   - AC coverage map: which parent ACs this Spec satisfies; which are deferred to sibling Specs.
   - Major technical surfaces involved: data model, contract, UI, observability, jobs, etc.
   - Any immediate blockers or NEED_HUMAN flags.
5. Invoke Spec Critic (`.cursor/core/agents/spec/spec-critic.md`) to review.
6. Present using the output format in `.cursor/core/commands/spec.md` Mode: propose.

## 5. Mode: scaffold

Materialize an **approved** Spec proposal into files. Governed by `.cursor/core/commands/spec.md` Mode: scaffold.

### Pre-conditions

1. Approved proposal in-context.
2. Parent User Story `ready-for-spec` and `NEED_HUMAN: false`.

### Behavior

1. Target `docs/product/specs/<fa-kebab>--<slice-kebab>--US-<NNN>--<short-kebab>.spec.md` per row (with `--A`, `--B` discriminator if multiple Specs per US).
2. **Skip** if file exists and non-empty.
3. Else instantiate from `.cursor/core/templates/product/spec.template.md`.
4. **Fill only**: Parent User Story link, Status (`exploratory`), NEED_HUMAN / NEED_UPDATE, Summary, Acceptance Criteria Trace (initial mapping), Out of Scope (from proposal + parent US), Dependencies (from proposal), Blockers (from proposal), Changelog (one row with today's date).
5. **Leave empty / TBD**: Data Model, Contract (Inputs/Outputs/Errors), UI Surface, Tests (all layers), Observability, Implementation notes, Tasks — these are owned by `refine`.
6. **Do not fill** Readiness for Implementation checklist (owned by `promote`).
7. **Do not** modify files outside `docs/product/specs/`.

## 6. Mode: refine

Edit product + implementation sections of one Spec. Governed by `.cursor/core/commands/spec.md` Mode: refine.

### Behavior

1. Resolve `docs/product/specs/<one file>.spec.md`.
2. Complete standard reads (§2).
3. **Allowed edits**: Summary, Acceptance Criteria Trace, Data Model (New / extended objects, Field-level constraints, Migrations), Contract (Inputs, Outputs, Errors), UI Surface, Tests (Unit, Integration, Acceptance, Non-functional), Observability, Implementation notes, Dependencies, Blockers, Out of Scope, Tasks; and NEED_HUMAN / NEED_UPDATE under Status.
4. **Architecture freedom here.** Stack, schema, framework, routes, runtime are allowed. This is the first level where they may appear per PD-001.
5. **Mandatory Tests section.** At least one test per applicable layer. Non-functional may state "None — not applicable at this layer" with reason. A Spec without a Tests section fails the SP checker.
6. **Must not** change Status to `ready-for-implementation` (use `promote`); edit Readiness for Implementation checklist or Verdict; edit Changelog; replace Parent User Story link except to fix.
7. **Do not** write Task content; do not write application code.

## 7. Mode: check

Run Part 5 (SP-01..SP-N) + CC-01..CC-05 against one Spec file.

## 8. Mode: promote

Apply narrow **ready-for-implementation** transition after CLEAR.

### Behavior

1. Standard reads (§2).
2. Gate: file under `docs/product/specs/`; parent User Story `ready-for-spec`; current Status `exploratory` (no-op if already `ready-for-implementation`; stop if `blocked`/`deferred`); flags false; blockers consistent.
3. Run SP-01..SP-N + CC-01..CC-05. CLEAR required.
4. **Only if CLEAR**, apply only these four edits:
   - Status → `ready-for-implementation`
   - Readiness for Implementation checklist all `[x]`
   - **Verdict:** → `READY FOR IMPLEMENTATION`
   - Changelog row appended with today's date.

## 9. Collaboration

| Need | Delegate to | When |
|------|-------------|------|
| Context reconstruction before any Spec operation | Spec Lead | On initial invocation; reuse Brief for same-thread scaffold-after-propose |
| Stress-test a Spec proposal | Spec Critic | After propose, before presenting to user |
| Stress-test a major Spec refinement | Spec Critic | When refine introduces new data model, contract, or framework choices |

## 10. Handoff to Task or implementation

Specs at `Status: ready-for-implementation` with `NEED_HUMAN: false`:

- If subdivision needed → `/task propose <spec-path>`.
- Otherwise → proceed to implementation per Spec body. This skill does not drive code writing.

State explicitly when a Spec reaches this point:

```txt
Spec "<name>" is marked ready-for-implementation.

If subdivision needed → /task propose <spec-path>
Otherwise → implementation proceeds per spec body.

This skill does not drive Task workflow or code writing.
```

## 11. Anti-patterns

| Anti-pattern | Verdict |
|---|---|
| Creating Spec files outside `scaffold`, or editing outside `scaffold` / `refine` / `promote` allowed scope | Forbidden |
| Spec without a Tests section, or with an empty Tests section across all applicable layers | Forbidden |
| Spec with architecture that does not trace to a parent AC | Forbidden — gold-plating |
| Spec that includes behavior in the parent User Story's Out of Scope | Forbidden — leakage |
| Spec that quietly expands the parent Scope Slice's boundary | Forbidden — leakage |
| Skipping Spec Lead pre-flight on initial invocation | Wrong |
| Skipping Spec Critic on a major refinement | Wrong |
| Claiming `ready-for-implementation` without the file reflecting it | Forbidden — use `/spec promote` after CLEAR |
| Writing Task content from this skill | Forbidden |
| Writing application code from this skill | Forbidden |

## 12. Guardrails

- **Creation vs promotion vs refinement.** `scaffold` creates. `refine` edits body. `promote` applies only the predefined ready-for-implementation transition. `propose` and `check` do not write.
- **Tests are mandatory.** A Spec without a Tests section is not promotable.
- **Observability is mandatory** where the Spec exposes user-visible behavior. State "None — not applicable" with reason if truly silent.
- **One mode at a time.**
- **Explicit blockers.** Any FAIL blocks advancement.
- **v0 discipline.** Cross-check against PRD Hard v0 exclusions before presenting.
