# Scope Readiness Checker

Governed by: `.cursor/core/rules/feature-area-workflow.mdc` (FA / Slice) and `.cursor/core/rules/user-story-workflow.mdc` (User Story / Spec / Task).
Decisions: `docs/product-decisions/PD-001-post-slice-workflow.md`, `docs/product-decisions/PD-006-per-fa-delivery-readiness-gate.md`.

Run this checker before advancing any artifact to the next level in the hierarchy:
- Feature Area → Scope Slice (Part 1 + Part 7)
- Feature Area `validated` → `delivery-ready` (Part 8 + Part 7)
- Scope Slice → User Story (Part 2 + Part 7) — requires parent FA at `delivery-ready` per PD-006
- User Story → Spec (Part 4 + Part 7)
- Spec → Task or Implementation (Part 5 + Part 7)
- Task → Merge (Part 6 + Part 7)

---

## How to Use

For each check, answer **PASS**, **FAIL**, or **SKIP (with reason)**.

A single **FAIL** blocks advancement. Resolve it or set `NEED_HUMAN=true` before proceeding.

Never mark `SKIP` to avoid a hard question. Only skip checks that are genuinely inapplicable (e.g. "Credit impact" for a purely auth-scoped slice with zero AI operations).

---

## Part 1 — Feature Area Checks

Run when evaluating whether a Feature Area is ready for Scope Slice decomposition.

### FA-01 · Not oversized

> The Feature Area does not contain more than ~5 distinct user-value clusters.

**How to check:** list the distinct user problems the area solves. If there are more than five that don't naturally resolve into one coherent concern, split the area.

**FAIL signals:**
- The area mixes auth, billing, settings, and content in one group
- Candidate Scope Slices exceed ~8 and span unrelated user jobs

---

### FA-02 · User-value language

> The Product Intent section uses no technical terms (no "service", "API", "database", "module", "microservice", "endpoint").

**FAIL signals:**
- "This service manages..."
- "The API layer handles..."
- Any implementation-layer noun in the intent statement

---

### FA-03 · Business objects named

> At least one business object is listed in the Business Objects Touched section.

**FAIL signals:**
- Section is empty or says "TBD"
- Only technical objects are listed (e.g. "users table", "credits_ledger")

---

### FA-04 · PRD sections cited

> The Feature Area lists at least one `docs/prd/PRD.md` section as its source.

**FAIL signals:**
- No PRD link
- Links to a discovery note instead of the PRD

---

### FA-05 · In-scope / out-of-scope separated

> Both sections are non-empty and explicit.

**FAIL signals:**
- Out of scope is empty or says "see PRD"
- Scope is defined only by a vague mission statement

---

### FA-06 · Open blockers assessed

> The Open Blockers section is present and either empty or lists blockers with NEED_HUMAN status.

**FAIL signals:**
- Section is missing
- Known open question from `docs/prd/questions/open-questions.md` affects this area but is not listed

---

### FA-07 · Deferred behaviors named

> Any behavior deferred post-v0 (or to a later Scope Slice) is listed in Out of Scope.

Cross-reference PRD `Hard v0 exclusions` section:
- Multi-user collaboration / invites
- PDF export as mandatory "done" criteria
- Subscription billing
- Advanced share controls (password, expiry)
- BYOK
- Anonymous share viewer feedback
- Any "under construction" surface

**FAIL signals:**
- A deferred behavior is listed as In Scope
- No deferred items listed despite PRD having explicit exclusions relevant to this area

---

### FA-08 · No architecture invented

> The Feature Area document contains no data models, API designs, service boundaries, runtime decisions, or technology choices beyond **PRD-allowed product-level terms** (see **Allowed product-level terms (PRD)** below).

**FAIL signals:**
- Database schema references
- REST/GraphQL endpoint definitions
- Service-to-service communication described
- Cloud infrastructure choices

---

### FA-09 · Status is valid

> Status is one of: `exploratory`, `validated`, `blocked`, `deferred`.

**FAIL signals:**
- Status is `ready`, `done`, `complete`, or any non-standard value
- Status is `validated` while Open Blockers has unresolved NEED_HUMAN items

---

## Part 2 — Scope Slice Checks

Run when evaluating whether a Scope Slice is ready for user story writing.

**After `/feature-area scaffold-slices`:** new Scope Slice files are expected to be **`exploratory`** and **not** story-ready. Part 2 will often return **BLOCKED** (e.g. SS-03) until product-level gaps are closed via **`/feature-area refine-slice`**. Advancement to **`ready-for-user-stories`** uses **`/feature-area promote-slice`** only after SS-01–SS-10 and CC-01–CC-05 are **CLEAR** (SS-11 is satisfied by that transition, not as a pre-write gate).

### SS-01 · Single user value

> The User Value section states exactly one user benefit in one sentence, without implementation language.

**FAIL signals:**
- Multiple benefits bundled together
- Technical language ("the API returns...", "the component renders...")
- Missing or blank

---

### SS-02 · Boundary is exact

> Included Behavior and Excluded Behavior are both non-empty and specific enough that two different people would draw the same boundary.

**FAIL signals:**
- "and similar behaviors" or "etc." without enumeration
- Excluded is empty while the PRD clearly has exclusions for this topic
- Overlaps with another Scope Slice's Included Behavior without explicit note

---

### SS-03 · UX states enumerated

> At least the following states are considered: empty, loading/in-progress, success, error, and one edge case or blocked/gated state.

**FAIL signals:**
- Only happy path described
- No error or empty state
- Credit-gated or permission-gated states missing for flows that have them

---

### SS-04 · No implementation details

> The document contains no database tables, API routes, component names, framework choices, or runtime decisions. **PRD-allowed product-level terms** (see below) are permitted when they describe product behavior or constraints, not implementation structure.

**FAIL signals:**
- "The POST /api/credits endpoint..."
- "The CreditBalance React component..."
- "Store in PostgreSQL..."

---

### SS-05 · Credit / payment impact assessed

> The section is present and either states "None" with a reason, or describes the credit interaction explicitly.

For Zedos v0, assess:
- Does this slice trigger an AI operation? (credit burn)
- Does it gate on balance? (zero-balance block, grace policy)
- Does it trigger a purchase flow? (recharge modal, auto-reload)

**FAIL signals:**
- Section is blank
- An AI operation is included but credit impact says "None"

---

### SS-06 · Sharing / privacy impact assessed

> The section is present and either states "None" with a reason, or explicitly describes any change to what anonymous share viewers can see.

**FAIL signals:**
- Section blank
- Slice produces or modifies shared content but section says "None"

---

### SS-07 · Feedback / instrumentation impact assessed

> The section is present and addresses whether this slice triggers an owner feedback prompt or produces attributable data.

For Zedos v0 owner milestones:
- First PRD version created
- PRD version updated after clarification
- PRD shared (link flow)
- PRD reopened / viewed by owner after generation

**FAIL signals:**
- Section blank
- Slice maps to a known milestone but section says "None"

---

### SS-08 · Dependencies explicit

> All dependencies are named with their current status (ready / pending / blocked / unknown).

**FAIL signals:**
- Dependencies section is empty but the slice clearly builds on something else
- Status is unknown for a dependency that appears critical

---

### SS-09 · Blockers resolved or flagged

> All blockers either have a resolution note or carry `NEED_HUMAN=true`.

**FAIL signals:**
- Open question from `docs/prd/questions/open-questions.md` affects this slice but is not listed
- Blocker row exists with no resolution and no NEED_HUMAN flag

---

### SS-10 · Acceptance outcome is behavioral

> The Acceptance-Level Outcome is written as observable user/system behavior, not test cases or code.

**FAIL signals:**
- "Unit test passes for..."
- "Function returns X"
- Describes a test harness instead of a product behavior

---

### SS-11 · Status is `ready-for-user-stories`

> Valid Scope Slice statuses are: `exploratory`, `blocked`, `deferred`, `ready-for-user-stories`. The status `validated` is not valid for Scope Slices.
>
> If the slice has passed SS-01–SS-10 and CC-01–CC-05 with no unresolved NEED_HUMAN flag, status must be `ready-for-user-stories` (set via **`/feature-area promote-slice`** after a **CLEAR** checker run, or equivalent manual edits). User stories may not be written until this status is set.

**FAIL signals:**
- Status is `validated` (not a valid Scope Slice status — `validated` belongs to Feature Areas only; use `ready-for-user-stories` instead)
- Status is `ready-for-user-stories` with unresolved NEED_HUMAN
- Status is `ready-for-user-stories` but SS-01 through SS-10 or CC-01–CC-05 have failures

---

## Allowed product-level terms (PRD)

These phrases may appear in Feature Area and Scope Slice artifacts when grounded in **`docs/prd/PRD.md`** as **product-level** behavior or constraints — not as architecture (no stack, schemas, or endpoints):

- Stripe (payments constraint / flow)
- web app (surface / channel)
- credit ledger (credit accounting concept)
- saved payment method
- noindex (SEO / indexing disposition)
- Cursor setup — **only** when the PRD defers it or marks it out-of-scope for v0 (cite the PRD passage)

Do not treat this list as permission to add implementation detail beyond what the PRD states.

---

## Part 4 — User Story Checks

Run when evaluating whether a User Story is ready for Spec authoring.

**After `/user-story scaffold`:** new User Story files are expected to be `exploratory` and not Spec-ready. Part 4 will often return **BLOCKED** until product-level gaps are closed via `/user-story refine`. Advancement to `ready-for-spec` uses `/user-story promote` only after US-01–US-N and CC-01–CC-05 are **CLEAR**.

Governed by: `docs/product-decisions/PD-001-post-slice-workflow.md`.

### US-01 · Standard story form

> The Story section uses the exact form "As an X, I do Y, so that Z." in one sentence.

**FAIL signals:**
- Missing role ("I do Y, so that Z" without "As an X").
- Missing outcome clause ("so that Z").
- Multiple sentences bundled.
- Implementation language in the role or action ("As the React component...", "As the API caller...").

### US-02 · Acceptance Criteria count and form

> The User Story carries 2–5 inline Acceptance Criteria, each in Given/When/Then form.

**FAIL signals:**
- Fewer than 2 ACs (single AC = the story is too small or under-specified).
- More than 5 ACs (story is too large — split into sibling stories).
- An AC missing Given or Then.
- ACs written as test cases ("assert that..." / "expect()...") instead of behavioral statements.

### US-03 · ACs are observable behaviors

> Every Acceptance Criterion describes an observable user-visible behavior, not implementation.

**FAIL signals:**
- AC mentions routes, endpoints, HTTP verbs, status codes.
- AC mentions component or screen class names.
- AC mentions database tables, columns, or schemas.
- AC uses vague verbs ("handles correctly", "works as expected") instead of observable verbs.

### US-04 · UX states covered are a non-empty subset of the parent slice

> UX States Covered references state names exactly as they appear in the parent Scope Slice's UX States, and the subset is non-empty.

**FAIL signals:**
- UX States Covered is empty.
- A state name does not match the parent slice (typo, paraphrase, invented state).
- The subset implies coverage of states that don't exist in the parent slice.

### US-05 · Out of scope explicit

> Out of Scope section is non-empty and references sibling user stories or future work where relevant.

**FAIL signals:**
- Section blank.
- Out of Scope contradicts the Story or ACs.

### US-06 · Data Touched inherits from parent slice

> Data Touched table is non-empty and stays product-level (no DB tables, no API fields).

**FAIL signals:**
- Section blank when the story affects any persisted object.
- Implementation-level naming ("users table", "session_id column").

### US-07 · Credit / payment, sharing / privacy, feedback impacts inherited

> All three impact sections are present and either state "None" with a reason or describe the impact, inheriting from the parent Scope Slice framing.

**FAIL signals:**
- Any of the three sections is blank.
- A "None" statement contradicts the parent slice's stated impact for this acceptance dimension.

### US-08 · Dependencies explicit

> All dependencies named with status (ready / pending / blocked / unknown). No `unknown` for a critical dependency.

**FAIL signals:**
- Dependency status `unknown` for a sibling story or Spec that this story explicitly depends on.
- Critical dependency missing from the table.

### US-09 · Blockers resolved or flagged

> All blockers either have a resolution note or carry `NEED_HUMAN=true`.

**FAIL signals:**
- Open question from `docs/prd/questions/open-questions.md` affects this story but is not listed.
- Blocker row exists with no resolution and no NEED_HUMAN flag.

### US-10 · Acceptance-Level Outcome is behavioral

> The Acceptance-Level Outcome is one sentence summarizing observable end state.

**FAIL signals:**
- Outcome describes a test ("unit test passes").
- Outcome describes a code-level fact ("function returns X").
- Outcome describes the implementation strategy instead of the end state.

### US-11 · No implementation language anywhere

> The document contains no routes, endpoints, database tables, component names, framework choices, or runtime decisions. **PRD-allowed product-level terms** (see Allowed product-level terms (PRD)) are permitted when they describe product behavior.

**FAIL signals:**
- "The POST /api/signup endpoint accepts..."
- "The SignupForm React component..."
- "Store in PostgreSQL..."

### US-12 · Status is valid

> Valid User Story statuses are: `exploratory`, `blocked`, `deferred`, `ready-for-spec`.
>
> If the story has passed US-01–US-11 and CC-01–CC-05 with no unresolved NEED_HUMAN flag, status must be `ready-for-spec` (set via `/user-story promote` or equivalent manual edits). Spec authoring may not begin until this status is set.

**FAIL signals:**
- Status is `validated` or `ready-for-user-stories` (those belong to Feature Areas / Scope Slices).
- Status is `ready-for-spec` with unresolved NEED_HUMAN.
- Status is `ready-for-spec` but US-01–US-11 or CC-01–CC-05 have failures.

---

## Part 5 — Spec Checks

Run when evaluating whether an Implementation Spec is ready for implementation.

**This is the level where architecture lands.** Checks are strict.

Governed by: `docs/product-decisions/PD-001-post-slice-workflow.md`.

### SP-01 · Summary traces to parent User Story

> Summary section is non-empty and traces back to the parent User Story's Acceptance-Level Outcome in one or two sentences.

**FAIL signals:**
- Summary missing.
- Summary describes a different user outcome than the parent US.
- Summary restates the parent US without adding implementation focus.

### SP-02 · Acceptance Criteria Trace complete

> Every Acceptance Criterion of the parent User Story is traced in the AC Trace table — either satisfied by this Spec or explicitly deferred to a sibling Spec.

**FAIL signals:**
- A parent AC is missing from the table.
- A "satisfied by this Spec" entry has no description of how.
- A "deferred to sibling Spec" entry has no sibling reference.

### SP-03 · Data Model named with constraints

> Data Model section names new or extended objects with field-level constraints and migration plan (or "None" with reason).

**FAIL signals:**
- Section blank when the Spec touches persisted state.
- Fields named without constraints (uniqueness, format, required, etc.).
- Migrations not described when schema changes are implied.

### SP-04 · Contract enumerated

> Contract section enumerates Inputs, Outputs, and Errors. Errors table has at least one row per parent AC that implies an error class.

**FAIL signals:**
- Inputs / Outputs missing.
- Errors table empty when error ACs exist.
- Errors row missing user-visible message or recovery semantics.

### SP-05 · UI surface named or marked None with reason

> UI Surface section either names screens / states or states "None — backend-only spec." with reason.

**FAIL signals:**
- Section blank.
- "None" stated without reason.
- Implementation-level component class names where product-level state names would suffice.

### SP-06 · Tests section non-empty across applicable layers

> Tests section has non-empty entries in Unit, Integration, Acceptance, and Non-functional sub-sections (Non-functional may state "None — not applicable" with reason; this counts as filled). At least one Acceptance test traces back to a parent AC.

**FAIL signals:**
- Tests section missing.
- One or more sub-sections empty without "None — not applicable" reason.
- Acceptance sub-section does not reference any parent AC.

### SP-07 · Observability signals named

> Observability table has at least one signal for every user-visible state change in this Spec. Each signal has a type (log / metric / trace / event) and a purpose tied to a production question.

**FAIL signals:**
- Observability table empty on a Spec that exposes user-visible behavior.
- Signal without type.
- Signal without purpose.

### SP-08 · Implementation notes name stack and runtime constraints

> Implementation notes section is non-empty and names the stack, framework, runtime constraints, concurrency model, and error handling pattern where they affect behavior. PRD-aligned constraints (e.g. Stripe for payments) are not implementation notes — they are PRD constraints; do not re-explain them here.

**FAIL signals:**
- Section blank.
- Stack named without justification when alternatives exist.
- Concurrency model unaddressed for a Spec that touches async state.

### SP-09 · Dependencies explicit

> All dependencies named with status. No `unknown` for a critical dependency.

**FAIL signals:**
- Critical dependency missing.
- `unknown` status for a sibling Spec or infra component.

### SP-10 · Blockers resolved or flagged

> All blockers either have a resolution note or carry `NEED_HUMAN=true`.

**FAIL signals:**
- Open question from `docs/prd/questions/open-questions.md` affects this Spec but is not listed.
- Blocker row exists with no resolution and no NEED_HUMAN flag.

### SP-11 · Out of scope explicit

> Out of Scope section is non-empty, referencing sibling Specs or future work.

**FAIL signals:**
- Section blank.

### SP-12 · No leakage past parent User Story boundary

> The Spec does not implement behavior listed in the parent User Story's Out of Scope; does not include UX states outside parent US UX States Covered; does not satisfy ACs not present in the parent US.

**FAIL signals:**
- Spec describes behavior in parent US Out of Scope.
- Spec satisfies an AC not present in the parent US.
- Spec adds UX states not in the parent US.

### SP-13 · Tasks subdivision justified (if present)

> If the Tasks table is non-empty, subdivision must be justified per PD-001 ("distinct technical surfaces that cannot land in one coherent commit"). If empty, that is the default and requires no justification.

**FAIL signals:**
- Tasks table populated without subdivision justification in Implementation notes.
- Task entries that could merge into one without ceremony loss.

### SP-15 · Async / Event / Webhook / Cron / Stream explicit

> The `## Async / Event / Webhook / Cron / Stream` section is present, every one of the six sub-questions has a non-empty answer matching one of the four allowed shapes, and the final **Async classification** line is filled with one of the four canonical options. Default-REST-sync is a choice, not a default — it must be stated.
>
> Governed by `docs/product-decisions/PD-007-async-event-baseline.md` once published. Until PD-007 ships, SP-15 still applies: answers may temporarily defer pattern selection to PD-007 (e.g. "Yes — handled by future webhook pattern in PD-007"), but they may not be blank.

The six sub-questions are:

1. **Long-running operation** — anything >2s wall time (LLM, external API, large query, file processing). If yes → stream / job-background, sync POST forbidden.
2. **External callback (webhook)** — third party calls back on its own timeline. If yes → webhook handler with signature + idempotency + replay.
3. **Temporal trigger (cron)** — scheduled work (cleanup, digest, polling fallback). If yes → name the cron, frequency, idempotency, worker.
4. **Event produced or consumed** — emits or consumes an event another Spec / FA / worker depends on. If yes → name event type, producer, consumer, delivery contract.
5. **Real-time push to client (SSE / WebSocket)** — client receives updates without polling. If yes → channel + message shape. If no → state polling-on-render is acceptable and why.
6. **Background job / queue** — work outside request/response cycle. If yes → queue, job type, retry policy, idempotency key.

The four allowed answer shapes per sub-question:

- `Yes — handled by <pattern>` (with PD-007 reference once published).
- `No — sync REST is correct here because <reason>` (must give a reason; "obvious" is not a reason).
- `Out of scope — deferred to sibling/future Spec <id>` (must name the Spec).
- `Out of scope — covered by another layer (middleware, infra)` (must name the layer).

The four canonical **Async classification** options:

- `Pure sync — no async patterns required.`
- `Sync with async helpers — primary path sync, uses <helper>.`
- `Mixed sync + async — primary path sync, emits/consumes/triggers <pattern>.`
- `Async-first — primary path is <stream | webhook | job>; sync only for kick-off.`

**FAIL signals:**

- Section header missing.
- One or more sub-questions blank.
- Sub-question answered with prose that does not match any of the four allowed shapes (free-form essays are not acceptable — they bypass the discipline).
- A `No — sync REST is correct` answer with no reason or with "default" / "REST is fine" / "no need" / "trivial" as the reason.
- A `Yes — handled by <pattern>` answer that does not name a pattern, queue, channel, event, cron, or webhook.
- A `Out of scope — deferred to <Spec>` answer where the referenced Spec does not exist anywhere in the chain.
- **Async classification** line missing or not one of the four canonical options.
- Sub-question 1 answered `No — sync REST is correct` but the Spec body mentions LLM, AI inference, file processing, external HTTP roundtrip, or batch operations — the answer is internally inconsistent.
- Sub-question 2 answered `No` but the Spec touches a payment / OAuth / third-party identity provider / mailer / SMS flow that has a known webhook surface (e.g. Stripe `payment_intent.*`).
- Sub-question 5 answered `Yes — SSE` or `Yes — WebSocket` without naming the channel topology and message shape.

---

### SP-14 · Status is valid

> Valid Spec statuses are: `exploratory`, `blocked`, `deferred`, `ready-for-implementation`.
>
> If the Spec has passed SP-01–SP-13, SP-15, and CC-01–CC-05 with no unresolved NEED_HUMAN flag, status must be `ready-for-implementation` (set via `/spec promote` or equivalent manual edits). Implementation may not begin until this status is set.

**FAIL signals:**
- Status is `validated`, `ready-for-spec`, or any non-Spec status.
- Status is `ready-for-implementation` with unresolved NEED_HUMAN.
- Status is `ready-for-implementation` but SP-01–SP-13, SP-15, or CC-01–CC-05 have failures.

---

## Part 6 — Task Checks

Run when evaluating whether a Task is ready for merge.

Tasks are **optional**; not every Spec has them. Checks apply only to Task files that exist.

Governed by: `docs/product-decisions/PD-001-post-slice-workflow.md`.

### TK-01 · Goal traces to parent Spec

> Goal section is one sentence and traces to a specific section of the parent Spec.

**FAIL signals:**
- Goal missing.
- Goal does not reference any parent Spec section.
- Goal restates the parent Spec Summary without narrowing.

### TK-02 · Scope sized for one commit / short PR

> Scope section is non-empty and bounded for one coherent commit or short PR.

**FAIL signals:**
- Scope spans multiple unrelated surfaces.
- Scope blank.
- Scope is so small the task would be merged trivially into a sibling.

### TK-03 · Out of scope explicit

> Out of Scope section is non-empty, referencing sibling tasks or future work.

**FAIL signals:**
- Section blank.

### TK-04 · Changes enumerated with specificity

> Changes table has at least one row per area touched. Each row names the area, the change, and any notes.

**FAIL signals:**
- Changes table empty.
- Rows with vague entries ("update code in module X").
- Changes that don't appear in any area of the parent Spec.

### TK-05 · Tests traced to parent Spec test plan

> Tests list has at least one entry, and each entry traces to a parent Spec test plan entry where possible.

**FAIL signals:**
- Tests list empty.
- Tests entry has no parent trace (acceptable only if Spec test plan does not yet name this specific test — but should be rare).

### TK-06 · Verification steps reproducible

> Verification Steps section has at least one ordered step. Each step is specific enough for a reviewer to run it.

**FAIL signals:**
- Verification Steps blank.
- Steps reference no specific command or check.
- Steps that depend on undocumented environment setup.

### TK-07 · Dependencies explicit

> All dependencies named with status.

**FAIL signals:**
- Critical dependency missing.
- `unknown` status for a sibling task or service.

### TK-08 · Blockers resolved or flagged

> All blockers either have a resolution note or carry `NEED_HUMAN=true`.

**FAIL signals:**
- Blocker row exists with no resolution and no NEED_HUMAN flag.

### TK-09 · Status is valid

> Valid Task statuses are: `exploratory`, `blocked`, `deferred`, `ready-for-merge`.
>
> If the Task has passed TK-01–TK-08 and CC-01–CC-05 with no unresolved NEED_HUMAN flag, status must be `ready-for-merge` (set via `/task promote` or equivalent manual edits).

**FAIL signals:**
- Status is any non-Task status.
- Status is `ready-for-merge` with unresolved NEED_HUMAN.
- Status is `ready-for-merge` but TK-01–TK-08 or CC-01–CC-05 have failures.

---

## Part 8 — Delivery Readiness Checks (Feature Area `validated` → `delivery-ready`)

Run when evaluating whether a `validated` Feature Area is ready to authorize the start of its downstream User Story / Spec / code chain in parallel with the continued macro elaboration of other Feature Areas.

**This part operates on Feature Area artifacts only.** It does not replace Part 1 (which gates `exploratory` → `validated`); it gates the next transition.

Governed by: `docs/product-decisions/PD-006-per-fa-delivery-readiness-gate.md`.

A `delivery-ready` Feature Area whose dependency status subsequently regresses (e.g. a dependency moves to `blocked`, or a previously approved PD is reopened to `provisional`) **must** be reverted to `validated` and re-checked by re-running Part 8. This is the same propagation discipline as CC-04, applied at the FA-level dependency layer.

### DR-01 · Parent FA is `validated`

> The Feature Area's `Status` field is exactly `validated`. Statuses `exploratory`, `blocked`, `deferred`, and `delivery-ready` itself all fail DR-01 (no skip-promote, no re-promote).

**FAIL signals:**
- Status is `exploratory` (Part 1 has not been run successfully yet).
- Status is `blocked` or `deferred`.
- Status is already `delivery-ready` and this is being re-run as a sanity check — that is not a transition; the check should be invoked only on a `validated` FA.

---

### DR-02 · Direct dependencies at minimum scaffolded

> Every Feature Area named in this FA's `Dependencies` section has an existing file at `docs/product/feature-areas/<kebab>.md`. The dependency FA file may be in any status (`exploratory`, `validated`, `delivery-ready`, `blocked`, `deferred`), but it must exist on disk with the canonical Feature Area template.

**FAIL signals:**
- A named dependency has no corresponding FA file.
- A dependency row in the table references a Feature Area name that does not resolve to a file (typo, paraphrase, invented name).
- The Dependencies section refers vaguely to "the rest of the product" or "TBD" without enumerated FA files.

---

### DR-03 · Governing Product Decisions are `approved`

> Every Product Decision (PD) cited in this Feature Area's body, or that any reasonable agent would identify as governing the FA's contract or behavior, is at `status: approved` in `docs/product-decisions/`. Decisions at `provisional`, `proposed`, or any other non-final status fail DR-03.

**How to check:**
- Read every PD referenced in the FA file.
- Cross-reference with `docs/product-decisions/README.md` and any PRD passages that would imply a governing PD (stack baseline, credit model, payments posture, share controls, etc.).
- A PD that is not yet authored but that would govern this FA's behavior also fails DR-03 (it is an implicit gap — surface it before promoting).

**FAIL signals:**
- A referenced PD is at `status: provisional` or `proposed`.
- A PD that clearly governs this FA's contract is not referenced in the FA body and not yet authored.
- The FA body cites a PD by id that does not exist in `docs/product-decisions/`.

---

### DR-04 · No `NEED_HUMAN=true` on this FA or its direct dependencies

> This Feature Area's metadata carries `NEED_HUMAN: false`. Every direct dependency (per DR-02) also carries `NEED_HUMAN: false`. Any open `NEED_HUMAN=true` flag on this FA or any direct dependency fails DR-04.

**Rationale:** an open `NEED_HUMAN` on a dependency means the contract with that dependency is not stable; investing in detailed downstream User Story / Spec work risks being invalidated when the dependency's `NEED_HUMAN` is resolved.

**FAIL signals:**
- This FA's metadata says `NEED_HUMAN: true` (Part 1 should have caught this, but re-check).
- A direct dependency FA carries `NEED_HUMAN: true` in its metadata.
- A `NEED_HUMAN=true` flag exists on a child Scope Slice and has not been propagated to the parent FA per CC-04 (which is itself a CC-04 failure but also blocks DR-04).

---

### DR-05 · At least one Scope Slice is `ready-for-user-stories`

> The Feature Area has at least one child Scope Slice file in `docs/product/scope-slices/<fa-kebab>--<slice-kebab>.md` whose `Status` is `ready-for-user-stories`. A `delivery-ready` Feature Area must have at least one actionable downstream artifact.

**FAIL signals:**
- No Scope Slice files exist for this FA.
- All Scope Slice files exist but are still at `exploratory` (Part 2 has not passed on any of them).
- All Scope Slice files are at `blocked` or `deferred`.

---

### Part 8 summary

When all five checks DR-01..DR-05 are PASS **and** Cross-Cutting Checks CC-01..CC-05 are PASS, the Feature Area is eligible for promotion from `validated` to `delivery-ready` via `/feature-area clear-for-vertical <name>`.

A single FAIL on DR-01..DR-05 blocks the transition. Address the cause (typically: scaffold a missing dependency FA, approve a `provisional` PD, resolve a `NEED_HUMAN` upstream, or refine at least one Scope Slice to `ready-for-user-stories`) and re-run.

---

## Part 7 — Cross-Cutting Checks

Run at any level. Apply to Feature Area, Scope Slice, User Story, Spec, and Task artifacts.

(This section was historically numbered "Part 3" before Parts 4–6 were added; renumbered to Part 7 for chain order on 2026-05-25. Check identifiers `CC-01` through `CC-05` are unchanged.)

### CC-01 · No task slicing from PRD

> No tasks or sub-tasks reference `docs/prd/PRD.md` directly as their source (without a Scope Slice intermediary).

**FAIL signals:**
- Task doc says "from PRD §Credits"
- Sprint ticket references PRD section without a Scope Slice ancestor

---

### CC-02 · No skipped levels

> Each artifact has a traceable parent at the level above.

| Artifact | Required parent |
|----------|----------------|
| Scope Slice | Feature Area |
| User Story | Scope Slice |
| Spec | User Story |
| Task | Spec |

**FAIL signals:**
- A Task references a Feature Area directly
- A Spec references the PRD directly

---

### CC-03 · v0 boundary not leaked

> No Feature Area or Scope Slice in `docs/product/` includes a behavior listed in `docs/prd/PRD.md` `Hard v0 exclusions`.

**FAIL signals:**
- Subscription billing appears in a Scope Slice's Included Behavior
- Multi-user collaboration or invited editors appear as in-scope
- PDF export listed as a required behavior in any v0 slice

---

### CC-04 · NEED_HUMAN propagates

> If a Scope Slice sets `NEED_HUMAN=true`, its parent Feature Area must also carry `NEED_HUMAN=true` until resolved.

**FAIL signals:**
- Feature Area says `NEED_HUMAN=false` while a child Scope Slice has `NEED_HUMAN=true`

---

### CC-05 · NEED_UPDATE actioned

> Any `NEED_UPDATE=true` flag has a corresponding note describing what is missing and where.

**FAIL signals:**
- `NEED_UPDATE=true` with no description of what needs updating
- Multiple NEED_UPDATE flags accumulated without action

---

## Summary Output Format

When running the checker, output a summary table:

```
## Scope Readiness Check — <Artifact Name>

| Check | Result | Notes |
|-------|--------|-------|
| FA-01 | PASS   |       |
| FA-02 | FAIL   | "This service manages..." found in Product Intent |
| ...   |        |       |

**Advancement verdict:** BLOCKED
**Reason:** FA-02 must be resolved before Scope Slice decomposition.
**NEED_HUMAN:** false
**NEED_UPDATE:** false
```
