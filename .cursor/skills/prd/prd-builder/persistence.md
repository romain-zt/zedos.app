# PRD Persistence — Patch Intent vs Delta Proposal

Referenced from `SKILL.md` §8. `/prd update` is persistence, not discovery. Default persistence mode is **Patch Intent Summary**, not full Before/After.

**PRD Lead pre-flight**: confirm a PRD Lead Context Brief exists for this `/prd update` flow (see `SKILL.md` §2.7) before assessing Patch Intent Summary vs. full PRD Delta Proposal. Do not re-run on `approved`, `preview`, or `cancel`.

## Invariants

- Only persist content that comes from prior discovery notes, answered questions, or an explicit convergence/checkpoint output.
- Do not invent, improve, expand, or editorialize content during persistence.
- Do not discover new content during `/prd update`.
- If new content appears during update, stop and route it to `/prd note` or `/prd converge`.
- Never treat `ok` as persistence approval.
- Never echo full PRD content after writing.
- The PRD file is the document surface; chat is the approval/control surface.

## Answered-queue supersession annotations (`open-questions.md`)

When the persisted PRD/`state.md` delta **supersedes** facts implied by older **Answered** rows, apply matching annotations in `docs/prd/questions/open-questions.md` in the **same** approved write batch (capture artifact only — not a version bump). Edit **Answer** and/or **PRD impact** cells only; use explicit supersession wording per `.cursor/commands/prd-questions.md` (e.g. pointer to newer `Q-NNN` or "persisted PRD"). **Never delete** answered rows.

Include `docs/prd/questions/open-questions.md` under Patch Intent Summary **Files to change** when those annotations are needed; omit when no older answered facts are overridden.

## Default: Patch Intent Summary

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

## Full PRD Delta Proposal

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

## Approval behavior

If previous assistant turn contained Patch Intent Summary:

- `approved` applies the summarized patch
- `preview` shows exact Before/After
- `cancel` stops

If previous assistant turn contained full PRD Delta Proposal:

- `approved` applies the exact delta

No Patch Intent Summary or full PRD Delta Proposal in the immediately preceding assistant turn means no write is allowed.

## False-readiness guard

A persistence update must never make a feature group look more ready than it is.

- If required surface fields are UNKNOWN, status must not be `validated` or `committed`.
- Use `validated-with-open-surface` only when user value/scope is agreed but surface blockers remain.
- Do not create implementation specs, tickets, or architecture from `validated-with-open-surface`.
- Do not promote anything to `committed` without explicit user decision.

## After writing

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
