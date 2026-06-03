# Scope Slice: Express deliverable generation

## Parent Feature Area

[Fast-track / mode urgent](../feature-areas/fast-track-urgent.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

In **express** mode, a founder completes **minimum IA** clarification and receives a **livrable express** (12 sections with lean content) as a versioned in-app PRD they can share the same day.

---

## Exact Boundary

### Included Behavior

- Applies only when the project is in **express** mode (Journey 10); **standard** projects keep the existing 8-section path unchanged.
- **Minimum IA** clarification: chat-driven dynamic decision UI with the **smallest necessary** question set (PD-002), not the full standard loop.
- Owner can **advance / approve** clarification steps in-app (Journey 3) until the product deems enough context for generation.
- **Livrable express** generation: in-app version with `title`, `version_summary`, and **12 sections** with **lean content** — `executive_summary`, `vision`, `target_users`, `core_features`, `user_journeys`, `technical`, `success_metrics`, `business_model`, `differentiation`, `timeline`, `out_of_scope`, `risks` (Q-025, Q-026, Q-029).
- New version is **marked as express** for owner browsing and for downstream share disclaimer slice.
- Owner can **read** the express version in the private workspace and proceed toward share (minting link is existing share FA).
- **Credit ledger**: same burn tiers as standard — lightweight step **1**, standard clarification **3**, mini-form decision **5**, PRD version generation **10**, challenge/convergence **15**; first-circuit grace (pre-check **>20** blocked, in-flight up to **20** once) and post-grace **block at zero** per PRD.

### Excluded Behavior

- **Standard** mode clarify depth and **8-section** generation (unchanged).
- **Import external PRD** as primary input (separate Feature Area).
- Copy **version express — à approfondir** on share/owner surfaces (`express-share-disclaimer`).
- Post-PRD nav **grayed** shell (`grayed-post-prd-shell`).
- Declaring or switching journey mode (`declare-express-mode`).
- Reduced pricing or urgent-only credit packs.
- Mandatory Markdown/PDF export for “done”.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Gated — not express | Project is **standard** | Express minimum IA / livrable express generation not offered; standard clarify path only |
| Empty — express, no version | Express project, first visit | Entry into express clarify (may be zero questions if product allows skip — still express path) |
| Clarify — in progress | Minimum IA running | Chat + contextual mini-forms; fewer steps than standard; question history grows |
| Clarify — awaiting approve | Step needs owner input | In-app continue / approve affordance (Journey 3) |
| Credit — pre-check blocked | Projected overage **>20** before start | Operation does not start; message + path to buy credits / auto-reload |
| Credit — zero balance | Post-grace, balance insufficient | Paid AI blocked; recharge UX (pack purchase or auto-reload flow) |
| Credit — grace in-flight | First PRD circuit, slight overage during run | Current response completes; then explanatory copy + recharge modal |
| Generation — in progress | Livrable express generating | Loading state; owner waits in workspace |
| Generation — success | Version persisted | Full **12-section** express PRD readable in-app; version list shows express lineage |
| Generation — failure | Generation errors | Error message; owner can retry when credits allow |
| Post-success — share-ready | Version exists | Owner can open share flow (existing capability); disclaimer applied by other slice |
| Blocked — not signed in | Session expired | Redirect sign-in; no partial generation exposed |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Project | Read | Confirm journey mode = **express** before express-only flows |
| PRD version | Create | New express-classified version with 12-section livrable express body |
| PRD version | Read | Owner views generated express content in workspace |
| Question history | Create | Structured entries for minimum IA steps (owner-private) |
| Credit balance | Read | Balance checks before operations |
| Credit ledger | Update | Per-operation deduction (1 / 3 / 5 / 10 / 15 tiers) |

---

## Credit / Payment Impact

**Yes** — each minimum IA step and **livrable express** generation consumes credits at the **same rates** as standard: 1 / 3 / 5 / 10 / 15 by operation type. First-circuit grace applies once (pre-check blocks if projected overage **>20**; in-flight completion up to **20** extra credits). After grace, **block at zero** unless **opt-in auto-reload** succeeds; otherwise manual recharge UX via **Stripe** packs. No reduced express pricing (PD-002).

---

## Sharing / Privacy Impact

None in this slice — share surfaces and disclaimer copy are owned by `express-share-disclaimer`; generation does not change anonymous viewer permissions.

---

## Feedback / Instrumentation Impact

**Yes** — may trigger owner milestone prompts (skippable): **first PRD version created** after first express livrable; **PRD version updated after clarification** after minimum IA iterations. Attribution: project, PRD version, milestone, timestamp. No prompts on anonymous share surface (v0 exclusion).

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `fast-track-urgent--declare-express-mode` | Scope Slice | ready-for-user-stories | Project must be in **express** mode before this slice runs |
| Guided clarification | Feature Area capability | validated | Minimum IA policy branch |
| PRD versioning | Feature Area capability | validated | Persist express versions |
| Credit system | Feature Area capability | validated | Same burn tiers |
| PD-002 | Product decision | accepted | Minimum IA + livrable rules |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

A signed-in founder on an **express** project can complete **minimum IA** clarification (with credits handled like standard), receive a persisted **livrable express** showing all **12 sections** with lean content, see it marked as an **express** version in the workspace, and proceed to share without completing post-PRD — while standard projects and pricing rules remain unchanged.

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
| 2026-06-03 | Scaffolded from approved `/feature-area slice` proposal via `/feature-area scaffold-slices` | — |
| 2026-06-03 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
