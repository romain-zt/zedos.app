<!--
  Scope Slice — scaffolded from validated Feature Area delivery + PD-001
  Parent: docs/product/feature-areas/delivery.md
-->

# Scope Slice: Cursor package export

## Parent Feature Area

[Delivery](../feature-areas/delivery.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A signed-in founder can review export-ready story bundles, confirm what will ship, and download one Cursor-ready package (stories, ordered tasks, and per-task prompts) they can drop into their own repository for an AI coding agent—without manual reformatting.

---

## Exact Boundary

### Included Behavior

- Surfacing only user stories (and nested tasks + prompts) that upstream workflows have marked **export-ready** / locked for delivery packaging.
- Letting the founder **preview** what will be included in the package (stories, task order, prompt bodies) before confirming export.
- Building a **delivery package** whose structure matches **PD-001**: a `WORK_QUEUE.md` with Zedos-compatible rows (ID, status, next action, parent linkage) plus per-story narrative files (actor, outcome, acceptance criteria) and per-task prompt content (inline in story files or sibling prompt artifacts — product choice at implementation).
- Including a **`.cursor/`**-oriented folder layout so the founder can open the artifact in Cursor with minimal friction (exact folder names are an implementation detail; the product promise is Cursor-native consumability per PD-001).
- Letting the founder **select** which export-ready story bundles to include when more than one is eligible (default: all export-ready bundles for the active project context).
- Offering a **download** of the package as a single portable archive the founder saves locally and copies into their target repository.
- Preserving **owner-only** access: only the signed-in project owner initiates export; no anonymous or collaborator export in this slice.

### Excluded Behavior

- **Executing** tasks or running agents inside Zedos (Cursor / the IDE is the execution surface).
- **Editing** upstream stories, tasks, or prompts during export (read-only consumption of locked bundles).
- **CI/CD** configuration, pipeline setup, or deployment automation.
- **Architecture diagrams** or separate technical spec documents as part of the package.
- **Multi-user** or collaborative co-editing of the delivery artifact.
- **Generic-only** export (e.g. Markdown dump with no `WORK_QUEUE` / `.cursor/` alignment) as the primary v1 deliverable — PD-001 locks the Cursor-native shape.
- **Markdown/PDF PRD export** (FG-PRD-V0 fast follow) — out of scope for this slice.
- **Billing for packaging** as a subscription or hidden refill — any credit interaction follows existing FG-PRD-V0 AI rules only if export triggers AI (packaging itself is not assumed to be an AI operation).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| **Empty / gated** | No story bundles are marked export-ready for the current project | Clear explanation that task splitting must be completed and bundles locked upstream; link or affordance toward the test-first workflows surface |
| **Eligible list** | At least one export-ready bundle exists | List of eligible stories with short identifiers (title or cluster label), task counts, and export-ready indicators; founder can select one or many (or accept all selected by default) |
| **Preview** | Founder chose bundles and opened preview before confirm | Read-only summary: ordered stories, nested tasks in sequence, prompt excerpts; no inline editing of upstream content; confirm and cancel actions |
| **Packaging loading** | Founder confirmed export and assembly is in progress | Non-blocking progress indicator; duplicate export requests prevented while loading |
| **Download ready** | Package assembled successfully | Success message, download affordance, short guidance to copy the archive into their repo and open it in Cursor; optional recap of what was included |
| **Error (transient)** | Assembly or download preparation failed retryably | Recoverable error with retry; partial state does not mark bundles as un-exported upstream |
| **Error (blocked)** | Hard prerequisite missing (e.g. bundle lost export-ready flag, ownership mismatch) | Blocked messaging with correction path toward test-first workflows or project selection |
| **Error (empty selection)** | Founder attempted export with zero bundles selected | Inline validation before packaging starts |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| **Project** | read | Export scoped to the signed-in owner's active project; no cross-project mixing in one package |
| **User story** | read | Only export-ready / locked narratives included in the package |
| **Task** | read | Ordered child units per included story; sequence preserved in the deliverable |
| **Prompt** | read | Per-task instruction bodies bundled with their parent tasks |
| **Delivery package** | create | Ephemeral or short-lived assembled artifact offered for download; not a new canonical source of truth inside Zedos |

---

## Credit / Payment Impact

None — packaging and download do not consume credits unless a future product decision adds AI-assisted preview; this slice assumes deterministic assembly of already-authored artifacts.

---

## Sharing / Privacy Impact

None — export is an owner workspace action. The downloaded package may contain project/product text the founder chooses to place in their own repo; Zedos does not create a new public share link in this slice.

---

## Feedback / Instrumentation Impact

None for v1 of this slice — export does not trigger an owner milestone feedback prompt. Optional future attribution of export events to project and PRD version may be added without changing the core export behavior.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| [Task splitting with prompts](./test-first-workflows--task-splitting-with-prompts.md) | Scope Slice | complete | Supplies locked `{story, ordered tasks, prompts}` payloads |
| [Story generation from feature split](./user-stories--story-generation-from-feature-split.md) | Scope Slice | complete | Upstream narratives must exist before task splitting |
| Test-first workflows Feature Area | Feature Area | complete | Per `docs/WORK_QUEUE.md` |
| PD-001 (export format) | Product decision | accepted | `.cursor/` layout + `WORK_QUEUE.md`-compatible entries |
| Project workspace | Feature Area | complete | Founder reaches export from a project context with eligible post-PRD artifacts |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| None | — | false |

---

## Acceptance-Level Outcome

A signed-in project owner with at least one export-ready story bundle can select which bundles to include, preview the assembled contents read-only, confirm export, download a single portable package shaped per PD-001 (`WORK_QUEUE`-compatible queue plus per-story and per-task prompt material), and open that package in Cursor without reformatting Zedos output by hand; if no bundle is export-ready, the product explains the upstream prerequisite instead of offering a broken download.

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
| 2026-05-29 | Scaffolded from validated Feature Area `delivery` candidate slice + PD-001 via `/feature-area scaffold-slices` | — |
| 2026-05-29 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
