# Scope Slice: Linear push stories and status sync

## Parent Feature Area

[Integrations (Linear)](../feature-areas/integrations-linear.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false
> **Gate override (2026-06-05):** `GATE-LINEAR-001` (≥3 founding-builder demand) is **waived by user decision** so the v1 scaffold can land code-but-dark. The blocker remains operationally true — if organic demand never reaches 3, the surface stays a stub. See changelog.

---

## User Value

I push Zedos user stories into Linear and see status updates flow back into my product workspace.

---

## Exact Boundary

### Included Behavior

- **Gate:** implement only after **≥3** founding builders request Linear (`integrations-linear-brief.md`).
- **OAuth Linear**; owner picks team/project.
- **Push** selected user story → Linear issue.
- **Webhook** updates story status in Zedos when issue status changes in Linear.

### Excluded Behavior

- Comment sync, epic automation, bi-directional description edits v1.
- Pushing without owner consent per story.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Gated — demand | <3 requests | Feature hidden or waitlist message |
| Connect — Linear | Owner connects | OAuth + team picker |
| Push — success | Story pushed | Linked issue id shown |
| Push — failure | API error | Retry message |
| Sync — inbound | Webhook | Story status updates in list |
| Disconnected | OAuth revoked | Reconnect CTA |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| User story | Read, Update | Status sync |
| Linear connection | Create, Read | OAuth |
| External issue link | Create | Mapping |

---

## Credit / Payment Impact

None.

---

## Sharing / Privacy Impact

None — integration is owner workspace.

---

## Feedback / Instrumentation Impact

Optional: `linear_issue_pushed`, `linear_status_synced`.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| FA-integrations-linear | Feature Area | proposed | Must promote FA after gate |
| FA-user-stories | Feature Area | complete | Story source |
| GATE-LINEAR-001 | Demand gate | pending | ≥3 concierge requests |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| GATE-LINEAR-001 | Demand gate not met | false — **waived 2026-06-05 by user override** (see changelog). v1 ships dark scaffold; real Linear API client stays stubbed until gate is met by organic demand. |
| B-FA-LINEAR-001 | Parent FA not `validated` | false |

---

## Acceptance-Level Outcome

After gate and FA promotion, an owner connects **Linear**, pushes a **user story** to an issue, and sees **status changes** in Linear reflected on the story in Zedos.

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
- [x] All blockers resolved or NEED_HUMAN=true explicitly set — GATE-LINEAR-001 waived by user (2026-06-05)
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES (gate-waived; v1 stub ships dark)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-04 | Blueprint scaffold (minimal) | — |
| 2026-06-04 | `/feature-area refine-slice` — exploratory, BLOCKED | — |
| 2026-06-05 | Promoted `exploratory` → `ready-for-user-stories` by **user override**. `GATE-LINEAR-001` (≥3 founding-builder demand) explicitly waived to land the v1 dark-scaffold; the Linear API client stays as a 501 stub until organic demand crosses the gate. `NEED_HUMAN: false` per the same user decision. | user (via implementer) |
