<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md
-->

# Feature Area: Dashboard shell

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Core User Journeys (1); § Global Product Picture; § MVP Completeness Checklist (under construction); § Feature Groups (FG-PRD-V0 — dashboard shell note); § Out of Scope (beyond PRD path shown as under construction)
- Related open questions: none (active queue empty)
- Related product decisions: none

---

## Product Intent

After sign-in, the founder sees a **home base** that orients them toward PRD work and honestly communicates what is **not** in v0. This area prevents “north star” confusion by labeling non-PRD product directions as **under construction** instead of implying they ship now.

---

## In Scope

- Post-sign-in landing experience that supports entering PRD workflows.
- Clear in-product signaling where applicable: capabilities beyond the PRD path are **under construction** (per PRD MVP checklist).
- Orientation that reinforces **v0 is the PRD slice**; long-term pipeline is visible only as framing, not as shipped scope.

## Out of Scope

- Shipping full post-PRD pipeline capabilities (services/feature split, Cursor packaging, user stories, test-first delivery, etc.) — PRD defers these as non-v0 deliverables.
- Multi-user dashboards, collaboration entry points, or invite management (Hard v0 exclusions).
- Anonymous or share-viewer dashboard experiences (share is a separate surface).

---

## Business Objects Touched

| Object | Relationship |
|--------|----------------|
| User account | Signed-in context for what the shell shows and who it addresses |

---

## User Journeys Touched

- Journey 1 — Sign up → land in dashboard (non-PRD areas may show **under construction**).

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Account & session | pending | Must establish signed-in owner before shell is meaningful |
| Approved v0 vs deferred messaging | ready | Global Product Picture + Out of Scope |

---

## Risks

- **North-star confusion** (PRD Risks): if labeling is weak, users believe deferred areas are available — undermines trust and scope clarity.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| Signed-in home orientation | Owner lands on a shell that routes toward projects/PRD and sets expectations for v0 vs under construction. | exploratory |
| Under-construction placeholders | Non-PRD roadmap surfaces show honest deferred state without implying feature completeness. | exploratory |

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

**Verdict:** NOT READY

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-09 | Initial scaffold from approved Feature Area map (`/feature-area scaffold`) | — |
