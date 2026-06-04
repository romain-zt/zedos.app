# Scope Slice: Evaluate drift and weekly digest

## Parent Feature Area

[PRD drift (GitHub)](../feature-areas/prd-drift-github.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

I receive drift alerts when GitHub activity and my PRD disagree, including a weekly summary in my inbox.

---

## Exact Boundary

### Included Behavior

- Scheduled **evaluation** of drift signals **DRIFT-01..04** per spec when repo connected.
- Create **DriftSignal** records owner can view in **drift inbox** UI.
- Owner actions: **resolve** or **dismiss** per signal.
- **Weekly email digest** of open/recent signals (opt-out product rule TBD — default on for connected projects).
- Coordination hook: may set **next action banner** drift state when open signals exist (banner slice consumes flag).

### Excluded Behavior

- Real-time **webhook** ingestion (`prd-drift-github--webhook-realtime`).
- GitLab/Bitbucket.
- Automatic PRD edits from code.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Inbox — empty | No signals | Empty state « No drift detected » |
| Inbox — items | Signals exist | List with severity, summary, CTA to PRD section |
| Resolved | Owner resolves | Item leaves open queue |
| Dismissed | Owner dismisses | Hidden from open queue; audit retained |
| Email — digest | Weekly job | Email with top signals + link to inbox |
| Skipped — no repo | Not connected | Evaluation does not run |
| Error — evaluation failed | Job error | Owner-safe message; retry later |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| DriftSignal | Create, Read, Update | Inbox + email |
| Project / GitHub link | Read | Prerequisite |
| PRD version | Read | Comparison baseline |

---

## Credit / Payment Impact

None for evaluation v1 (no AI burn in slice boundary unless spec adds AI summary later — excluded here).

---

## Sharing / Privacy Impact

None — drift inbox is owner-only.

---

## Feedback / Instrumentation Impact

**Yes** — `drift_signal_created`, `drift_inbox_opened`, `drift_signal_resolved`.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `prd-drift-github--connect-repo` | Scope Slice | ready-for-user-stories | Must be connected |
| `docs/product/prd-drift-github-v1-spec.md` | Spec | complete | Signal definitions |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

With a connected repo, the system **detects** drift per signal rules, surfaces signals in an **owner inbox**, sends a **weekly digest email**, and lets the owner **resolve** or **dismiss** each item.

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
