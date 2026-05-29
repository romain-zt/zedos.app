# Cursor PR Automation — Setup Guide

Five minutes to configure. Once done, every PR opened against `main` is automatically reviewed and merged by a Cursor cloud agent.

---

## 1. Get a Cursor API key

1. Go to [https://cursor.com/settings](https://cursor.com/settings) → **API Keys** section
   - Or: Cursor app → Settings → Account → API Key
   - Or (Team plan): [https://cursor.com/dashboard](https://cursor.com/dashboard) → Team Settings → Service accounts
2. Generate a new key if none exists
3. Copy the key — it starts with `cursor_`

> Note: cloud agent API access requires a Pro or Team plan.

---

## 2. Add `CURSOR_API_KEY` as a GitHub Actions secret

1. Open your repo on GitHub
2. Go to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Name: `CURSOR_API_KEY`
5. Value: paste the key from step 1
6. Click **Add secret**

The `GITHUB_TOKEN` secret is injected automatically by GitHub — you don't need to add it.

---

## 3. Recommended branch protection rules

In **Settings → Branches → Add rule** for `main`:

| Setting | Value |
|---|---|
| Require a pull request before merging | ✅ |
| Require status checks to pass before merging | ✅ — add `quality` (CI: typecheck, lint, test, build) and optionally `playwright` (E2E) |
| Require branches to be up to date before merging | ✅ |
| Restrict who can push to matching branches | ✅ (only the bot / admins) |

This ensures the Cursor agent is the gate for all merges into `main`.

---

## 4. Verify the workflow runs

1. Open the **Actions** tab on GitHub
2. Find the **PR Automation** workflow
3. Click a run to see live streaming logs from the Cursor agent

If the workflow doesn't appear, check that the branch with `.github/workflows/pr-automation.yml` has been merged (or pushed) to the repo's default branch, or open a PR targeting `main` to trigger it.

---

## 5. Test with the first PR

The best test is a small draft PR:

```bash
git checkout -b test/cursor-automation
echo "# test" >> README.md
git commit -am "test: trigger Cursor PR automation"
git push -u origin test/cursor-automation
gh pr create --draft --title "test: Cursor PR automation" --body "Testing automated review and merge."
```

The workflow will:
1. Detect the draft, call `gh pr ready` to undraft it
2. Spin up a Cursor cloud agent against the repo
3. Read `docs/state/HANDOFF.md`, review the diff, check rules
4. Approve and squash-merge if everything passes

Watch the Actions tab for live output.

---

---

## How stacked PRs cascade automatically (`pr-cascade.yml`)

`.github/workflows/pr-cascade.yml` closes the loop for stacked PRs (see `79-pr-sizing.mdc` §4).

**How it works:**

1. A PR merges into `main`.
2. `pr-cascade.yml` fires on the `closed` + merged event.
3. It finds open **draft** PRs stacked on the merged head (`--base <merged-head>`), rebases each onto the merge target (`main` / `feature/*`), `gh pr edit --base` to repoint at the merge base, then **`gh pr merge --merge`** straight through the stack.

> **Difference vs old notes:** cascading does **not** call `gh pr ready`; it merges drafts directly so throughput does not depend on the PR-automation reviewer workflow.

**Typical flow for a 3-layer stack:**

```
main
└── feature/A  (PR #10) → merges → triggers cascade
    └── feature/B  (PR #11, draft, base = feature/A) → un-drafted → pr-automation runs
        └── feature/C  (PR #12, draft, base = feature/B) → stays draft until #11 merges
```

No secrets beyond the default `GITHUB_TOKEN` are required.

## Phase Orchestrator — autonomous pipeline driver

`.github/workflows/phase-orchestrator.yml` reads `docs/state/status.json` **and** `docs/state/orchestration.pipeline.json` to determine the next runnable step, starts or **continues** that step, and fires a Cursor cloud agent. It runs when a PR merges into **`main`** or a **`feature/*`** integration branch, on a **30-minute schedule**, or via **workflow_dispatch**.

Pipeline order is declarative: migration “bundled” steps (with prompts in `.github/scripts/phase-orchestrator.ts`) and **slice** workloads (Feature Area + Scope Slice file pointers) run in dependency order. When a tracking PR merges, `pr-ready.yml` dispatches the orchestrator again → **merge → next step → loop**. Append new slice rows to `docs/state/orchestration.pipeline.json` after each Feature Area’s slices are prioritized (see `execution-loop.mdc` P0–P4 bands).

**Repository variable** `CURSOR_AGENT_MODEL` (Actions → Variables) overrides the default **`composer-2`** SDK model (`model.id`) for orchestrator + PR automation. If unset or empty, scripts use Composer 2.

**Remediation and human blockers:**

1. If a phase is **`in-progress`** and a **draft** orchestrator tracking PR still exists for that phase (same merge base as `ORCHESTRATOR_TRACKING_BASE`, default `main`), the orchestrator **re-fires the agent** with a remediation prompt (conflicts, CI, review feedback) instead of exiting immediately.
2. When the agent marks **`blocked`** on the tracking branch (recommended: `blocker` starting with `NEED_HUMAN:`), the script mirrors **`blocked`** onto **`main`** so the next run **skips** that phase and can pick another eligible step.
3. Optional **integration branch:** set the Actions variable `ORCHESTRATOR_TRACKING_BASE` to e.g. `feature/my-epic` (branch must exist on the remote). Tracking PRs target that branch; land stacked sub-PRs into it; when ready, merge `feature/my-epic` → `main`. `pr-cascade.yml` cascades stacks after merges to `main` or `feature/*`.

**How phases advance:**

1. A PR merges into `main` or `feature/*` (or the schedule / manual run fires).
2. The orchestrator reads **`docs/state/orchestration.pipeline.json`** (step order + dependencies) and merges that with `docs/state/status.json` (canonical: `orchestration.steps`, legacy: `phase3` / `fa_account_session` for bundled IDs).
3. If the next step is complete, it advances; if work is **blocked**, it skips that node and keeps scanning.
4. It marks the chosen step as **`in-progress`** in `status.json` (commits + pushes `[skip ci]`) and opens a **draft** tracking PR from **`ORCHESTRATOR_TRACKING_BASE`** (default `main`).
5. It fires `Agent.prompt` with bundled or slice-specific instructions.
6. The agent finishes, sets **`orchestration.steps["<id>"] = "complete"`** (plus legacy fields when applicable), runs `gh pr ready` on the tracking PR.
7. `pr-ready.yml` merges that PR and **re-dispatches** this workflow so the next slice/phase starts.

**Phase chain:**

```
docs/state/orchestration.pipeline.json   (append slice steps per FA priority)
  → phase3-p0 (bundled)
  → phase3-p1 (bundled)
  → phase3-p2 (bundled)
  → phase3-p3 (bundled)
  → fa-account-session (bundled / legacy status mirror)
  → … additional { "workload": { "kind": "slice", … } } rows …
```

**Kill switch — pause automation instantly:**

1. Go to your repo on GitHub
2. **Settings → Secrets and variables → Actions → Variables tab**
3. Click **New repository variable**
4. Name: `ORCHESTRATOR_ENABLED`, Value: `true`

To **pause** automation (no agents fired, no errors):

- Edit the variable → set Value to `false`

To **resume**:

- Edit the variable → set Value back to `true`

> If the variable is absent entirely, the orchestrator defaults to **enabled**.

**Guard rails built in:**

| Condition | Behavior |
|---|---|
| `ORCHESTRATOR_ENABLED=false` | Logs and exits 0 — no agent fired |
| `docs/state/status.json` missing | Logs warning and exits 0 — safe on new repos |
| Any phase is `"in-progress"` | If an open **draft** tracking PR exists for that step (matching `ORCHESTRATOR_TRACKING_BASE`), a **remediation** agent run is started. If there is **no** such draft, the step is **reset** to `not-started` so the chain can recover. |
| Any phase is `"blocked"` | That step is **skipped**; the pipeline attempts the next eligible step (dependencies permitting). Prefer `NEED_HUMAN:` in `blocker` text for operator-visible stalls. |
| `docs/state/orchestration.pipeline.json` missing | Exits 1 — copy from repo template / define `steps[]` before enabling automation |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `CURSOR_API_KEY is not set` | Add the secret (step 2) |
| `401 Unauthorized` from the SDK | Key may have extra whitespace — re-paste it |
| Agent starts but posts a blocker comment | Read the comment — it explains exactly what a human needs to resolve |
| `GH_TOKEN lacks merge permission` | Enable **Allow GitHub Actions to create and approve pull requests** in Settings → Actions → General |
| Workflow doesn't trigger | Confirm the workflow file is on the default branch or in a PR targeting `main` |
