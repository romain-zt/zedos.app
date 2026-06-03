<!--
  Feature Area — fast-track / mode urgent (H1)
  Autonomous Feature Area (not a FG-PRD-V0 sub-component only)
  Shipped: no — Planned v0 per PRD Flow Inventory (Q-027)
-->

# Feature Area: Fast-track / mode urgent

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` — Core User Journeys **#10** (Express / fast-track), **#2** (project intention), **#3** (clarify), **#4** (version), **#8** (share)
- `docs/prd/PRD.md` — Flow Inventory (express rows, Planned v0)
- `docs/prd/PRD.md` — Configuration Matrix (journey mode, express livrable sections, express share copy)
- `docs/prd/PRD.md` — MVP Completeness Checklist (express items)
- Related open questions: **none** (Q-024–Q-029 answered)
- Related product decisions: **PD-002**
- Context: `docs/product/product-hics-diagnostic.md` (H1), `docs/prd/notes/2026-06-03-product-hics-fast-track.md`

---

## Product Intent

When a founder needs a **deliverable now** (deadline, pitch, partner read, pivot this week), Zedos **recognizes urgency**, runs a **shortened clarification path** (**minimum IA** only), produces a **livrable express** (structured output with **lean content** per section), and enables **immediate share/export** — without forcing the full standard discovery loop. The founder can **switch to standard mode** later and deepen the PRD in new versions while keeping the express lineage.

---

## In Scope

- Declare **express** journey mode at **project creation** or **mid-project** (switch back to standard allowed).
- **Livrable express** : **12 sections** (+ `title` / `version_summary`) with **lean content** per section — same headings as configured in PRD, not fewer rubriques than standard depth policy (Q-025, Q-026, Q-029).
- Clarify in express mode : **minimum IA** (smallest question set the product deems necessary).
- **Same credit burn rates** as standard (per PRD tier model; PD-002).
- **Express labeling** on share surface and owner-facing PRD view: **version express — à approfondir**.
- **Post-PRD surfaces** (feature-split, user stories, delivery, architecture unlock path): **visible, disabled (grayed)**, with product copy explaining deferral or switch to standard.
- **Exit paths** : share link, in-app read (existing); print/HTML export where available; Markdown export not required for “done”.
- **Defer deepen** : explicit path to standard mode and enrich via new PRD versions (express lineage preserved).

## Out of Scope

- **Import external PRD** (paste/file) — separate Feature Area; combinable at product level but not owned here.
- Reduced credit pricing or urgent-only packs (PD-002).
- Hiding post-PRD navigation entirely in express mode (PD-002: grayed, not hidden).
- Multi-user collaboration / co-editing on express versions (v0 solo).
- Subscription billing, BYOK, unlimited free AI (PRD hard v0 exclusions).
- Advanced share controls (password, expiry) beyond owner disable + noindex.

---

## Business Objects Touched

| Object | Relationship |
|--------|--------------|
| Project | Carries journey mode: **standard** or **express** (switchable) |
| PRD version | Express versions distinguished for share copy and owner UX |
| Share link | Renders express disclaimer for viewers |
| Question history | Fewer entries expected in express; structured when minimum IA runs |

---

## User Journeys Touched

- **Journey 2** — Create or select project → choose **express** intention or switch mid-project.
- **Journey 10** — Express / fast-track: minimum IA → livrable express → share/export; post-PRD grayed; deepen later via standard.
- **Journey 3** — Clarify and iterate (minimum IA branch in express mode).
- **Journey 4** — Version the PRD (express vs standard depth / lineage).
- **Journey 8** — Share with express disclaimer on anonymous read surface.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Project workspace | validated | Entry point for mode switch |
| PRD versioning | validated | Express v1+; standard enrichment = new versions |
| Guided clarification | validated | Minimum IA policy branch |
| Read-only sharing | validated | Express disclaimer on anonymous surface |
| Post-PRD pipeline (FG-POST-PRD-V1) | pending | Grayed shell + copy only in express; full pipeline v1 |

---

## Risks

- **Minimum IA** variability may still feel long for some users — track time-to-first-share.
- Express vs standard **dual mode** complexity in journey UI (orientation FA H3 should reference active mode).
- Founders with an existing external doc still need the **import** Feature Area (H2) — not solved by fast-track alone.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| `fast-track-urgent--declare-express-mode` | Create or switch express journey mode at project level | exploratory |
| `fast-track-urgent--express-deliverable-generation` | Minimum IA → livrable express (12 sections, lean content) + version tagging | exploratory |
| `fast-track-urgent--express-share-disclaimer` | Share page and owner view: version express — à approfondir | exploratory |
| `fast-track-urgent--grayed-post-prd-shell` | Post-PRD navigation visible but disabled with product message | exploratory |

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
| 2026-06-03 | Aligned with PRD Q-024–Q-029, PD-002, autonomous FA; status exploratory | — |
| 2026-06-03 | Promoted to validated after CLEAR readiness check (`/feature-area promote`) | — |
