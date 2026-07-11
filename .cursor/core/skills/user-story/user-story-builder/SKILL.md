---
name: user-story-builder
description: Drives User Story authoring from `ready-for-user-stories` Scope Slices. `propose` reads parent Slice + PRD chain and proposes User Story candidates (no writes). `scaffold` writes initial User Story markdown from an approved proposal (only mode that may create User Story files). `refine` edits product-level sections of one User Story. `promote` applies the narrow ready-for-spec transition after CLEAR (US-01–US-N, CC-01–CC-05). `check` runs the readiness checker only. Never writes Spec, Task, or implementation code.
disable-model-invocation: true
---

# User Story Builder

Operational skill for converting a `ready-for-user-stories` Scope Slice into User Story files. Drives the `/user-story` command modes. Does not drive `/spec`, `/task`, or any code writing — those have separate skills.

## 1. Goal

Produce User Story proposals and files that are:

- Grounded in a specific Scope Slice that is already `ready-for-user-stories`
- Written in standard "As an X, I do Y, so that Z" form
- Carry 2–5 inline Acceptance Criteria in Given/When/Then form
- Cover a non-empty subset of the parent Slice's UX States
- Free of implementation language (no routes, schemas, frameworks)
- Gated by the scope-readiness-checker Part 4 + CC checks before any status advancement

Anti-goal: cranking out user stories to look productive. A bad first story poisons the Spec that follows.

## 2. Activation

Activate when the user runs `/user-story <mode>`.

Do not activate for PRD, Feature Area, Scope Slice, Spec, or Task workflows — those have separate skills.

Before any mode executes:

1. Read `docs/prd/state.md`
2. Read `docs/prd/PRD.md`
3. Read `docs/prd/questions/open-questions.md`
4. Read all files in `docs/product-decisions/` (PD-001 is mandatory because it defines this workflow)
5. Read the parent Scope Slice file (resolved from the mode's argument)
6. Read the parent Feature Area linked from the Scope Slice
7. Read all existing User Story files under `docs/product/user-stories/` for the same parent Scope Slice

If `docs/prd/PRD.md` is missing or empty: stop and recommend `/prd init`.

If the parent Scope Slice is not at status `ready-for-user-stories`: stop and recommend completing `/feature-area refine-slice` + `/feature-area promote-slice` first.

## 3. User Story Lead Pre-flight

Before executing `propose`, `scaffold`, `refine`, `check`, or `promote`, confirm that a User Story Context Brief has been produced by the User Story Lead (`.cursor/core/agents/user-story/user-story-lead.md`) for this command flow.

The brief is context reconstruction only — not a story proposal, not a checker run, not a file write.

Do not re-run the pre-flight when the user is responding to an existing proposal. Resume the active flow.

When running `scaffold` immediately after the user approves a User Story proposal produced in this same conversation, reuse the Brief from `propose` — do not re-run the Lead.

`refine`, `check`, and `promote` may reuse the most recent Brief if available; otherwise request one.

## 4. Mode: propose

Propose User Story candidates for one Scope Slice. No file writes.

### Behavior

1. Confirm parent Scope Slice is `ready-for-user-stories` with `NEED_HUMAN: false`.
2. Read parent Scope Slice sections: User Value, Included Behavior, Excluded Behavior, UX States, Data Touched, Credit/Sharing/Feedback Impact, Acceptance-Level Outcome.
3. Identify distinct acceptance dimensions. Heuristics for dimension detection:
   - Each user-visible success path is one dimension.
   - Each user-visible error class (not each error message) is one dimension.
   - Each edge / gated state with distinct user behavior is one dimension.
   - "Loading" or "in-progress" states alone are not dimensions; they are sub-states of a success or error dimension.
4. For each dimension, draft one User Story:
   - Standard form: "As an X, I do Y, so that Z."
   - 2–5 inline Acceptance Criteria as Given/When/Then bullets.
   - UX states covered: explicit subset of parent slice's UX states.
   - Cross-check against PRD Hard v0 exclusions and parent slice's Excluded Behavior.
5. Apply story-sizing rules (§ below).
6. Invoke Story Critic (`.cursor/core/agents/user-story/story-critic.md`) to review the proposal before presenting.
7. Present using the output format in `.cursor/core/commands/user-story.md` Mode: propose.

### Story-sizing rules

A User Story is correctly sized when:
- It maps to exactly one acceptance dimension of the parent slice.
- Its Acceptance Criteria are 2–5 inline Given/When/Then bullets.
- It can be implemented in one Spec (rare cases: two coordinating Specs).

A User Story is too large when:
- It bundles success + error + edge dimensions into one story.
- It has more than 5 ACs.
- It spans more than one Scope Slice.

A User Story is too small when:
- A single AC could be merged into a sibling story without losing clarity.
- It describes a single UI element behavior with no observable user outcome.

Merge or split before presenting.

## 5. Mode: scaffold

Materialize an **approved** User Story proposal into files. Governed by `.cursor/core/commands/user-story.md` Mode: scaffold.

### Pre-conditions

1. User **approved** the proposal table in the current conversation. If not: stop; instruct to run `propose` first.
2. Parent Scope Slice file exists with `Status: ready-for-user-stories` and `NEED_HUMAN: false`.
3. Complete standard reads (§2) before writing.

### Behavior

1. For each row in the approved proposal, target `docs/product/user-stories/<fa-kebab>--<slice-kebab>--US-<NNN>--<short-kebab>.md` only.
2. **Skip** if the file exists and is non-empty; list in output.
3. If missing or empty-only: instantiate from `.cursor/core/templates/product/user-story.template.md`.
4. **Fill only** product-level sections: Parent Scope Slice link, Status (`exploratory`), NEED_HUMAN / NEED_UPDATE, Story, Acceptance Criteria (initial Given/When/Then from proposal), UX States Covered, Out of Scope, Data Touched (inherit narrowing from parent slice), Credit / Sharing / Feedback impacts (inherit framing), Dependencies, Blockers, Acceptance-Level Outcome, Changelog (one row with current date).
5. **Leave empty** Readiness for Spec checklist + Verdict line — owned by `promote`.
6. **Do not** modify PRD, Feature Area, Scope Slice, or any path outside `docs/product/user-stories/`.

## 6. Mode: refine

Edit product-level sections of one User Story. Governed by `.cursor/core/commands/user-story.md` Mode: refine.

### Behavior

1. Resolve `docs/product/user-stories/<one file>.md`.
2. Complete standard reads (§2).
3. **Allowed edits** — only sections listed in the command doc (Story, Acceptance Criteria, UX States Covered, Out of Scope, Data Touched, Credit/Sharing/Feedback impacts, Dependencies, Blockers, Acceptance-Level Outcome; NEED_HUMAN / NEED_UPDATE under Status). No Status → `ready-for-spec`, no Readiness checklist or Verdict, no Changelog, no Parent Scope Slice except broken-link fix.
4. Ground in parent Scope Slice + Feature Area + PRD + product decisions; **PRD-allowed product-level terms** per checker.
5. **Do not** write Spec or Task content. Acceptance Criteria stay at observable-behavior level (Given/When/Then), not at code-spec level.

## 7. Mode: check

Run Part 4 (US-01..US-N) + CC-01..CC-05 from `.cursor/core/checkers/scope-readiness-checker.md` against one User Story file.

### Behavior

1. Read the file at `<artifact-path>`. Confirm path is under `docs/product/user-stories/`.
2. Run each check; PASS / FAIL / SKIP (with reason).
3. Output the summary table per Summary Output Format.
4. State CLEAR or BLOCKED verdict.

`check` does not require User Story Lead pre-flight.

## 8. Mode: promote

Apply the narrow **ready-for-spec** transition after CLEAR. Governed by `.cursor/core/commands/user-story.md` Mode: promote.

### Behavior

1. Complete standard reads (§2).
2. Read the User Story file and `docs/prd/questions/open-questions.md`.
3. **Gate before write:** file under `docs/product/user-stories/`; parent Scope Slice exists and is `ready-for-user-stories`; current Status is `exploratory` (if already `ready-for-spec`, no-op; if `blocked`/`deferred`, stop); `NEED_HUMAN`/`NEED_UPDATE` false; blockers consistent with US checks.
4. Run US-01..US-N + CC-01..CC-05. Verdict must be CLEAR; otherwise output checker table and do not write.
5. **Only if CLEAR**, apply only these four edits:
   - `## Status` → `ready-for-spec`
   - `## Readiness for Spec` checklist all `[x]`
   - **Verdict:** → `READY FOR SPEC`
   - `## Changelog` → append one row with today's date and the exact text from the command doc.

No other sections or files.

## 9. Collaboration

| Need | Delegate to | When |
|------|-------------|------|
| Context reconstruction before any User Story operation | User Story Lead | On initial invocation; reuse Brief for same-thread scaffold-after-propose |
| Stress-test a User Story proposal | Story Critic | After propose, before presenting to user |

Do not replicate the agents' work — invoke them and incorporate their output.

## 10. Handoff to Spec authoring

User Stories at `Status: ready-for-spec` with `NEED_HUMAN: false` are ready for `/spec propose`. This skill does not drive Spec authoring.

State explicitly when a User Story reaches this point:

```txt
User Story "<name>" is marked ready-for-spec.
Spec authoring may begin.

This skill does not drive Spec authoring.
Refer to /spec for next steps.
```

## 11. Anti-patterns

| Anti-pattern | Verdict |
|---|---|
| Creating User Story files outside `scaffold`, or editing outside `scaffold` / `promote` allowed scope | Forbidden |
| Using `promote` to change anything beyond the four defined edits | Forbidden |
| Writing Acceptance Criteria with code, routes, schemas, or framework names | Forbidden |
| Bundling success + error + edge into one User Story | Wrong — split into separate stories |
| Skipping User Story Lead pre-flight on initial invocation | Wrong |
| Skipping Story Critic review on a propose | Wrong |
| Claiming `ready-for-spec` without the file reflecting it | Forbidden — use `/user-story promote` after CLEAR |
| Proceeding past NEED_HUMAN=true without explicit user approval | Forbidden |
| Writing Spec or Task content from this skill | Forbidden |
| Writing application code from this skill | Forbidden |

## 12. Guardrails

- **Creation vs promotion vs refinement.** `scaffold` creates files. `refine` edits product-level body sections. `promote` applies only the predefined ready-for-spec transition. `propose` and `check` do not write.
- **One mode at a time.** Do not run propose + scaffold in one response.
- **Explicit blockers.** Any FAIL in US-01..US-N or CC-01..CC-05 blocks advancement — do not paper over it.
- **Terminology precision.** "User Story" — never "ticket", "issue", "story card".
- **v0 discipline.** Every proposal cross-checked against PRD Hard v0 exclusions before presenting.
