# Scope Slice: Official seed template catalog

## Parent Feature Area

[Templates marketplace](../feature-areas/templates-marketplace.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

I pick from proven PRD templates (express pitch, B2B SaaS, import cleanup) instead of starting from a blank project.

---

## Exact Boundary

### Included Behavior

- **10 official templates** with metadata (title, description, journey mode hint, slug) and content body per `docs/product/templates-marketplace-v1-cadrage.md`.
- In-app **catalog** surface (route or dashboard entry) listing templates read-only.
- Templates are **Zedos-authored** only (no UGC v1).

### Excluded Behavior

- **Use template on create** pre-fill flow (next slice).
- Community publish, ratings, payments for templates.
- Editing template content in-app by founders.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Catalog — loaded | Owner opens catalog | Grid/list of 10 templates |
| Catalog — empty | Seed data missing (ops) | Maintenance message |
| Detail — preview | Clicks template | Description + journey hint |
| Loading | Fetch catalog | Skeleton cards |
| Error | Fetch failed | Retry |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Template catalog entry | Read | Static seed |
| Template content | Read | Markdown body |

---

## Credit / Payment Impact

None — browsing catalog is free.

---

## Sharing / Privacy Impact

None.

---

## Feedback / Instrumentation Impact

Optional: `template_catalog_viewed`, `template_preview_opened`.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `docs/product/templates-marketplace-v1-cadrage.md` | Cadrage | complete | 10 templates list |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

A signed-in owner can open the **catalog**, see **10 official templates** with accurate descriptions, and preview any template before using it in project creation (next slice).

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
