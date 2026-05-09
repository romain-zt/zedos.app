<!--
  Scoped from approved `/feature-area slice account-session` + parent Feature Area + PRD
-->

# Scope Slice: Signup to signed-in dashboard

## Parent Feature Area

[Account & session](../feature-areas/account-session.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A new founder can complete open self-serve signup and land in the signed-in product with a clear path toward PRD work.

---

## Exact Boundary

### Included Behavior

- First-time acquisition via **public self-serve signup** as the default v0 path (aligned with Buyer entry point — no waitlist/invite gate as the default).
- Creating a **single-owner** user account consistent with Journey 1 (Sign up → land in dashboard) and Operating Model (**one account owns** projects and PRDs).
- Ending in a **signed-in session** at the primary post-signup entry (dashboard); downstream flows assume an identifiable owner (**solo v0**).

### Excluded Behavior

- Waitlist-only or invite-only acquisition as the **default** v0 path; **multi-user** collaboration (invites, roles, co-editing — PRD Hard v0 exclusions).
- A **separate merchant or admin** persona — the same signed-in founder is the operating surface in v0 (`docs/prd/PRD.md` Product Surface).
- **Credit packs, ledger, checkout, Stripe, auto-reload, or recharge UX** — credit and payments are other Feature Areas; sign-in/session does not sell or deduct credits here.
- **Share links, anonymous viewers, revoke/disable link, noindex** — sharing is out of this slice’s boundary (other Feature Areas).
- **Concrete dashboard/project UI** beyond “land signed-in” and a **TBD** product-level path toward PRD/project work (`docs/prd/PRD.md` Core User Journey 1 mentions non-PRD areas may show **under construction** — framing only, no delivery mandate in this slice).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Empty / first visit | Founder opens the public signup entry from the buyer path | Prompt to begin signup with **English-first** v0 copy (FR later per PRD); **web app** surface only |
| In progress | Founder submits signup details or confirms the flow step | **Loading** indicator on the continue/create affordance; inputs disabled or clearly busy per in-app pattern |
| Success | Account creation and session handoff complete | **Signed-in** landing at the post-auth entry (dashboard shell) with an **obvious path toward PRD work**; non-PRD areas may show **under construction** framing only (`docs/prd/PRD.md` Journey 1) |
| Recoverable error | Validation fails (missing fields, mismatch rules, “already registered” product message, rate/abuse limit) | Inline or summarized errors tied to the form; **retry** without losing safe entered context where the product allows |
| System / connectivity error | Network or service outage during signup | Clear **failure** state with retry; no silent hang |
| Edge / blocked | Product blocks signup (abuse, unknown configuration, or policy gate beyond this slice) | Explains **cannot continue** and offers support or alternate path **without** claiming credit purchase or share features |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| User account | Create | **Single-owner** identity created through **public self-serve signup** (`docs/prd/PRD.md` Buyer entry / Operating Model) |
| Signed-in session | Establish | Session ties the browser to the **owner** so downstream PRD workspace assumes **solo** accountability |

---

## Credit / Payment Impact

None — no prepaid credit deduction, balance gate, recharge modal, purchase, or auto-reload in this slice.

---

## Sharing / Privacy Impact

None — no share link issuance, revocation, or anonymous-readable surface changes; private signed-in workspace context only.

---

## Feedback / Instrumentation Impact

None — PRD-aligned **owner feedback** milestones (e.g. first PRD version generated) occur after downstream PRD work, not solely as a signup outcome (`docs/prd/PRD.md` Success Metrics / Learning).

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| [Account & session](../feature-areas/account-session.md) | Feature Area | ready | Parent boundaries and solo-owner stance |
| `docs/prd/PRD.md` — Buyer entry point, Journey 1, Operating Model | PRD constraint | ready | Public signup default; dashboard landing |
| Signed-in dashboard / shell entry UX | Slice / sibling area | pending | Landing “next step” copy and layout **TBD** at product-detail level; coordinates with **Dashboard shell** Feature Area |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A founder without an existing account can use **default public signup**, complete account creation intended for **one owner**, and arrive **signed in** at the web app’s post-auth entry consistent with Journey 1, such that downstream v0 behaviors can assume **solo ownership**—without enabling **multi-user**, **non-default gated acquisition**, or **payment/credit** flows in this slice.

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
