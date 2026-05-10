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

## Troubleshooting

| Symptom | Fix |
|---|---|
| `CURSOR_API_KEY is not set` | Add the secret (step 2) |
| `401 Unauthorized` from the SDK | Key may have extra whitespace — re-paste it |
| Agent starts but posts a blocker comment | Read the comment — it explains exactly what a human needs to resolve |
| `GH_TOKEN lacks merge permission` | Enable **Allow GitHub Actions to create and approve pull requests** in Settings → Actions → General |
| Workflow doesn't trigger | Confirm the workflow file is on the default branch or in a PR targeting `main` |
