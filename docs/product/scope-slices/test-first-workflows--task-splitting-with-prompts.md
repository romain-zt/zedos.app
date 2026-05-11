<!--
  Scope Slice — test-first-workflows — task-splitting-with-prompts
-->

# Scope Slice: Task splitting with prompts

## Parent Feature Area

[Test-first workflows](../feature-areas/test-first-workflows.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Founders graduate each user story into an ordered checklist of actionable tasks paired with prompts so an AI coding agent can begin implementation confidently.

---

## Exact Boundary

### Included Behavior

- Selecting exactly one finalized user story surfaced from the storytelling slice.
- Producing structured tasks emitted in deterministic order reflecting dependencies implied by narratives (without coding stack decisions).
- Generating contextual Cursor-ready prompt text scoped per task honoring existing business language from the owning story/cluster.
- Enabling reordering prompts/tasks, rewriting prompt bodies, collapsing overly granular bullets, inserting manual tasks without AI drafts.
- Persisting finalized story payloads bundling `{story, ordered tasks[{title, prompt body}]}` for Delivery packaging readiness.

### Excluded Behavior

- Executing tasks inside Cursor automatically or initiating live IDE sessions beyond what the Delivery workflow defines (controlled by downstream packaging).
- Owning Markdown/PDF exporter packaging (Delivery FA).
- Generating executable automated tests or CI/CD pipeline definitions literalized as code snippets.
- Multi-user concurrency or presence while editing prompts.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Empty / gated | No eligible finalized stories remain | Explanation to finalize stories upstream |
| Story selection picker | Stories available | Narrative excerpts + completeness indicators tied to prerequisites |
| Generation loading | Tasks/prompt sets requested | Spinner + ETA affordance respecting credit safeguards |
| Review surface | Outputs returned | Sectioned narrative with nested tasks expandable for prompt scrutiny |
| Regeneration friction | Editing invalidates lineage | Lightweight diff summary before accepting refreshed AI drafts |
| Error transient | Retryable failure | Recoverable banners with differentiated actions (retry vs save partial manual edits only) |
| Error blocked | Hard dependency missing | Locked view pointing to prerequisites |
| Success export-ready | Founder locks bundle | Locked indicator before Delivery packaging |
| Credit gated | Insufficient prepaid balance | Mirrors FG-PRD-V0 credit messaging referencing recharge/auto-reload copy |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| User story | read | Source narrative + acceptance framing |
| Task | create, update, delete, reorder | Child units sequencing work |
| Prompt | create, update per task | Instruction layer per task |

---

## Credit / Payment Impact

Task/prompt regeneration expected to incur AI deductions consistent with directional burn tiers in PRD (standard vs heavy uplift) pending explicit FG-POST-PRD-V1 SKU—must respect ledger gating identical to FG-PRD-V0 AI operations once engineering wires burns.

---

## Sharing / Privacy Impact

None — outputs remain confined to owner workspace awaiting Delivery-stage export semantics.

---

## Feedback / Instrumentation Impact

None — FG-PRD-V0 milestone prompts not bound to FG-POST-PRD-V1 slicing per PRD; optional future hooks only.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `user-stories--story-generation-from-feature-split` completeness | Scope Slice | pending implementation | Supplies stories accepted as ready-for-task decomposition |
| User stories Feature Area | Feature Area | validated | Guards behavioral intent completeness |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| None | — | false |

---

## Acceptance-Level Outcome

For an accepted story artifact, founders can synthesize structured tasks paired with rewritten prompts until they explicitly lock versioned deliverable payloads ready for external packaging workflows.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated (including error and empty states)
- [x] Business objects named
- [x] Credit / payment impact assessed
- [x] Sharing / privacy surface assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Scaffolded from approved `/feature-area slice test-first-workflows` proposal via `/feature-area scaffold-slices` | — |
| 2026-05-11 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
