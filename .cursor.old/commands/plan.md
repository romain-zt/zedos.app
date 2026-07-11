# /plan — Implementation Plan from a Scope Slice

## Usage

```txt
/plan <scope-slice-path>          (initial Plan for a Scope Slice)
/plan <user-story-path>           (Plan for an existing User Story)
/plan <plan-path> --revise        (revise an existing Plan)
```

Lead agent: `architect` (`.cursor/agents/execution/architect.md`)
Adversarial pairing: `domain-guardian` (`.cursor/agents/execution/domain-guardian.md`), `scope-critic` (`.cursor/agents/feature-area/scope-critic.md`)
Operational rule: `.cursor/rules/70-execution-bridge.mdc`
Templates: `.cursor/templates/execution/user-story.template.md`, `.cursor/templates/execution/implementation-plan.template.md`
Checker: `.cursor/checkers/implementation-readiness-checker.md`

---

## Purpose

`/plan` produces an Implementation Plan from a `ready-for-user-stories` Scope Slice. It is the bridge between product (`docs/product/scope-slices/`) and execution (`docs/execution/plans/`). It does **not** write code.

`/plan` is the only mode that may **persist** files under `docs/execution/user-stories/` and `docs/execution/plans/` — and only after explicit user approval of the proposal.

---

## Pre-flight

1. Read the parent Scope Slice. Confirm `Status: ready-for-user-stories` and `NEED_HUMAN: false`.
2. Read the Slice's parent Feature Area; confirm `Status: validated`.
3. Read `docs/prd/PRD.md` for grounding.
4. Read `docs/prd/questions/open-questions.md`; refuse to proceed if any open question blocks this Slice.
5. Read `.cursor/rules/70-execution-bridge.mdc`, `72-hexagonal-boundaries.mdc`, `73-result-rop.mdc`, `74-contracts-zod.mdc` always.
6. Read specialist rules per the Slice's `Data Touched` and `Credit / Payment Impact`: `75-drizzle.mdc`, `76-better-auth.mdc`, `77-nextjs.mdc`, `78-testing.mdc`.
7. **Architect-Lead pre-flight (initial invocation):** the Architect produces an Architect Context Brief (per `.cursor/agents/execution/architect.md`) before drafting. Reuse the brief on follow-ups in the same conversation. Skip on `--revise` follow-ups to an already-drafted Plan.
8. **SISO classification:** `/plan` is EXECUTION mode — but read-only at the source-tree level (no code edits). It writes only to `docs/execution/**`.

---

## Modes

### Initial `/plan <scope-slice-path>`

Produces a User Story (if missing) **and** an Implementation Plan as chat artifacts. User approves; persistence follows.

### `/plan <user-story-path>`

User Story already exists and is `ready-for-implementation`. Produces only the Implementation Plan.

### `/plan <plan-path> --revise`

Revises an existing Plan that is `proposed` or `proposed-with-open-surface`. Used after `domain-guardian` returns BLOCK or after a Surface Block resolution.

---

## Behavior

### Step 1 — Author the User Story (if missing)

Use `.cursor/templates/execution/user-story.template.md`. Required sections per the template. The Story is not persisted until the user `approved` it.

The Story is gated by `implementation-readiness-checker.md` Part A.

### Step 2 — Author the Implementation Plan

Use `.cursor/templates/execution/implementation-plan.template.md`. Required sections (per `70-execution-bridge.mdc` §3.2):

- Approach
- Architecture Surface Block (Surface Gate per `70-execution-bridge.mdc` §8)
- Layers Affected
- Touched Files (exact paths under the layout in effect)
- Contracts Changed
- Migrations
- Tests
- Dependencies Added
- Rollback
- Risks
- Out of Scope
- Adversarial Review
- Approval

### Step 3 — Adversarial review

Invoke `domain-guardian` and `scope-critic` (from `agents/feature-area/`) before presenting the proposal to the user. If either returns REVISE or BLOCK, revise the Plan before presenting.

### Step 4 — Run `implementation-readiness-checker.md`

Required: CLEAR. If BLOCKED, surface the first failing check and route to the appropriate fix (Slice refinement, Story revision, Plan revision).

### Step 5 — Present the proposal

Use this output format:

```txt
Implementation Plan Proposal

User Story (will be persisted on approval): docs/execution/user-stories/<...>.md
Implementation Plan (will be persisted on approval): docs/execution/plans/<...>.plan.md

Layout: pre-migration | post-migration
Status: proposed | proposed-with-open-surface

[Story body using the user-story template]

[Plan body using the implementation-plan template]

Adversarial review:
- domain-guardian: PASS | REVISE | BLOCK — <one-line summary>
- scope-critic:    PASS | REVISE | BLOCK — <one-line summary>

Implementation Readiness Check (US-01..XC-03): CLEAR | BLOCKED — <first failing>

Approval required:
Reply `approved` to persist both files.
Reply `preview` to see exact wording before persisting.
Reply `cancel` to stop.
```

### Step 6 — On `approved`, persist

- Write `docs/execution/user-stories/<...>.md` (if a Story was authored).
- Write `docs/execution/plans/<...>.plan.md`.
- Set Plan Status to `approved`.
- Append a Changelog row.

After writing, output only:

```txt
Plan persisted:
- docs/execution/user-stories/<...>.md (status: ready-for-implementation)
- docs/execution/plans/<...>.plan.md (status: approved)

Next recommended command:
/implement docs/execution/plans/<...>.plan.md
```

---

## Hard rules

- No source-tree writes. `/plan` writes only `docs/execution/user-stories/<...>.md` and `docs/execution/plans/<...>.plan.md`.
- No persistence without explicit user `approved`. `ok` and silence are not approval.
- No proposing implementation against a Slice that is not `ready-for-user-stories`.
- No adversarial review skipped. `domain-guardian` + `scope-critic` PASS required for status `approved`.
- No Plan that names architecture not grounded in `72`, `73`, `74` (and `75`, `76`, `77` when their domains apply). If the situation requires patterns not covered, set `NEED_UPDATE: true` and stop.
- No frozen-violation contributions (per `72-hexagonal-boundaries.mdc` §7, `73-result-rop.mdc` §7).

---

## Failure routing

| Verdict | Action |
|---------|--------|
| Slice not `ready-for-user-stories` | Route to `/feature-area refine-slice <path>` |
| Slice has `NEED_HUMAN: true` | Stop; surface blockers; do not paper over |
| Open question blocks Slice | Route to `/prd questions` |
| `domain-guardian` BLOCK | Revise Plan; loop |
| `scope-critic` REVISE | Revise Plan; loop |
| `implementation-readiness-checker` BLOCKED | Surface first failing check; route accordingly |
| Surface Block has UNKNOWN load-bearing field | Status `proposed-with-open-surface`; `/implement` blocked until surface resolves or user explicitly waives |

---

→ /implement → /review → /commit → /pr → /babysit
