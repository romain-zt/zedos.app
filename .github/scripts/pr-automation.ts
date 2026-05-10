import { Agent, CursorAgentError } from "@cursor/sdk";
import { execSync } from "node:child_process";

// --- Environment -----------------------------------------------------------

const apiKey = process.env.CURSOR_API_KEY;
const ghToken = process.env.GH_TOKEN;
const prNumber = process.env.PR_NUMBER;
const prDraft = process.env.PR_DRAFT === "true";
const repo = process.env.REPO; // e.g. "org/repo"
const baseBranch = process.env.BASE_BRANCH ?? "main";
const headBranch = process.env.HEAD_BRANCH ?? "";

if (!apiKey) {
  console.error("❌ CURSOR_API_KEY is not set. Add it as a GitHub Actions secret.");
  process.exit(1);
}
if (!ghToken) {
  console.error("❌ GH_TOKEN is not set.");
  process.exit(1);
}
if (!prNumber || !repo) {
  console.error("❌ PR_NUMBER or REPO env vars are missing.");
  process.exit(1);
}

// --- Undraft if needed -----------------------------------------------------

if (prDraft) {
  console.log(`📋 PR #${prNumber} is a draft — converting to ready-for-review…`);
  try {
    execSync(`gh pr ready ${prNumber}`, {
      stdio: "inherit",
      env: { ...process.env, GH_TOKEN: ghToken },
    });
    console.log("✅ PR marked as ready for review.");
  } catch (err) {
    console.error("⚠️  Could not undraft PR:", err);
    // Non-fatal — proceed with review anyway.
  }
}

// --- Prompt ----------------------------------------------------------------

const prompt = `
You are a senior automated reviewer and merge bot for the ZedOS project.

## Context
- PR number: ${prNumber}
- Repository: ${repo}
- Base branch: ${baseBranch}
- Head branch: ${headBranch}

## Step 1 — Load project context
Read \`docs/state/HANDOFF.md\` to understand the current architecture, active work, and any known issues.

## Step 2 — Review the PR diff
Run \`gh pr diff ${prNumber}\` to get the full diff, then check for:

1. **Hexagonal boundary violations** — per \`.cursor/rules/72-hexagonal-boundaries.mdc\`. Domain must not import infrastructure; use-cases must not import route handlers; etc.
2. **Banned patterns** — any new \`as any\` (banned per \`.cursor/rules/73-result-rop.mdc\`), raw throws that cross layer boundaries, or Result/Option type misuse.
3. **Missing Zod contracts** — any new cross-layer data shape (API request/response, event payload) without a corresponding Zod schema in \`contracts/\`.
4. **PR size** — per \`.cursor/rules/79-pr-sizing.mdc\`. Flag if the PR is too large; do not block on size alone unless the rule specifies a hard stop.
5. **Merge conflicts** — run \`git merge-tree \$(git merge-base HEAD origin/${baseBranch}) HEAD origin/${baseBranch}\` to surface conflicts. If conflicts exist and the intent of both sides is clearly the same (e.g. identical logic written two ways), resolve them and push to the head branch. If intent is ambiguous, post a comment explaining each conflict and stop — do NOT merge.

## Step 3 — Decision

**If review passes AND no ambiguous conflicts:**
- Approve the PR: \`gh pr review ${prNumber} --approve --body "✅ Automated review passed. Approving for squash merge."\`
- Merge the PR: \`gh pr merge ${prNumber} --squash --auto\`
- Exit with a success summary.

**If review finds fixable issues** (e.g. a missing \`as const\`, a missing Zod import, a minor type annotation):
- Push the fixes to the head branch.
- Re-run the review checks.
- If it now passes, approve and merge.

**If review is blocked** (ambiguous conflict, security concern, CRITICAL rule violation, permission error):
- Post a comment on the PR via \`gh pr comment ${prNumber} --body "..."\` explaining the specific blocker clearly and what a human needs to do.
- Do NOT approve or merge.
- Exit with a clear explanation printed to stdout.

## Important notes
- If \`gh pr merge\` fails due to insufficient permissions, print "⚠️  GH_TOKEN lacks merge permission — PR approved but not merged. A repo admin must complete the merge." and exit cleanly.
- Never force-push to \`${baseBranch}\`.
- Never close or delete the PR.
- Never commit directly to \`${baseBranch}\`.
`.trim();

// --- Run -------------------------------------------------------------------

const agent = Agent.create({
  apiKey,
  cloud: {
    repos: [{ url: `https://github.com/${repo}` }],
    autoCreatePR: false,
    skipReviewerRequest: true,
  },
});

try {
  const run = await agent.send(prompt);

  // Log IDs immediately — needed for dashboard investigation if stream hangs.
  console.log(`🆔 agent.agentId : ${agent.agentId}`);
  console.log(`🆔 run.id        : ${run.id}`);

  // Stream output live so GitHub Actions logs are readable in real time.
  if (run.supports("stream")) {
    for await (const event of run.stream()) {
      if (event.type === "assistant") {
        for (const block of event.message.content) {
          if (block.type === "text") {
            process.stdout.write(block.text);
          }
        }
      }
    }
  }

  const result = await run.wait();

  if (result.status === "error") {
    console.error(`\n❌ Agent run failed (run.id=${result.id}). Check the Cursor dashboard for details.`);
    process.exit(2);
  }

  console.log(`\n✅ PR automation completed successfully (run.id=${result.id}).`);
  process.exit(0);
} catch (err) {
  if (err instanceof CursorAgentError) {
    console.error(`❌ Agent failed to start: ${err.message} (retryable=${err.isRetryable})`);
    process.exit(1);
  }
  throw err;
} finally {
  if (typeof (agent as any)[Symbol.asyncDispose] === "function") {
    await (agent as any)[Symbol.asyncDispose]();
  }
}
