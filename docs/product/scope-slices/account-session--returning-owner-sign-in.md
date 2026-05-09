<!--
  Scoped from approved `/feature-area slice account-session` + parent Feature Area + PRD
-->

# Scope Slice: Returning owner sign-in

## Parent Feature Area

[Account & session](../feature-areas/account-session.md)

## Status

`exploratory`

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
|       |      |                                  |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
|        |           |       |

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
| [Signup to signed-in dashboard](./account-session--signup-to-signed-in-dashboard.md) | Scope Slice | pending | Logical predecessor for “returning founder” cohort in product narrative |
| Signed-in dashboard / shell continuity | Slice / sibling area | unknown | **TBD** — post-auth landing consistency with signup slice |

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

- [ ] User value stated without implementation language
- [ ] Exact boundary defined (included + excluded)
- [ ] UX states enumerated (including error and empty states)
- [ ] Business objects named
- [ ] Credit / payment impact assessed
- [ ] Sharing / privacy surface assessed
- [ ] Feedback / instrumentation impact assessed
- [ ] All dependencies named and their status known
- [ ] All blockers resolved or NEED_HUMAN=true explicitly set
- [ ] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** NOT READY

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-09 | Scaffolded from approved `/feature-area slice account-session` via `/feature-area scaffold-slices` | — |
