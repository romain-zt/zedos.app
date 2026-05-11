<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md (FG-FUTURE north star arc)
  Status: deferred — PRD v1 marks post-PRD pipeline as "under construction / not v0"
-->

# Feature Area: Services / feature split

## Status

`deferred`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Feature Groups (FG-FUTURE — "Services/feature split, tech alignment, Cursor packaging, user stories, delivery loop"; `deferred`); § Global Product Picture (north star arc: "versioned PRD → services/feature grouping…"); § Product Overview ("services/feature split… out of v0 scope… under construction"); § Out of Scope ("Post-PRD pipeline (services split…) | No (dashboard: under construction)")
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

- Not yet defined in PRD v1 (this area is post-v0 north star). TBD when the PRD is updated to include the post-PRD pipeline.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| PRD versioning FA | pending | A stable, versioned PRD is required as input; the founder must have completed the PRD flow first |
| PRD v1 update | blocked | PRD must move FG-FUTURE into active scope before this FA can advance to `exploratory` |

---

## Risks

- Splitting too coarsely produces clusters too large to plan; splitting too finely produces noise. The product must guide the founder toward an appropriate granularity.
- The split may conflict with the founder's intuition about their product — the product must make it easy to adjust, not prescriptive.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| PRD scope — FG-FUTURE is `deferred` in PRD v1 | Advancement to `exploratory` and all downstream work | false — requires `/evol` or `/prd update` to bring into active scope, not a human product decision |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| PRD-to-feature-split | Founder generates a first-pass feature split from a stable PRD version and can review or adjust the proposed clusters. | deferred |

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
