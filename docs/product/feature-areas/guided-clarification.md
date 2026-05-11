<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md
-->

# Feature Area: Guided clarification

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Feature Groups (FG-PRD-V0 — Guided clarification loop); § Core User Journeys (3); § Flow Inventory; § Integration Boundaries (AI inference — managed, no BYOK); § Surface Blockers (AI inference); § Risks & Assumptions (AI mini-form generation reliability); § Business Objects (cross-ref: clarification pairs with Question History FA)
- Related open questions: Q-017 (answered — interaction model); surface blockers tracked in PRD § Surface Blockers
- Related product decisions: none

---

## Product Intent

The founder moves from fuzzy thinking to concrete product decisions through a **chat-driven** experience: chat carries guidance and reasoning, and when a decision needs structure, Zedos presents **contextual constrained inputs** (decision card, checklist, ranked options, modal-style selects with optional "not sure / ask me differently"). This is **not** positioned as a static questionnaire nor as unconstrained chat-only typing as the sole pattern.

---

## In Scope

- Chat-guided clarification that stays the primary reasoning layer for the owner in the private workspace.
- On-the-fly constrained inputs when a product decision benefits from structured capture (per PRD sub-component list).
- In-app advance / approve affordances consistent with **Confirmation channel: in-app first** (exact control pattern remains UX detail).
- Contextual inline refinement: owner can re-open a focused clarification from the PRD, Architecture, or History tabs without navigating away.
- Clarification progress visibility: owner sees which PRD sections have been covered and which remain.

## Out of Scope

- Bring-your-own model or non-managed AI arrangements (Hard v0 exclusions: **no BYOK** in v0).
- Multi-user co-editing or invite-based clarification (Hard v0 exclusions).
- Anonymous share viewers participating in clarification (share surface is read-only and separate).

---

## Business Objects Touched

| Object | Relationship |
|--------|----------------|
| Project | Clarification is scoped to a project's PRD journey |
| PRD version | Outputs of clarification feed versioned PRD evolution (coordination with PRD versioning FA) |
| Question history | Each clarification turn produces a structured log entry (owned by Question History FA) |

*Structured log lines are owned by the **Question history** Feature Area; this area produces the live clarification experience that feeds those entries.*

---

## User Journeys Touched

- Journey 3 — Clarify and iterate using the chat-driven dynamic decision UI + contextual mini-forms.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Project workspace | validated | Must open a project context |
| PRD versioning | validated | Clarification iterates toward PRD updates |
| AI inference stance | resolved | `callAI` operational; provider selected operationally per existing implementation |

---

## Risks

- **AI mini-form reliability** (PRD): if constrained inputs are inconsistent, the whole clarification UX degrades; **no static-questionnaire fallback is defined for v0**.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN | Resolution |
|---------|--------|------------|------------|
| **AI inference / provider selection** | Reliability / cost boundaries | resolved | `lib/ai-service.ts` (`callAI`) operational; provider selected operationally. Waiver approved 2026-05-11. |
| **Mini-form quality bar** | v0 fallback decision | resolved | `decision-card.tsx` + streaming clarify route shipping in production. Waiver approved 2026-05-11. |

---

## Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| Chat-led clarification turn | Owner receives guidance in chat and can proceed with in-app advance/approve patterns. | exploratory |
| Contextual mini-form decision step | When needed, owner completes a constrained input pattern (cards, lists, ranking, structured selects) including "not sure / ask me differently." | exploratory |
| Contextual tab refinement | Owner refines a specific section or item from the PRD, Architecture, or History tab via a focused inline chat — without switching to the main clarification tab. | ready-for-user-stories |
| Question preview and progress score | Owner sees the next 2–3 uncovered PRD sections as a preview in the clarification tab, and the readiness score reflects answered / remaining sections rather than an opaque ADR-based metric. | ready-for-user-stories |

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

**Verdict:** VALIDATED — all blockers resolved or waived. Two new slices (contextual-tab-refinement, question-preview-and-progress-score) promoted to `ready-for-user-stories`.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-09 | Initial scaffold from approved Feature Area map (`/feature-area scaffold`) | — |
| 2026-05-11 | Waived AI provider + mini-form quality blockers (both resolved by existing implementation). Promoted to `validated`. Added two new scope slices: contextual-tab-refinement, question-preview-and-progress-score. | — |
