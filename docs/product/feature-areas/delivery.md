<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md
  Activated in PRD v2 (FG-POST-PRD-V1) — post-PRD pipeline brought into active v1 scope.
  Export format resolved via PD-001: .cursor/ folder structure + WORK_QUEUE-compatible entries.
-->

# Feature Area: Delivery

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Feature Groups (FG-POST-PRD-V1 — "Cursor delivery"; `exploratory`); § Global Product Picture ("Beyond v0 — FG-POST-PRD-V1: … → Cursor delivery"); § FG-POST-PRD-V1 Sub-components ("Cursor delivery"); § Flow Inventory ("Post-PRD pipeline… | Yes (v1 scope — FG-POST-PRD-V1)")
- Related open questions: none
- Related product decisions: PD-001 (export format)

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

- Founder reviews their completed user stories + tasks + prompts and initiates a Cursor package export.
- Founder receives a structured deliverable they can open directly in Cursor to start implementation.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Test-first workflows FA | exploratory | Tasks + prompts must exist before packaging; Delivery consumes that output |

---

## Risks

- Export format compatibility: the package format must match how Cursor or the target tool consumes structured work; wrong format = zero adoption.
- If the upstream quality (stories, tasks, prompts) is poor, packaging doesn't add value — this area's usefulness depends entirely on upstream quality.

---

## Open Blockers

None. Export format resolved by PD-001 (2026-05-11).

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| Cursor package export | Founder exports their completed user stories, tasks, and prompts as a structured package ready to open in Cursor. | exploratory |

---

## Readiness Verdict

- [x] PRD source sections read
- [x] Product intent stated without technical language
- [x] Business objects enumerated
- [x] User journeys identified
- [x] In-scope / out-of-scope explicitly separated
- [x] No unresolved PRD open questions affecting this area
- [x] Deferred behaviors explicitly named
- [ ] Candidate Scope Slices are individually small enough

**Verdict:** CLEAR — PRD scope confirmed (PRD v2 / FG-POST-PRD-V1). Export format resolved by PD-001. Ready for Scope Slice definition.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial scaffold from approved Feature Area map (`/feature-area scaffold`) — created as `deferred` per PRD v1 FG-FUTURE; maps to "Cursor packaging" + "tech alignment" from FG-FUTURE | — |
| 2026-05-11 | Activated — PRD v2 promotes FG-FUTURE → FG-POST-PRD-V1 (active v1 scope); status changed `deferred` → `exploratory`; PRD scope blocker cleared; export format NEED_HUMAN blocker remains | — |
| 2026-05-11 | Export format resolved via PD-001 (`.cursor/` folder structure + WORK_QUEUE-compatible entries); NEED_HUMAN cleared; status `exploratory` → `validated` | — |
