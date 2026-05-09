---
version: v1
status: draft
supersedes: null
date: 2026-05-09
---

# Why This Version Exists

Establish a single narrative PRD for **Zedos**: a web product that moves the current Cursor-style PRD workflow online for **solo founders**, with a deliberate **v0** cut (PRD-only slice) and **deferred** product areas shown as under construction. This version aligns product language with discovery (**Q-001–Q-016** and `2026-05-09-zedos-discovery-note.md`) before deeper feature-group work.

# Product Overview

**Zedos** helps founders who use AI to **ship and validate** a market idea when they only have a **vague concept**. In **v0**, the product delivers **guided clarification**, a **versioned in-app PRD**, **question history**, **readable, shareable output** in the browser, **credit-metered AI** with **Stripe** purchase flows, and **owner-only milestone feedback** so learning tracks **PRD quality** after key steps. Other capabilities implied by the long-term vision (services/feature split, technical and Cursor workspace alignment, user stories, test-first delivery) are **out of v0 scope** and are surfaced elsewhere in the dashboard as **under construction**.

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
- **Learning / feedback (v0):** **Signed-in owner only** receives **lightweight, skippable** feedback prompts after **owner milestones** (see **Success Metrics**). **Anonymous share viewers** are **not** prompted for feedback in v0 (**deferred post-v0**).
- Payment model (**v0**):
  - **Free to start** with a **configurable starter credit grant (X)** (**numeric X** stays **operator-TBD** per discovery).
  - Credits are **prepaid quantities** (packs are **100 / 200 / 1000 credits**), **never** sold as “N PRDs.” **Zedos** maintains an **internal credit ledger**; credits deduct **per AI operation**.
  - **First PRD circuit (one-time grace):** if the owner **slightly exceeds** the starter balance during this circuit, the **current AI response still completes** (no mid-stream cut). Afterward, show clear copy that they **exceeded included starter credits** and that Zedos **covered that completion once** so the first flow was not interrupted; then present a **recharge** path. **After** that circuit, **paid AI generation** is **blocked at zero credits** unless **auto-reload** succeeds for the operation.
  - **Purchases:** **Stripe** **one-time payments** for manual top-ups; **launch payments** support **France/EU + US** (product scope for v0).
  - **Auto-reload:** **Opt-in only**; uses a **saved payment method** to **automatically buy one of the same three prepaid packs** when rules trigger. **Auto-reload is a prepaid refill behavior, not a subscription plan** and **must not** be hidden or implied as a subscription.
  - **Tax / compliance (product intent):** **Clear VAT/tax handling** for **digital AI credits** in supported markets (**not** implementation detail here).
  - **No subscription in v0.** **No BYOK in v0.** **No unlimited free AI.**
- Hard v0 exclusions:
  - **Subscriptions, BYOK, unlimited free AI** (see payment model).
  - **Multi-user collaboration** (invites, roles, co-editing) in v0.
  - **Markdown export** as a bar for “PRD complete” (export is useful but **not** required for done); **PDF export** not v0-critical.
  - **Advanced share controls** in v0: **no** link password, **no** time-based expiry, **no** extra “private link” controls beyond **owner disable** and **noindex** (simple public read-only links only).

## Surface Blockers

- **Starter credit grant (X)** — **numeric value** remains **operator-config / TBD** in the PRD (discovery Q-008).
- **AI inference** — **model/provider** is **not** specified here beyond **managed** usage and **no BYOK** in v0.

# Global Product Picture

**v0** is a **solo** founder experience: **multiple projects**, each with **multiple PRD versions**, **guided clarification**, persisted **question history**, **credit-metered AI** (**Stripe** top-ups, **internal ledger**, **first-circuit grace** then strict balance rules), **simple public read-only share links** (anonymous viewers, no workspace/history leakage, owner can disable, **not** search-indexed), and **owner-only milestone feedback** so the product can measure **PRD usefulness** without surveying anonymous viewers.

**Beyond v0 (north star, not in scope for this release):** discovery described a longer arc — **product clarification → versioned PRD →** services/feature grouping **→** technical needs **→** architecture / Cursor setup **→** user stories **→** test-first delivery and iteration. That sequence informs direction but **must not** be mistaken for v0 deliverables; non-PRD surfaces appear as **under construction** in the customer dashboard.

# Operating Model

- **One account owns** projects and PRDs (**single-user v0**).
- **Acquisition:** open signup.
- **Work:** browser-first; owner advances the PRD through **in-app** actions and consumes **credits** on **AI operations**.
- **Learning:** **Owner** gives **in-product feedback** after **defined milestones**; prompts are **automatic but selective** and **skippable**.
- **Sharing:** owner generates **read-only** links for external viewers; viewers **cannot** edit, comment, duplicate, or see **private/workspace history** on the share surface.
- **Differentiation of navigation:** users move between **projects** and between **PRD versions within a project** (two distinct navigation jobs).

# Core User Journeys

1. **Sign up** → land in dashboard (non-PRD areas may show **under construction**).
2. **Create or select a project** → open the PRD / clarification flow for that project.
3. **Clarify and iterate** using **in-app** controls; **question history** is visible/available to the owner in the private workspace.
4. **Version the PRD** and move between **versions** within a project.
5. **Switch projects** to work on another PRD lineage.
6. **Credits:** see balance; **per-operation** consumption against the **internal ledger**; **first PRD circuit** may **complete one in-flight response** if the owner **slightly exceeds** starter credits, then **recharge UX** (**buy pack**, **opt-in auto-reload**, or defer with **paid AI blocked** until purchase); **after** that circuit, **block at zero** unless **auto-reload** covers the next paid generation attempt.
7. **Feedback (owner):** after **owner milestones** — **first PRD version created**; **PRD version updated after clarification**; **PRD shared** (link flow); **PRD reopened / viewed by owner after generation** — show a **lightweight** prompt (**1–5 stars** or **like/dislike**, **optional** comment), **skippable**; **no** prompts on the **anonymous share** surface in v0.
8. **Share:** owner creates a **read-only public link**; anonymous viewer reads **only** the shared PRD content; owner can **disable** the link; page is **not** intended for search indexing.
9. **Not in v0:** invited editors, comments on share page as collaboration, passworded or expiring links, Markdown/PDF export as mandatory “done” criteria.

# Flow Inventory

| Flow | v0 |
|------|-----|
| Sign up / sign in | Yes |
| Create / list / open **projects** | Yes |
| Clarification loop (guided) + **question history** | Yes |
| Persist and browse **PRD versions** per project | Yes |
| **Credit** ledger, **per-operation** consumption, **first-circuit grace**, **block at zero** (post-grace) unless **auto-reload** | Yes (**Stripe** FR/EU+US) |
| **Stripe** one-time purchase of **100 / 200 / 1000** credit packs | Yes |
| **Opt-in auto-reload** (buy **one pack** via saved PM; **not** a subscription) | Yes |
| **Owner milestone feedback** (skippable; **anonymous viewers**: none) | Yes |
| **Share:** mint read-only URL, anonymous read, revoke link, noindex | Yes |
| Markdown / PDF export | No as MVP gate (MD may follow as fast / v0.1) |
| Team / invites / roles | No |
| Post-PRD pipeline (services split, Cursor artifacts, user stories, CI) | No (dashboard: under construction) |

# Business Objects

- **User account** (solo v0).
- **Project** (container for a product line / idea).
- **PRD version** (versioned document state in-app).
- **Clarification / question history** (owner-private workspace context; not exposed on anonymous share).
- **AI credit balance** and **credit ledger** / consumption semantics (**per operation**; Zedos-owned ledger).
- **Credit pack purchase** (Stripe one-time; **100 / 200 / 1000** credits) and **auto-reload preference** / saved instrument (**product-level** intent; not implementation).
- **Milestone feedback** (owner-only; tied to **project**, **PRD version**, **milestone type**, **timestamp**).
- **Share link** (read-only public surface; revocable; noindex intent).

# Configuration Matrix

| Dimension | v0 stance |
|-----------|-----------|
| UI + AI language | EN |
| Future locale | FR (after EN); i18n-ready |
| Starter credits **X** | **TBD / operator-config** (not fixed in this PRD) |
| Launch payment markets | **France/EU + US** |
| Payments provider | **Stripe** |
| Credit pack denominations | **100 / 200 / 1000 credits** (fixed; **not** “N PRDs”) |
| Pack list prices | **Operator-config**; may vary by **currency/region** |
| Share link | Simple public read-only; disable by owner; noindex |

# Integration Boundaries

- **Payments:** **Stripe** for **one-time** credit pack purchases and **opt-in auto-reload** pack purchases; **FR/EU + US** flows required for v0; **clear tax/VAT treatment** for **digital AI credits** is a **product requirement** (details not implementation-specified here).
- **Credits:** **Zedos** holds the **authoritative internal ledger**; **deduction is progressive per AI operation**; packs are **prepaid credit quantities** only.
- **AI inference:** **managed** usage; **model/provider** **not** named in this PRD (**no BYOK** in v0 per scope).
- **Identity:** public signup and signed-in owner; **anonymous** read-only **share** viewers (no account).
- **Search engines:** shared URLs treated as **non-indexable** by product intent (policy/robots level — not implementation).
- **Export:** optional **Markdown** later for alignment outside the app; **PDF** deferred from v0 critical path.

# MVP Completeness Checklist

- [ ] Founder can **sign up** and reach the PRD workflow.
- [ ] Founder can manage **multiple projects** and **multiple PRD versions** per project.
- [ ] **Guided clarification** runs with **in-app** advance/approve affordances.
- [ ] **Question history** is persisted for the owner workspace.
- [ ] **Versioned PRD state** is authoritative **in-app**; “done” for a version **does not** depend on file export.
- [ ] **Credit** ledger, **per-operation** consumption, **first-circuit grace**, **post-grace block at zero**, **Stripe** top-up path (**100 / 200 / 1000**), and **opt-in auto-reload** (prepaid pack) exist.
- [ ] **Signed-in owner** receives **milestone feedback** prompts (**skippable**; **no** prompts for **anonymous share** viewers).
- [ ] **Read-only share link**: generate, anonymous read, **no** edit/comment/duplicate/share of private history on viewer surface; **disable** link; **noindex** behavior.
- [ ] Non-PRD product areas show **under construction** where applicable.

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
- **Anonymous share-viewer feedback** ( **post-v0** ).
- **Implementation** specs, stack, tickets, and architecture.

# Success Metrics

**Primary v0 lens:** **User feedback quality** after **PRD generation / iteration** (owner-reported usefulness).

**Working metrics (definitions):**

1. **Feedback response rate** — % of **signed-in owners** who submit feedback **after** a **prompted milestone** (if response is near zero, learning is unreliable).
2. **Positive feedback rate** — % of submitted feedback that is **4–5 stars** or **like** (proxy for “output feels useful”).
3. **Negative feedback reasons** — recurring **themes** in **1–3 star** / **dislike** **optional** comments (prioritize fixes: unclear PRD, weak questions, wrong structure, too generic, missing context, etc.).

**Prompt rules (v0):**

- **Audience:** **Signed-in owner only**; **no** feedback prompts for **anonymous share** viewers.
- **Moments:** after **first PRD version created**; **PRD version updated after clarification**; **PRD shared**; **PRD reopened / viewed by owner after generation**.
- **Capture:** **1–5 stars** **or** **like/dislike**, **optional** comment; store with **project**, **PRD version**, **milestone**, and **timestamp**.

# Risks & Assumptions

- **Feedback program execution:** prompts must stay **lightweight** and **well-timed** so metrics reflect real signal, not annoyance-driven dropout.
- **Public read-only links:** abuse, scraping, or unintended leakage of **private** workspace content if boundaries blur — product must keep **share surface** limited to agreed read-only PRD content.
- **Credit economics:** starter **X** and regional **price points** are **config**; wrong defaults could starve first value or create unsustainable cost — tuned outside this PRD.
- **Payments & tax:** **Stripe** + **FR/EU/US** + **digital VAT/tax** posture must remain **legible to users**; operational correctness is **outside** this PRD’s implementation detail.
- **North-star confusion:** stakeholders may read long-term pipeline as v0; assumption is **clear labeling** in-product and in this PRD keeps v0 narrow.
