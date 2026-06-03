# Scope Slice: Declare express journey mode

## Parent Feature Area

[Fast-track / mode urgent](../feature-areas/fast-track-urgent.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A founder can choose **express** when creating a project or switch between **express** and **standard** mid-project, and can explicitly move to **standard** to deepen the PRD later without losing express lineage.

---

## Exact Boundary

### Included Behavior

- At **project creation**, the founder chooses **standard** (default) or **express** as journey intention (Journey 2); choice is distinct from **import external PRD** (other FA) but may appear on the same creation step without this slice owning import.
- On an **existing project**, the founder can switch to **express** or back to **standard** at any time (PD-002, permanent toggle).
- An explicit **Approfondir / Passer en standard** action: sets journey mode to **standard** so subsequent clarification and versions follow standard depth; **existing express versions stay in version history**.
- The **active journey mode** (standard | express) is always visible to the signed-in owner while inside the project (label or equivalent affordance).
- After switching to **express**, the owner is routed into the express clarification path entry (actual minimum IA flow is `express-deliverable-generation`).

### Excluded Behavior

- Generating a **livrable express** or running **minimum IA** clarify (slice `express-deliverable-generation`).
- **Import external PRD** (paste/file) — separate Feature Area.
- Share disclaimer copy (slice `express-share-disclaimer`).
- Post-PRD grayed navigation (slice `grayed-post-prd-shell`).
- Reduced credit pricing or urgent-only packs (PD-002).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Creation — mode choice | New project flow (Journey 2) | **Standard** pre-selected; founder can select **Express (urgent)** before confirming create |
| Creation — submitting | Create in flight | Primary action loading; mode choice locked until success or error |
| Creation — success | Project created | Lands in project workspace with chosen mode reflected in visible mode indicator |
| Creation — failure | Create fails | Error message; founder can retry without losing mode selection |
| In project — standard active | Project journey mode = standard | Mode indicator shows **Standard**; express switch affordance available |
| In project — express active | Project journey mode = express | Mode indicator shows **Express**; standard switch and **Approfondir** affordances available |
| Mid-project — switching to express | Founder activates express on existing project | Short confirmation that next work follows express path (minimum IA, livrable express); prior versions unchanged |
| Mid-project — switching to standard | Founder leaves express for standard | Confirmation that **new** work uses standard depth; copy notes express versions remain in history |
| Deepen — express → standard | Founder chooses **Approfondir** | Mode becomes standard; owner can start standard clarify / versioning without deleting express versions |
| Blocked — not signed in | Session expired | Redirect to sign-in; no mode change (account-session FA) |
| Edge — mode switch with versions | Project already has PRD versions | Switch allowed; indicator updates; no version deletion |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Project | Read | Current journey mode for display |
| Project | Update | Persist **standard** or **express** at create and on mid-project switch |
| PRD version | Read | Version history unchanged when mode switches; express vs standard classification on versions owned by other slices |

---

## Credit / Payment Impact

None — no credit consumption or purchase flow in this slice; mode selection only.

---

## Sharing / Privacy Impact

None — no change to share link semantics or anonymous viewer surface in this slice.

---

## Feedback / Instrumentation Impact

None — no new milestone prompts; mode changes may be attributed in analytics later (out of slice scope).

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Project workspace | Feature Area capability | validated | Create / open projects |
| PRD versioning | Feature Area capability | validated | Deepen via new versions after switch to standard |
| PD-002 | Product decision | accepted | Trigger at create + mid-project |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

A signed-in founder can create a project with **express** or **standard** intention, see the active mode at all times inside the project, switch modes mid-project without losing version history, and use **Approfondir** to move to **standard** for deeper work while express versions remain available in the version list.

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
| 2026-06-03 | Scaffolded from approved `/feature-area slice` proposal via `/feature-area scaffold-slices` | — |
| 2026-06-03 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
