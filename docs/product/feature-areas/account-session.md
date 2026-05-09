<!--
  Feature Area — scaffolded from approved map + docs/prd/PRD.md
-->

# Feature Area: Account & session

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Product Surface (Buyer entry point; Merchant operating surface); § Operating Model; § Feature Groups (FG-PRD-V0 — Auth shell); § Flow Inventory (Sign up / sign in); § Core User Journeys (1)
- Related open questions: none (active queue empty)
- Related product decisions: none

---

## Product Intent

Solo founders can discover Zedos through open signup, create an account, and stay signed in as the **single owner** of their workspace. This area exists so every other v0 capability can assume a clear, accountable identity without team or invite flows.

---

## In Scope

- Public self-serve signup as the default v0 entry (no waitlist or invite gate as the default).
- Sign-in for returning owners so they reach their signed-in experience.
- Session semantics consistent with **one account owns projects and PRDs** (solo v0).

## Out of Scope

- Multi-user collaboration: invites, roles, co-editing (PRD Hard v0 exclusions).
- Waitlist-only or invite-only acquisition as the **default** v0 path (non-default experiments are out unless PRD changes).
- Separate merchant or admin persona (same signed-in founder is the operating surface in v0).

---

## Business Objects Touched

| Object | Relationship |
|--------|----------------|
| User account | Create on signup; authenticate returning owner; scope ownership of workspace |

---

## User Journeys Touched

- Journey 1 — Sign up → land in dashboard (session establishes access to downstream flows).

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| PRD identity stance (solo, open signup) | ready | Grounded in Product Surface / Operating Model |

---

## Risks

- If signup friction is high, founders never reach PRD value — balance with fraud/abuse concerns outside this FA’s boundary.

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

*Active PRD question queue is empty; no additional blockers listed for this area.*

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| Public signup to first dashboard | Founder completes signup and lands signed-in with clear next step toward PRD work. | exploratory |
| Returning owner sign-in | Founder signs back in and resumes without losing account context. | exploratory |

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
| 2026-05-09 | Promoted to validated after CLEAR readiness check (`/feature-area promote`) | — |
