<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md
  Activated in PRD v2 (FG-POST-PRD-V1) — post-PRD pipeline brought into active v1 scope.
  Product clarification (2026-05-11): "task splitting / for v0 we provide user story with task in it
  (and prompt for each task)" — user stories with embedded tasks + a Cursor prompt per task.
-->

# Feature Area: Test-first workflows

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Feature Groups (FG-POST-PRD-V1 — "test-first workflows"; `exploratory`); § Global Product Picture ("Beyond v0 — FG-POST-PRD-V1: … → test-first workflows → Cursor delivery"); § FG-POST-PRD-V1 Sub-components ("Test-first workflows"); § Flow Inventory ("Post-PRD pipeline… | Yes (v1 scope — FG-POST-PRD-V1)")
- Related open questions: none
- Related product decisions: none

---

## Product Intent

For v0 of this area: Zedos takes each user story and breaks it down into **concrete tasks**, attaching a **Cursor-ready prompt** to each task so the founder can move from story to implementation without manually drafting prompts. The story is the unit of delivery; the task-with-prompt is the unit of execution. A founder ends this step with a self-contained user story that carries its own implementation roadmap, ready to be handed to Cursor.

---

## In Scope

- Breaking a user story into a structured list of tasks (small, ordered, actionable units).
- Generating a Cursor-ready prompt for each task — the prompt gives an AI coding agent enough context to execute the task.
- Presenting the story + tasks + prompts in a format the founder can review and adjust before using.
- This is task splitting, not test authoring — the "test-first" framing describes the workflow intent (tasks defined before implementation), not literal test code generation in v0 of this area.

## Out of Scope

- Running or executing prompts / sending them to Cursor directly (owned by the Delivery Feature Area, downstream).
- Writing actual test code or CI configuration (deferred — north star arc references "test-first delivery" but v0 of this area is task + prompt generation only).
- Multi-user or collaborative task editing (Hard v0 exclusions carry forward from PRD).
- Architecture analysis (separate future area, not in scope here).

---

## Business Objects Touched

| Object | Relationship |
|--------|-------------|
| User story | Consumed as input; tasks and prompts are generated for each story |
| Task | Created as output — an ordered, actionable unit within a user story |
| Prompt | Created as output — a Cursor-ready instruction attached to each task |

---

## User Journeys Touched

- Founder opens a user story and initiates task splitting to generate an ordered task list with Cursor-ready prompts.
- Founder reviews and adjusts tasks and prompts before handing off to the Delivery area for packaging.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| User stories FA | validated | A set of user stories is required as input for task splitting |

---

## Risks

- Tasks too large → founder still faces a blank implementation screen; tasks too small → noise without coherence. Product must guide toward actionable granularity.
- Prompt quality is load-bearing: a bad prompt produces a bad implementation start. This area's value depends on AI-generated prompt quality, which carries the same managed-AI reliability risk as the clarification loop.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| None | — | — |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| `test-first-workflows--task-splitting-with-prompts` | Founder breaks a user story into tasks with Cursor-ready prompts per task. | complete |

---

## Readiness Verdict

- [x] PRD source sections read
- [x] Product intent stated without technical language
- [x] Business objects enumerated
- [x] User journeys identified
- [x] In-scope / out-of-scope explicitly separated
- [x] No unresolved PRD open questions affecting this area
- [x] Deferred behaviors explicitly named
- [x] Candidate Scope Slices are individually small enough

**Verdict:** COMPLETE — task splitting shipped (`WORK_QUEUE`)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial scaffold from approved Feature Area map (`/feature-area scaffold`) — created as `deferred` per PRD v1 FG-FUTURE; product intent clarified as task splitting + prompt-per-task for v0 of this area | — |
| 2026-05-11 | Activated — PRD v2 promotes FG-FUTURE → FG-POST-PRD-V1 (active v1 scope); status changed `deferred` → `exploratory`; PRD scope blocker cleared | — |
| 2026-05-11 | Promoted to validated after CLEAR readiness check (`/feature-area promote`) | — |
| 2026-06-04 | Slice `test-first-workflows--task-splitting-with-prompts` synced **complete** | — |
