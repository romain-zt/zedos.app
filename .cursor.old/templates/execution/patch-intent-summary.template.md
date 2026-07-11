<!--
  Patch Intent Summary Template — Execution side
  Location: .cursor/templates/execution/patch-intent-summary.template.md
  Usage:    chat-only artifact produced by `implementer` immediately before the first code edit.
  Governed by: .cursor/rules/70-execution-bridge.mdc §3.3, .cursor/rules/80-change-policy.mdc §5.3
  Mirrors:  .cursor/skills/prd/prd-builder/persistence.md (PRD Patch Intent Summary)

  NOTE: This artifact is chat-only — never persist as a .md file.
  The audit trail is the chat transcript itself.
-->

# Patch Intent Summary — Execution

## Plan reference

Implementation Plan: `docs/execution/plans/{{FA_KEBAB}}--{{SLICE_KEBAB}}--{{STORY_KEBAB}}.plan.md`
User Story: `docs/execution/user-stories/{{FA_KEBAB}}--{{SLICE_KEBAB}}--{{STORY_KEBAB}}.md`
Scope Slice: `docs/product/scope-slices/{{FA_KEBAB}}--{{SLICE_KEBAB}}.md`

## Approval blockers

<!--
  Preconditions the user must explicitly accept before `approved` is meaningful.
  Default when nothing is unusual: `- None.`

  When present, list each blocker as a numbered item. The user's `approved` reply constitutes
  written acceptance of every blocker listed here. If a user could reasonably reply `approved`
  without realising they are also waiving a non-trivial precondition, that precondition MUST
  appear here.

  Examples of content that belongs here:
  - Parent FA `NEED_HUMAN` carve-out (safety-fix-slice per feature-area-workflow.mdc §10)
  - An open product question (OQ-N) with a proposed default the user must accept
  - A stacked PR shape that exceeds individual PR size limits in aggregate
  - A placeholder (e.g. fixture TODO) that must be swapped before merge
-->

- None.

## Files to change

<!-- Subset of Plan §"Touched Files (exact paths)". The implementer is bound to this list. -->

- {{PATH_1}} — {{SHORT_CHANGE_1}}
- {{PATH_2}} — {{SHORT_CHANGE_2}}

## Files not touched (declared)

<!-- Files in the parent Plan that are NOT being touched in this iteration. Documents the intent. -->

- {{PATH_OR_LAYER}}

## Patch type

- {{PATCH_TYPE}} <!-- patch | refactor | bug-fix | feature-increment -->

## Verification plan

The following must PASS before the patch is considered complete (run by `verifier`, see `.cursor/agents/execution/verifier.md`):

- [ ] `pnpm typecheck` (or `npm run typecheck`)
- [ ] `pnpm lint` (boundaries enforced)
- [ ] `pnpm test` (unit + colocated integration)
- [ ] `pnpm build`
- [ ] Concurrent integration test if credit / payment / quota touched (per `.cursor/rules/75-drizzle.mdc` §5)

## Safety declarations

- [ ] No `as any` introduced (per `.cursor/rules/73-result-rop.mdc` §3.1)
- [ ] No raw `throw new Error` outside `domain/` (per `.cursor/rules/73-result-rop.mdc` §3.2)
- [ ] No vendor SDK construction outside `infrastructure/` (per `.cursor/rules/72-hexagonal-boundaries.mdc` §5)
- [ ] No new dependencies beyond Plan §"Dependencies Added"
- [ ] No edits outside Plan §"Touched Files"
- [ ] Schema migration count in this patch ≤ 1 (per `.cursor/rules/79-pr-sizing.mdc` §2)

## Approval required

Reply `approved` to apply the patch.
Reply `preview` to see the full proposed diff before applying.
Reply `cancel` to stop.

`ok` is **not** approval. Silence is **not** approval.

---

<!--
  After approval, the implementer applies edits, then routes to verifier.
  After verifier PASS, the implementer routes to reviewer.
  Anything that requires deviation from this list requires a NEW Patch Intent Summary.

  REMINDER: This PIS is chat-only. Do not write it to a file under docs/prd/patch-intent/,
  docs/execution/patch-intent/, or anywhere else. The chat transcript is the audit trail.
-->
