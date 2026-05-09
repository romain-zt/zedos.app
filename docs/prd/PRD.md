---
version: v1
status: draft
supersedes: null
date: 2026-05-09
---

# Why This Version Exists

Establish a single narrative PRD for **Zedos**: a web product that moves the current Cursor-style PRD workflow online for **solo founders**, with a deliberate **v0** cut (PRD-only slice) and **deferred** product areas shown as under construction. This version exists to align product language with discovery (Q-001–Q-012 and `2026-05-09-zedos-discovery-note.md`) before feature-group detail.

# Product Overview

**Zedos** helps founders who use AI to **ship and validate** a market idea when they only have a **vague concept**. In **v0**, the product delivers **guided clarification**, a **versioned in-app PRD**, **question history**, and **readable, shareable output** in the browser. Other capabilities implied by the long-term vision (services/feature split, technical and Cursor workspace alignment, user stories, test-first delivery) are **out of v0 scope** and are surfaced elsewhere in the dashboard as **under construction**.

# Problem & Users

**Primary users:** founders using AI to iterate on ideas and eventually ship.

**Core problem:** they start fuzzy and need a **structured path** from **idea → clarified product framing → versioned PRD** without losing thread. **v0** focuses purely on that PRD path; downstream execution workflows are intentionally not shipped in v0.

# Product Surface

- Primary market / language: **English** for UI and AI in v0; **French** planned next; content and structure should be **i18n-ready** without requiring multi-language UI in v0.
- Buyer entry point: **Public self-serve signup** (no waitlist/invite gate as the default for v0).
- Buyer-facing surface: **Web application** (primary place to clarify, iterate, and version PRDs).
- Merchant operating surface: **Same signed-in founder** in the web app (solo v0; no separate merchant role).
- Source of truth: **In-app versioned PRD** (canonical state lives in the product, not in an exported file).
- Confirmation channel: **In-app first** — obvious controls (buttons, inputs, or equivalent) to advance and approve steps; not email or external channels as the default for v0.
- Payment model: **Free to start** with a **configurable starter credit grant (X)**; **AI usage consumes prepaid credits per AI operation**; at **zero credits**, **generation is blocked** until **more credits are purchased**. **No subscription in v0.** **No BYOK in v0.** **No unlimited free AI.** Positioning: start free with included credits; buy more when needed.
- Hard v0 exclusions:
  - **Subscriptions, BYOK, unlimited free AI** (see payment model).
  - **Multi-user collaboration** (invites, roles, co-editing) in v0.
  - **Markdown export** as a bar for “PRD complete” (export is useful but **not** required for done); **PDF export** not v0-critical.
  - **Advanced share controls** in v0: **no** link password, **no** time-based expiry, **no** extra “private link” controls beyond **owner disable** and **noindex** (simple public read-only links only).

## Surface Blockers

- **Success metrics for v0 are not yet chosen** (discovery: explicit gap — Q-010). Until defined, treat impact and learning claims as **non-measured**.

# Global Product Picture

**v0** is a **solo** founder experience: **multiple projects**, each with **multiple PRD versions**, **guided clarification**, persisted **question history**, **credit-metered AI**, and **simple public read-only share links** (anonymous viewers, no workspace/history leakage, owner can disable, **not** search-indexed).

**Beyond v0 (north star, not in scope for this release):** discovery described a longer arc — **product clarification → versioned PRD →** services/feature grouping **→** technical needs **→** architecture / Cursor setup **→** user stories **→** test-first delivery and iteration. That sequence informs direction but **must not** be mistaken for v0 deliverables; non-PRD surfaces appear as **under construction** in the customer dashboard.

# Operating Model

- **One account owns** projects and PRDs (**single-user v0**).
- **Acquisition:** open signup.
- **Work:** browser-first; owner advances the PRD through **in-app** actions and consumes **credits** on **AI operations**.
- **Sharing:** owner generates **read-only** links for external viewers; viewers **cannot** edit, comment, duplicate, or see **private/workspace history** on the share surface.
- **Differentiation of navigation:** users move between **projects** and between **PRD versions within a project** (two distinct navigation jobs).

# Core User Journeys

1. **Sign up** → land in dashboard (non-PRD areas may show **under construction**).
2. **Create or select a project** → open the PRD / clarification flow for that project.
3. **Clarify and iterate** using **in-app** controls; **question history** is visible/available to the owner in the private workspace.
4. **Version the PRD** and move between **versions** within a project.
5. **Switch projects** to work on another PRD lineage.
6. **Credits:** see balance; **AI operations** consume credits; at **zero**, **generation is blocked** until **purchase/top-up** (exact purchase UX is product work, not prescribed here).
7. **Share:** owner creates a **read-only public link**; anonymous viewer reads **only** the shared PRD content; owner can **disable** the link; page is **not** intended for search indexing.
8. **Not in v0:** invited editors, comments on share page as collaboration, passworded or expiring links, Markdown/PDF export as mandatory “done” criteria.

# Flow Inventory

| Flow | v0 |
|------|-----|
| Sign up / sign in | Yes |
| Create / list / open **projects** | Yes |
| Clarification loop (guided) + **question history** | Yes |
| Persist and browse **PRD versions** per project | Yes |
| **Credit** balance, consumption, block at zero, **top-up path** | Yes (product requirement; provider-agnostic here) |
| **Share:** mint read-only URL, anonymous read, revoke link, noindex | Yes |
| Markdown / PDF export | No as MVP gate (MD may follow as fast / v0.1) |
| Team / invites / roles | No |
| Post-PRD pipeline (services split, Cursor artifacts, user stories, CI) | No (dashboard: under construction) |

# Business Objects

- **User account** (solo v0).
- **Project** (container for a product line / idea).
- **PRD version** (versioned document state in-app).
- **Clarification / question history** (owner-private workspace context; not exposed on anonymous share).
- **AI credit balance** and **credit ledger**/consumption semantics (per operation — product-level).
- **Share link** (read-only public surface; revocable; noindex intent).

# Configuration Matrix

| Dimension | v0 stance |
|-----------|-----------|
| UI + AI language | EN |
| Future locale | FR (after EN); i18n-ready |
| Starter credits **X** | **TBD / operator-config** (not fixed in this PRD) |
| Share link | Simple public read-only; disable by owner; noindex |
| Credit packs / pricing | Product decision pending economics — **not fixed here** |

# Integration Boundaries

- **Payments:** credit **top-ups** imply an external **payment** path — **provider, regions, and compliance** are **not** locked in this PRD.
- **AI inference:** credit burn implies **managed AI usage** — **model/provider** choices are **not** specified here (no BYOK in v0 per scope).
- **Identity:** public signup and signed-in owner; **anonymous** read-only **share** viewers (no account).
- **Search engines:** shared URLs treated as **non-indexable** by product intent (policy/robots level — not implementation).
- **Export:** optional **Markdown** later for alignment outside the app; **PDF** deferred from v0 critical path.

# MVP Completeness Checklist

- [ ] Founder can **sign up** and reach the PRD workflow.
- [ ] Founder can manage **multiple projects** and **multiple PRD versions** per project.
- [ ] **Guided clarification** runs with **in-app** advance/approve affordances.
- [ ] **Question history** is persisted for the owner workspace.
- [ ] **Versioned PRD state** is authoritative **in-app**; “done” for a version **does not** depend on file export.
- [ ] **Credit** balance, **per-operation** consumption, **block at zero**, and a **top-up** path exist.
- [ ] **Read-only share link**: generate, anonymous read, **no** edit/comment/duplicate/share of private history on viewer surface; **disable** link; **noindex** behavior.
- [ ] Non-PRD product areas show **under construction** where applicable.
- [ ] **Explicit product gap:** **success metrics** for v0 remain **undefined** (see Success Metrics).

# Feature Groups

| Id | Name | Status | Notes |
|----|------|--------|--------|
| FG-PRD-V0 | PRD workspace (web): projects, versions, clarification, credits, share | `exploratory` | Sole v0 delivery slice |
| FG-FUTURE | Services/feature split, tech alignment, Cursor packaging, user stories, delivery loop | `deferred` | Names only; not v0 |

# Build Sequence

Not defined in this document. Requires separate feature-group convergence and explicit ordering after global PRD is stable.

# Out of Scope

- **Everything beyond the PRD path** for v0 (shown as **under construction** in dashboard where relevant).
- **Subscriptions, BYOK, unlimited free AI.**
- **Collaboration** (multi-user, invites, co-editing).
- **Password / expiry / extra private-link controls** for shares in v0; **advanced sharing** may be explored as a **later paid** layer if traction exists.
- **PDF export** as v0-critical.
- **Markdown export** as mandatory for “complete” (may land as fast follow / v0.1).
- Defining **success metrics** (still open — see Success Metrics).
- **Implementation** specs, stack, tickets, and architecture.

# Success Metrics

**Not yet chosen** (discovery Q-010). This is an explicit gap: do not infer adoption or revenue success without a later decision. ICE or prioritization that depends on measurable outcomes should treat confidence as **limited** until metrics are set.

# Risks & Assumptions

- **Metrics gap:** shipping without success criteria weakens learning and prioritization; assumption is metrics will be set later without rewriting scope silently.
- **Public read-only links:** abuse, scraping, or unintended leakage of **private** workspace content if boundaries blur — product must keep **share surface** limited to agreed read-only PRD content.
- **Credit economics:** starter **X** and price points are **config**; wrong defaults could either starve first value or invite unsustainable cost — must be tuned outside this PRD.
- **North-star confusion:** stakeholders may read long-term pipeline as v0; assumption is **clear labeling** in-product and in this PRD keeps v0 narrow.
