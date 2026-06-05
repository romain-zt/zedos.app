# Scope Slice: Export Cursor conversion gate

## Parent Feature Area

[Delivery](../feature-areas/delivery.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A **free** founder understands **Builder** value at the first **Cursor export** moment and can upgrade without confusion about what is inside the package.

---

## Exact Boundary

### Included Behavior

- On owner’s **first successful Cursor export attempt per account** (not per project), show conversion moment per `docs/product/conversion-export-cursor-spec.md`.
- **Soft gate (recommended):** preview package structure + **sample file**; **full zip** requires **builder** (or higher) tier.
- **Upgrade modal** copy (EN) with primary CTA to Builder checkout; secondary sample download; tertiary dismiss.
- **Signed-in builder/pro** owners: **no gate** — full export unchanged from `delivery--cursor-package-export`.
- In-app **pre-export nudges** on delivery surface (copy table in spec).
- Optional **transactional email** when export blocked (J0) — product requirement; delivery channel TBD at implement time.
- Instrumentation: `cursor_export_completed`, gate shown, upgrade clicked (product analytics).

### Excluded Behavior

- Changing zip generation logic for paying users (existing delivery slice).
- Subscription checkout implementation (`payments--builder-subscription-checkout`).
- Blocking export for **builder** tier.
- Hard paywall with zero preview (alternative in spec — not default unless product reverses).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Builder — no gate | `planTier` builder or pro | Full export proceeds immediately |
| Free — first export | First export event per account | Soft gate modal or interstitial before full download |
| Free — preview only | Chooses secondary CTA | Sample file or partial listing visible |
| Free — dismissed | Tertiary « Not now » | Returns to workspace; export not completed |
| Free — upgrade path | Primary CTA | Routes to Builder checkout (payments slice) |
| Free — repeat visit | Export already attempted once | Policy: show gate again or lighter nudge — default **lighter nudge** unless product sets strict repeat gate (TBD in US: prefer same soft gate only first time) |
| Error — package missing | No PRD version / package build failed | Existing delivery error UX; no upgrade modal |
| Blocked — not signed in | Session expired | Sign-in; no export |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Account / plan tier | Read | Determines gate vs full export |
| Export attempt / attribution | Create | First-export-per-account flag |
| Cursor delivery package | Read | Preview vs full download |
| PRD version | Read | Prerequisite for package |

---

## Credit / Payment Impact

None for the gate UI itself — checkout is payments slice. Export generation may still consume credits per existing delivery rules for free tier AI paths.

---

## Sharing / Privacy Impact

None — export is owner-private; share surfaces unchanged.

---

## Feedback / Instrumentation Impact

**Yes** — funnel events for gate, upgrade click, export completed; aligns with monetization analytics (Funnel B). No anonymous viewer prompts.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `delivery--cursor-package-export` | Scope Slice | complete | Package generation |
| `payments--builder-subscription-checkout` | Scope Slice | ready-for-user-stories | Upgrade destination (Phase 1 #2; gates A + B′) |
| `docs/product/conversion-export-cursor-spec.md` | Spec | complete | Soft gate default |
| `docs/gtm/pricing-page-copy-en-v1.md` | GTM | complete | Modal copy |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none for story writing)_ | — | — |

---

## Acceptance-Level Outcome

A **free** owner hitting their **first** Cursor export sees a **clear Builder value** message, can preview what is in the package, and can either upgrade (full zip after successful subscription) or defer — while **builder** owners export the **full package** without friction.

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
| 2026-06-04 | `/feature-area refine-slice` — full sections | — |
| 2026-06-04 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
