<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md
-->

# Feature Area: Guided clarification

## Status

`exploratory`

> **NEED_HUMAN:** true
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Feature Groups (FG-PRD-V0 — Guided clarification loop); § Core User Journeys (3); § Flow Inventory; § Integration Boundaries (AI inference — managed, no BYOK); § Surface Blockers (AI inference); § Risks & Assumptions (AI mini-form generation reliability); § Business Objects (cross-ref: clarification pairs with Question History FA)
- Related open questions: Q-017 (answered — interaction model); surface blockers tracked in PRD § Surface Blockers
- Related product decisions: none

---

## Product Intent

The founder moves from fuzzy thinking to concrete product decisions through a **chat-driven** experience: chat carries guidance and reasoning, and when a decision needs structure, Zedos presents **contextual constrained inputs** (decision card, checklist, ranked options, modal-style selects with optional “not sure / ask me differently”). This is **not** positioned as a static questionnaire nor as unconstrained chat-only typing as the sole pattern.

---

## In Scope

- Chat-guided clarification that stays the primary reasoning layer for the owner in the private workspace.
- On-the-fly constrained inputs when a product decision benefits from structured capture (per PRD sub-component list).
- In-app advance / approve affordances consistent with **Confirmation channel: in-app first** (exact control pattern remains UX detail).

## Out of Scope

- Bring-your-own model or non-managed AI arrangements (Hard v0 exclusions: **no BYOK** in v0).
- Multi-user co-editing or invite-based clarification (Hard v0 exclusions).
- Anonymous share viewers participating in clarification (share surface is read-only and separate).

---

## Business Objects Touched

| Object | Relationship |
|--------|----------------|
| Project | Clarification is scoped to a project’s PRD journey |
| PRD version | Outputs of clarification feed versioned PRD evolution (coordination with PRD versioning FA) |

*Structured log lines are owned by the **Question history** Feature Area; this area produces the live clarification experience that feeds those entries.*

---

## User Journeys Touched

- Journey 3 — Clarify and iterate using the chat-driven dynamic decision UI + contextual mini-forms.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Project workspace | pending | Must open a project context |
| PRD versioning | pending | Clarification iterates toward PRD updates |
| AI inference stance | blocked | PRD Surface Blocker: model/provider not fixed beyond managed usage |

---

## Risks

- **AI mini-form reliability** (PRD): if constrained inputs are inconsistent, the whole clarification UX degrades; **no static-questionnaire fallback is defined for v0**.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| **AI inference / provider selection** — PRD Surface Blocker: model/provider not specified beyond managed usage and no BYOK | Boundaries for production reliability, cost, and acceptable failure modes for mini-form generation | true |
| **Mini-form quality bar** — load-bearing assumption in Risks & Assumptions | Whether v0 ships without a defined fallback if quality is insufficient | true |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| Chat-led clarification turn | Owner receives guidance in chat and can proceed with in-app advance/approve patterns. | exploratory |
| Contextual mini-form decision step | When needed, owner completes a constrained input pattern (cards, lists, ranking, structured selects) including “not sure / ask me differently.” | exploratory |

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

**Verdict:** BLOCKED — PRD Surface Blockers and reliability assumption require human resolution (`NEED_HUMAN: true`).

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-09 | Initial scaffold from approved Feature Area map (`/feature-area scaffold`) | — |
