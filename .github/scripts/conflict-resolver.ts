/**
 * conflict-resolver.ts
 *
 * Invoked by conflict-resolver.yml whenever main advances or on a schedule.
 * For every open non-draft PR with CONFLICTING merge status it spawns one
 * Cursor Agent that merges origin/main into the branch and resolves conflicts
 * intelligently before pushing.
 *
 * Unlike auto-rebase.yml (which blindly takes --ours), this agent understands
 * file-level intent: docs/state/* takes main's version, source code is merged
 * carefully, tracking stubs keep the branch's version.
 */

import { Agent, CursorAgentError } from "@cursor/sdk";
import { buildCursorCloudOptions } from "./cursor-sdk-options";
import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const apiKey = process.env.CURSOR_API_KEY;
const ghToken = process.env.GH_TOKEN;
const repo = process.env.REPO;

if (!apiKey) {
  console.error("❌ CURSOR_API_KEY is not set.");
  process.exit(1);
}
if (!ghToken) {
  console.error("❌ GH_TOKEN is not set.");
  process.exit(1);
}
if (!repo) {
  console.error("❌ REPO env var is missing.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gh(args: string): string {
  return execSync(`gh ${args}`, {
    encoding: "utf8",
    env: { ...process.env, GH_TOKEN: ghToken! },
  }).trim();
}

interface ConflictedPR {
  number: number;
  headRefName: string;
  title: string;
  isDraft: boolean;
}

function listConflictedPRs(): ConflictedPR[] {
  // GitHub's mergeability computation can lag — retry once with a short wait.
  let raw = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    raw = gh(
      `pr list --repo ${repo} --state open --base main --json number,headRefName,title,isDraft,mergeable --jq '[.[] | select(.mergeable == "CONFLICTING")]'`
    );
    const prs: ConflictedPR[] = JSON.parse(raw || "[]");
    if (prs.length > 0 || attempt === 1) return prs;
    // Wait for GitHub to compute mergeability on freshly-pushed branches
    console.log("⏳  No conflicted PRs yet — waiting 15s for GitHub to catch up…");
    execSync("sleep 15");
  }
  return JSON.parse(raw || "[]");
}

// ---------------------------------------------------------------------------
// Per-PR conflict resolution prompt
// ---------------------------------------------------------------------------

function buildPrompt(pr: ConflictedPR): string {
  return `
You are an automated conflict-resolution agent for the ZedOS project.

## Your task
PR #${pr.number} — "${pr.title}" — has merge conflicts with \`main\`.
Your job is to resolve those conflicts and push a clean merge commit so the PR
becomes mergeable. Then stop. Do NOT review code quality, suggest refactors, or
merge the PR itself.

## Step 1 — Set up git identity
\`\`\`
git config user.email "github-actions[bot]@users.noreply.github.com"
git config user.name "github-actions[bot]"
\`\`\`

## Step 2 — Fetch and check out the branch
\`\`\`
git fetch origin main ${pr.headRefName}
git checkout ${pr.headRefName}
git pull origin ${pr.headRefName} --ff-only || git reset --hard origin/${pr.headRefName}
\`\`\`

## Step 3 — Merge origin/main
\`\`\`
git merge origin/main --no-edit
\`\`\`

If the merge is clean, skip to Step 6.

## Step 4 — Identify conflicted files
\`\`\`
git diff --name-only --diff-filter=U
\`\`\`

Read each conflicted file. Resolve conflicts using these rules:

### Resolution rules (in priority order)

1. **\`docs/state/tracking/*.md\`** — always keep the **branch** version. These are
   per-run orchestrator stubs; the branch's stub is the active one.

2. **\`docs/state/status.json\`** — keep \`origin/main\` as the base and layer on top
   any fields that exist only in the branch (e.g. a new \`tracking_pr\` number or a
   new step in \`orchestration.steps\`). Do not discard either side's unique keys.

3. **\`docs/state/HANDOFF.md\`** — take the longer/more-detailed version; never shrink
   the document. If both sides added content to different sections, include both.

4. **\`docs/state/orchestration.*.json\`** or any other orchestration state files — 
   take \`origin/main\` (it reflects the most current orchestration pipeline state).

5. **\`pnpm-lock.yaml\`** — regenerate with \`pnpm install --frozen-lockfile=false\`;
   take whatever pnpm produces.

6. **Source code (\`apps/**\`, \`packages/**\`)** — read both sides carefully.
   Take the more complete / newer implementation. For UI components, prefer
   \`origin/main\`'s version as it reflects the latest shipped feature; keep any
   additions the branch introduced that aren't in main (e.g. new props, new handlers).

7. **\`.cursor/**\` governance files** — take \`origin/main\` (always more authoritative).

8. **Any other file** — read both sides. Pick whichever is more complete. If genuinely
   ambiguous, leave a TODO comment and take \`origin/main\`'s version.

After editing each file to remove all \`<<<<<<<\`, \`=======\`, \`>>>>>>>\` markers:
\`\`\`
git add <file>
\`\`\`

## Step 5 — Continue merge
\`\`\`
git merge --continue --no-edit
\`\`\`
or if that's unavailable:
\`\`\`
git commit --no-edit -m "chore(merge): resolve main into ${pr.headRefName}"
\`\`\`

## Step 6 — Push
\`\`\`
git push origin ${pr.headRefName}
\`\`\`

## Step 7 — Verify
Run:
\`\`\`
gh pr view ${pr.number} --repo ${repo} --json mergeable --jq '.mergeable'
\`\`\`
If it says \`MERGEABLE\`, you're done. Print "✅ PR #${pr.number} is now conflict-free."
If it still says \`CONFLICTING\`, re-read the remaining conflicted files and fix them.
If it says \`UNKNOWN\`, wait 10 seconds and check again (GitHub is still computing).

## Important constraints
- Never force-push to \`main\`.
- Never close or delete the PR.
- Never merge the PR yourself — conflict resolution only.
- If you cannot resolve a conflict without human intent clarification, post a comment on
  the PR via \`gh pr comment ${pr.number} --repo ${repo} --body "..."\` explaining
  exactly which file/hunk needs human input and stop.
`.trim();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const conflicted = listConflictedPRs();

if (conflicted.length === 0) {
  console.log("✅ No conflicted PRs found — nothing to do.");
  process.exit(0);
}

console.log(`\n🔧 Found ${conflicted.length} conflicted PR(s):`);
for (const pr of conflicted) {
  console.log(`  • PR #${pr.number} — ${pr.title} (${pr.headRefName})`);
}

let anyFailed = false;

for (const pr of conflicted) {
  console.log(`\n━━━ Resolving PR #${pr.number}: ${pr.title} ━━━`);

  const prompt = buildPrompt(pr);

  try {
    const result = await Agent.prompt(prompt, buildCursorCloudOptions(apiKey!, repo!));

    if (result.status === "error") {
      console.error(`❌ Agent failed for PR #${pr.number}.`);
      anyFailed = true;
    } else {
      console.log(`✅ Agent completed for PR #${pr.number}.`);
    }
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(
        `❌ Agent could not start for PR #${pr.number}: ${err.message} (retryable=${err.isRetryable})`
      );
    } else {
      console.error(`❌ Unexpected error for PR #${pr.number}:`, err);
    }
    anyFailed = true;
  }
}

process.exit(anyFailed ? 1 : 0);
