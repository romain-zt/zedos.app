---
version: v1
status: draft
supersedes: null
date: 2026-06-03
---

# Why This Version Exists

Establish a single narrative PRD for **Zedos**: a web product that moves the current Cursor-style PRD workflow online for **solo founders**, with a deliberate **v0** cut (PRD-only slice) and **deferred** product areas shown as under construction. This version aligns product language with discovery (**Q-001–Q-029**, **PD-002**, and discovery notes including `2026-05-09-zedos-discovery-note.md` and `2026-06-03-product-hics-fast-track.md`) before deeper feature-group work.

# Product Overview

**Zedos** helps founders who use AI to **ship and validate** a market idea when they only have a **vague concept** — or who need a **shareable deliverable under time pressure**. In **v0**, the product delivers **guided clarification** (full **standard** path or shortened **express** path per **PD-002**), a **versioned in-app PRD**, **question history**, **readable, shareable output** in the browser, **credit-metered AI** with **Stripe** purchase flows, and **owner-only milestone feedback** so learning tracks **PRD quality** after key steps. The PRD workflow is **v0** scope. The post-PRD pipeline (services/feature split, user stories, test-first workflows, Cursor delivery) is **FG-POST-PRD-V1** — active v1 scope, not v0 deliverables. These surfaces transition from under construction in the dashboard as v1 implementation proceeds; in **express** mode they remain **visible but grayed** with product copy (not hidden).

# Problem & Users

**Primary users:** founders using AI to iterate on ideas and eventually ship.

**Core problem:** they start fuzzy and need a **structured path** from **idea → clarified product framing → versioned PRD** without losing thread — at a **depth and speed** that matches their situation (exploration vs **deadline now**). **v0** focuses purely on that PRD path; downstream execution workflows are intentionally not shipped in v0. **Express / fast-track** (PD-002, Q-024) addresses founders who must produce a **livrable express** and **share or export same-day**, then **deepen later** in standard mode without discarding the express version.

# Product Surface

- Primary market / language: **English** for UI and AI in v0; **French** planned next; content and structure should be **i18n-ready** without requiring multi-language UI in v0.
- Buyer entry point: **Public self-serve signup** (no waitlist/invite gate as the default for v0).
- Buyer-facing surface: **Web application** (primary place to clarify, iterate, and version PRDs).
- Merchant operating surface: **Same signed-in founder** in the web app (solo v0; no separate merchant role).
- Source of truth: **In-app versioned PRD** (canonical state lives in the product, not in an exported file).
- Confirmation channel: **In-app first** — obvious controls (buttons, inputs, or equivalent) to advance and approve steps; not email or external channels as the default for v0.
- **Learning / feedback (v0):** **Signed-in owner only** receives **lightweight, skippable** feedback prompts after **owner milestones** (see **Success Metrics**). **Anonymous share viewers** are **not** prompted for feedback in v0 (**deferred post-v0**).
- Payment model (**v0**):
  - **Free to start** with **20 starter credits** granted at signup (**X = 20** for v0; operator may tune via config without changing product narrative).
  - Credits are **prepaid quantities** (packs are **100 / 200 / 1000 credits**), **never** sold as “N PRDs.” **Zedos** maintains an **internal credit ledger**; credits deduct **per AI operation**.
  - **First PRD circuit (one-time grace):** **pre-check gate** — if the projected cost of the next AI operation exceeds the owner's remaining balance by more than **20 credits**, the operation does **not** start; present the recharge path immediately. If the operation was already in flight and the owner's balance runs out mid-response with an overage of **at most 20 credits**, the **current AI response still completes** (no mid-stream cut). Afterward, show clear copy that they **exceeded included starter credits** and that Zedos **covered that completion once** so the first flow was not interrupted; then present a **recharge** path. This grace applies **once, during the first PRD circuit only**. **After** that circuit, **paid AI generation** is **blocked at zero credits** unless **auto-reload** succeeds. **No hidden debt, no silent retry loop, no negative balance except this first-circuit grace.**
  - **Purchases:** **Stripe** **one-time payments** for manual top-ups (**primary v0 payment path**); **launch payments** support **France/EU + US** (product scope for v0).
  - **Auto-reload:** **Opt-in only; best-effort convenience layer** — uses a **saved payment method** to buy one of the same three prepaid packs when rules trigger. **If auto-reload succeeds**, credits are added and generation continues. **If auto-reload fails or requires authentication (e.g. EU/SCA)**, Zedos falls back to **manual recharge UX**: show a clear message, ask the owner to confirm or authenticate payment manually; **paid AI generation remains blocked** until recharge succeeds. **Auto-reload is a prepaid refill behavior, not a subscription plan** and **must not** be hidden or implied as a subscription. Auto-reload must **never** be required to complete the first PRD flow.
  - **Tax / compliance (product intent):** **Clear VAT/tax handling** for **digital AI credits** in supported markets (**not** implementation detail here).
  - **No subscription in v0.** **No BYOK in v0.** **No unlimited free AI.**
- Hard v0 exclusions:
  - **Subscriptions, BYOK, unlimited free AI** (see payment model).
  - **Multi-user collaboration** (invites, roles, co-editing) in v0.
  - **Markdown export** as a bar for “PRD complete” (export is useful but **not** required for done); **PDF export** not v0-critical.
  - **Advanced share controls** in v0: **no** link password, **no** time-based expiry, **no** extra “private link” controls beyond **owner disable** and **noindex** (simple public read-only links only).
  - **Reduced credit pricing or urgent-only packs** in express mode (**same burn tiers** as standard per PD-002).

## Surface Blockers

- _(none for v0 baseline — resolved 2026-05-28 per B-001 / B-003 in `docs/BLOCKERS.md`)_

# Global Product Picture

**v0** is a **solo** founder experience: **multiple projects**, each with **multiple PRD versions**, **guided clarification** on either a **standard** or **express** journey mode (per project, switchable at creation and mid-project), persisted **question history**, **credit-metered AI** (**Stripe** top-ups, **internal ledger**, **first-circuit grace** then strict balance rules), **simple public read-only share links** (anonymous viewers, no workspace/history leakage, owner can disable, **not** search-indexed; **express** versions carry an explicit **version express — à approfondir** disclaimer), and **owner-only milestone feedback** so the product can measure **PRD usefulness** without surveying anonymous viewers.

**Beyond v0 — FG-POST-PRD-V1 (active v1 scope):** the post-PRD pipeline — **services/feature split → user stories → test-first workflows → Cursor delivery** — is now active v1 scope (**FG-POST-PRD-V1**). These surfaces transition from **under construction** to planned deliverables. The PRD workflow (FG-PRD-V0) must ship first; FG-POST-PRD-V1 follows.

# Operating Model

- **One account owns** projects and PRDs (**single-user v0**).
- **Acquisition:** open signup.
- **Work:** browser-first; owner advances the PRD through **in-app** actions and consumes **credits** on **AI operations**.
- **Learning:** **Owner** gives **in-product feedback** after **defined milestones**; prompts are **automatic but selective** and **skippable**.
- **Sharing:** owner generates **read-only** links for external viewers; viewers **cannot** edit, comment, duplicate, or see **private/workspace history** on the share surface.
- **Differentiation of navigation:** users move between **projects** and between **PRD versions within a project** (two distinct navigation jobs).
- **Journey mode (per project):** **standard** (full clarification depth) or **express** (minimum IA questions → **livrable express** → immediate share/export; post-PRD surfaces **grayed**). Owner may **switch to express** at project creation or **mid-project**; may **deepen** later by moving to standard mode and versioning forward (PD-002).

# Core User Journeys

1. **Sign up** → land in dashboard (non-PRD areas may show **under construction**).
2. **Create or select a project** → choose project intention: **standard** (explore), **express** (urgent), and/or **import external PRD** (paste/file — **v0**, Q-028); **express** and **import** are distinct but combinable → open the PRD / clarification flow for that project.
3. **Clarify and iterate** using the **chat-driven dynamic decision UI**: chat guides and reasons throughout; when a product decision benefits from constrained input, Zedos generates a **contextual mini-form on the fly** (single-choice decision card, multi-choice checklist, ranked options, modal with select fields + optional comment, "not sure / ask me differently"); **question history** (structured log) is visible/available to the owner in the private workspace.
4. **Version the PRD** and move between **versions** within a project.
5. **Switch projects** to work on another PRD lineage.
6. **Credits:** see balance; **per-operation** consumption against the **internal ledger**; **first PRD circuit** — **pre-check gate**: if projected overage exceeds **20 credits**, block before starting and show recharge path; if in-flight response runs over by **at most 20 credits**, allow completion (one-time grace); afterward show overage message + **recharge UX** (**buy pack**, **opt-in auto-reload**, or defer with **paid AI blocked**); if **auto-reload** is enabled and succeeds, credits are added and generation continues; if auto-reload fails or requires authentication, fall back to **manual recharge UX** (clear message, manual confirm/authenticate, generation blocked until resolved); **after** the first circuit, **block at zero** with no further grace.
7. **Feedback (owner):** after **owner milestones** — **first PRD version created**; **PRD version updated after clarification**; **PRD shared** (link flow); **PRD reopened / viewed by owner after generation** — show a **lightweight** prompt (**1–5 stars** or **like/dislike**, **optional** comment), **skippable**; **no** prompts on the **anonymous share** surface in v0.
8. **Share:** owner creates a **read-only public link**; anonymous viewer reads **only** the shared PRD content; owner can **disable** the link; page is **not** intended for search indexing. For **express** PRD versions, the share surface (and owner-facing equivalent) **must** show explicit copy: **version express — à approfondir** (PD-002).
9. **Not in v0:** invited editors, comments on share page as collaboration, passworded or expiring links, Markdown/PDF export as mandatory “done” criteria.
10. **Express / fast-track (PD-002, Q-025, Q-026):** when project is in **express** mode — run **minimum IA** clarification (smallest question set the product deems necessary; not the full standard loop); produce a **livrable express** as structured JSON with **`title`**, **`version_summary`**, and **12 sections** (lean **content** per section — not fewer headings than standard): `executive_summary`, `vision`, `target_users`, `core_features`, `user_journeys`, `technical`, `success_metrics`, `business_model`, `differentiation`, `timeline`, `out_of_scope`, `risks` (see **Configuration Matrix** — express livrable sections); owner **shares or exports** without completing post-PRD pipeline; **FG-POST-PRD-V1** navigation stays **visible but grayed** with product-oriented disable message; owner may later **switch to standard** and enrich (new PRD versions; express lineage preserved). **Standard** mode generation keeps the **8-section** in-app shape (no `executive_summary`, `business_model`, `differentiation`, `timeline` unless product later extends standard). **Credits:** same per-operation burn tiers as standard.
11. **Import external PRD (Q-028):** at project creation (or combinable with express), owner **pastes or uploads** an existing PRD (ChatGPT, Claude, Notion, etc.) → persist as in-app version (brut acceptable; restructure IA optional); may skip full clarify when content is sufficient; **v0** scope — **Planned v0** in Flow Inventory (not yet in prod).

# Flow Inventory

**Legend:** **Shipped** = in production today. **Planned v0** = v0 product scope, **not yet in prod** (Q-027).

| Flow | Shipped | Planned v0 |
|------|---------|------------|
| Sign up / sign in | Yes | — |
| Create / list / open **projects** | Yes | — |
| **Chat-driven dynamic decision UI** (clarification loop + contextual mini-forms on the fly) + **question history** structured log | Yes | — |
| Persist and browse **PRD versions** per project | Yes | — |
| **Credit** ledger, **per-operation** consumption, **first-circuit grace**, **block at zero** (post-grace) unless **auto-reload** | Yes (**Stripe** FR/EU+US) | — |
| **Stripe** one-time purchase of **100 / 200 / 1000** credit packs | Yes | — |
| **Opt-in auto-reload** (buy **one pack** via saved PM; **not** a subscription) | Yes | — |
| **Owner milestone feedback** (skippable; **anonymous viewers**: none) | Yes | — |
| **Share:** mint read-only URL, anonymous read, revoke link, noindex | Yes | — |
| **Express journey mode:** declare at **project creation** or **mid-project**; switch back to standard later | — | Yes (PD-002, Q-024) |
| **Express path:** minimum IA clarify → **livrable express** → share/export same day | — | Yes |
| **Express share:** **version express — à approfondir** disclaimer on anonymous read surface | — | Yes |
| **Post-PRD surfaces in express mode:** **grayed** (visible, disabled + message) — not hidden | — | Yes |
| **Import external PRD** (paste / file → in-app version) | — | Yes (Q-028) |
| Markdown / PDF export | No | — |
| Team / invites / roles | No | — |
| Post-PRD pipeline (services/feature split, user stories, test-first workflows, Cursor delivery) | — | Yes (v1 scope — FG-POST-PRD-V1) |

# Business Objects

- **User account** (solo v0).
- **Project** (container for a product line / idea; carries **journey mode**: **standard** or **express**, switchable at creation and mid-project per PD-002).
- **PRD version** (versioned document state in-app; may be tagged or classified as **express livrable express** vs **standard** depth for share copy and owner UX).
- **Clarification / question history** (owner-private; structured log per decision — structured question, available options, founder answer, optional comment, AI interpretation, PRD impact; not a raw chat transcript; not exposed on anonymous share).
- **AI credit balance** and **credit ledger** / consumption semantics (**per operation**; Zedos-owned ledger; directional burn tier model: lightweight clarification step = 1 credit, standard decision / clarification step = 3, dynamic mini-form decision step = 5, PRD version generation / major update = 10, PRD challenge / convergence pass = 15; **product assumption for v0, not final pricing**).
- **Credit pack purchase** (Stripe one-time; **100 / 200 / 1000** credits) and **auto-reload preference** / saved instrument (**product-level** intent; not implementation).
- **Milestone feedback** (owner-only; tied to **project**, **PRD version**, **milestone type**, **timestamp**).
- **Share link** (read-only public surface; revocable; noindex intent).

# Configuration Matrix

| Dimension | v0 stance |
|-----------|-----------|
| UI + AI language | EN |
| Future locale | FR (after EN); i18n-ready |
| Starter credits **X** | **20** at signup (env-tunable; product baseline **X = 20**) |
| Launch payment markets | **France/EU + US** |
| Payments provider | **Stripe** |
| Credit pack denominations | **100 / 200 / 1000 credits** (fixed; **not** “N PRDs”) |
| Pack list prices | **Operator-config**; may vary by **currency/region** |
| Credit burn rates | **Directional product assumption** (not implementation-hardcoded): 1 / 3 / 5 / 10 / 15 credits per operation type; pack legibility anchors: 100 = meaningful first PRD, 200 = deeper iteration, 1000 = power / multi-project |
| First-circuit grace ceiling | **20 credits** (fixed; anti-abuse; pre-check gate enforced before operation start) |
| Share link | Simple public read-only; disable by owner; noindex |
| Project journey mode | **standard** (default depth) or **express** (minimum IA + livrable express); switchable creation + mid-project |
| Express share copy | **version express — à approfondir** on share + owner-facing PRD view |
| Standard PRD generation sections | **8** (`vision`, `target_users`, `core_features`, `user_journeys`, `technical`, `success_metrics`, `out_of_scope`, `risks`) + `title` / `version_summary` |
| Express livrable sections (Q-025, Q-026) | **12** = standard **8** + **`executive_summary`** (first), **`business_model`**, **`differentiation`**, **`timeline`**; **lean content** per section; same burn tiers |

# Integration Boundaries

- **Payments:** **Stripe** for **one-time** credit pack purchases and **opt-in auto-reload** pack purchases; **FR/EU + US** flows required for v0; **clear tax/VAT treatment** for **digital AI credits** is a **product requirement** (details not implementation-specified here).
- **Credits:** **Zedos** holds the **authoritative internal ledger**; **deduction is progressive per AI operation**; packs are **prepaid credit quantities** only.
- **AI inference:** **managed** usage via **Abacus-managed OpenAI `gpt-4o-mini`** for v0 mini-forms and clarification flows (**no BYOK** in v0 per scope).
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
- [ ] Founder can declare **express** mode at **project creation** or **switch mid-project** (**Planned v0** — Q-027).
- [ ] **Express** path delivers a **livrable express**, **minimum IA** clarify, **same credit burn tiers**, and **share/export** without requiring post-PRD completion (**Planned v0**).
- [ ] **Express** share surfaces show **version express — à approfondir** (**Planned v0**).
- [ ] **Post-PRD** areas are **grayed** (not hidden) when project is in express mode, with clear product copy (**Planned v0**).
- [ ] **Express** generation emits all **12** configured sections (+ `title` / `version_summary`) with lean content (**Planned v0**).
- [ ] **Import external PRD** at project creation (**Planned v0** — Q-028).

# Feature Groups

| Id | Name | Status | Notes |
|----|------|--------|--------|
| FG-PRD-V0 | PRD workspace (web): projects, versions, clarification, credits, share | `exploratory` | Sole v0 delivery slice |
| FG-POST-PRD-V1 | Post-PRD pipeline: services/feature split, user stories, test-first workflows, Cursor delivery | `exploratory` | Active v1 scope — see FG-POST-PRD-V1 sub-components |
| FG-FUTURE | Services/feature split, tech alignment, Cursor packaging, user stories, delivery loop | `archived` | Superseded by FG-POST-PRD-V1 |

## FG-PRD-V0 Sub-components

| Sub-component | v0 scope anchor |
|---|---|
| **Auth shell** | Public signup, signed-in owner session; no invite/team auth |
| **Project workspace** | Create / list / open projects; multi-project navigation |
| **PRD versioning** | Persist versioned PRD state in-app; browse version history per project; "done" ≠ export |
| **Guided clarification loop** | **Chat-driven dynamic decision UI**: chat is the guidance and reasoning layer; when a product decision benefits from constrained input, Zedos generates a **contextual mini-form on the fly** (modal with select fields, single-choice decision card, multi-choice checklist, ranked options, "not sure / ask me differently"); not a free-form chatbot; not a static questionnaire |
| **Question history** | Structured log (owner-private, not exposed on share); per decision: structured question, available options, founder answer, optional comment, AI interpretation, PRD impact |
| **Credit system** | Internal ledger; per-operation deduction; directional burn tiers (1 / 3 / 5 / 10 / 15 credits — product assumption, not final pricing); pack legibility anchors: 100 = first PRD, 200 = deeper iteration, 1000 = power use; first-circuit grace: pre-check gate (block if projected overage > 20 credits), allow in-flight completion up to 20-credit ceiling (once only), then recharge UX; post-grace block at zero; Stripe one-time packs (100 / 200 / 1000), primary payment path = manual top-up; opt-in auto-reload (best-effort, SCA fallback to manual recharge UX, not subscription); FR/EU + US |
| **Owner milestone feedback** | Skippable prompts after 4 milestones; 1–5 stars or like/dislike + optional comment; stored with project / version / milestone / timestamp |
| **Share** | Mint read-only public URL; anonymous read (no edit/comment/workspace access); owner revoke; noindex; **express** versions require **version express — à approfondir** on share and owner view |
| **Fast-track / express** | **PD-002 / Q-024–Q-029:** journey mode **express** at create or mid-project (**Planned v0**, Q-027); **minimum IA** clarification; **livrable express** = **12 sections** (standard 8 + `executive_summary`, `business_model`, `differentiation`, `timeline`) with **lean content**; same credit burn as standard; immediate share/export; post-PRD nav **grayed** with message; **deepen later** via standard mode + new versions |
| **Import external PRD** | Paste/file → in-app version at create; combinable with express; distinct from urgent-only (**Planned v0**, Q-028) |

Dashboard shell (under-construction sections for non-PRD areas) is a v0 prerequisite outside this group's scope boundary.

## FG-POST-PRD-V1 Sub-components

| Sub-component | v1 scope anchor |
|---|---|
| **Services / feature split** | Break a validated PRD into logical service groupings and feature clusters; structured output consumable by downstream steps |
| **User stories** | Translate each feature cluster into structured, testable user stories; per-story: title, actor, outcome, acceptance criteria |
| **Test-first workflows** | For each user story, generate a task list with implementation prompt per task; v0 format: user story doc with embedded tasks + prompts (no separate test scaffold) |
| **Cursor delivery** | Package and export user stories + task prompts into a Cursor-ready format; initial target: `.cursor/` folder structure + WORK_QUEUE-compatible entries |

FG-PRD-V0 must be delivered before FG-POST-PRD-V1 implementation begins.

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
- **AI mini-form generation reliability:** the guided clarification loop depends on a managed AI model reliably generating appropriate constrained mini-forms (decision cards, checklists, ranked options) on the fly. If output quality degrades or is inconsistent, the clarification loop degrades with it. No static-questionnaire fallback is defined for v0. This assumption must be validated via prototype before treating the mechanic as stable for production.
- **Auto-reload / SCA:** off-session charges in EU/France may trigger SCA (Strong Customer Authentication); handled by design — auto-reload is best-effort, and failure falls back to manual recharge UX (not treated as an error, treated as a designed fallback path).
- **First-circuit grace anti-abuse:** the 20-credit ceiling and pre-check gate are deliberate product constraints to prevent grace from becoming an exploitable free tier; the gate must be enforced before any AI operation starts, not after.
- **Express / minimum IA variability:** express mode relies on the product asking the **minimum** necessary questions; session length may still vary — monitor time-to-first-share and abandonment vs standard path (PD-002).
- **Express vs reader expectations:** without the **version express — à approfondir** disclaimer, external viewers may treat a livrable express as a complete PRD — disclaimer is mandatory on share (PD-002).
