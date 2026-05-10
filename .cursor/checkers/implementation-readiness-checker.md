# Implementation Readiness Checker

Governed by: `.cursor/rules/70-execution-bridge.mdc`

Run this checker before `/implement` is allowed to write code. It gates two artifacts:

- **Part A — User Story** (`docs/execution/user-stories/<...>.md`)
- **Part B — Implementation Plan** (`docs/execution/plans/<...>.plan.md`)

Both parts must return **CLEAR** before `/implement` produces a Patch Intent Summary.

This checker is the execution-side analogue of `.cursor/checkers/scope-readiness-checker.md` (which gates discovery-side advancement up to Scope Slice). Together they cover the full PRD → Feature Area → Scope Slice → User Story → Implementation Plan → code lifecycle.

---

## How to use

For each check, answer **PASS**, **FAIL**, or **SKIP (with reason)**.

A single **FAIL** blocks `/implement`. Resolve it or set `NEED_HUMAN=true` on the relevant artifact, then re-run.

Never mark `SKIP` to dodge a hard question. Only skip checks that are genuinely inapplicable (e.g. "Migration plan" for a UI-only Story).

---

## Part A — User Story checks

Run against `docs/execution/user-stories/<fa-kebab>--<slice-kebab>--<story-kebab>.md`.

### US-01 · Parent Scope Slice exists and is `ready-for-user-stories`

> The User Story's Parent Scope Slice link resolves to a non-empty file under `docs/product/scope-slices/`, and that file's `Status` is `ready-for-user-stories`.

**FAIL signals:**
- Link is broken or to a Slice that is `exploratory`, `blocked`, or `deferred`
- Parent Slice has `NEED_HUMAN: true`

### US-02 · Story shape canonical

> The Story is expressed as "As a {role}, I want {capability} so that {outcome}" — one sentence, user-value language.

**FAIL signals:**
- Implementation language ("the API returns…", "the component renders…")
- Multiple capabilities bundled into one Story
- Outcome is missing or vague ("so that the system is better")

### US-03 · Acceptance Criteria cover UX states

> Acceptance Criteria has at least one row per UX state listed in the parent Scope Slice's UX States table (empty, loading, success, error, edge case).

**FAIL signals:**
- AC table is empty or only happy-path
- Error state has no AC even though the parent Slice listed an error UX state

### US-04 · Test plan classified

> Each test plan item names its type — `unit`, `integration`, `contract`, or `e2e`.

**FAIL signals:**
- Untyped test items
- "TODO: figure out testing" placeholders

### US-05 · Out of Scope explicit

> The Out of Scope section is non-empty and consistent with the parent Slice's Excluded Behavior.

**FAIL signals:**
- Section blank
- Out of Scope contradicts the Slice (e.g. Story claims a behavior the Slice excluded)

### US-06 · Blockers resolved or flagged

> Open Questions is either empty, or every row has a "Next action" assignment.

**FAIL signals:**
- Open question with no next action
- Open question that targets PRD-level uncertainty (route back to `/prd questions`, do not write the Story)

---

## Part B — Implementation Plan checks

Run against `docs/execution/plans/<...>.plan.md`.

### IP-01 · Parent User Story passes Part A

> Part A above returned **CLEAR** for the User Story this Plan implements.

**FAIL signals:** any FAIL in Part A.

### IP-02 · Approach grounds in named rules

> The Approach section explicitly cites the rules it depends on: `72-hexagonal-boundaries.mdc`, `73-result-rop.mdc`, `74-contracts-zod.mdc`, plus any of `75-drizzle.mdc`, `76-better-auth.mdc`, `77-nextjs.mdc` if those domains are touched.

**FAIL signals:**
- Approach is hand-wavy ("we'll do it the right way")
- Touches persistence but does not cite `75-drizzle.mdc`
- Touches auth but does not cite `76-better-auth.mdc`

### IP-03 · Architecture Surface Block resolved (or marked open)

> The Architecture Surface Block (per `70-execution-bridge.mdc` §8) lists every load-bearing field. UNKNOWN on a load-bearing field is allowed only when status is `proposed-with-open-surface` AND the user has explicitly waived in writing.

**FAIL signals:**
- Surface Block missing
- UNKNOWN on `Source-of-truth (data)`, `Auth source-of-truth`, or `Transaction boundary` while status claims `approved`

### IP-04 · Touched Files exact and within layout

> The Touched Files section lists exact paths under the layout-in-effect (per `71-monorepo-context.mdc`). Paths under the wrong layout, glob patterns, or "and similar files" are forbidden.

**FAIL signals:**
- Path uses post-migration `apps/` while layout = pre-migration
- Path is a glob (`src/**/some-file*.ts`)
- Section says "TBD"

### IP-05 · Layers Affected matches Touched Files

> The Layers Affected checklist is consistent with Touched Files. A Plan touching `infrastructure/` paths must check the `infrastructure` row.

**FAIL signals:**
- Touched Files include a route handler but `app` row unchecked
- Touched Files include `domain/` paths but `domain` row unchecked
- Layer crossings violate the import matrix in `72-hexagonal-boundaries.mdc` §3

### IP-06 · Contracts changes named

> Every cross-layer DTO modified or added is listed in Contracts Changed with a corresponding test fixture (per `74-contracts-zod.mdc` §5).

**FAIL signals:**
- New `z.object` in Touched Files but missing from Contracts Changed
- Schema added without a contract test fixture

### IP-07 · Concurrency design declared

> If credit / payment / quota / lock paths are touched, the Plan explicitly describes the transaction boundary and the row lock (per `75-drizzle.mdc` §5). Idempotency keys are declared for any webhook side effect.

**FAIL signals:**
- Credit deduct touched without `SELECT … FOR UPDATE` design
- Stripe webhook touched without idempotency key
- "We'll figure out concurrency later"

### IP-08 · Tests declared, including concurrency where relevant

> The Tests section names at least one test per touched layer. Concurrency-critical paths name at least one concurrent integration test.

**FAIL signals:**
- Plan ships without unit tests
- Concurrency-critical Plan ships without a concurrent integration test
- Tests section is "we'll add later"

### IP-09 · Adversarial review complete

> Adversarial Review section shows verdicts from `domain-guardian` and `scope-critic`. At least one PASS each is required for status `approved`.

**FAIL signals:**
- Either reviewer is missing
- Either reviewer returned BLOCK or REVISE without resolution

### IP-10 · Approval recorded

> Status is `approved` AND the Approval block has user approval recorded.

**FAIL signals:**
- Status is `proposed` or `proposed-with-open-surface`
- Approval status is `pending` or `revoked`

---

## Cross-cutting (run at every Part)

### XC-01 · No skipped levels

> The traceability chain is intact: Scope Slice → User Story → Implementation Plan.

**FAIL signals:** any link broken or skipped.

### XC-02 · Layout matches reality

> The layout declared on the Plan (`pre-migration` / `post-migration`) matches what currently exists in the repo. No Plan that assumes post-migration paths is approvable while `zedos/nextjs_space/` still exists, and vice versa.

### XC-03 · Frozen-violation discipline

> No new contributions to the frozen-violation counts in `73-result-rop.mdc` §7 (`as any`, raw `throw`, silent catch) or `72-hexagonal-boundaries.mdc` §7 (UI-in-`components/`, `lib/`-additions).

**FAIL signals:** new `as any` cast, new `lib/<...>.ts` file, new `throw new Error` in non-domain code in the Plan's diff prediction.

---

## Summary output

```txt
## Implementation Readiness Check — <Story name>

| Check | Result | Notes |
|-------|--------|-------|
| US-01 | PASS   |       |
| US-02 | FAIL   | "the API returns ..." in Story |
| ...   |        |       |
| IP-01 | PASS   |       |
| IP-02 | PASS   |       |
| ...   |        |       |
| XC-01 | PASS   |       |
| XC-02 | PASS   |       |
| XC-03 | PASS   |       |

**Advancement verdict:** CLEAR | BLOCKED
**First failing check (if BLOCKED):** <ID> — <reason>
**NEED_HUMAN:** true | false
**NEED_UPDATE:** true | false

Next recommended command:
- CLEAR → /implement <plan-path>
- BLOCKED → resolve <first failing check>; re-run /plan or /feature-area refine-slice as appropriate
```

---

## Hard rules

- No file writes — checker output is chat-only.
- A single FAIL blocks `/implement`. Do not paper over with prose.
- A `proposed-with-open-surface` Plan can pass IP-03 only if the user has explicitly waived the named UNKNOWN field in writing — and the waiver is recorded in the Plan's Open Questions or Surface Blockers.
- This checker does not run discovery-side checks; for those use `.cursor/checkers/scope-readiness-checker.md`.
