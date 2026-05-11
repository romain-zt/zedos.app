<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md (FG-FUTURE north star arc)
  Status: deferred — PRD v1 marks post-PRD pipeline as "under construction / not v0"
-->

# Feature Area: User stories

## Status

`deferred`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Feature Groups (FG-FUTURE — "user stories"; `deferred`); § Global Product Picture (north star arc: "→ user stories"); § Product Overview ("user stories… out of v0 scope… under construction"); § Out of Scope ("Post-PRD pipeline (…user stories…) | No (dashboard: under construction)")
- Related open questions: none
- Related product decisions: none

---

## Product Intent

After the founder has split their product into feature groups, Zedos helps them generate **executable user stories** for each feature area — concrete, behavior-level statements that define what to build from the perspective of the user. This step turns the product split from a naming exercise into an actionable work surface: each story captures a user-facing outcome and can stand alone as a unit of planning.

---

## In Scope

- Generating user stories from a defined feature split / feature group.
- Each story captures a user-facing behavior (not implementation) and includes enough context to be actionable.
- Presenting stories in a way that is reviewable and adjustable by the founder.
- Scoping stories to be small enough to produce tasks (coordination with the Test-first workflows Feature Area downstream).

## Out of Scope

- Task-level breakdown with prompts per task (owned by the Test-first workflows Feature Area, downstream).
- Architectural decisions or technical specifications — stories are behavioral, not technical.
- Multi-user or collaborative story editing (Hard v0 exclusions carry forward from PRD).
- Architecture analysis as a step in this area (TBD as a separate future area, not in the current menu scope).

---

## Business Objects Touched

| Object | Relationship |
|--------|-------------|
| Feature group / service | Consumed as the input; one or more user stories generated per feature group |
| User story | Created as the output — behavioral unit tied to a feature group |

---

## User Journeys Touched

- Not yet defined in PRD v1 (this area is post-v0 north star). TBD when the PRD is updated to include the post-PRD pipeline.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Services / feature split FA | deferred | A defined feature split is required as the input for user story generation |
| PRD v1 update | blocked | PRD must move FG-FUTURE into active scope before this FA can advance to `exploratory` |

---

## Risks

- Stories that are too broad become mini-PRDs; stories that are too narrow become tasks. The product must guide the founder toward the right level of granularity.
- Without clear feature group boundaries upstream, user stories may overlap or leave gaps.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| PRD scope — FG-FUTURE is `deferred` in PRD v1 | Advancement to `exploratory` and all downstream work | false — requires `/evol` or `/prd update` to bring into active scope |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| Story generation from feature split | Founder generates a first set of user stories for a feature group and can review or adjust them before moving to task-level breakdown. | deferred |

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
| 2026-05-11 | Initial scaffold from approved Feature Area map (`/feature-area scaffold`) — created as `deferred` per PRD v1 FG-FUTURE | — |
