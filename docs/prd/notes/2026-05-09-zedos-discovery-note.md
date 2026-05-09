# Zedos Discovery Note — 2026-05-09

Source: PRD discovery session (`/prd discover`)

Status: active

---

## 2026-05-09 — Discovery session opened

### Raw user input
> /prd discover

### Interpreted product insight
Discovery was started without additional narrative; `state.md` direction is still TBD and the PRD remains an initial scaffold.

### PRD implication
No persisted PRD facts change yet—the next inputs should establish problem, users, or a pilot so scaffold sections can be replaced via convergence and `/prd update`.

### New / updated questions
- Q-001 — replaced scaffold “TBD” with first orienting product question (see `open-questions.md`).

---

## 2026-05-09 — Founders using AI to ship/validate; v0 = PRD only

### Raw user input
> founder that use AI to ship/validate their market idea. They usually have a vague idea, and zedos.app wants to acompagny them.
>
> Vague idea
> → Product clarification
> → Versioned PRD
> → Split into services / feature groups
> → Technical needs analysis aligned with those groups
> → Create initial architecture/setup to explore the v1 technical solution
> → Update the Cursor setup with new agents/rules/skills for the chosen solution
> → Split into user stories
>
> For each user story:
>   → Functional spec
>   → If approved: write integration tests for the user-story flow
>   → If approved: split the spec into subtasks/tasks
>   → Write tests for each subtask
>   → Validate/merge test work into the active feature branch
>   → Only then implement the green phase
>   → Review / re-implement until approved
>   → Merge / deploy
>   → Define the next step
>
> Then loop back to:
> → Iterate on the next user story
>
> ---
> So far, all the other features/flows are going to be a "under construction" in the customer dashboard. We'll only focus on PRD for v0

### Interpreted product insight
Primary users are founders who use AI to validate and ship ideas; they start from a vague concept and want guided progression from clarification through a versioned PRD, then (later) services/feature groups, technical and architecture alignment, Cursor workspace setup, user stories, and a test-first delivery loop. For v0, scope is intentionally narrow: only the PRD slice of that journey; the rest of the product appears as “under construction” in the customer dashboard.

### PRD implication
`Problem & Users` and `Global Product Picture` can describe an accompaniment workflow from vague idea to versioned PRD as the v0 promise, with a staged long-term roadmap implied but explicitly out of scope for v0. `Feature Groups`, MVP checklist, and surface sections should treat non-PRD capabilities as deferred and reflect a dashboard that signals “under construction” outside the PRD path.

### New / updated questions
- Q-001 answered (moved to Answered in `open-questions.md`).
- Q-002 opened — v0 product surface (where the PRD workflow runs vs dashboard shell).

---

## 2026-05-09 — Web app; multi-project and versioned PRDs

### Raw user input
> We need to "move" our current cursor flow into a web-app online.
> Userr will manage it thrgouht a well-designed ux/ui.
> He should be able to easily navigate between several PRDs for different project, but also several PRDs (versions) of a specific project.

### Interpreted product insight
V0 centers on bringing the existing Cursor-based PRD workflow into a **web application** with strong UX. Information architecture must support **switching between multiple projects** (each with its own PRD lineage) and **switching among multiple PRD versions within one project**, without conflating the two navigation modes.

### PRD implication
`Product Surface`, `Buyer-facing surface`, and `Core User Journeys` can state **browser/web** as the primary experience for v0 PRD work; **Business Objects** should name **Project** and **PRD version** as first-class entities; navigation patterns belong in journeys and the configuration/global picture. **Confirmation channel** for step/version approval remains unspecified until captured (Q-003).

### New / updated questions
- Q-002 answered (primary surface = web app; multi-project + per-project version navigation). **Partial:** default “approve” / advance gesture not yet defined.
- Q-003 opened — confirmation / approval pattern in the web app.

---

## 2026-05-09 — Confirmation: in-app first

### Raw user input
> In-app as first (button/input/whatever easy to use in-app)

### Interpreted product insight
Advancing and approving the PRD/clarification flow is **in-product first**, using simple, obvious controls (buttons, inputs, or equivalent) rather than email or external tools as the default path for v0.

### PRD implication
`Confirmation channel` can default to **in-app actions**; out-of-app confirmation (email, etc.) is not required for v0 unless you add it later. **Core User Journeys** should show explicit approve/continue controls at each gated step.

### New / updated questions
- Q-003 answered; Q-004 opened — primary language/locale for v0.

---

## 2026-05-09 — Language: EN first, FR planned

### Raw user input
> EN only as first. Then FR will arrive so plan it accordingly.

### Interpreted product insight
The product should launch v0 **English-only** (UI + AI), with **French** as a near-term follow-on; design and content decisions should **assume localization later** without shipping FR in the first release.

### PRD implication
**Primary market / language** can be set to English-first with a stated FR phase; global/config sections should call out **i18n readiness** (copy structure, locale strategy) as a deliberate plan, not a v0 scope expansion. No need to implement FR strings in v0 if EN-only is explicit.

### New / updated questions
- Q-004 answered; Q-005 opened — how users first enter the product (buyer entry) for v0.

---

## 2026-05-09 — Buyer entry: public signup

### Raw user input
> public signup

### Interpreted product insight
New users reach Zedos through **public self-serve signup** (no invite-only or waitlist gate as the v0 default).

### PRD implication
**Buyer entry point** can be documented as open acquisition; onboarding and auth journeys assume self-serve registration. Compliance/abuse posture may still be layered later but is not the default gate in v0.

### New / updated questions
- Q-005 answered; Q-006 opened — canonical PRD / export vs in-app only (source of truth for v0).

---

## 2026-05-09 — Source of truth in-app; export optional

### Raw user input
> For v0, the in-app versioned PRD is the source of truth.
>
> Export is useful but not required for a PRD version to count as “done”. The first version should focus on guided clarification, versioned PRD state, question history, and shareable/readable in-app output.
>
> Markdown export can be a fast follow or lightweight v0.1, because PRDs are commonly used as alignment documents for teams and stakeholders, and many PRD tools/templates assume the document must be easy to share or reuse outside the app. PDF export is not v0-critical.

### Interpreted product insight
**Canonical state** lives in the product: the **in-app versioned PRD** is authoritative; “done” does not depend on export. v0 should **prioritize** guided clarification, persisted versioned PRD, question history, and an **in-app artifact** that is readable and shareable (view/link) without requiring file export. **Markdown export** is valuable for real-world alignment workflows and can land as a **fast follow** or thin **v0.1**; **PDF** is explicitly **out of v0 critical path**.

### PRD implication
**Source of truth** = in-app; **MVP Completeness** gates “PRD complete” on in-app readiness, not downloads. **Integration/export** belongs in roadmap as phased (MD optional soon, PDF later). Journeys should include **sharing/reading** the PRD **inside the product** as the alignment surface for v0.

### New / updated questions
- Q-006 answered; Q-007 opened — v0 monetization / pricing intent.

---

## 2026-05-09 — v0 monetization: free to start, prepaid AI credits

### Raw user input
> v0 Monetization Model
>
> Zedos is free to start, but AI usage is credit-based.
>
> - New users receive X free signup credits.
> - Those credits let them create and iterate on their first PRD.
> - When credits are exhausted, generation is blocked until they buy more credits.
> - No subscription in v0.
> - No BYOK in v0.
> - No “unlimited free” AI usage.
> - Credits are prepaid and consumed per AI operation.
>
> Default positioning:
> “Start free with included credits. Buy more only when you need them.”

### Interpreted product insight
**GTM:** free onboarding with a **bundled starter credit (X)** sufficient to bootstrap a first PRD iteration. **AI is metered:** each AI operation **consumes prepaid credits**; at **zero balance**, **generation/interaction that spends credits is blocked** until **top-ups**. **Out of scope for v0:** subscriptions, **BYOK**, and **unlimited free** AI. **Positioning** emphasizes included credits then pay-as-you-go.

### PRD implication
**Payment model** = freemium entry + **prepaid credits** for AI; **hard exclusions** list subs/BYOK/unlimited-free. **MVP** must include **credit balance**, **consumption per operation**, **purchase/top-up path**, and **hard stop** when depleted. **X** remains a tunable parameter unless you fix a number in the PRD. **Success/revenue** metrics can anchor on credit attach rate and repeat purchases—not MRR from subs in v0.

### New / updated questions
- Q-007 answered; Q-008 opened — whether **X (free signup credits)** is fixed in the PRD vs TBD/tunable.

---

## 2026-05-09 — Signup credits (X): configuration, not a PRD-fixed number

### Raw user input
> stay TBD (that's just going to be configuration so no matters)

### Interpreted product insight
The **starter credit grant (X)** should remain **TBD in the PRD as a fixed value**—it will be handled as **runtime/configuration**, not as a named product commitment in documentation.

### PRD implication
**Configuration Matrix** can treat **free signup credits** as an **operator-tunable parameter**; the PRD states the **model** (included credits + top-ups) without locking **X**. Pilot economics and UX still assume a **non-zero starter balance**, without a canonical number in `PRD.md`.

### New / updated questions
- Q-008 answered; Q-009 opened — v0 **single-user vs multi-user/collaboration** on a project.

---

## 2026-05-09 — v0 single-user (no collaborators)

### Raw user input
> single-user for v0

### Interpreted product insight
Projects and PRDs are **owned and used by one account in v0**—no inviting teammates, shared workspaces, or role-based collaboration in scope for the first release.

### PRD implication
**Operating model** and **journeys** stay **solo-founder**; sharing remains **read/share via in-app links/views** (per prior intent), not co-editing. Collaboration can be a **later phase** without scoping v0 MVP. **Merchant operating surface** aligns with the **same person** as buyer for v0.

### New / updated questions
- Q-009 answered; Q-010 opened — **success metrics / v0 outcomes**.

---

## 2026-05-09 — Success metrics: not defined yet

### Raw user input
> i don't yet know

### Interpreted product insight
**v0 success metrics are not chosen yet**—this remains an explicit gap for prioritization, ICE confidence, and any pilot commitment language.

### PRD implication
**Success Metrics** stays **TBD in the PRD** until you decide; discovery records that **uncertainty is acknowledged** (not silently assumed). **ICE Confidence** for scope/prioritization should stay **capped** until measurable outcomes exist. Optional: pick metrics **before** calling a v0 pilot “successful.”

### New / updated questions
- Q-010 answered (metrics TBD); Q-011 opened — **viewer access for shared in-app PRD links** (auth vs public read-only).

---

## 2026-05-09 — Share links: unauthenticated read-only (v0)

### Raw user input
> Answer:
> Unauthenticated read-only links are in scope for v0.
>
> A PRD owner can generate a share link that lets external viewers read the PRD without signing in. Viewers cannot edit, comment, duplicate, or access workspace/private history.
>
> Default:
> - Owner/editor: signed in
> - Viewer: unauthenticated read-only link
> - Link can be disabled by the owner
> - Public link is not indexed by search engines

### Interpreted product insight
v0 **includes** **public, read-only share URLs**: owners (signed-in) create links; **anonymous viewers** may **read the PRD only**—no edit, comment, fork, or access to **workspace/private history**. **Revocation:** owner can **disable** the link. **SEO:** shared pages must not be **search-indexed** (treat as **noindex** product requirement).

### PRD implication
**Core User Journeys** need **generate link → unauthenticated read → revoke**; **privacy** separates **shared PRD content** from **account/workspace history** and AI/clarification trails if those are private. **Integration/export** remains distinct (Q-006). **MVP** includes link governance (disable); viewer surface is **read-only**.

### New / updated questions
- Q-011 answered; Q-012 opened — optional **link controls** beyond disable (expiry, password) for v0 vs later.

---

## 2026-05-09 — Sharing controls: simple for v0; advanced maybe paid later

### Raw user input
> v0 sharing is intentionally simple: public read-only links only. No password, no expiry, no private-link controls. Advanced sharing can become a paid feature later if traction exists.

### Interpreted product insight
v0 scope is **minimal sharing**: **public read-only URLs** with the already-decided **owner disable** + **noindex** behavior only—**no** passwords, **no** expiring links, **no** extra “private link” controls. **Richer sharing controls** are explicitly **deferred** and may become a **future paid** line if the product gets traction.

### PRD implication
**MVP** and **journeys** avoid scope creep on link policy; **Out of scope / roadmap** can list password/expiry/private-link controls as **post-v0** or **monetized later**. **Payment model** already credit-based—**advanced sharing as add-on revenue** is a hypothesis, not v0 scope.

### New / updated questions
- Q-012 answered. *(No further items in the tactical queue from this thread.)*

---

## 2026-05-09 — v0 success metrics: lightweight in-product feedback

### Raw user input
> Feedback is the first v0 success metric.
>
> After key PRD moments, Zedos should automatically ask for lightweight feedback:
> - 1–5 star rating or like/dislike
> - optional comment box
>
> Primary success metric:
> User feedback quality after PRD generation / iteration.
>
> Working metrics:
> 1. Feedback response rate
> Definition: % of users who answer the feedback prompt after a key PRD step.
> Why it matters: if nobody answers, we cannot learn reliably.
>
> 2. Positive feedback rate
> Definition: % of submitted feedback rated 4–5 stars or “like”.
> Why it matters: measures whether the output feels useful enough to the user.
>
> 3. Negative feedback reasons
> Definition: recurring themes from 1–3 star / dislike comments.
> Why it matters: tells us what to fix first: unclear PRD, weak questions, wrong structure, too generic, missing context, etc.
>
> Product behavior:
> - Ask automatically after meaningful moments, not constantly:
>   - first PRD version generated
>   - PRD updated after clarification
>   - share link created / PRD viewed
> - Feedback must be lightweight and skippable.
> - Comment is optional.
> - Store feedback per project, PRD version, and workflow step.

### Interpreted product insight
v0 success measurement centers on **in-product feedback** after **key PRD milestones**: **primary** lens is **feedback quality** tied to generation/iteration; **operational** measures include **response rate**, **positive rate** (4–5 / like), and **thematic analysis** of negative signals. Prompts are **automatic but selective** (first version, post-clarification update, share/ view moments), **skippable**, stars **or** binary like, **optional comment**, attributed in storage to **project + PRD version + workflow step**.

### PRD implication
**Success Metrics**, **journeys**, and **MVP** should explicitly include **feedback collection** UX and **measurement definitions**; **Flow Inventory** gains feedback-after-milestone flows; **Business Objects** likely include **feedback events**. Minor ambiguity: “PRD viewed” may mean **owner** vs **anonymous share viewer**—may need a follow-up if product boundaries differ.

### New / updated questions
- Q-013 answered (replaces prior “metrics unknown” gap from Q-010 for current truth). Q-010 annotated **SUPERSEDED** for metrics narrative. Next: Q-014.

---

## 2026-05-09 — First-run credit grace + recharge path

### Raw user input
> First-run credit grace model
>
> At signup, users receive X starter credits.
>
> During the first PRD circuit only, if the user slightly exceeds the starter credit balance, Zedos allows the current AI response to complete instead of cutting the flow mid-answer.
>
> After completion, the app shows a clear message:
>
> “You exceeded your included starter credits by X credits. We covered this one for you so your first PRD flow was not interrupted.”
>
> Then Zedos shows a recharge modal:
> - buy more credits now
> - enable auto-reload
> - continue without credits, but paid AI generation is blocked until recharge
>
> This grace is one-time and limited to the first PRD circuit.
> After that, credits are deducted continuously and generation is blocked when balance is insufficient, unless auto-reload is enabled.

### Interpreted product insight
v0 includes a **one-time “first PRD circuit” credit grace**: **starter balance X** at signup; if the user **marginally overspends** during that **first circuit**, the **in-flight AI completion** still **finishes**, then the app explains the **overage covered once** and opens a **recharge modal** with **buy now**, **auto-reload**, or **defer** (AI blocked until top-up). **After** that circuit, behavior is **strict**—**no mid-response grace**; **block** when balance can’t cover the operation **unless auto-reload** handles it.

### PRD implication
**Payment / credits** sections need **grace rules**, **first-circuit definition**, **negative or promotional balance semantics** (implicit debt covered once), **auto-reload** as a v0 product surface, and **recharge modal** copy/flows; **Q-014** commercial packaging (pack sizes, price bands, geo) still **not specified**—opened **Q-016**. Next open: **Q-015**.

### New / updated questions
- Q-014 answered (grace + recharge UX; packs/pricing/geo → **Q-016**, later split: **Q-015** for compliance/provider).

---

## 2026-05-09 — Stripe + v0 payment/compliance constraints

### Raw user input
> Stripe is selected for v0.
>
> Payment/compliance constraints for v0:
> - Launch regions: France/EU + US.
> - Payment provider: Stripe.
> - Must support prepaid credit packs.
> - Must support one-time credit top-ups.
> - Must support explicit card saving for future auto-reload.
> - Auto-reload must be opt-in only, not a hidden subscription.
> - Auto-reload is a prepaid refill rule, not a subscription plan.
> - Must support France/EU + US payment flows.
> - Must support clear tax/VAT handling for digital AI credits.
> - Must allow Zedos to maintain its own internal credit ledger.
> - Must deduct credits progressively, per AI operation.
> - Credit packs are X credits, not “1 PRD / N PRDs”.
> - First signup circuit includes X starter credits.
> - If the first PRD circuit slightly exceeds X, Zedos lets the current response finish and offers the overage once.
> - After the first-circuit grace, paid AI generation is blocked at zero credits unless auto-reload succeeds.
> - No BYOK in v0.
> - No subscription in v0.
> - No unlimited free AI.

### Interpreted product insight
v0 **locks payments to Stripe** with **launch coverage FR/EU + US**, **prepaid credit packs** and **one-time top-ups**, **VAT/tax clarity** for **digital AI credits**, and **Zedos-owned ledger** with **per-operation deduction**. **Saved payment method** enables **opt-in auto-reload** framed as **prepaid refill rules**, **not** a subscription. Product restates **first-circuit grace** and post-grace **hard stop at zero** unless **auto-reload succeeds**; **packs denominated in credits (X)**, not PRD-count bundles; **BYOK / subscription / unlimited free** remain **out of v0**.

### PRD implication
**Integration Boundaries** and **Configuration Matrix** can name **Stripe** and **FR/EU + US**; **payment model** gains **tax/VAT**, **ledger ownership**, **auto-reload semantics**, and **card-on-file** for refill; **Q-016** shrinks to **SKU count + rough pricing** (geo/provider decided here).

### New / updated questions
- Q-015 answered. **Q-016** narrowed (no longer asks geo).

---

## 2026-05-09 — Credit pack SKUs (100 / 200 / 1000) + pricing stance

### Raw user input
> Credit packs:
> - 100 credits
> - 200 credits
> - 1000 credits
>
> Credit packs are sold as prepaid credit quantities, not as “number of PRDs.”
> Credits are consumed progressively per AI operation.
> Prices remain operator-configurable and can differ by currency/region.
> v0 uses Stripe one-time payments for manual top-ups.
> Auto-reload, when enabled, purchases one of these prepaid packs automatically using a saved payment method.
> Auto-reload is opt-in and does not create a subscription.

### Interpreted product insight
v0 sells **three fixed pack sizes**—**100**, **200**, and **1000 credits**—as **pure prepaid quantities** (never “N PRDs”); **consumption stays per AI operation**. **List prices** are **operator-config** and may **vary by currency/region**. **Manual top-up** = **Stripe one-time** checkout; **opt-in auto-reload** charges **one of the same three packs** via **saved payment method**, **without** creating a **subscription**.

### PRD implication
**Configuration Matrix** can list **enumerated pack sizes** while keeping **prices tunable**; **flows** distinguish **one-time purchase** vs **auto-reload pack selection**; aligns with **Q-015** (Stripe, FR/EU+US). **Persisted `PRD.md` remains stale** until `/prd converge` → `/prd update`.

### New / updated questions
- Q-016 answered. Active queue empty → **PRD blocker scan**: remaining `PRD.md` gaps are **stale text** vs **Q-013–Q-016** / intentional TBD (**AI vendor** “not specified here”); recommend **`/prd converge`**.

---

## 2026-05-09 14:46 — Guided clarification UX model defined (Q-017)

### Raw user input
> Hybrid.
>
> The guided clarification loop should use structured questions inside a conversational wrapper.
>
> The founder experiences the flow as a guided AI conversation, but each step has a clear question, a focused answer field, and explicit actions such as:
> - answer
> - skip / not sure
> - approve
> - refine
> - generate PRD version
>
> This is not a free-form chatbot where the user can drift endlessly, and not a rigid questionnaire that feels like paperwork.
>
> Question history stores the structured question, founder answer, AI interpretation, and resulting PRD impact.

### Interpreted product insight
The clarification loop is a **structured-conversational hybrid**: the AI drives a guided sequence of focused questions; the founder sees one question at a time with a dedicated answer field and explicit step-level actions (answer, skip/not sure, approve, refine, generate PRD version). The conversational wrapper creates a guided feel without free-form drift. Question history is a structured log — not a raw chat transcript — storing: structured question, founder answer, AI interpretation, and PRD impact per step.

### PRD implication
- **Guided clarification loop** sub-component of FG-PRD-V0 is now explicitly defined: structured questions + conversational wrapper + per-step explicit actions.
- **Question history** business object gains 4 required fields: structured question, founder answer, AI interpretation, PRD impact.
- The "approve" and "generate PRD version" actions confirm that the loop has explicit **advancement gates** — not passive auto-progression.
- "Skip / not sure" confirms the loop must handle **incomplete answers** gracefully (question not required to advance).
- This is a significant product design anchor; must be reflected in FG-PRD-V0 definition before `/prd update`.

### New / updated questions
- Q-017 opened and answered. Active queue remains empty post-capture.

---

## 2026-05-09 14:49 — Q-017 refined: chat-driven dynamic decision UI

### Raw user input
> Approved, with one wording adjustment.
>
> The clarification loop should be defined as: Chat-driven dynamic decision UI.
>
> The chat remains the guidance and reasoning layer, but when a product decision is better captured through constrained input, Zedos generates a contextual mini-form on the fly.
>
> Examples: modal with 2 select fields + optional comment, single-choice decision card, multi-choice checklist, ranked options, "not sure / ask me differently" action.
>
> This is not a free-form chatbot and not a static questionnaire.
>
> Each dynamic UI block must map to a PRD decision: structured question, available options, founder answer, optional comment, AI interpretation, PRD impact.

### Interpreted product insight
The clarification loop is a **chat-driven dynamic decision UI**: chat is the persistent guidance and reasoning layer; when a decision benefits from constrained input, Zedos **generates a contextual mini-form on the fly** (modal, decision card, checklist, ranked options). The founder is never in a free-form chat drift, never filling a static form — they're in a guided conversation where the interface adapts to the decision type. Question history is a **structured log** with 6 fields per decision: structured question, available options, founder answer, optional comment, AI interpretation, PRD impact.

### PRD implication
- **Guided clarification loop** → rename/reframe as **chat-driven dynamic decision UI** throughout FG-PRD-V0 definition.
- **Question history** business object gains a 6th field: **available options** (the constrained choices offered by the mini-form).
- **"Not sure / ask me differently"** is a named action — must be supported in the loop design.
- This is approved for persistence via `/prd update` in the same turn.

### New / updated questions
- Q-017 answer refined. Governing product text: `docs/prd/PRD.md` after approved `/prd update`.

---

## 2026-05-09 15:02 — Credit burn model (directional, v0)

### Raw user input
> Credit burn model for v0:
>
> Use a simple directional model first:
>
> - Lightweight clarification step: 1 credit
> - Standard decision / clarification step: 3 credits
> - Dynamic mini-form decision step: 5 credits
> - PRD version generation or major PRD update: 10 credits
> - PRD challenge / convergence pass: 15 credits
>
> This is a product assumption for v0, not final pricing.
>
> The goal is only to make 100 / 200 / 1000 credit packs understandable:
> - 100 credits = enough to meaningfully create and iterate a first PRD
> - 200 credits = enough for deeper iteration
> - 1000 credits = power-user / repeated project usage
>
> Prices and starter X stay operator-configurable.

### Interpreted product insight
The credit system now has a **directional burn model**: five operation tiers (1 / 3 / 5 / 10 / 15 credits) calibrated so that **100 credits maps to a complete meaningful first PRD**, **200 to deeper iteration**, and **1000 to power/multi-project usage**. This is explicitly a **product assumption for v0, not final pricing** — the goal is to make pack sizes legible to founders, not to commit to implementation costs. Prices and starter grant X remain operator-configurable.

### PRD implication
- **Credit system sub-component** of FG-PRD-V0 can now reference a directional burn table to justify the 100/200/1000 pack denominations as meaningful founder-value anchors.
- **Business Objects:** credit ledger / consumption semantics gains a tier model (5 operation types with credit weights).
- **Configuration Matrix:** burn rates are a product assumption (labeled as such), not hardcoded; prices and X remain TBD/operator-config.
- **Credit economics gap** flagged in the `/prd challenge` is now partially answered — addresses Q-018 (raised by challenge).
- Answers the challenge report question: "directional credit consumption range per AI operation."

### New / updated questions
- Q-018 answered: directional credit burn model defined (see above).

---

## 2026-05-09 15:04 — First-circuit grace cap (fixed ceiling, v0)

### Raw user input
> First-circuit grace cap:
>
> Use a fixed credit ceiling, not a percentage.
>
> For v0:
> - First PRD circuit grace can cover at most 20 extra credits.
> - It applies only once, only during the first PRD circuit.
> - It only lets the current in-flight AI response finish.
> - After that response, the user sees the overage message + recharge modal.
> - If the projected overage is above 20 credits, the app should not start the paid AI operation unless the user has enough credits or auto-reload succeeds.
> - After the first circuit, no grace applies: paid AI generation is blocked at zero credits unless auto-reload succeeds.
>
> Reason: 20 credits is enough to avoid a bad first-use interruption, but small enough to avoid turning grace into an exploitable free tier.

### Interpreted product insight
The first-circuit grace is now precisely bounded: **20-credit fixed ceiling**, single-use, single-circuit, applied only to let an in-flight response finish — not to start new operations. There's a pre-check gate: if the projected cost of the next AI operation exceeds the remaining balance + 20 credits, the operation does not start at all. The grace only absorbs an overage that occurs mid-response for an operation that was already projected to fit (or nearly fit). After the grace fires, the recharge modal appears immediately. Post-first-circuit: zero tolerance — block at zero.

### PRD implication
- **Credit system** flow gains a precise grace rule: `if balance ≥ 0 AND projected_cost ≤ remaining + 20 AND first_circuit_active → allow completion`. If `projected_cost > remaining + 20`, block before starting.
- **"Slightly exceeds"** language in PRD.md should be replaced with the explicit 20-credit ceiling.
- The pre-check gate (do not start if overage would exceed 20 credits) is a new product behavior not yet in PRD.md.
- Reason is product-level: anti-abuse, not implementation detail — worth noting in Risks & Assumptions.
- Answers Q-019 (raised by challenge).

### New / updated questions
- Q-019 answered: first-circuit grace defined as 20-credit fixed ceiling with pre-check gate.

---

## 2026-05-09 15:08 — Auto-reload v0 product rule (best-effort, SCA-aware)

### Raw user input
> Auto-reload remains in v0, but only as an opt-in convenience layer.
>
> Product rule:
> - Manual top-up is the primary v0 payment path.
> - Auto-reload is in v0, but it must never be required to complete the first PRD flow.
> - Auto-reload is opt-in only.
> - Auto-reload buys one prepaid credit pack via saved payment method.
> - Auto-reload is not a subscription.
> - If auto-reload succeeds, credits are added and generation can continue.
> - If auto-reload fails or requires authentication, Zedos must fall back to manual recharge UX.
> - The user should see a clear message and be asked to confirm/authenticate payment manually.
> - Paid AI generation remains blocked until the recharge succeeds.
> - No hidden debt, no silent retry loop, no negative balance except first-circuit grace.
>
> Reason: Auto-reload is valuable for conversion and continuity, but EU/SCA can interrupt off-session payments. So v0 should include it as best-effort convenience, not as a guaranteed background refill.

### Interpreted product insight
Auto-reload in v0 is **best-effort convenience, not guaranteed background refill**. The product explicitly acknowledges EU/SCA as a runtime reality: when off-session charge fails or requires authentication, the fallback is **manual recharge UX** — clear message, manual confirm/authenticate, generation stays blocked until resolved. This resolves the FALSE CONVERGENCE RISK flagged in the challenge. Manual top-up remains the **primary** path; auto-reload is the secondary, opt-in, convenience layer. Hard invariants: no hidden debt, no silent retry loop, no negative balance except the one defined first-circuit grace.

### PRD implication
- **Auto-reload** description in PRD.md must change from implied silent background refill → **best-effort convenience with explicit SCA fallback**.
- New product behavior: if auto-reload fails or requires authentication → show clear message → present manual recharge UX → block generation until resolved.
- The EU/SCA constraint previously flagged as a FALSE CONVERGENCE RISK is now explicitly acknowledged and handled at product level.
- **Risks & Assumptions** should note: auto-reload is best-effort; SCA may require manual intervention; the product UX handles this gracefully rather than treating it as an error.
- Hard invariants ("no hidden debt, no silent retry, no negative balance except grace") are product-level constraints, worth persisting.
- Answers Q-020 (raised by challenge: should auto-reload be deferred given EU SCA?).

### New / updated questions
- Q-020 answered: auto-reload stays v0 as best-effort opt-in with defined SCA fallback to manual recharge UX.

---

Rules:
- Append only.
- Do not edit past entries unless correcting a clear interpretation error.
- Notes are input material, not PRD persistence.
- Content from notes reaches PRD.md only through `/prd converge` → approved delta → `/prd update`.
