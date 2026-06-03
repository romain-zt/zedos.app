<!--
  Feature Area — Import external PRD (Q-028)
  Shipped: no — Planned v0 per PRD Flow Inventory
-->

# Feature Area: Import external PRD

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` — Core User Journeys **#2**, **#11**; Flow Inventory (Import external PRD — Planned v0); FG-PRD-V0 sub-component **Import external PRD**
- `docs/prd/questions/open-questions.md` — Q-028 (answered: **v0**)
- Related product decisions: none (combinable with **express** per PD-002 / PRD)
- Context: `docs/product/product-hics-diagnostic.md` (H2)

---

## Product Intent

A founder who **already has a PRD** (ChatGPT, Claude, Notion export, etc.) can **paste or upload** it at **project creation** (or in the same creation step as mode choice) so Zedos **persists an in-app version** without forcing a full clarify loop when content is already sufficient. **Import** and **express** are **distinct intentions** but **combinable** on one project.

---

## In Scope

- **Paste** plain text (or markdown-like text) into a creation-time capture control.
- **Upload** a file (product-defined allowed types, e.g. `.md`, `.txt` — exact MIME list at `/plan` time).
- Persist imported content as a **PRD version** in-app (canonical state per Q-006).
- Optional **light restructure** prompt (IA) when paste is messy — not mandatory for v0 “done”.
- **Skip or shorten clarify** when imported content is deemed sufficient (product rule at generation boundary — not “zero questions” guaranteed for every import).
- Combinable with **standard** or **express** journey mode on the same project creation flow.

## Out of Scope

- Live sync from Notion/Google Docs APIs (no connector v0).
- Import **after** project creation as primary v0 path (creation-time is the PRD anchor; post-create import = future slice).
- Replacing **express minimum IA** or **livrable express** generation (fast-track FA).
- Markdown/PDF **export** as mandatory complete (PRD exclusion).
- Multi-user import / shared drives.

---

## Business Objects Touched

| Object | Relationship |
|--------|----------------|
| Project | Created with optional import path |
| PRD version | First (or early) version seeded from external content |
| Question history | May be empty or minimal when clarify skipped |

---

## User Journeys Touched

- Journey 2 — Create project with **import** intention.
- Journey 11 — Import external PRD (paste / file → in-app version).

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Project workspace | validated | Creation entry point |
| PRD versioning | validated | Persist imported body as version |
| Guided clarification | validated | May be skipped or shortened after import |
| Fast-track / express | validated (partial) | Combinable; express generation is sibling FA |

---

## Risks

- **Format chaos:** pasted HTML or huge files → need size limits and sanitization (product: max size at plan; not here).
- **False “done”:** founders assume import = PRD complete without review — mitigated by express disclaimer when in express mode (sibling FA).

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| `prd-import--capture-external-prd-at-create` | Paste + file upload at project creation → persisted PRD version | ready-for-user-stories |

---

## Readiness Verdict

- [x] PRD source sections read
- [x] Product intent stated without technical language
- [x] Business objects enumerated
- [x] User journeys identified
- [x] In-scope / out-of-scope explicitly separated
- [x] No unresolved PRD open questions affecting this area
- [x] Candidate Scope Slices are individually small enough

**Verdict:** READY FOR SCOPE SLICES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Feature Area created; aligns Q-028, Flow Inventory Planned v0 | doc-sync |
