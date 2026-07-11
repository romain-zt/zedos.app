# /review — Adversarial review of staged or unstaged changes

## Usage

```txt
/review                                   (review HEAD against the default branch)
/review <base>...<head>                   (explicit diff range)
/review --staged                          (review staged-but-not-committed changes)
```

Lead agent: `reviewer` (`.cursor/agents/execution/reviewer.md`)
Pairing: `domain-guardian` (`.cursor/agents/execution/domain-guardian.md`), `security-pii` (`.cursor/agents/execution/security-pii.md`)
Operational template: `.cursor/templates/execution/review-report.template.md`

---

## Purpose

`/review` produces a Review Report against the current diff. It is the adversarial pair to `/implement` — a separate persona, separate model, refusing to grade its own work. The output is severity-ordered findings (🔴 Critical, 🟡 Suggestion, 🟢 Nice-to-have) with file:line citations.

`/review` is read-only. It does not edit code. The user decides whether to act on findings.

---

## Pre-flight

1. Read the active Implementation Plan (the one referenced by the most recent Patch Intent Summary).
2. Read the parent User Story and Scope Slice.
3. Read all rules applicable to the Plan's `Layers Affected`: `72-hexagonal-boundaries.mdc`, `73-result-rop.mdc`, `74-contracts-zod.mdc`, plus `75-drizzle.mdc`, `76-better-auth.mdc`, `77-nextjs.mdc` per applicability.
4. Read the Verification Report. Required: PASS. If verifier did not run or returned FAIL, refuse to review — the diff isn't ready for adversarial review.
5. **SISO classification:** EXECUTION (read-only).

---

## Behavior

### Step 1 — Inspect the diff

`git diff <base>...<head>` (or `git diff --staged` for `--staged`). Read the full diff into context — you must inspect every changed line.

### Step 2 — Run the checks

Per `.cursor/agents/execution/reviewer.md` checks 1–9:

1. Architecture violations
2. Result-type / RoP violations
3. Contract / zod violations
4. Persistence violations
5. Auth violations
6. Next.js conventions
7. Testing discipline
8. PR-sizing
9. **Scope creep** (the highest-leverage check)

Invoke `domain-guardian` for §1 and frozen-violation policing.
Invoke `security-pii` when the diff touches credentials, logs, vendor responses, or share/auth surfaces.

### Step 3 — Produce the Review Report

Use `.cursor/templates/execution/review-report.template.md`. Findings ordered by severity. Verdict is exactly one of:

- **PASS** — no Critical findings; PR ready for `/pr` (subject to `pr-readiness-checker.md`).
- **REVISE** — Suggestions or Nice-to-have findings only; user decides.
- **BLOCK** — at least one Critical finding; merge halted.

---

## Hard rules

- No code edits.
- No softening of Critical findings.
- No reviewing until verifier returns PASS.
- No inventing findings to look thorough — apply the materiality filter.
- Do not re-review unchanged files in subsequent iterations; focus on new commits.

---

## Failure routing

| Verdict | Next |
|---------|------|
| PASS | `/pr` |
| REVISE | User decides; if act, `/improve-from-review`; else `/commit` |
| BLOCK | Iteration: produce fresh PIS targeting the Critical findings; loop |

---

→ /commit → /pr → /babysit
