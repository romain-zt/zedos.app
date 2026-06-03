# Scope Slice: Grayed post-PRD shell

## Parent Feature Area

[Fast-track / mode urgent](../feature-areas/fast-track-urgent.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

When a project is in **express** mode, the founder still sees where the product is headed after the PRD (feature split, user stories, delivery) but cannot start those steps until they **Approfondir** into **standard** mode or wait for the full post-PRD pipeline later.

---

## Exact Boundary

### Included Behavior

- While **journey mode = express** (PD-002, Journey 10), these **post-PRD** destinations stay **visible** in the product shell (dashboard / project navigation as configured in v0):
  - **Services / feature split**
  - **User stories**
  - **Test-first workflows**
  - **Cursor delivery** (export / delivery packaging)
- Each destination is **disabled (grayed)** — not clickable to start work — with **product-oriented copy** that:
  - States the step is **not available in express mode**;
  - Points the founder to **Approfondir / Passer en standard** to deepen the PRD first; and/or
  - Notes that the **full post-PRD pipeline** arrives in a later product phase (no implementation promise in this slice).
- Grayed state applies **for the whole time** the project stays in express mode (including before and after an express PRD version exists).
- When the founder **switches to standard** (`declare-express-mode`), grayed treatment **ends** for these destinations (their enabled vs under-construction behavior is owned elsewhere).

### Excluded Behavior

- Implementing post-PRD pipeline behavior (feature split output, story generation, task prompts, Cursor export — v1 scope).
- **Hiding** post-PRD navigation in express mode (PD-002: visible, not masked).
- Grayed treatment when project is in **standard** mode (out of scope for this slice).
- Express livrable generation, minimum IA clarify, share disclaimer (sibling slices).
- Import external PRD or journey mode declaration UI (sibling slices / other FA).
- Credit purchase, share links, or anonymous viewer surfaces.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Express — shell loaded | Signed-in owner opens project in **express** mode | Post-PRD destinations visible; each appears **grayed / disabled** with deferral copy |
| Express — focus grayed entry | Owner hovers or attempts a disabled destination | Copy reinforces **Approfondir** or **standard** path; no navigation into pipeline work |
| Express — before first PRD | Express mode, no PRD version yet | Same grayed post-PRD shell (pipeline not shortcut for “empty” projects) |
| Express — after livrable | Express PRD version exists | Post-PRD still grayed; PRD path remains primary active work |
| Standard — active | Project journey mode = **standard** | This slice’s grayed treatment **off**; post-PRD availability follows global product rules (not defined here) |
| Switch — express → standard | Owner uses **Approfondir** or mode switch | Grayed entries become eligible per non-express rules; express versions stay in history |
| Switch — standard → express | Owner re-activates express | Post-PRD destinations return to **grayed + message** |
| Blocked — not signed in | Session expired | No project shell; redirect to sign-in (account-session FA) |
| Error — shell unavailable | Project load fails | Existing error pattern; no partial unlock of post-PRD |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Project | Read | **Journey mode** (`express` vs `standard`) gates grayed vs normal shell |
| PRD version | Read | Optional — confirm PRD exists for messaging context only; does not unlock post-PRD |

---

## Credit / Payment Impact

None — disabled shell only; no AI operations started from grayed entries in this slice.

---

## Sharing / Privacy Impact

None — grayed shell affects **signed-in owner** navigation only; anonymous share surface and link semantics unchanged.

---

## Feedback / Instrumentation Impact

None — viewing or clicking grayed post-PRD entries does **not** trigger owner milestone feedback prompts (PRD generation / share milestones unchanged).

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `fast-track-urgent--declare-express-mode` | Scope Slice | ready-for-user-stories (impl. complete) | Journey mode + **Approfondir** path must exist |
| Project workspace | Feature Area capability | validated | Shell where post-PRD destinations appear |
| Post-PRD pipeline (FG-POST-PRD-V1) | PRD scope (v1) | complete (orchestration) | Nav destinations implemented; this slice adds **grayed + message** in express only |
| PD-002 | Product decision | accepted | Visible + disabled + message (not hidden) |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

A signed-in founder with a project in **express** mode sees **Services / feature split**, **User stories**, **Test-first workflows**, and **Cursor delivery** in the shell, each **grayed and non-actionable**, with copy that explains express deferral and how to **Approfondir** into **standard**; switching to **standard** removes this grayed treatment.

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
| 2026-06-03 | Scaffolded from approved `/feature-area slice` proposal via `/feature-area scaffold-slices` | — |
| 2026-06-03 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
| 2026-06-03 | Post-PRD dependency aligned with WORK_QUEUE `complete` (orchestration) | doc-sync |
