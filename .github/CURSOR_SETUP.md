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
| Require status checks to pass before merging | ✅ — add `cursor-review-and-merge` |
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
3. It lists all open **draft** PRs whose **base branch** equals the just-merged PR's **head branch**.
4. For each match it calls `gh pr ready`, which un-drafts the PR.
5. Un-drafting fires the `ready_for_review` event — triggering `pr-automation.yml` automatically.

**Typical flow for a 3-layer stack:**

```
main
└── feature/A  (PR #10) → merges → triggers cascade
    └── feature/B  (PR #11, draft, base = feature/A) → un-drafted → pr-automation runs
        └── feature/C  (PR #12, draft, base = feature/B) → stays draft until #11 merges
```

No secrets beyond the default `GITHUB_TOKEN` are required.

---

---

## Phase Orchestrator — autonomous pipeline driver

`.github/workflows/phase-orchestrator.yml` reads `docs/state/status.json`, starts or **continues** phases, and fires a Cursor cloud agent. It runs when a PR merges into **`main`** or a **`feature/*`** integration branch, on a **30-minute schedule**, or via **workflow_dispatch**.

**Remediation and human blockers:**

1. If a phase is **`in-progress`** and a **draft** orchestrator tracking PR still exists for that phase (same merge base as `ORCHESTRATOR_TRACKING_BASE`, default `main`), the orchestrator **re-fires the agent** with a remediation prompt (conflicts, CI, review feedback) instead of exiting immediately.
2. When the agent marks **`blocked`** on the tracking branch (recommended: `blocker` starting with `NEED_HUMAN:`), the script mirrors **`blocked`** onto **`main`** so the next run **skips** that phase and can pick another eligible step.
3. Optional **integration branch:** set the Actions variable `ORCHESTRATOR_TRACKING_BASE` to e.g. `feature/my-epic` (branch must exist on the remote). Tracking PRs target that branch; land stacked sub-PRs into it; when ready, merge `feature/my-epic` → `main`. `pr-cascade.yml` cascades stacks after merges to `main` or `feature/*`.

**How phases advance:**

1. A PR merges into `main` or `feature/*` (or the schedule / manual run fires).
2. The orchestrator reads `docs/state/status.json` to find the current phase state.
3. If the last completed phase's entry is `"complete"`, it advances to the next phase.
4. It marks the next phase as `"in-progress"` in `status.json` (commits + pushes `[skip ci]`).
5. It fires `Agent.prompt` with the phase-specific instructions.
6. The agent does the work and writes `"complete"` back to `status.json` when done.
7. The next merged PR triggers the cycle again.

**Phase chain:**

```
phase3-p0 (Turborepo scaffold)
  → phase3-p1 (package extraction)
  → phase3-p2 (Drizzle migration)
  → phase3-p3 (better-auth migration)
  → fa-account-session (sign-up / sign-in)
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
| `CURSOR_API_KEY` missing | Exits 1 with a clear message |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `CURSOR_API_KEY is not set` | Add the secret (step 2) |
| `401 Unauthorized` from the SDK | Key may have extra whitespace — re-paste it |
| Agent starts but posts a blocker comment | Read the comment — it explains exactly what a human needs to resolve |
| `GH_TOKEN lacks merge permission` | Enable **Allow GitHub Actions to create and approve pull requests** in Settings → Actions → General |
| Workflow doesn't trigger | Confirm the workflow file is on the default branch or in a PR targeting `main` |
