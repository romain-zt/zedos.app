<!--
  Review Report Template
  Location: .cursor/templates/execution/review-report.template.md
  Usage:    chat-only artifact produced by `reviewer` after verifier PASS.
            Optionally archived to docs/execution/reviews/<...>.md for audit.
  Governed by: .cursor/rules/70-execution-bridge.mdc §3.5
  Authored by: reviewer agent (`.cursor/agents/execution/reviewer.md`)
-->

# Review Report

## Patch reference

Plan: `docs/execution/plans/{{FA_KEBAB}}--{{SLICE_KEBAB}}--{{STORY_KEBAB}}.plan.md`
Verifier report: PASS at {{VERIFIER_TIMESTAMP}}
Layout: {{LAYOUT}}
Diff range: {{BASE_REF}}…{{HEAD_REF}}

---

## Architecture review (per `.cursor/rules/72-hexagonal-boundaries.mdc`)

| Check | Verdict | Notes |
|-------|---------|-------|
| Layer import matrix respected | PASS / FAIL | |
| No vendor SDK imports outside `infrastructure/` | PASS / FAIL | |
| Routes < 30 lines, no business logic | PASS / FAIL | |
| `Prisma.<Model>` (or Drizzle row types) not leaking past `infrastructure/persistence/` | PASS / FAIL | |
| No new code in `lib/` (pre-migration retirement zone) | PASS / FAIL | |

## Result / RoP review (per `.cursor/rules/73-result-rop.mdc`)

| Check | Verdict | Notes |
|-------|---------|-------|
| No new `as any` casts | PASS / FAIL | |
| No `throw new Error` outside `domain/` or `app/error.tsx` | PASS / FAIL | |
| All cross-layer functions return `Result<T, E>` | PASS / FAIL | |
| All `unwrap()` callsites preceded by `isOk()` | PASS / FAIL | |
| Catch blocks produce typed `err(...)` (no silent swallow, no `return null`) | PASS / FAIL | |

## Contracts review (per `.cursor/rules/74-contracts-zod.mdc`)

| Check | Verdict | Notes |
|-------|---------|-------|
| Every cross-layer DTO is `z.infer<typeof Schema>` from `contracts/` | PASS / FAIL | |
| New `z.object` definitions live only in `contracts/**` | PASS / FAIL | |
| API routes validate `req.body` AND outbound DTO with `safeParse` | PASS / FAIL | |
| Vendor responses validated before crossing into `application/` | PASS / FAIL | |
| AI streamed JSON validated at buffer-end before any side effect | PASS / FAIL | |

## Persistence review (per `.cursor/rules/75-drizzle.mdc`)

| Check | Verdict | Notes |
|-------|---------|-------|
| Credit / payment / quota ops wrapped in transaction with `SELECT … FOR UPDATE` | PASS / FAIL / N/A | |
| Webhook side effects keyed by event id for idempotency | PASS / FAIL / N/A | |
| Migrations forward-only; one logical change per migration | PASS / FAIL / N/A | |

## Auth review (per `.cursor/rules/76-better-auth.mdc`)

| Check | Verdict | Notes |
|-------|---------|-------|
| Server code derives user only from verified session | PASS / FAIL | |
| `requireSession` / `requireUser` returns `Result<…, UnauthorizedError>` | PASS / FAIL / N/A | |
| No CSRF or trusted-origins protection disabled | PASS / FAIL / N/A | |

## PR-sizing review (per `.cursor/rules/79-pr-sizing.mdc`)

| Metric | Value | Limit | Pass? |
|--------|-------|-------|-------|
| Net lines changed | {{LINES}} | 400 | PASS / FAIL |
| Files touched | {{FILES}} | 15 | PASS / FAIL |
| Layers touched | {{LAYERS}} | 3 | PASS / FAIL |
| Packages touched (post-migration) | {{PACKAGES}} | 3 | PASS / FAIL |
| Schema migrations | {{MIGRATIONS}} | 1 | PASS / FAIL |

---

## Findings (ordered by severity)

| Severity | Finding | Location | Suggested fix |
|----------|---------|----------|---------------|
| 🔴 Critical | <issue that blocks merge> | `path:line` | <required fix> |
| 🟡 Suggestion | <issue that should improve> | `path:line` | <suggested change> |
| 🟢 Nice-to-have | <minor polish> | `path:line` | <optional> |

---

## Scope creep check

Compare against the Plan's `Touched Files` and Acceptance Criteria from the parent User Story:

- [ ] All edited files appear in Plan §"Touched Files (exact paths)"
- [ ] No behavior introduced beyond Acceptance Criteria
- [ ] No deviation from `Layers Affected`
- [ ] Tests in §Tests of the Plan are present in the diff

If any unchecked: this is a scope creep — flag as 🔴 Critical and require a Plan revision before merge.

---

## Verdict

**Reviewer verdict:** {{VERDICT}} <!-- PASS | REVISE | BLOCK -->

- **PASS** — no critical findings; PR ready for `/pr` after `pr-readiness-checker.md`.
- **REVISE** — suggestions or non-blocking findings; user decides whether to act.
- **BLOCK** — at least one critical finding; merge halted; route to `/fix` for the named issues.

---

## Audit

| Run at | Reviewer model | Run by command |
|--------|----------------|----------------|
| {{ISO_TS}} | {{MODEL_SLUG}} | `/review` |
