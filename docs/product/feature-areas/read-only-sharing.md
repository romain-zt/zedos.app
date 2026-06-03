<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md
  Shipped: Yes — Flow Inventory (mint, anonymous read, revoke, noindex); orchestration complete per status.json
-->

# Feature Area: Read-only sharing

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Feature Groups (FG-PRD-V0 — Share); § Core User Journeys (8); § Flow Inventory; § Hard v0 exclusions (advanced share controls); § Business Objects (Share link); § Integration Boundaries (Identity; Search engines noindex intent); § Risks (public read-only links / leakage)
- Related open questions: Q-011, Q-012 (answered — anonymous read-only links; no password/expiry in v0)
- Related product decisions: none

---

## Product Intent

The owner can mint a **read-only public link** so **anonymous viewers** can read **only** the shared PRD presentation — without editing, commenting, duplicating, or seeing **private/workspace history**. The owner can **disable** the link; the page is **not** intended for search indexing (**noindex** product intent).

---

## In Scope

- Generate a share artifact the owner can distribute as a **public read-only** experience.
- Anonymous read of **shared PRD content** per PRD boundaries (no workspace/history leakage on the share surface).
- Owner **revokes / disables** the link.
- **Noindex** behavior as a **product requirement** (policy/robots level described at PRD, not as implementation here).

## Out of Scope

- **Advanced share controls** in v0: **password**, **time-based expiry**, extra “private link” controls beyond **owner disable** + **noindex** (Hard v0 exclusions).
- Anonymous **feedback prompts** on the share surface (deferred post-v0).
- Markdown/PDF export as mandatory “PRD complete” (export not in this FA’s MVP gate).

---

## Business Objects Touched

| Object | Relationship |
|--------|----------------|
| Share link | Create, expose read-only surface, revoke; ties to which PRD content is shared |

---

## User Journeys Touched

- Journey 8 — Share: mint read-only URL, anonymous read, disable link, noindex intent.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| PRD versioning | validated | Share must reference stable “what is shown” semantics for a version |

---

## Risks

- **Leakage** (PRD): if share surface over-exposes private clarification/history, trust breaks — boundaries must stay strict.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| [`read-only-sharing--mint-read-only-link`](../scope-slices/read-only-sharing--mint-read-only-link.md) | Owner creates a public read-only link for the intended PRD content. | ready-for-user-stories (**impl.** US/plan executed) |
| [`read-only-sharing--anonymous-read-surface`](../scope-slices/read-only-sharing--anonymous-read-surface.md) | Viewer reads shared content only; no edit/comment/workspace/history on share surface. | ready-for-user-stories (**impl.** US/plan executed) |
| [`read-only-sharing--revoke-link-and-noindex`](../scope-slices/read-only-sharing--revoke-link-and-noindex.md) | Owner disables link; share URL non-indexable by product intent. | ready-for-user-stories (**impl.** US/plan executed) |

> **Queue :** `FA-read-only-sharing` + **`SS-read-only-sharing--*`** ×3 = **`complete`** (`docs/WORK_QUEUE.md`). Slice files keep **`ready-for-user-stories`** per SS-11; orchestration keys `fa-read-only-sharing--*` = **complete** in `status.json`.

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
| 2026-05-09 | Initial scaffold from approved Feature Area map (`/feature-area scaffold`) | — |
| 2026-05-11 | Promoted to validated after CLEAR readiness check (`/feature-area promote`) | — |
| 2026-06-03 | Scope Slices table synced — Shipped; removed stale `exploratory` | doc-sync |
