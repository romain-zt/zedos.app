<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md (FG-FUTURE north star arc)
  Status: deferred — PRD v1 marks post-PRD pipeline as "under construction / not v0"
  Product clarification (2026-05-11): "task splitting / for v0 we provide user story with task in it
  (and prompt for each task)" — user stories with embedded tasks + a Cursor prompt per task.
-->

# Feature Area: Test-first workflows

## Status

`deferred`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Feature Groups (FG-FUTURE — "delivery loop"; `deferred`); § Global Product Picture (north star arc: "→ test-first delivery and iteration"); § Product Overview ("test-first delivery… out of v0 scope… under construction"); § Out of Scope ("Post-PRD pipeline (…CI…) | No (dashboard: under construction)")
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

- Not yet defined in PRD v1 (this area is post-v0 north star). TBD when the PRD is updated to include the post-PRD pipeline.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| User stories FA | deferred | A set of user stories is required as input for task splitting |
| PRD v1 update | blocked | PRD must move FG-FUTURE into active scope before this FA can advance to `exploratory` |

---

## Risks

- Tasks too large → founder still faces a blank implementation screen; tasks too small → noise without coherence. Product must guide toward actionable granularity.
- Prompt quality is load-bearing: a bad prompt produces a bad implementation start. This area's value depends on AI-generated prompt quality, which carries the same managed-AI reliability risk as the clarification loop.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| PRD scope — FG-FUTURE is `deferred` in PRD v1 | Advancement to `exploratory` and all downstream work | false — requires `/evol` or `/prd update` to bring into active scope |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| Task splitting with prompts | Founder breaks a user story into tasks and receives a Cursor-ready prompt for each, producing a story ready for implementation. | deferred |

---

## Readiness Verdict

- [ ] PRD source sections read
- [ ] Product intent stated without technical language
- [ ] Business objects enumerated
- [ ] User journeys identified
- [ ] In-scope / out-of-scope explicitly separated
- [ ] No unresolved PRD open questions affecting this area
- [ ] Deferred behaviors explicitly named
- [ ] Candidate Scope Slices are individually small enough

**Verdict:** BLOCKED — PRD v1 marks this area `deferred` (FG-FUTURE). Advancement requires PRD update to bring post-PRD pipeline into active scope.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial scaffold from approved Feature Area map (`/feature-area scaffold`) — created as `deferred` per PRD v1 FG-FUTURE; product intent clarified as task splitting + prompt-per-task for v0 of this area | — |
