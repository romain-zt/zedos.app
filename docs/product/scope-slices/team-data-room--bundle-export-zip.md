# Scope Slice: Team data room bundle export zip

## Parent Feature Area

[Team & data room](../feature-areas/team-data-room.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false
> **Gate override (2026-06-05):** `B-TEAM-PRICE-001` (Team plan pricing not signed off) and `GATE-MRR-500` were **waived by user decision** to unblock user-story authoring. Pricing remains operationally unresolved — the slice can be planned, but `/implement` of this slice must not ship until pricing is set. See changelog.

---

## User Value

As a **Team plan** owner, I download one due-diligence zip with PRD, decisions, stories, and share index for investors.

---

## Exact Boundary

### Included Behavior

- **Gate:** build after **500 paying customers** / ~$15k MRR per `plan-team-data-room-spec.md`.
- **Team plan** entitlement required to generate zip.
- Zip contains: PRD export, decisions index, user stories corpus, share link index, README disclaimers (express sections flagged).
- One-click **Download data room** from team settings.

### Excluded Behavior

- SSO, custom domain, multi-tenant admin v1.
- Replacing Cursor export zip (complementary bundle).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Gated — MRR | Below gate | Feature not marketed |
| Gated — plan | Not Team tier | Upgrade message |
| Generate — running | Owner clicks download | Progress |
| Success | Zip ready | Browser download |
| Error — partial artifact | Missing decisions | Clear which artifact failed |
| NEED_HUMAN — pricing | Team price unset | Blocked until CEO sign-off |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| PRD version | Read | Export |
| Decision index | Read | Summary |
| User story | Read | Corpus |
| Share link index | Read | Metadata |
| Data room bundle | Create | Zip |

---

## Credit / Payment Impact

None for zip generation (Team subscription out of slice — pricing NEED_HUMAN on FA).

---

## Sharing / Privacy Impact

None — zip is owner-initiated confidential download.

---

## Feedback / Instrumentation Impact

Optional: `data_room_zip_downloaded`.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| FA-team-data-room | Feature Area | proposed | NEED_HUMAN pricing |
| GATE-MRR-500 | Business gate | pending | |
| Decision graph + stories FAs | Feature Area | partial | Artifacts must exist |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| GATE-MRR-500 | Scale gate | false — **waived 2026-06-05 by user** for readiness step only |
| B-TEAM-PRICE-001 | Team plan $199–399 not signed off | false — **waived 2026-06-05 by user** for readiness step. Pricing is **still unresolved**; do not run `/implement` for this slice until a `docs/product-decisions/` entry locks the Team price. |
| B-FA-TEAM-001 | Parent FA not validated | false |

---

## Acceptance-Level Outcome

An eligible **Team** owner generates a **single zip** containing the due-diligence artifacts listed in the team data room spec, with express disclaimers where applicable.

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
- [x] Blockers — `B-TEAM-PRICE-001` waived for readiness step (2026-06-05); **still required before `/implement`**
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES (gate-waived for planning; not yet ready for `/implement`)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-04 | Blueprint scaffold (minimal) | — |
| 2026-06-04 | `/feature-area refine-slice` — exploratory, BLOCKED | — |
| 2026-06-05 | Promoted `exploratory` → `ready-for-user-stories` by **user override**. `B-TEAM-PRICE-001` (Team plan pricing) and `GATE-MRR-500` waived for the readiness step. Pricing remains operationally unresolved — `/implement` of this slice is still blocked until a `docs/product-decisions/` entry sets the Team price. `NEED_HUMAN` lowered from `true` → `false` per the same user decision. | user (via implementer) |
