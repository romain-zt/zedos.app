<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md
  Activated in PRD v2 (FG-POST-PRD-V1) — post-PRD pipeline brought into active v1 scope.
-->

# Feature Area: Services / feature split

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Feature Groups (FG-POST-PRD-V1 — "Post-PRD pipeline: services/feature split…"; `exploratory`); § Global Product Picture ("Beyond v0 — FG-POST-PRD-V1 (active v1 scope): services/feature split → user stories → test-first workflows → Cursor delivery"); § FG-POST-PRD-V1 Sub-components ("Services / feature split"); § Flow Inventory ("Post-PRD pipeline… | Yes (v1 scope — FG-POST-PRD-V1)")
- Related open questions: none
- Related product decisions: none

---

## Product Intent

After a PRD is stable, the founder decomposes their product narrative into **distinct services or feature groups** — named product areas that can be planned and delivered independently. This is the first step in the post-PRD pipeline: turning a versioned PRD into a structured map of what to build, in what order, so the founder no longer stares at a monolithic document wondering where to start.

---

## In Scope

- Taking a stable, versioned PRD and identifying distinct feature groups or services within it.
- Naming each cluster with a short label and a one-line description of the user value it delivers.
- Establishing clear boundaries between clusters so they can be planned independently.
- Presenting the split to the founder in a way that is actionable (not just a taxonomy).

## Out of Scope

- Generating user stories or tasks from the split (owned by the User stories Feature Area, downstream).
- Architectural or runtime service boundary decisions (product naming only — no tech decisions here).
- Multi-user or collaborative split editing (Hard v0 exclusions carry forward from PRD).
- v0 PRD workflow (owned by FG-PRD-V0 Feature Areas).

---

## Business Objects Touched

| Object | Relationship |
|--------|-------------|
| PRD version | Consumed as the input for the split; the founder's stable PRD feeds this workflow |
| Feature group / service | Created as the output — named product clusters the founder can act on |

---

## User Journeys Touched

- Founder opens a completed PRD version and initiates a feature split to decompose it into named service/feature clusters.
- Founder reviews, adjusts, and confirms the proposed clusters before proceeding to user story generation.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| PRD versioning FA | pending | A stable, versioned PRD is required as input; the founder must have completed the PRD flow first |

---

## Risks

- Splitting too coarsely produces clusters too large to plan; splitting too finely produces noise. The product must guide the founder toward an appropriate granularity.
- The split may conflict with the founder's intuition about their product — the product must make it easy to adjust, not prescriptive.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| None | — | — |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| PRD-to-feature-split | Founder generates a first-pass feature split from a stable PRD version and can review or adjust the proposed clusters. | ready-for-user-stories |

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

**Verdict:** READY FOR SCOPE SLICES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial scaffold from approved Feature Area map (`/feature-area scaffold`) — created as `deferred` per PRD v1 FG-FUTURE | — |
| 2026-05-11 | Activated — PRD v2 promotes FG-FUTURE → FG-POST-PRD-V1 (active v1 scope); status changed `deferred` → `exploratory`; PRD scope blocker cleared | — |
| 2026-05-11 | Promoted to validated after CLEAR readiness check (`/feature-area promote`) | — |
