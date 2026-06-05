<!--
  Feature Area — Decision Graph (blueprint moat T1)
  Source: docs/product/decision-graph-v1-spec.md
-->

# Feature Area: Decision graph

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- Blueprint moat ROI #8 — `docs/product/decision-graph-v1-spec.md`
- `docs/prd/PRD.md` — Business Objects (question history cross-ref)
- Related product decisions: none
- Depends: **Question history** FA (data amont)

---

## Product Intent

Every PRD section can be traced to **founder decisions** (chosen option, rejected alternatives) — not a disposable AI document. Owners see a **decision log** and links from PRD sections to those decisions.

---

## In Scope

- Persist **Decision** rows from structured question history (and future clarify turns).
- Owner-only **Decisions** panel (list + filter by section).
- **Section badges** on PRD viewer (count of linked decisions).
- Export `decisions.json` in Cursor delivery package (v1 slice 4).

## Out of Scope

- Force-directed graph visualization v1.
- Anonymous share viewers seeing decisions.
- Collaborative editing of decisions.
- Cross-project decision search.

---

## Business Objects Touched

| Object | Relationship |
|--------|--------------|
| Decision | New — links to project, PRD version, section |
| DecisionLink | New — decision ↔ section |
| Question history | Source for backfill |

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Question history | complete | Mapper required |
| PRD versioning | complete | Version scoping |
| Delivery | complete | Zip export extension |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| `decision-graph--persist-from-question-history` | Backfill + sync new entries | ready-for-user-stories |
| `decision-graph--owner-decisions-list-panel` | Onglet liste owner | ready-for-user-stories |
| `decision-graph--section-badges-and-links` | Badges PRD viewer | ready-for-user-stories |
| `decision-graph--export-decisions-json` | `decisions.json` in Cursor zip | ready-for-user-stories |

---

## Open Blockers

| Blocker | NEED_HUMAN |
|---------|------------|
| _(none)_ | — |

---

## Readiness Verdict

**Verdict:** READY FOR SCOPE SLICES

| Date | Change |
|------|--------|
| 2026-06-04 | FA created from blueprint T1 doc |
| 2026-06-04 | Open Blockers section added after `/feature-area refine-slice` pass on child slices | — |
