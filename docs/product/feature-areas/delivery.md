<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md (FG-FUTURE north star arc)
  Status: deferred — PRD v1 marks post-PRD pipeline as "under construction / not v0"
  Maps to "Cursor packaging" in FG-FUTURE; also covers "tech alignment" from the same group.
-->

# Feature Area: Delivery

## Status

`deferred`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Feature Groups (FG-FUTURE — "Cursor packaging", "tech alignment"; `deferred`); § Global Product Picture (north star arc: "→ architecture / Cursor setup → … test-first delivery"); § Product Overview ("Cursor… out of v0 scope… under construction"); § Out of Scope ("Post-PRD pipeline (…Cursor artifacts…) | No (dashboard: under construction)")
- Related open questions: none
- Related product decisions: none

---

## Product Intent

After a user story has been broken into tasks with prompts, Zedos **packages and exports the work** into a format ready for use directly in Cursor (or equivalent tooling). The founder closes Zedos with everything they need to start implementation — stories, tasks, and prompts organized in a way that an AI coding agent can immediately consume, without manual reformatting or copy-pasting.

---

## In Scope

- Packaging the output of the Test-first workflows area (user stories + tasks + prompts) into a Cursor-ready deliverable.
- Exporting the packaged work in a format the founder can open in their editor / AI coding tool.
- Presenting the delivery artifact to the founder for review before export.

## Out of Scope

- Running or executing tasks inside Zedos (Zedos is the authoring surface; Cursor / the IDE is the execution surface).
- CI/CD setup or pipeline configuration (deferred from north star; not part of v0 of this area).
- Architecture diagrams or technical spec documents (separate future area, not in scope here).
- Multi-user or collaborative delivery editing (Hard v0 exclusions carry forward from PRD).

---

## Business Objects Touched

| Object | Relationship |
|--------|-------------|
| User story | Consumed as input — part of the packaged deliverable |
| Task | Consumed as input — ordered tasks within each story |
| Prompt | Consumed as input — Cursor-ready instruction per task |
| Delivery package | Created as output — the exportable artifact the founder takes to their editor |

---

## User Journeys Touched

- Not yet defined in PRD v1 (this area is post-v0 north star). TBD when the PRD is updated to include the post-PRD pipeline.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Test-first workflows FA | deferred | Tasks + prompts must exist before packaging; Delivery consumes that output |
| PRD v1 update | blocked | PRD must move FG-FUTURE into active scope before this FA can advance to `exploratory` |

---

## Risks

- Export format compatibility: the package format must match how Cursor or the target tool consumes structured work; wrong format = zero adoption.
- If the upstream quality (stories, tasks, prompts) is poor, packaging doesn't add value — this area's usefulness depends entirely on upstream quality.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| PRD scope — FG-FUTURE is `deferred` in PRD v1 | Advancement to `exploratory` and all downstream work | false — requires `/evol` or `/prd update` to bring into active scope |
| Export format for Cursor packaging | Exact delivery format (file structure, markdown shape, Cursor-specific conventions) | true — requires product decision before Scope Slices can be defined |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| Cursor package export | Founder exports their completed user stories, tasks, and prompts as a structured package ready to open in Cursor. | deferred |

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

**Verdict:** BLOCKED — PRD v1 marks this area `deferred` (FG-FUTURE). Advancement requires PRD update to bring post-PRD pipeline into active scope. Export format also requires a product decision (NEED_HUMAN=true for that blocker).

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial scaffold from approved Feature Area map (`/feature-area scaffold`) — created as `deferred` per PRD v1 FG-FUTURE; maps to "Cursor packaging" + "tech alignment" from FG-FUTURE | — |
