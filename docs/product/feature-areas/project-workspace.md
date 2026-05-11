<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md
-->

# Feature Area: Project workspace

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Feature Groups (FG-PRD-V0 — Project workspace); § Core User Journeys (2, 5); § Flow Inventory; § Operating Model (one account owns projects); § Business Objects (Project)
- Related open questions: none (active queue empty)
- Related product decisions: none

---

## Product Intent

The founder can organize work into **multiple projects** (each a container for a product line or idea), then **create, list, and open** the project they want to work on. This area is distinct from switching **PRD versions within** a project — that is a separate navigation job in the PRD.

---

## In Scope

- Create projects.
- List projects the owner can access (solo v0: owned by the signed-in account).
- Open a project to continue PRD / clarification work for that lineage.
- Switch between projects when working across multiple ideas (Journey 5).

## Out of Scope

- Multi-user project membership, invites, shared ownership, or role-based project access (Hard v0 exclusions).
- Import/export of projects as a mandatory workflow (Markdown/PDF export are not MVP “done” gates per PRD).

---

## Business Objects Touched

| Object | Relationship |
|--------|----------------|
| Project | Create, list, open; container for PRD versions and clarification history |
| User account | Owns projects in solo v0 |

---

## User Journeys Touched

- Journey 2 — Create or select a project → open the PRD / clarification flow for that project.
- Journey 5 — Switch projects to work on another PRD lineage.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Account & session | complete | better-auth session shipped (`fa_account_session` complete) |

---

## Risks

- Weak project organization UX makes multi-PRD founders lose thread — undermines core promise of “never losing the narrative.”

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| Create project | Founder creates a new project container and can proceed to PRD work inside it. | complete |
| List and open project | Founder finds an existing project and opens it to resume work. | complete |
| Switch active project | Founder moves between projects without losing account context. | exploratory |

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
