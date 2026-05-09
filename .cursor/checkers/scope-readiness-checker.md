# Scope Readiness Checker

Governed by: `.cursor/rules/feature-area-workflow.mdc`

Run this checker before advancing any artifact to the next level in the hierarchy:
- Feature Area → Scope Slices
- Scope Slice → User Stories
- User Stories → Specs
- Specs → Tasks

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

## Part 3 — Cross-Cutting Checks

Run at any level.

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
