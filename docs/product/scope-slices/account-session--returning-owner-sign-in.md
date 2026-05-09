<!--
  Scoped from approved `/feature-area slice account-session` + parent Feature Area + PRD
-->

# Scope Slice: Returning owner sign-in

## Parent Feature Area

[Account & session](../feature-areas/account-session.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A returning founder can sign back in and reach the signed-in experience without losing account context.

---

## Exact Boundary

### Included Behavior

- **Sign-in path for a returning founder** so they regain the signed-in operating surface (**same founder** as merchant/owner — `docs/prd/PRD.md` Product Surface).
- **Signed-in session** consistent with **one account owns projects and PRDs** (solo v0); account context (**identity for ownership**) is preserved relative to signup.

### Excluded Behavior

- **New account registration / first signup** — use **Signup to signed-in dashboard** sibling slice.
- **Multi-user**: invites, roles, co-editing (PRD Hard v0 exclusions); **merchant vs admin personas** separated from founder — none in v0.
- Default **invite-only/waitlist-only** acquisition as the shipping path — not the default Buyer entry framing for returning users.
- **Credit balance, deductions, recharge, Stripe, auto-reload** — billing and credit metering are separate Feature Areas.
- **Sharing**: mint/revoke read-only links, anonymous viewer flows — handled elsewhere (`docs/prd/PRD.md` sharing exclusions apply to viewer surface, not this signed-in ingress).
- Specific **credential technology** beyond “returning founder can authenticate” — **TBD** at UX/product detail (`docs/prd/PRD.md` does not fix magic link vs password-only at slice level).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Empty / signed-out entry | Returning founder opens the **sign-in** entry (not signup) | **English-first** web app surface; path to authenticate as existing owner |
| In progress | Founder submits credentials or completes the sign-in step | **Loading** on the primary continue/sign-in control; clear busy state |
| Success | Authentication succeeds | **Signed-in** continuation at the **same** signed-in shell used after signup, with **solo ownership** preserved |
| Recoverable error | Wrong credentials, locked account message, validation | Actionable error with **retry**; no silent failure |
| Session expired / interrupted | Prior session no longer valid | Prompt to sign in again; **no** merge with signup or team flows |
| System / connectivity error | Network or outage | Failure state with retry guidance |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| User account | Read / bind | Confirms the **returning owner** maps to an **existing** single-user account |
| Signed-in session | Establish / refresh | Restores **private** signed-in access consistent with **one account owns** projects and PRDs |

---

## Credit / Payment Impact

None — sign-in consumes no credits and does not open purchase or ledger flows.

---

## Sharing / Privacy Impact

None — this slice restores private signed-in access for the owner; it does not change share-link visibility or anonymous reader surfaces.

---

## Feedback / Instrumentation Impact

None — milestone feedback attaches to PRD milestones (e.g. after generation/clarification), not to signing in alone (`docs/prd/PRD.md` Learning / feedback).

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| [Account & session](../feature-areas/account-session.md) | Feature Area | ready | Parent scope |
| Existing user account from signup lifecycle | Slice / precondition | pending | Depends on signup flow having created an account in product terms |
| [Signup to signed-in dashboard](./account-session--signup-to-signed-in-dashboard.md) | Scope Slice | ready | Sibling promoted **ready-for-user-stories** — narrative predecessor for returning cohort |
| Signed-in dashboard / shell continuity | Slice / sibling area | pending | Post-auth landing consistency with signup slice — coordinates with **Dashboard shell** Feature Area; UX detail **TBD** |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A founder who already has an account can **authenticate as returning owner**, arrive at the **signed-in web experience** used for PRD work, and the product continues to attribute **solo ownership** to that session—without covering **signup**, **collaborators**, **payment**, or **share-link** journeys in this slice.

---

## Readiness for User Stories

<!-- Fill before marking ready-for-user-stories -->

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
| 2026-05-09 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
