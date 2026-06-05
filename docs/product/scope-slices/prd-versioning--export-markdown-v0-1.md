# Scope Slice: Export Markdown v0.1

## Parent Feature Area

[PRD versioning](../feature-areas/prd-versioning.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

I download my active PRD version as a **Markdown** file for stakeholders outside Zedos.

---

## Exact Boundary

### Included Behavior

- **Export MD** control on PRD viewer toolbar and version menu per `docs/product/export-markdown-v0.1-spec.md`.
- File includes title, version metadata, **canonical section order** (8 standard or 12 express), `version_summary`, section bodies.
- **Express disclaimer** block in header when `deliverable_kind=express` (PD-002).
- **Zero credits** — read-only snapshot export.
- Exports **active version snapshot** only (not full history zip).

### Excluded Behavior

- **PDF** export.
- Auto-sync export to share link.
- Bulk export all versions.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Ready | Version loaded | Export MD enabled |
| Download — success | Click export | Browser downloads `.md` |
| Error — no version | Missing version | Button disabled |
| Express — disclaimer | Express version | Disclaimer in file header |
| Gated — not signed in | Expired session | Sign-in required |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| PRD version | Read | Snapshot source |
| Export file | Create | Client download |

---

## Credit / Payment Impact

**None** — explicit 0 credit per spec (Q-006 fast follow alignment).

---

## Sharing / Privacy Impact

None — export is owner-initiated download; does not change share link content.

---

## Feedback / Instrumentation Impact

Optional: `prd_export_md_completed` with version id.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| FA-prd-versioning | Feature Area | complete | Versions |
| `docs/product/export-markdown-v0.1-spec.md` | Spec | complete | Layout |
| PD-002 | Product decision | accepted | Express disclaimer |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

A signed-in owner downloads a **Markdown** file reflecting the **current PRD version** with correct sections and express disclaimer when applicable, without spending credits.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated (including error and empty states)
- [x] Business objects named
- [x] Credit / payment impact assessed
- [x] Sharing / privacy surface assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-04 | Blueprint scaffold (minimal) | — |
| 2026-06-04 | `/feature-area refine-slice` | — |
| 2026-06-04 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
