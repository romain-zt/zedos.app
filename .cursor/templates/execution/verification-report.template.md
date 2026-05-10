<!--
  Verification Report Template
  Location: .cursor/templates/execution/verification-report.template.md
  Usage:    chat-only artifact produced by `verifier` after every Patch Intent Summary execution.
            Optionally archived to docs/execution/verification/<...>.md for audit.
  Governed by: .cursor/rules/70-execution-bridge.mdc §3.4, .cursor/rules/78-testing.mdc
  Authored by: verifier agent (`.cursor/agents/execution/verifier.md`)
-->

# Verification Report

## Patch reference

Plan: `docs/execution/plans/{{FA_KEBAB}}--{{SLICE_KEBAB}}--{{STORY_KEBAB}}.plan.md`
Patch Intent Summary applied at: {{PATCH_TIMESTAMP}}
Layout: {{LAYOUT}} <!-- pre-migration (zedos/nextjs_space/) | post-migration (apps/web/ + packages/) -->

---

## Mechanical checks

| Check | Command | Result | Duration | First failing line (if FAIL) |
|-------|---------|--------|----------|------------------------------|
| typecheck | `pnpm typecheck` (or `npm run typecheck`) | PASS / FAIL | {{DUR}} | |
| lint (boundaries enforced) | `pnpm lint` | PASS / FAIL | {{DUR}} | |
| unit + integration tests | `pnpm test` | PASS / FAIL ({{N}}/{{M}} suites) | {{DUR}} | |
| build | `pnpm build` | PASS / FAIL | {{DUR}} | |

### First failure detail (when any FAIL)

```
{{FIRST_FAILURE_OUTPUT}}
```

---

## Coverage delta

<!--
  Per .cursor/rules/78-testing.mdc §4. Floors must hold; new code must not drop coverage.
  Report only the packages or directories touched by this patch.
-->

| Package / directory | Stmts before | Stmts after | Delta | Floor | Pass? |
|---------------------|--------------|-------------|-------|-------|-------|
|                     |              |             |       |       |       |

---

## Concurrency tests (if applicable)

<!-- Required when credit / payment / quota paths are touched (per .cursor/rules/75-drizzle.mdc §5). -->

- [ ] Concurrent deduct test PASS
- [ ] Idempotency test PASS (Stripe webhook event id, or equivalent)
- [ ] N/A — patch did not touch concurrency-critical paths

---

## Verdict

**Verifier verdict:** {{VERDICT}} <!-- PASS | FAIL — when FAIL, halt the loop -->

**Halt reason (if FAIL):** {{HALT_REASON}}

---

## Hand-off

- On PASS → route to `reviewer` (`.cursor/agents/execution/reviewer.md`).
- On FAIL → halt the loop, surface the first failing line + the file path, and route the user back to `/fix` or a Plan revision. Do not retry silently.

---

## Audit

| Run at | Verifier model | Run by command |
|--------|----------------|----------------|
| {{ISO_TS}} | {{MODEL_SLUG}} | `/implement` / `/fix` |
