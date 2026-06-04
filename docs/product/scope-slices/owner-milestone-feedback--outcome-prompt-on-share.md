# Scope Slice: Outcome prompt on share milestone

## Parent Feature Area

[Owner milestone feedback](../feature-areas/owner-milestone-feedback.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

After I create a share link, Zedos asks whether I **actually shared externally** so product learns real outcomes, not vanity stars alone.

---

## Exact Boundary

### Included Behavior

- On milestone **`prd_shared`**, replace **primary** prompt with **outcome O1** per `docs/product/outcome-tracking-prompts-alignment.md`: Yes / Not yet / No (external share).
- **Optional collapsed** 1–5 stars as secondary (legacy signal).
- Store response with **project**, **PRD version**, **milestone**, **timestamp** (existing feedback object).
- **Signed-in owner only** — no prompts on anonymous share views.
- **Freeze** outcome changes on other milestones in this slice (`prd_created`, `prd_updated`, `prd_viewed` unchanged).

### Excluded Behavior

- **O2 pitched** follow-up (48h after Yes).
- **O3 shipped** on `cursor_export_completed` (separate slice/phase).
- Viewer feedback on share page.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Prompt — shown | Share link minted | Modal or inline O1 question |
| Prompt — skipped | Owner dismisses | No blocking; milestone logged as skipped |
| Prompt — answered Yes/Not yet/No | Selection | Saved; optional stars collapsed |
| No prompt — wrong actor | Anonymous | Never shown |
| Stars only — secondary | Owner expands | Optional 1–5 |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Owner feedback / outcome | Create | O1 response |
| Share link event | Read | Triggers milestone |
| PRD version | Read | Attribution |

---

## Credit / Payment Impact

None.

---

## Sharing / Privacy Impact

None — prompt is owner-only; share URL behavior unchanged.

---

## Feedback / Instrumentation Impact

**Yes** — this slice **is** the instrumentation change for `prd_shared` outcome rate metrics.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| FA-owner-milestone-feedback | Feature Area | complete | Milestone infra |
| `docs/product/outcome-tracking-v1.md` | Spec | complete | O1 definition |
| FA-read-only-sharing | Feature Area | complete | Share milestone |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

After creating a **share link**, the **owner** sees the **O1 outcome** question as the primary prompt, can answer or skip, and the response is **stored with correct attribution** without prompting anonymous viewers.

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
