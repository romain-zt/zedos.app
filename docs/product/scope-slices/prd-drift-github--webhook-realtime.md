# Scope Slice: GitHub webhook realtime drift

## Parent Feature Area

[PRD drift (GitHub)](../feature-areas/prd-drift-github.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

I get near-real-time drift signals when GitHub events occur instead of waiting only for the weekly digest.

---

## Exact Boundary

### Included Behavior

- Register **GitHub webhook** on connected repository for product-relevant events (push, issues, release — per `living-prd-github-webhook-brief.md`).
- Ingest webhook payloads → create or update **DriftSignal** rows (same inbox as evaluation slice).
- **Idempotent** handling for duplicate deliveries.
- In-app notification or inbox badge for new realtime signals (owner).

### Excluded Behavior

- Replacing scheduled evaluation entirely (weekly + evaluation slice remains).
- Comment-level NLP on every commit.
- Auto-merge or PRD patch from webhook.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Realtime — new signal | Webhook fires | Inbox shows new item; optional badge |
| Duplicate delivery | GitHub retries | No duplicate open signal |
| Webhook — misconfigured | Secret mismatch | Ops alert; owner sees « realtime paused » |
| No connection | Repo disconnected | Webhook inactive |
| Digest still sent | Weekly job | Complements realtime |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| DriftSignal | Create, Update | From webhook |
| GitHub webhook registration | Create, Delete | Tied to project connection |

---

## Credit / Payment Impact

None.

---

## Sharing / Privacy Impact

None.

---

## Feedback / Instrumentation Impact

**Yes** — `drift_webhook_received`, `drift_signal_realtime_created`.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `prd-drift-github--connect-repo` | Scope Slice | ready-for-user-stories | Repo linked |
| `prd-drift-github--evaluate-and-weekly-digest` | Scope Slice | ready-for-user-stories | Shared inbox model |
| `docs/product/living-prd-github-webhook-brief.md` | Brief | complete | Event list |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

When GitHub sends a subscribed event for a connected project, Zedos records a **DriftSignal** visible in the owner inbox within minutes, without duplicate open items for the same underlying change.

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
