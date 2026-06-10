# QA Synopsis — what to test before any release

This is the manual release-QA checklist for zedos. It aggregates the acceptance criteria
(`## UX States` + `## Acceptance-Level Outcome`) already defined in the 60 scope slice files
under `docs/product/scope-slices/` — those files are the source of truth. If a slice changes,
update the matching section here; if a new slice ships, add a section and cite the slice file.

How to use it:

- Before any release, run at minimum the **Release smoke** section at the bottom (~15 minutes).
- Before a release that touches a feature area, run that area's full section.
- Sections are ordered by the user journey: account → dashboard → project → clarify → PRD →
  share → credits → post-PRD pipeline → gated features.
- Gated/flagged features (section 13) are coded but **prod-gated** behind PRD gates
  (`docs/prd/gates-status.md`: GATE-PHASE1-A/B/B′, GATE-MOAT-C, GATE-LINEAR-001, GATE-MRR-500).
  For those, the QA assertion in prod is "hidden, disabled, or stubbed" — not "works end to end."

## Test environment

- Run the app with `E2E_MODE=true` for deterministic behavior: infrastructure swaps in
  stubs for Stripe and the AI provider (`apps/web/src/shared/testing/e2e-mode.ts`), and
  PostHog analytics is disabled (no network calls).
- Seed test users with `apps/web/scripts/seed-e2e.ts`:
  - `e2e@zedos.test` / `E2eTestPassword123!` — standard user with credits
  - `e2e-nocredits@zedos.test` / `E2eTestPassword123!` — zero-credit user for blockage flows
- Key routes: `/sign-in`, `/sign-up`, `/dashboard`, `/dashboard/projects`,
  `/dashboard/projects/[id]` (tabs: clarify, PRD, architecture, history, decisions),
  `/dashboard/credits`, `/dashboard/billing`, `/dashboard/settings`, `/dashboard/templates`,
  post-PRD pipeline pages (feature-split, user-stories, task-split, delivery),
  `/share/[token]`, `/legal/*`.
- For real-Stripe verification (staging only), use Stripe test cards; never run money-path
  QA against live keys.

---

## 1. Account & session

Sign-up / sign-in:

- [ ] Visiting `/sign-up` with no session shows email + password fields, a create-account button, and a link to sign-in
- [ ] Visiting `/sign-in` with no session shows email + password fields, a sign-in button, and a link to sign-up
- [ ] Submitting either form disables the submit button and shows a loading state until the request resolves
- [ ] Invalid email format, too-short password, or blank required field shows an inline per-field error and does not submit
- [ ] Signing up with an already-registered email shows an error indicating the email is taken and offers a sign-in link
- [ ] Signing in with wrong credentials shows a generic error (no hint which field is wrong — no email enumeration)
- [ ] Repeated failed sign-in attempts trigger a rate-limit message directing the user to wait
- [ ] Successful signup lands directly on `/dashboard` signed in (no email-verification step in v0)
- [ ] Successful sign-in lands on `/dashboard`, or on the originally requested protected URL if sign-in was triggered by a redirect
- [ ] Visiting `/sign-up` or `/sign-in` while already signed in redirects to `/dashboard`
- [ ] Forgot-password flow lets a user request an email-based reset and sign in with the new password

Session persistence & protected routes:

- [ ] Navigating between dashboard pages never re-prompts for sign-in while the session is valid
- [ ] Reloading a signed-in page keeps the user signed in
- [ ] Closing and reopening the browser within the session lifetime (7-day window) keeps the user signed in
- [ ] Visiting a protected URL without a session redirects to sign-in with the destination preserved (e.g. `/sign-in?from=/dashboard`)
- [ ] An expired session hitting a protected route behaves identically to no-session (redirect with return URL, no error page)
- [ ] Explicit sign-out destroys the session and lands on a public page; signing out with an already-expired session is clean (no error)
- [ ] Public routes (`/sign-in`, `/sign-up`, `/share/[token]`, `/legal/*`) render without a session and without redirecting
- [ ] No private workspace content (projects, PRD versions, history) is ever returned to an unauthenticated request

Source: `account-session--sign-up-sign-in.md`, `account-session--session-persistence-protected-routes.md`

## 2. Dashboard shell

- [ ] After sign-in, `/dashboard` shows a home base with clear navigation toward project creation and PRD work
- [ ] First-time user with no projects sees an empty state inviting them to create their first project
- [ ] Returning user sees their recent projects with entry points back into PRD work
- [ ] Deferred/non-v0 areas are visibly labeled "under construction" / "coming soon" — never presented as live features
- [ ] Clicking an under-construction placeholder does not navigate to a 404 or throw — at most a tooltip/notice
- [ ] Unauthenticated access to `/dashboard` redirects to sign-in (covered by section 1, verify from the shell too)

Source: `dashboard-shell--signed-in-home.md`, `dashboard-shell--under-construction-placeholders.md`

## 3. Project workspace

Create:

- [ ] Projects list shows skeleton placeholders while loading, then either an empty state with a create CTA or the project list
- [ ] "New project" opens a dialog with required name and optional description
- [ ] Submitting without a valid name shows an inline validation error and does not navigate
- [ ] Successful create shows a success toast and navigates into the new project workspace; the project is scoped to the creating account only
- [ ] A failed create shows an error toast and allows retry without losing input

List / open / switch:

- [ ] Dashboard/projects page lists all owned projects with name and description snippet; clicking one opens its workspace
- [ ] A failed project-list fetch shows an inline error with a retry — never a silent empty list
- [ ] Opening a project id that doesn't exist or isn't owned redirects back to the projects list (no partial workspace)
- [ ] The in-workspace project switcher lists other owned projects; selecting one navigates to that workspace without losing the session
- [ ] A switcher list-fetch error shows an inline message + retry; an empty list points back to the create flow

Next-action banner:

- [ ] Exactly one next-action banner is shown at any time, matching project progress: no projects → "create"; project without PRD → "open Clarify"; clarify in progress → "resume Clarify"; PRD v1 without share → "create share link"; shared + not exported → "open Delivery/export"; express + post-PRD locked → "deepen/switch to standard"; export done → "iterate or new project"
- [ ] While project data is loading the banner is hidden or skeleton — never a misleading CTA
- [ ] If project load fails, the banner is suppressed and the normal error UX shows
- [ ] The banner's primary CTA actually navigates to the recommended step

Source: `project-workspace--create-project.md`, `project-workspace--list-and-open-project.md`, `project-workspace--switch-active-project.md`, `project-workspace--next-action-banner.md`

## 4. PRD import at create

- [ ] Default project creation shows only the standard/express choice; the import option is a collapsed optional expander
- [ ] Expanding import offers paste; pasting invalid content shows inline validation errors
- [ ] Uploading a file shows progress; an oversize or wrong-type file shows a clear error
- [ ] A successful import lands in the workspace with the imported PRD visible as the **first** in-app version
- [ ] After import the founder can continue (clarify/share) without being forced through a full standard clarify loop
- [ ] A server/validation failure shows an actionable message and never leaves a half-created project without a recovery path
- [ ] Importing with an expired session redirects to sign-in

Source: `prd-import--capture-external-prd-at-create.md`

## 5. Guided clarification

Core clarify loop (standard):

- [ ] A clarify turn streams an AI response in the Clarify tab and, on success, adds a structured row to question history and deducts credits
- [ ] A malformed clarify request returns a 400 with validation details — no credit deduction, no history row
- [ ] Insufficient credits returns a 402 with balance/cost info — no history row (test with `e2e-nocredits@zedos.test`)
- [ ] An AI response that fails schema validation does not deduct credits and does not insert a history row

Contextual tab refinement:

- [ ] Every section/item heading in the PRD, Architecture, and History tabs shows a small "Refine" trigger
- [ ] Tapping the trigger opens a drawer whose header names the context (e.g. "Refine: Target Users"); the underlying tab stays in place
- [ ] Send is disabled while the input is empty and while the AI is streaming; a reasoning chip may appear during stream
- [ ] After the AI reply, the user can continue with another turn or close; Esc/close dismisses the drawer leaving the tab unchanged
- [ ] A 402 credit error shows a toast, keeps the panel open, and disables send; a network error shows a toast and allows retry
- [ ] A refinement turn produces a `questionHistory` row and deducts credits exactly like a main clarify turn

Question preview & progress score:

- [ ] With zero answers, "Coming up" lists the first 3 canonical PRD sections and the readiness score shows 0%
- [ ] With partial coverage, "Coming up" shows the next uncovered sections and the score equals answered / (answered + remaining) × 100
- [ ] With all 8 sections covered but no PRD generated, the score caps at 95% with a "ready to generate" hint
- [ ] Once a PRD version exists with all sections covered, the score can reach 100%
- [ ] While the score is fetching the badge shows a skeleton/"…"; if the fetch fails it degrades to "—" without crashing

Source: `guided-clarification--contextual-tab-refinement.md`, `guided-clarification--question-preview-and-progress-score.md`, `question-history--persist-structured-decision-entries.md`

## 6. Fast-track / express mode

Declare & switch:

- [ ] Project creation pre-selects **Standard** and offers **Express (urgent)**; the choice is locked while the create is in flight
- [ ] After creation, a visible mode indicator in the workspace reflects the chosen mode at all times
- [ ] Switching to express mid-project shows a short confirmation that next work follows the express path; prior versions are unchanged
- [ ] Switching to standard confirms new work uses standard depth and notes express versions remain in history
- [ ] "Approfondir" moves an express project to standard without deleting any express versions
- [ ] Mode switching on a project that already has PRD versions is allowed and never deletes versions

Express deliverable generation:

- [ ] On a standard project, express minimum-IA generation is not offered (standard clarify only)
- [ ] On an express project, minimum-IA clarification runs with fewer steps and grows question history
- [ ] Credit rules apply identically to standard: pre-check block at projected overage > 20, zero-balance recharge UX, one-time in-flight grace
- [ ] Successful generation persists a full 12-section express PRD readable in-app, marked as an express version in the version list
- [ ] A failed generation shows an error and allows retry when credits permit; an expired session never exposes a partial generation

Express disclaimer & grayed shell:

- [ ] The owner viewing an express PRD version sees "version express — à approfondir" near the content; standard versions never show it
- [ ] An anonymous share visitor on an express version sees the same disclaimer on the read-only page; a standard version share does not
- [ ] On an express project, post-PRD destinations (feature split, user stories, task split, delivery) are visible but grayed/disabled with deferral copy pointing to "Approfondir"
- [ ] The grayed treatment holds both before the first PRD version and after the livrable express exists
- [ ] Switching express → standard removes the grayed treatment; switching back restores it

Source: `fast-track-urgent--declare-express-mode.md`, `fast-track-urgent--express-deliverable-generation.md`, `fast-track-urgent--express-share-disclaimer.md`, `fast-track-urgent--grayed-post-prd-shell.md`

## 7. PRD versioning

- [ ] Opening a project workspace for the first time silently ensures version 1 exists (placeholder content); reloading or duplicate requests never create a duplicate version 1
- [ ] An unauthenticated ensure/list call returns 401 and the client does not retry it as a "PRD init" failure; non-401 failures show a user-visible error toast
- [ ] Accessing PRD versions of a project the user does not own returns an access error
- [ ] The version selector shows the active version's identity even when only one version exists
- [ ] With multiple versions, the picker lists each version (number + status) and switching changes the displayed PRD without losing signed-in or project context
- [ ] The active version is prominently indicated in the PRD panel
- [ ] A failed version-list fetch shows an error signal (toast) while keeping the user in the project
- [ ] "Export Markdown" is enabled when a version is loaded and downloads a `.md` file matching the current version's sections — without spending credits
- [ ] Markdown export of an express version includes the express disclaimer in the file header
- [ ] Export is disabled when no version exists; an expired session requires sign-in before export

Source: `prd-versioning--create-or-capture-prd-version.md`, `prd-versioning--browse-and-switch-prd-versions.md`, `prd-versioning--export-markdown-v0-1.md`

## 8. Question history & decisions

- [ ] The History tab shows skeletons while loading, then either an explainer empty state or a scrollable list
- [ ] Each history entry shows all six structured fields (question, options, answer, impact, etc.) plus its PRD version association when present
- [ ] Returning to the History tab after new clarification turns refetches so new decisions appear without a full reload
- [ ] A history fetch failure shows a short message with retry; the list endpoint returns an empty array for a fresh project
- [ ] Legacy/invalid stored options surface as null in the API rather than arbitrary JSON; a contract-shape drift yields a generic 500 (details server-side only)
- [ ] Question history is visible only to the signed-in owner — never to other accounts or anonymous visitors

Source: `question-history--owner-views-question-history.md`, `question-history--persist-structured-decision-entries.md`

## 9. Read-only sharing

Mint:

- [ ] With a PRD version selected and no active link, a Share action is available; tapping it shows loading and prevents duplicate requests
- [ ] A successful mint shows the full URL with Copy and Disable controls; re-minting returns the existing active link instead of creating a duplicate
- [ ] Network failures, 4xx/5xx responses, and contract-invalid 200 responses each show a distinct error toast

Anonymous view:

- [ ] Opening a valid `/share/[token]` link with no session shows the shared PRD content with a neutral loading state — no sign-in prompt
- [ ] The share page exposes **only** the PRD content: no project name/IDs, workspace nav, edit/comment/export controls, or question history
- [ ] An unknown, malformed, or disabled token shows a friendly "not available" page that does not reveal whether a workspace exists
- [ ] A server error during the share read shows a safe generic failure (refresh to retry)

Revoke & noindex:

- [ ] The owner can disable a live link; while revoking, a busy affordance shows; success confirms the link is dead
- [ ] After revocation, the old URL no longer serves PRD content (inactive/not-found surface)
- [ ] Disabling a link you don't own or an unknown link id returns a generic not-found (no ownership leakage); unauthenticated disable prompts sign-in
- [ ] All share pages — active or revoked — are served with noindex/nofollow intent (check response headers / meta)

Source: `read-only-sharing--mint-read-only-link.md`, `read-only-sharing--anonymous-read-surface.md`, `read-only-sharing--revoke-link-and-noindex.md`

## 10. Owner milestone feedback

- [ ] No feedback prompt appears during normal use until a milestone fires
- [ ] Each of the four milestones (first PRD version created; PRD updated after clarification; share link minted; PRD reopened after generation) triggers a lightweight, non-blocking prompt with a visible Skip
- [ ] Skipping closes the prompt immediately and records nothing
- [ ] The same milestone firing again within one browser session does not re-show the prompt (session dedupe)
- [ ] Prompts never appear for anonymous share visitors or non-owner sessions
- [ ] Submitting a rating (with or without optional comment) shows in-progress state, prevents double-submit, and confirms success
- [ ] A failed save shows an error and allows retry without losing the selected rating/comment
- [ ] Stored feedback carries the correct project, PRD version, milestone type, and timestamp
- [ ] After minting a share link, the O1 outcome question ("did you actually share externally?" — Yes / Not yet / No) is the primary prompt; stars are a collapsed secondary option; skipping is logged as skipped

Source: `owner-milestone-feedback--milestone-detection-and-prompt.md`, `owner-milestone-feedback--feedback-capture-and-attribution.md`, `owner-milestone-feedback--outcome-prompt-on-share.md`

## 11. Credits & payments

Ledger & burn (use `e2e-nocredits@zedos.test` for blocked states):

- [ ] A successful AI operation deducts credits **after** the response completes; the balance visibly decreases by the operation cost
- [ ] A failed AI call (timeout, provider error, invalid JSON) leaves the balance unchanged — no charge for failed work
- [ ] Starting a costly operation with projected overage > 20 credits (grace unused) returns a 402 with a recharge prompt before any AI call
- [ ] The one-time grace lets a first-circuit operation complete slightly negative (within −20), then flips the grace flag; subsequent insufficient-balance ops are blocked
- [ ] Two concurrent AI calls (two tabs) never double-deduct or double-consume grace: one wins, the other gets the normal 402

Manual credit pack checkout:

- [ ] `/dashboard/credits` presents the three prepaid packs (100 / 200 / 1000) with explicit one-time (non-subscription) wording
- [ ] Confirming a pack redirects to Stripe Checkout (stubbed deterministically under `E2E_MODE`)
- [ ] A successful payment returns to the app with confirmation and the balance increased by exactly the purchased pack
- [ ] Canceling checkout returns with no balance change and a clear "no purchase completed" message
- [ ] A declined/failed payment shows an actionable error, allows retry, and adds no credits
- [ ] Webhook resilience: completing payment then closing the tab before redirect still grants credits on next dashboard load; a delayed webhook shows "Processing your purchase…" with polling; a replayed webhook (duplicate event id) never double-credits; an invalid webhook signature is rejected with no side effects

Auto-reload:

- [ ] Auto-reload is off by default and described as an optional prepaid convenience — never as a subscription
- [ ] Enabling auto-reload without a saved payment method explains a prior successful manual checkout is required first
- [ ] When the trigger fires with a saved method, the refill happens silently in the background (no interrupting UI)
- [ ] A declined or SCA-requiring off-session charge routes to a clear manual recharge prompt; paid AI features stay blocked until manual recharge succeeds; no automatic retry loop
- [ ] Disabling auto-reload stops further automatic attempts

Builder subscription:

- [ ] A free signed-in owner sees the upgrade CTA on eligible surfaces (pricing / export modal); anonymous users cannot start checkout
- [ ] Completing Builder Monthly checkout returns with `builder` tier active and full Cursor export unlocked
- [ ] Abandoning checkout leaves the account free with workspace state unchanged
- [ ] The Customer Portal lets the owner update card or schedule cancel; cancel-at-period-end keeps builder until the end date (with messaging), then reverts to free with the export gate restored
- [ ] A failed subscription payment shows a banner/modal to update payment
- [ ] One-time credit packs remain purchasable alongside an active subscription

Tax / VAT legibility:

- [ ] The credits page shows a tax line (estimate or "calculated at checkout") while packs load; selecting a pack shows the estimated VAT/tax for FR/EU or US before redirect
- [ ] Stripe Checkout shows the hosted tax breakdown; the post-purchase confirmation/receipt includes a legible tax/VAT line
- [ ] When tax cannot be computed for a region, clear copy says it will be shown at the payment provider — no misleading figures, and errors never display fabricated tax amounts

Source: `credit-system--ledger-concurrency-and-stripe-webhook.md`, `payments--manual-credit-pack-checkout.md`, `payments--auto-reload-opt-in-and-outcomes.md`, `payments--builder-subscription-checkout.md`, `payments--tax-and-vat-legibility.md`

## 12. Post-PRD pipeline

Feature split:

- [ ] With no PRD version ready, the feature-split page shows a guided message to complete or capture a PRD first
- [ ] With versions available, a picker lets the founder choose the input version (guidance: stable drafts only)
- [ ] Generation shows a busy state; partial saves are prevented or clearly reconciled
- [ ] The returned proposal lists clusters with labels and descriptions and supports edit, merge, split, and reorder; edits persist
- [ ] A transient failure allows retry without losing manual edits; an irrecoverable upstream state shows blocked messaging pointing back to PRD versioning
- [ ] Confirming the split produces an artifact and unblocks navigation toward user stories; insufficient credits shows the standard prepaid messaging

User stories:

- [ ] Without a confirmed split, the user-stories page explains the upstream prerequisite
- [ ] With clusters confirmed, the selector shows cluster summaries; generation shows progress with a credit-respecting cancel
- [ ] Generated stories are listed with cluster link, order, and draft markers; the founder can edit narratives, reorganize duplicates, and persist changes
- [ ] Racing saves / validation conflicts show recoverable notices with the latest server truth preserved
- [ ] Marking the corpus review-complete enables navigation to task splitting; credit-gated generation shows balance messaging

Task split (test-first workflows):

- [ ] Without finalized stories, the page explains what to finish upstream
- [ ] Story selection shows narrative excerpts with completeness indicators; generation shows a spinner respecting credit safeguards
- [ ] Output shows ordered tasks with expandable per-task prompts; editing that invalidates lineage shows a diff summary before accepting regenerated drafts
- [ ] Transient errors offer retry vs save-partial-manual-edits; hard missing dependencies show a locked view pointing to prerequisites
- [ ] Locking a bundle marks it export-ready ahead of Delivery

Delivery / Cursor export:

- [ ] With no export-ready bundle, the delivery page explains that task splitting must be completed and links upstream — never a broken download
- [ ] Eligible bundles are listed with task counts; the founder can select some or all
- [ ] Preview shows a read-only summary (ordered stories, tasks, prompt excerpts) with confirm/cancel — no inline editing
- [ ] Confirming shows progress and blocks duplicate export requests; success offers the zip download with guidance to open it in Cursor
- [ ] A transient packaging failure is retryable and does not un-mark bundles upstream; empty selection is validated inline before packaging

Export conversion gate:

- [ ] A builder/pro owner exports the full package immediately with no gate
- [ ] A free owner's **first** export shows a soft gate explaining Builder value, with: primary CTA to Builder checkout, secondary preview (sample/partial listing), and tertiary "Not now" returning to the workspace without export
- [ ] Repeat export attempts by a free owner show a lighter nudge rather than the full gate
- [ ] A missing package / build failure shows the normal delivery error — no upgrade modal; an expired session requires sign-in

Source: `services-feature-split--prd-to-feature-split.md`, `user-stories--story-generation-from-feature-split.md`, `test-first-workflows--task-splitting-with-prompts.md`, `delivery--cursor-package-export.md`, `delivery--export-cursor-conversion-gate.md`

## 13. Gated / flagged features — verify hidden, disabled, or stubbed in prod

These are implemented in code but blocked by PRD gates (`docs/prd/gates-status.md`). In production
QA, the assertion is that they are correctly hidden/default-off/stubbed; full functional checks
apply only in environments where the corresponding gate or flag is enabled.

Decision graph (GATE-MOAT-C):

- [ ] When enabled: completed clarify turns silently persist decisions (one per eligible history entry; backfill is idempotent, no duplicates)
- [ ] When enabled: the Decisions tab shows a chronological, section-filterable list with empty state pointing to Clarify; navigation from a decision reaches its PRD context; the tab is owner-only
- [ ] When enabled: PRD sections with decisions show an accurate count badge that opens the filtered Decisions list; share viewers see no badges
- [ ] When enabled: Cursor export zips include a valid `decisions.json` when decisions exist, and are unchanged when none exist

GitHub drift (GATE-MOAT-C; digest/webhook default-off):

- [ ] When enabled: an owner can connect one repo via OAuth (denied consent leaves it disconnected with a message), see it in settings, and disconnect; revoked tokens show a reconnect prompt; non-owners see no settings action
- [ ] When enabled: drift signals appear in an owner inbox with severity + PRD-section CTA; items can be resolved or dismissed (audit retained); a weekly digest email is sent; no repo connected → evaluation does not run
- [ ] When enabled: webhook events surface signals within minutes; duplicate GitHub deliveries never create duplicate open signals; a secret mismatch shows "realtime paused" + ops alert

Templates marketplace (GATE-MOAT-C):

- [ ] When enabled: `/dashboard/templates` shows 10 official templates with skeleton loading, retry on error, and a maintenance message if seed data is missing; preview shows description + journey hint
- [ ] When enabled: selecting a template at project creation lands in a workspace whose journey mode and starter PRD match the template; standard create without a template is unchanged

Collab comments (GATE-PHASE1-B):

- [ ] When enabled: an owner invites a commenter by email (cap: 3 active, clear cap message); the commenter lands on a read-only PRD via magic link; expired links direct back to the owner; revoke ends access
- [ ] When enabled: section threads support add/reply/resolve (resolved collapses to read-only history); commenters cannot edit the PRD body; the owner gets a notification badge; share viewers still cannot comment

AI red team (GATE-MOAT-C):

- [ ] When enabled: a non-eligible (free) owner sees an upgrade/credit message; an eligible owner sees the CTA, the run spends configured credits, shows progress, and produces a findings panel linking each issue to its PRD section
- [ ] When enabled: failures allow retry when credits allow; zero findings shows a positive empty state; insufficient balance shows recharge UX

Linear integration (GATE-LINEAR-001 — API intentionally a 501 stub):

- [ ] In prod: the Linear surface is hidden or shows a waitlist message; the push/sync API returns 501
- [ ] When enabled: connect via OAuth + team picker; pushing a story shows the linked issue id (failure → retry); Linear status changes flow back to the story; revoked OAuth shows a reconnect CTA

Team data room (GATE-MRR-500 / Team pricing unresolved):

- [ ] In prod: the feature is not marketed below the gate; non-Team tiers see an upgrade message
- [ ] When enabled: an eligible Team owner downloads a single zip containing PRD, decisions, stories, and share index (express disclaimers applied); a partial-artifact failure names which artifact failed

Product analytics (B-ANALYTICS-001/002 — default-off in prod):

- [ ] With `E2E_MODE=true` or `NEXT_PUBLIC_POSTHOG_DISABLED=true`, no PostHog network calls are made; tracking failures never block product use
- [ ] When enabled: Funnel A (signup → first project → first clarify → first PRD) renders with all four steps and express/standard cohort filters
- [ ] When enabled: credit-blockage Funnel B (blockage → credits page → checkout started → completed) is reportable; session replay is masked (no PRD/clarification body visible) and stays off until B-ANALYTICS-002 sign-off

Source: `decision-graph--*.md`, `prd-drift-github--*.md`, `templates-marketplace--*.md`, `collab-async--*.md`, `ai-red-team--adversarial-review-report.md`, `integrations-linear--push-stories-and-status-sync.md`, `team-data-room--bundle-export-zip.md`, `product-analytics--*.md`

---

## Release smoke (15 minutes)

The minimum money-path pass before any release. Use `E2E_MODE=true` with the seeded users.

- [ ] Sign up with a fresh email → land signed-in on `/dashboard`
- [ ] Sign out, sign back in as `e2e@zedos.test` → session survives a page reload
- [ ] Visit `/dashboard` in a private window → redirected to sign-in with return URL
- [ ] Create a project → land in its workspace; version 1 exists; next-action banner shows "open Clarify"
- [ ] Run one clarify turn → AI response streams, a question-history row appears, credits decrease
- [ ] Open the History tab → the new structured decision entry is visible
- [ ] Generate/open a PRD version and switch versions → active version clearly indicated, context preserved
- [ ] Export the PRD as Markdown → file downloads with correct sections, no credits spent
- [ ] Mint a share link → open it in a private window → PRD content only (no workspace data); revoke → URL goes dead; response has noindex
- [ ] As `e2e-nocredits@zedos.test`, attempt a clarify turn → 402 recharge prompt, no history row, balance unchanged
- [ ] Buy a 100-credit pack via (stubbed) Stripe Checkout → balance increases by exactly 100; cancel a second checkout → balance unchanged
- [ ] As a free owner, attempt a Cursor export → soft Builder gate appears with upgrade / preview / not-now; "Not now" returns to workspace without export
