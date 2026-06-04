---
version: v2
status: active
supersedes: v1
date: 2026-06-04
---

# Why This Version Exists

Establish a single narrative PRD for **Zedos**: a web product for **solo founders** that delivers **pitch → shareable spec → Cursor handoff** (wedge **48h**), with **v0** covering clarification, versioned in-app PRD, express/import, share, and credit-metered AI. **FG-POST-PRD-V1** (feature split → user stories → Cursor export) is **implemented** per `WORK_QUEUE`; founder-facing copy may still need phase/prerequisite labels — not “product missing.” **Phase 1** (Builder subscription, collab async, export MD, outcomes) and **moat T1** are **gated** (`docs/prd/gates-status.md`). Aligns discovery (**Q-001–Q-030**, **PD-002**, **PD-003**, `2026-06-03-product-hics-fast-track.md`).

# Product Overview

**Zedos** helps founders who use AI to **ship and validate** a market idea when they only have a **vague concept** — or who need a **shareable deliverable under time pressure**. **Shipped today (v0 launch):** **guided clarification** (standard + **express** per **PD-002**), **versioned in-app PRD**, **import at create**, **question history**, **share links**, **credit-metered AI** with **Stripe** pack top-ups, and **owner milestone feedback**. **FG-POST-PRD-V1** (feature split → user stories → test-first → **Cursor export**) is **implemented** per `WORK_QUEUE`; in **standard** mode some surfaces may still read **under construction**, and in **express** mode post-PRD nav stays **grayed** (PD-002) — not “missing product.” **Phase 1 wedge** (Builder subscription, collab async, export MD, outcome O1) is **documented below** and **gated** — not automatic on technical readiness.

# Problem & Users

**Primary users:** founders using AI to iterate on ideas and eventually ship.

**Core problem:** they start fuzzy and need a **structured path** from **idea → clarified product framing → versioned PRD → optional handoff to build** without losing thread — at a **depth and speed** that matches their situation (exploration vs **deadline now**). **Express / fast-track** (PD-002, Q-024) addresses founders who must produce a **livrable express** and **share or export same-day**, then **deepen later** in standard mode without discarding the express version.

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
  - **No recurring subscription in v0 launch.** **No BYOK in v0.** **No unlimited free AI.**
- **Payment model — Phase 1 wedge (v0.1 — post-PMF; not v0 launch):**
  - **Builder monthly subscription** via **Stripe** (self-serve Checkout + Customer Portal): unlocks **full Cursor export** and Builder entitlements per commercial docs (`docs/gtm/pricing-page-copy-en-v1.md`).
  - **Coexists** with **credit packs** and the **internal ledger** (packs remain top-up; subscription is **not** unlimited free AI and **not** a hidden replacement for the ledger).
  - **Free tier** may hit a **soft export gate** on first Cursor export until upgrade (see `docs/product/conversion-export-cursor-spec.md`).
  - **Pro** plan and **annual** billing are **out of Phase 1** product scope.
- **Phase 1 execution gates (product law — governs `WORK_QUEUE` / `/implement`):**
  - **Gate A — Wedge qualitative (required before any Phase 1 prod ship):** **≥ 5** founder interviews completed (see `docs/gtm/founder-interviews-cursor-guide.md`) **and** **≥ 1** documented express run **&lt; 45 min** wall-clock (`docs/product/express-30min-checklist-friction-log.md`).
  - **Gate B — Revenue (required before full Phase 1 bundle):** **≥ 20** active **Builder** subscribers **or** **≥ 800 € MRR** (founding concierge or self-serve).
  - **Gate B′ — Narrow exception:** **Builder subscription + export conversion gate** may ship after Gate A only if **≥ 10** documented fake-door / waitlist signals (`docs/gtm/fake-door-subscription-spec.md`) — **collab async (PD-003) never** ships on B′ alone.
  - **Phase 1 ship order (after applicable gates):** (1) **next-action banner** → (2) **Builder subscription** → (3) **export conversion gate** → (4) **outcome O1** on `prd_shared` → (5) **Markdown export v0.1** → (6) **collab async** (invite, then threads).
  - **Gate C — Moat T1 (decision graph, drift GitHub, templates marketplace, AI red team):** no prod ship until **≥ 100** active paying subscribers **or** explicit `/prd update` waiver recorded.
- Hard v0 exclusions:
  - **Recurring subscription billing in v0 launch** (see Payment model — Phase 1 wedge for **Builder** after v0).
  - **BYOK, unlimited free AI** (unchanged).
  - **Multi-user collaboration in v0 launch:** **editor/viewer co-editing**, **team roles**, **workspace co-ownership** — excluded.
  - **Async section commenters (PD-003) — Phase 1 wedge (v0.1):** owner may invite up to **3 commenters** per project by email; **read-only PRD** for commenters; **section-level async threads**; owner resolves threads; **no** PATCH to canonical PRD body; **no** comments on **anonymous share** surface. **Not** v0 launch.
  - **Markdown export** as a bar for “PRD complete” (export is useful but **not** required for done); **PDF export** not v0-critical.
  - **Advanced share controls** in v0: **no** link password, **no** time-based expiry, **no** extra “private link” controls beyond **owner disable** and **noindex** (simple public read-only links only).
  - **Reduced credit pricing or urgent-only packs** in express mode (**same burn tiers** as standard per PD-002).

## Surface Blockers

- _(none for v0 baseline — resolved 2026-05-28 per B-001 / B-003 in `docs/BLOCKERS.md`)_

# Global Product Picture

**v0** is a **solo** founder experience: **multiple projects**, each with **multiple PRD versions**, **guided clarification** on either a **standard** or **express** journey mode (per project, switchable at creation and mid-project), persisted **question history**, **credit-metered AI** (**Stripe** top-ups, **internal ledger**, **first-circuit grace** then strict balance rules), **simple public read-only share links** (anonymous viewers, no workspace/history leakage, owner can disable, **not** search-indexed; **express** versions carry an explicit **version express — à approfondir** disclaimer), and **owner-only milestone feedback** so the product can measure **PRD usefulness** without surveying anonymous viewers.

**Beyond v0 — FG-POST-PRD-V1 (active v1 scope):** the post-PRD pipeline — **services/feature split → user stories → test-first workflows → Cursor delivery** — is now active v1 scope (**FG-POST-PRD-V1**). These surfaces transition from **under construction** to planned deliverables. The PRD workflow (FG-PRD-V0) must ship first; FG-POST-PRD-V1 follows.

# Operating Model

- **One account owns** projects and PRDs (**single-user v0** for canonical PRD editing).
- **Phase 1 (PD-003):** optional **commenters** invited by email — **not** co-owners or editors; PRD truth remains **owner-controlled**.
- **Acquisition:** open signup.
- **Work:** browser-first; owner advances the PRD through **in-app** actions and consumes **credits** on **AI operations**.
- **Learning:** **Owner** gives **in-product feedback** after **defined milestones**; prompts are **automatic but selective** and **skippable**.
- **Sharing:** owner generates **read-only** links for external viewers; viewers **cannot** edit, comment, duplicate, or see **private/workspace history** on the share surface.
- **Differentiation of navigation:** users move between **projects** and between **PRD versions within a project** (two distinct navigation jobs).
- **Journey mode (per project):** **standard** (full clarification depth) or **express** (minimum IA questions → **livrable express** → immediate share/export; post-PRD surfaces **grayed**). Owner may **switch to express** at project creation or **mid-project**; may **deepen** later by moving to standard mode and versioning forward (PD-002).

# Core User Journeys

1. **Sign up** → land in dashboard (non-PRD areas may show **under construction**).
2. **Create or select a project** → choose project intention: **standard** (explore), **express** (urgent), and/or **import external PRD** (paste/file — **shipped**, Q-028); **express** and **import** are distinct but combinable → open the PRD / clarification flow for that project.
3. **Clarify and iterate** using the **chat-driven dynamic decision UI**: chat guides and reasons throughout; when a product decision benefits from constrained input, Zedos generates a **contextual mini-form on the fly** (single-choice decision card, multi-choice checklist, ranked options, modal with select fields + optional comment, "not sure / ask me differently"); **question history** (structured log) is visible/available to the owner in the private workspace.
4. **Version the PRD** and move between **versions** within a project.
5. **Switch projects** to work on another PRD lineage.
6. **Credits:** see balance; **per-operation** consumption against the **internal ledger**; **first PRD circuit** — **pre-check gate**: if projected overage exceeds **20 credits**, block before starting and show recharge path; if in-flight response runs over by **at most 20 credits**, allow completion (one-time grace); afterward show overage message + **recharge UX** (**buy pack**, **opt-in auto-reload**, or defer with **paid AI blocked**); if **auto-reload** is enabled and succeeds, credits are added and generation continues; if auto-reload fails or requires authentication, fall back to **manual recharge UX** (clear message, manual confirm/authenticate, generation blocked until resolved); **after** the first circuit, **block at zero** with no further grace.
7. **Feedback (owner):** after **owner milestones** — **first PRD version created**; **PRD version updated after clarification**; **PRD shared** (link flow); **PRD reopened / viewed by owner after generation** — show a **lightweight** prompt (**1–5 stars** or **like/dislike**, **optional** comment), **skippable**; on **`prd_shared`**, **Phase 1** adds primary **outcome O1** (Yes / Not yet / No external share) per `docs/product/outcome-tracking-prompts-alignment.md`; **no** prompts on the **anonymous share** surface in v0.
8. **Share:** owner creates a **read-only public link**; anonymous viewer reads **only** the shared PRD content; owner can **disable** the link; page is **not** intended for search indexing. For **express** PRD versions, the share surface (and owner-facing equivalent) **must** show explicit copy: **version express — à approfondir** (PD-002).
9. **Not in v0 launch:** invited **editors** / viewer workspace roles, **comments on anonymous share** as collaboration, passworded or expiring links, Markdown/PDF export as mandatory “done” criteria. **Async commenters (PD-003)** are **Phase 1 wedge**, not v0 launch.
10. **Express / fast-track (PD-002, Q-025, Q-026):** when project is in **express** mode — run **minimum IA** clarification (smallest question set the product deems necessary; not the full standard loop); produce a **livrable express** as structured JSON with **`title`**, **`version_summary`**, and **12 sections** (lean **content** per section — not fewer headings than standard): `executive_summary`, `vision`, `target_users`, `core_features`, `user_journeys`, `technical`, `success_metrics`, `business_model`, `differentiation`, `timeline`, `out_of_scope`, `risks` (see **Configuration Matrix** — express livrable sections); owner **shares or exports** without completing post-PRD pipeline; **FG-POST-PRD-V1** navigation stays **visible but grayed** with product-oriented disable message; owner may later **switch to standard** and enrich (new PRD versions; express lineage preserved). **Standard** mode generation keeps the **8-section** in-app shape (no `executive_summary`, `business_model`, `differentiation`, `timeline` unless product later extends standard). **Credits:** same per-operation burn tiers as standard.
11. **Import external PRD (Q-028):** at project creation (or combinable with express), owner **pastes or uploads** an existing PRD (ChatGPT, Claude, Notion, etc.) → persist as in-app version (brut acceptable; restructure IA optional); may skip full clarify when content is sufficient — **shipped** per Flow Inventory / `WORK_QUEUE`.

# Flow Inventory

**Legend**

| Column / value | Meaning |
|----------------|---------|
| **Shipped = Yes** | Live for real users today |
| **Shipped = Partial** | **Some** v0 behavior is in prod (see row note); remaining scope on that row is still **Planned v0** |
| **Shipped = No** | Not a v0 product commitment (e.g. export, team) |
| **Planned v0 = Yes** | In **v0 product scope**, **not yet in prod** — doc + queue may exist (`docs/WORK_QUEUE.md`, plans `draft` / `approved`) |
| **Planned v0 = —** | Either fully shipped, out of v0 scope, or **special row** (see below) |

**How to read (avoid false “not built”)**

1. **Express** — declare/switch, livrable, disclaimer, grayed shell = **Shipped** (per `WORK_QUEUE`, 2026-06-03+).
2. **Post-PRD pipeline** — **Shipped = Yes** here means **implementation complete** per `WORK_QUEUE` / FG-POST-PRD-V1 ; founders in **standard** mode may still see **under construction** ; in **express** mode surfaces are **grayed** (PD-002) — not “missing code”.
3. **Import external PRD** — **Shipped** (FA `prd-import`, `WORK_QUEUE` complete).
4. **Phase 1 wedge (documented; gated — see Payment model gates):** Builder subscription ; async commenters (**PD-003**) ; Markdown export v0.1 ; outcome **O1** on `prd_shared`.
5. **Moat T1 (documented; Gate C):** decision graph ; drift GitHub ; templates marketplace ; AI red team.
6. **Product analytics (PostHog)** — not in this table ; spec in `docs/product/feature-areas/product-analytics.md` ; **not in prod** until implemented + **B-ANALYTICS-001** (see `docs/observability/README.md`).

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
| **Express journey mode:** declare at **project creation** or **mid-project**; switch back to standard later | Yes | — |
| **Express path:** minimum IA clarify → **livrable express** → share/export same day | Yes | — |
| **Express share:** **version express — à approfondir** disclaimer on anonymous read surface | Yes | — |
| **Post-PRD surfaces in express mode:** **grayed** (visible, disabled + message) — not hidden | Yes | — |
| **Import external PRD** (paste / file → in-app version) | Yes | — |
| Markdown / PDF export | No | — |
| **Builder monthly subscription** (Stripe; coexists with credit packs) | No | — |
| **Async commenters** (PD-003; section threads; not share-page comments) | No | — |
| Team / editor-viewer workspace roles | No | — |
| Post-PRD pipeline (services/feature split, user stories, test-first workflows, Cursor delivery) | Yes (code **complete** per `WORK_QUEUE`; surfaces may still show **under construction** for v0 founders) | — (v1 **positioning** / UX labeling — not “not built”) |

# Business Objects

- **User account** (solo v0).
- **Project** (container for a product line / idea; carries **journey mode**: **standard** or **express**, switchable at creation and mid-project per PD-002).
- **PRD version** (versioned document state in-app; may be tagged or classified as **express livrable express** vs **standard** depth for share copy and owner UX).
- **Clarification / question history** (owner-private; structured log per decision — structured question, available options, founder answer, optional comment, AI interpretation, PRD impact; not a raw chat transcript; not exposed on anonymous share).
- **AI credit balance** and **credit ledger** / consumption semantics (**per operation**; Zedos-owned ledger; directional burn tier model: lightweight clarification step = 1 credit, standard decision / clarification step = 3, dynamic mini-form decision step = 5, PRD version generation / major update = 10, PRD challenge / convergence pass = 15; **product assumption for v0, not final pricing**).
- **Credit pack purchase** (Stripe one-time; **100 / 200 / 1000** credits) and **auto-reload preference** / saved instrument (**product-level** intent; not implementation).
- **Milestone feedback** (owner-only; tied to **project**, **PRD version**, **milestone type**, **timestamp**).
- **Share link** (read-only public surface; revocable; noindex intent).
- **Plan tier / subscription entitlement** (Phase 1: **free** vs **builder**; monthly subscription via Stripe — product-level fields).
- **Project commenter invite** and **section comment thread** (Phase 1, PD-003; owner + invited commenter only).

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
- **Export:** optional **Markdown** as **Phase 1 fast follow** (0 credits; not a “done” bar); **PDF** deferred from v0 critical path.

# MVP Completeness Checklist

> **Sync rule:** checkboxes mirror **Flow Inventory** above. **Shipped** rows → `[x]`; **Planned v0** → `[ ]`.

- [x] Founder can **sign up** and reach the PRD workflow.
- [x] Founder can manage **multiple projects** and **multiple PRD versions** per project.
- [x] **Guided clarification** runs with **in-app** advance/approve affordances.
- [x] **Question history** is persisted for the owner workspace.
- [x] **Versioned PRD state** is authoritative **in-app**; “done” for a version **does not** depend on file export.
- [x] **Credit** ledger, **per-operation** consumption, **first-circuit grace**, **post-grace block at zero**, **Stripe** top-up path (**100 / 200 / 1000**), and **opt-in auto-reload** (prepaid pack) exist.
- [x] **Signed-in owner** receives **milestone feedback** prompts (**skippable**; **no** prompts for **anonymous share** viewers).
- [x] **Read-only share link**: generate, anonymous read, **no** edit/comment/duplicate/share of private history on viewer surface; **disable** link; **noindex** behavior.
- [x] Non-PRD product areas show **under construction** where applicable (standard mode); post-PRD pipeline code may exist under FG-POST-PRD-V1 — **founder-facing v0 narrative** remains “PRD first”.
- [x] Founder can declare **express** mode at **project creation** or **switch mid-project** (WORK_QUEUE `complete`).
- [x] **Express** path delivers a **livrable express**, **minimum IA** clarify, **same credit burn tiers**, and **share/export** without requiring post-PRD completion.
- [x] **Express** share surfaces show **version express — à approfondir**.
- [x] **Post-PRD** areas are **grayed** (not hidden) when project is in express mode, with clear product copy.
- [x] **Express** generation emits all **12** configured sections (+ `title` / `version_summary`) with lean content.
- [x] **Import external PRD** at project creation (Q-028).

# Feature Groups

| Id | Name | Status | Notes |
|----|------|--------|--------|
| FG-PRD-V0 | PRD workspace (web): projects, versions, clarification, credits, share | `active` | Core flows **Shipped** per Flow Inventory (incl. express + import); **Phase 1 wedge** documented (Builder sub, PD-003 collab) |
| FG-POST-PRD-V1 | Post-PRD pipeline: services/feature split, user stories, test-first workflows, Cursor delivery | `active` | **Code complete** per `docs/WORK_QUEUE.md` (orchestration). **Founder-facing v0** may still label surfaces **under construction**; **express mode** grays them per PD-002 — distinct from “not implemented”. |
| FG-FUTURE | Services/feature split, tech alignment, Cursor packaging, user stories, delivery loop | `archived` | Superseded by FG-POST-PRD-V1 |

## FG-PRD-V0 Sub-components

| Sub-component | v0 scope anchor |
|---|---|
| **Auth shell** | Public signup, signed-in owner session; no editor/viewer workspace roles in v0 launch; **Phase 1:** commenter magic-link auth (PD-003) |
| **Project workspace** | Create / list / open projects; multi-project navigation |
| **PRD versioning** | Persist versioned PRD state in-app; browse version history per project; "done" ≠ export |
| **Guided clarification loop** | **Chat-driven dynamic decision UI**: chat is the guidance and reasoning layer; when a product decision benefits from constrained input, Zedos generates a **contextual mini-form on the fly** (modal with select fields, single-choice decision card, multi-choice checklist, ranked options, "not sure / ask me differently"); not a free-form chatbot; not a static questionnaire |
| **Question history** | Structured log (owner-private, not exposed on share); per decision: structured question, available options, founder answer, optional comment, AI interpretation, PRD impact |
| **Credit system** | Internal ledger; per-operation deduction; directional burn tiers (1 / 3 / 5 / 10 / 15 credits — product assumption, not final pricing); pack legibility anchors: 100 = first PRD, 200 = deeper iteration, 1000 = power use; first-circuit grace: pre-check gate (block if projected overage > 20 credits), allow in-flight completion up to 20-credit ceiling (once only), then recharge UX; post-grace block at zero; Stripe one-time packs (100 / 200 / 1000), primary payment path = manual top-up; opt-in auto-reload (best-effort, SCA fallback to manual recharge UX, not subscription); FR/EU + US |
| **Owner milestone feedback** | Skippable prompts after 4 milestones; 1–5 stars or like/dislike + optional comment; **Phase 1:** primary **outcome O1** on `prd_shared`; stored with project / version / milestone / timestamp |
| **Share** | Mint read-only public URL; anonymous read (no edit/comment/workspace access); owner revoke; noindex; **express** versions require **version express — à approfondir** on share and owner view |
| **Fast-track / express** | **PD-002 / Q-024–Q-029:** journey mode **express** at create or mid-project — **shipped**; **minimum IA** clarification; **livrable express** = **12 sections** with **lean content**; same credit burn as standard; immediate share/export; post-PRD nav **grayed** with message; **deepen later** via standard mode + new versions |
| **Import external PRD** | Paste/file → in-app version at create; combinable with express — **shipped** (Q-028) |
| **Builder subscription (Phase 1)** | Monthly **Builder** plan via Stripe; coexists with packs; export gate for Free tier — **documented, not v0 launch** |
| **Collab async (Phase 1, PD-003)** | Invite **commenters** (max 3); section threads; no co-edit; no share-page comments — **documented, not v0 launch** |

Dashboard shell (under-construction sections for non-PRD areas) is a v0 prerequisite outside this group's scope boundary.

## FG-POST-PRD-V1 Sub-components

| Sub-component | v1 scope anchor |
|---|---|
| **Services / feature split** | Break a validated PRD into logical service groupings and feature clusters; structured output consumable by downstream steps |
| **User stories** | Translate each feature cluster into structured, testable user stories; per-story: title, actor, outcome, acceptance criteria |
| **Test-first workflows** | For each user story, generate a task list with implementation prompt per task; v0 format: user story doc with embedded tasks + prompts (no separate test scaffold) |
| **Cursor delivery** | Package and export user stories + task prompts into a Cursor-ready format; initial target: `.cursor/` folder structure + WORK_QUEUE-compatible entries |

**Sequence note:** FG-PRD-V0 core flows and FG-POST-PRD-V1 implementation are **complete** in `WORK_QUEUE` (2026-06-04). Further work follows **Phase 1 gates** and **Gate C (moat)** below — not “PRD before post-PRD.”

# Build Sequence

**Governing order (product — not implementation detail):**

1. **v0 launch (shipped):** FG-PRD-V0 core + express/import + FG-POST-PRD-V1 code per Flow Inventory.
2. **Gate A** → optional **Gate B′** (Builder + export gate only) → **Gate B** → **Phase 1 ship order** (Payment model section).
3. **Gate C** → moat T1 slices (decision graph, drift, templates, red team).
4. **Hold:** Linear (≥3 concierge requests), Team data room (≥500 MRR + pricing sign-off).

**Business metrics (Phase 1+ — tracked in `docs/TODO.md`, not v0 north star):** founding **≥ 20** Builders (stretch **50** month 1), **≥ 800 € MRR** gate, conversion **export → Builder**, time-to-share express median **&lt; 45 min**.

# Out of Scope

- **Everything beyond the PRD path** for v0 (shown as **under construction** in dashboard where relevant).
- **Recurring subscriptions in v0 launch** (Builder monthly is **Phase 1 wedge** in Payment model).
- **BYOK, unlimited free AI.**
- **Workspace collaboration** (editor/viewer roles, co-editing, team seats) in v0 launch.
- **Async commenters (PD-003)** in v0 launch — deferred to **Phase 1 wedge**.
- **Password / expiry / extra private-link controls** for shares in v0; **advanced sharing** may be explored as a **later paid** layer if traction exists.
- **PDF export** as v0-critical.
- **Markdown export** as mandatory for “complete” (may land as fast follow / v0.1).
- **Anonymous share-viewer feedback** ( **post-v0** ).
- **Implementation** specs, stack, tickets, and architecture.

# Success Metrics

**North star (v0 → Phase 1 transition — `docs/product/outcome-tracking-v1.md`):** **real outcomes**, not satisfaction vanity.

| Horizon | Primary metric | Definition |
|---------|----------------|------------|
| **v0 learning (until O1 shipped)** | **Share activation rate** | % of new owners who create **≥1 read-only share link** within **7 days** of first PRD version |
| **Phase 1 (Gate B+)** | **Outcome O1 rate** | % of prompted owners on **`prd_shared`** who answer **shared externally** (yes / not yet / no) |
| **Phase 1+** | **Outcome O3 rate** | % of owners with **`cursor_export_completed`** (handoff wedge) |

**Secondary v0 metrics (diagnostic only — stars frozen for new prompts per TODO):**

1. **Feedback response rate** — % who respond when legacy star/like prompts still fire on old milestones.
2. **Negative feedback themes** — qualitative tags from optional comments (clarity, questions, structure).

**Prompt rules:**

- **Audience:** **Signed-in owner only**; **no** prompts on **anonymous share**.
- **v0 milestones (legacy capture):** first PRD version; PRD updated after clarification; PRD shared; PRD reopened by owner — **1–5 stars or like/dislike optional**; **no new star-only prompts** without `/prd update`.
- **Phase 1 (Gate B):** on **`prd_shared`**, **O1 primary**; stars **optional secondary** on that milestone only (`outcome-tracking-prompts-alignment.md`).
- **Phase 1+:** **O2** (pitched), **O3** (shipped code) per `outcome-tracking-v1.md`.

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
