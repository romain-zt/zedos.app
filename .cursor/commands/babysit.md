# /babysit — Keep a PR merge-ready

## Usage

```txt
/babysit                  (current branch's PR)
/babysit <pr-number>      (specific PR)
```

Lead agent: `implementer` (`.cursor/agents/execution/implementer.md`)
Verification: `verifier`
Review: `reviewer`
First-party reference: `~/.cursor/skills-cursor/babysit/SKILL.md`

---

## Purpose

`/babysit` keeps an open Pull Request merge-ready: triages comments, resolves clear merge conflicts, fixes CI issues with small scoped fixes. It mirrors the first-party `babysit/SKILL.md` semantics, with zedos's gates layered on top: every fix runs through `/fix` (Plan-Lite + PIS), every fix verifies and reviews.

`/babysit` is the natural follow-up to `/pr`. It runs in a loop until the PR is mergeable + green + comments triaged, or it stops and reports a blocker.

---

## Pre-flight

1. Identify the PR (current branch's PR via `gh pr view`, or explicit `<pr-number>`).
2. Read the PR's open unresolved comments (filter resolved threads).
3. Read the latest CI status.
4. Read the active Implementation Plan referenced by the PR.
5. **SISO classification:** EXECUTION. Same authority bounds as `/implement` — `Touched Files` allow-list still applies.

---

## Behavior

### Loop

```
1. Sync with base branch (if mergeable check requires it).
2. Triage open comments:
   - For each unresolved comment:
     - If you agree: route to `/fix` (Plan-Lite + PIS for the comment's scope).
     - If you disagree: post a reply explaining; mark resolved if the user previously approved disagreement.
     - If unsure: ask the user; do not act.
3. Resolve merge conflicts:
   - Sync with base branch.
   - For each conflict:
     - If intent is unambiguous and mechanical: resolve.
     - If intent is unclear: stop; ask the user.
4. Fix CI failures:
   - For each red check:
     - Read the failing job's first failing line.
     - Route to `/fix` (Plan-Lite + PIS targeting the failure).
     - After the fix lands, re-run CI.
5. Re-run reviewer if any commits land in the PR.
6. Loop until: PR is mergeable, CI green, all comments triaged.
```

### Comment-triage discipline (mirrors first-party babysit)

- Read each comment body and the minimum location/URL needed to act.
- Do **not** read entire JSON output or unnecessary payload data — small scoped reads.
- Bugbot or similar automated reviewers count as comments; same triage rules.
- If the user previously approved acting on a class of comments (e.g. "fix all 🔴 from Bugbot"), proceed for that class only.

### Conflict-resolution discipline

- Resolve only when intent is clearly the same on both sides.
- If two changes describe the same edit, take the one with the more complete context.
- If two changes describe contradictory edits, **stop and ask** — never guess.

### CI-fix discipline

- Each CI failure is one `/fix` iteration.
- Each `/fix` runs verifier + reviewer locally before pushing.
- Push the smallest possible commit. No "while I was there" fixes.

---

## Output (per loop iteration)

```txt
Babysit iteration <N>

Comments triaged: <N> (acted on: <X>; replied: <Y>; deferred to user: <Z>)
Conflicts resolved: <N> (mechanical only)
CI fixes pushed: <N>

Current PR state:
- Mergeable: yes | no | conflicts
- CI: green | red (<failing job>)
- Open comments: <N>

Next:
- Loop if any of mergeable=no, CI=red, open comments > 0
- Stop and report when all three are resolved or a hard blocker fires
```

## Final report (when loop exits clean)

```txt
PR #<N> ready to merge

Comments: 0 unresolved
CI: green
Mergeable: yes
Latest commit: <sha> <message>
Backup ref: refs/backup/pre-split-<ts> (if /split was used)

Next:
- Merge per your team's policy
```

---

## Hard stops

Stop and report when:

- A comment requires a product decision (`/feature-area refine-slice` territory) — not a code fix.
- A merge conflict has unclear intent.
- A CI failure cannot be reproduced locally (likely environment / flake — needs a human).
- The PR's scope has drifted from the Plan (a comment asks for behavior outside the Plan) — Plan revision required.
- The user explicitly stops the loop.

In all stop cases, output:

```txt
Babysit stopped.

Reason: <one-line>
Open work: <list>
Recommended next step: <command>
```

---

## Hard rules (preserved from first-party `babysit`)

- Read only each comment body and the minimum location/URL needed to act on it; do not read entire JSON output.
- Fix only comments you agree with; explain when you disagree or are unsure.
- Resolve merge conflicts only when intent is clearly the same; otherwise stop and ask.
- Fix CI issues with small scoped fixes — push them and re-watch CI.

## Hard rules (zedos additions)

- Every fix runs through `/fix` (Plan-Lite + PIS). No raw commits without governance.
- Every fix runs verifier + reviewer locally before pushing.
- No force-push to `main` / `master`.
- No bypassing the pre-commit / pre-pr hooks.
- No editing files outside the active Plan's `Touched Files` — comment-driven scope expansions revise the Plan first.

---

→ merge
