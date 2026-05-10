import { Agent, CursorAgentError } from "@cursor/sdk";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const apiKey = process.env.CURSOR_API_KEY;
const repo = process.env.REPO;
const mergedHeadBranch = process.env.MERGED_HEAD_BRANCH ?? "";
const mergedPrNumber = process.env.MERGED_PR_NUMBER ?? "";
const orchestratorEnabled = process.env.ORCHESTRATOR_ENABLED !== "false";

if (!orchestratorEnabled) {
  console.log("⏸️  ORCHESTRATOR_ENABLED=false — paused. Set it to 'true' to resume.");
  process.exit(0);
}

if (!apiKey) {
  console.error("❌ CURSOR_API_KEY is not set. Add it as a GitHub Actions secret.");
  process.exit(1);
}

if (!repo) {
  console.error("❌ REPO env var is missing.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Phase prompts
// ---------------------------------------------------------------------------
// Each prompt receives a `{TRACKING_PR_NUMBER}` and `{TRACKING_PR_BRANCH}`
// placeholder that the orchestrator fills in before firing the agent.
// The agent MUST call `gh pr ready {TRACKING_PR_NUMBER}` as its final act
// to signal completion and trigger the next orchestrator run via
// the pr-ready.yml workflow.

const PHASE_PROMPTS: Record<string, string> = {
  "phase3-p0": `Read docs/state/HANDOFF.md and docs/execution/plans/turborepo-migration--phase-0-scaffold.plan.md.
Execute Phase 3 Phase 0: scaffold the Turborepo root.
- Add root package.json, pnpm-workspace.yaml, turbo.jsonc, .changeset/, .npmrc, tsconfig.base.json
- Move zedos/nextjs_space/ → apps/web/
- Verify the app still builds after the move: pnpm typecheck && pnpm build must pass
Open draft PRs for each logical unit (PR P0-a workspace init, PR P0-b CI hygiene).
When all PRs are open and gates pass:
  - Set docs/state/status.json -> phase3.p0 = "complete" and commit + push
  - Run: gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
If blocked at any point:
  - Set docs/state/status.json -> phase3.p0 = "blocked" and phase3.blocker = "<one-line reason>"
  - Write a "Current Blocker" section in docs/state/HANDOFF.md
  - Commit + push docs/state/status.json and docs/state/HANDOFF.md
  - STOP — do not call gh pr ready`,

  "phase3-p1": `Read docs/state/HANDOFF.md first, then read docs/execution/plans/turborepo-migration--phase-1-package-extraction.plan.md.
The plan contains exact file paths for every operation. Follow it precisely.

Execute Phase 3 Phase 1: extract @repo/result, @repo/contracts, @repo/db, @repo/auth from apps/web/.
Extraction order matters (dependency order): result → contracts → db → auth.
Open one draft PR per package. After each PR passes pnpm typecheck && pnpm build, open the next.
The pr-cascade.yml workflow will un-draft each PR when the previous merges.

Architecture rules in .cursor/rules/ apply — especially 72-hexagonal-boundaries.mdc and 73-result-rop.mdc.

When all 4 PRs are open and the final verification gate passes:
  - Set docs/state/status.json -> phase3.p1 = "complete" and commit + push on main (not on a branch)
  - Run: gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
If blocked at any point:
  - Set docs/state/status.json -> phase3.p1 = "blocked" and phase3.blocker = "<one-line reason>"
  - Write a "Current Blocker" section in docs/state/HANDOFF.md
  - Commit + push docs/state/ files
  - STOP — do not call gh pr ready`,

  "phase3-p2": `Read docs/state/HANDOFF.md first, then read docs/execution/plans/turborepo-migration--phase-2-drizzle.plan.md.
The plan contains the full Drizzle schema translation from the Prisma schema (12 models, 10 schema files) and exact file paths for all 6 repository rewrites.

Execute Phase 3 Phase 2: migrate Prisma → Drizzle ORM.
PR order: schema+config → repository rewrites → Prisma cleanup.
Critical: CreditRepository.deductCredits() must use a Drizzle transaction with SELECT FOR UPDATE (see plan).
After each PR: pnpm typecheck && pnpm build must pass before opening the next.
Also run: drizzle-kit check (must exit 0 against the database after PR-1).

When all PRs are open and final gate passes:
  - Set docs/state/status.json -> phase3.p2 = "complete" and commit + push on main
  - Run: gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
If blocked:
  - Set phase3.p2 = "blocked" and phase3.blocker = "<one-line reason>"
  - Write "Current Blocker" in docs/state/HANDOFF.md
  - Commit + push docs/state/ files
  - STOP — do not call gh pr ready`,

  "phase3-p3": `Read docs/state/HANDOFF.md first, then read docs/execution/plans/turborepo-migration--phase-3-better-auth.plan.md.
The plan covers the full better-auth setup: server.ts, client.ts, guards.ts (Result<T,E> pattern), Drizzle adapter wiring against @repo/db, and the disabled API-key plugin stub for v2/v3.

Execute Phase 3 Phase 3: migrate NextAuth → better-auth.
PR order: @repo/auth better-auth scaffold + DB tables → handler + session wiring → cleanup.
Critical: after PR-2, verify with grep that zero files in apps/web/ still import from 'next-auth'.
Session shape: session.user.id must be string (not string | undefined) — no as any casts allowed.
The API-key plugin stub must exist in packages/auth/src/plugins/api-key.ts (disabled).

When all PRs are open and final gate passes (including the grep check):
  - Set docs/state/status.json -> phase3.p3 = "complete" and commit + push on main
  - Run: gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
If blocked:
  - Set phase3.p3 = "blocked" and phase3.blocker = "<one-line reason>"
  - Write "Current Blocker" in docs/state/HANDOFF.md
  - Commit + push docs/state/ files
  - STOP — do not call gh pr ready`,

  "fa-account-session": `Read docs/state/HANDOFF.md first, then:
  - docs/product/feature-areas/account-session.md (FA boundaries)
  - docs/product/scope-slices/account-session--sign-up-sign-in.md (canonical slice — designed for better-auth post-Phase 3)
  - docs/execution/user-stories/account-session--sign-up-sign-in--credentials-flow.md (user story with ACs)
  - docs/product/scope-slices/account-session--session-persistence-protected-routes.md (sibling slice)
  - .cursor/rules/76-better-auth.mdc (auth implementation rules)

PREREQUISITE CHECK: before implementing, verify that Phase 3 better-auth is complete:
  - packages/auth/src/server.ts exists and exports auth
  - packages/auth/src/guards.ts exports requireSession and requireUser
  - apps/web/app/api/auth/[...all]/route.ts exists with better-auth handler
  If any of these are missing, set docs/state/status.json -> fa_account_session.slice1 = "blocked" + blocker message, and STOP (do not call gh pr ready).

Execute FA-account-session, Slice 1: sign-up and sign-in flows using better-auth.
Implement the 12 Acceptance Criteria from the user story (skip AC-11 and AC-12 which are PENDING human decisions).
Architecture: route handlers → use-cases → @repo/auth; use Result<T,E> throughout.
Open draft PRs per the user story test plan.

When done:
  - Set docs/state/status.json -> fa_account_session.slice1 = "complete" and commit + push on main
  - Run: gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
If blocked:
  - Set fa_account_session.slice1 = "blocked" and fa_account_session.blocker = "<one-line reason>"
  - Write "Current Blocker" in docs/state/HANDOFF.md
  - Commit + push docs/state/ files
  - STOP — do not call gh pr ready`,
};

// Human-readable titles for the tracking PRs
const PHASE_TITLES: Record<string, string> = {
  "phase3-p0": "chore(orchestrator): [tracking] phase3-p0 — Turborepo scaffold",
  "phase3-p1": "chore(orchestrator): [tracking] phase3-p1 — package extraction",
  "phase3-p2": "chore(orchestrator): [tracking] phase3-p2 — Drizzle migration",
  "phase3-p3": "chore(orchestrator): [tracking] phase3-p3 — better-auth migration",
  "fa-account-session": "chore(orchestrator): [tracking] fa-account-session — sign-up/sign-in",
};

// ---------------------------------------------------------------------------
// Status file
// ---------------------------------------------------------------------------

type PhaseStatus = "not-started" | "in-progress" | "complete" | "blocked";

interface StatusJson {
  phase3?: {
    p0?: PhaseStatus;
    p1?: PhaseStatus;
    p2?: PhaseStatus;
    p3?: PhaseStatus;
    blocker?: string;
  };
  fa_account_session?: {
    slice1?: PhaseStatus;
    blocker?: string;
  };
  [key: string]: unknown;
}

const STATUS_PATH = path.join(process.cwd(), "docs/state/status.json");

function readStatus(): StatusJson | null {
  if (!fs.existsSync(STATUS_PATH)) {
    console.warn("⚠️  docs/state/status.json not found — no automated steps will fire.");
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(STATUS_PATH, "utf8")) as StatusJson;
  } catch (err) {
    console.error("❌ Failed to parse docs/state/status.json:", err);
    process.exit(1);
  }
}

function writeStatus(updated: StatusJson): void {
  fs.writeFileSync(STATUS_PATH, JSON.stringify(updated, null, 2) + "\n", "utf8");
}

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

function determineNextStep(status: StatusJson): string | null {
  const p3 = status.phase3 ?? {};
  const fa = status.fa_account_session ?? {};

  const allPhaseStatuses = [p3.p0, p3.p1, p3.p2, p3.p3, fa.slice1];
  if (allPhaseStatuses.some((s) => s === "in-progress")) {
    console.log("⏳ A phase is already in-progress — another agent may be running. Holding.");
    return null;
  }

  if (p3.blocker || fa.blocker) {
    const msg = p3.blocker ?? fa.blocker;
    console.log(`🚧 Blocked: ${msg}`);
    console.log("Manual intervention required. Stopping.");
    return null;
  }

  if (p3.p0 !== "complete") {
    if (p3.p0 === "blocked") { console.log(`🚧 phase3-p0 blocked: ${p3.blocker ?? "(no message)"}`); return null; }
    return "phase3-p0";
  }
  if (p3.p1 !== "complete") {
    if (p3.p1 === "blocked") { console.log(`🚧 phase3-p1 blocked: ${p3.blocker ?? "(no message)"}`); return null; }
    return "phase3-p1";
  }
  if (p3.p2 !== "complete") {
    if (p3.p2 === "blocked") { console.log(`🚧 phase3-p2 blocked: ${p3.blocker ?? "(no message)"}`); return null; }
    return "phase3-p2";
  }
  if (p3.p3 !== "complete") {
    if (p3.p3 === "blocked") { console.log(`🚧 phase3-p3 blocked: ${p3.blocker ?? "(no message)"}`); return null; }
    return "phase3-p3";
  }
  if (fa.slice1 !== "complete") {
    if (fa.slice1 === "blocked") { console.log(`🚧 fa-account-session/slice1 blocked: ${fa.blocker ?? "(no message)"}`); return null; }
    return "fa-account-session";
  }

  return null;
}

// ---------------------------------------------------------------------------
// Tracking PR
// ---------------------------------------------------------------------------
// Opens a draft PR on a throwaway branch whose only purpose is to carry the
// "phase is running" signal. When the agent calls `gh pr ready <n>`, the
// pr-ready.yml workflow fires, merges it, and triggers this orchestrator again.

function gh(cmd: string): string {
  return execSync(`gh ${cmd}`, { encoding: "utf8" }).trim();
}

function gitExec(cmd: string): void {
  execSync(`git ${cmd}`, { stdio: "inherit" });
}

interface TrackingPR {
  number: number;
  branch: string;
  url: string;
}

function openTrackingPR(step: string): TrackingPR {
  const branch = `orchestrator/tracking-${step}-${Date.now()}`;
  const title = PHASE_TITLES[step] ?? `chore(orchestrator): [tracking] ${step}`;

  gitExec(`config user.email "github-actions[bot]@users.noreply.github.com"`);
  gitExec(`config user.name "github-actions[bot]"`);
  gitExec(`checkout -b ${branch}`);

  // Write a minimal tracking file so the branch has a commit
  const trackingDir = path.join(process.cwd(), "docs/state/tracking");
  fs.mkdirSync(trackingDir, { recursive: true });
  fs.writeFileSync(
    path.join(trackingDir, `${step}.md`),
    `# Tracking: ${step}\n\nStarted: ${new Date().toISOString()}\nBranch: ${branch}\n\nThis file is auto-generated by the phase orchestrator.\nDelete after the phase completes.\n`,
  );

  gitExec(`add docs/state/tracking/`);
  gitExec(`commit -m "chore(orchestrator): open tracking PR for ${step} [skip ci]"`);
  gitExec(`push origin ${branch}`);

  // Write body to a temp file to avoid shell escaping issues with backticks/special chars
  const bodyFile = path.join(process.cwd(), ".github/scripts/.tracking-pr-body.md");
  fs.writeFileSync(bodyFile, [
    `## Orchestrator tracking PR`,
    ``,
    `Phase: \`${step}\``,
    `Started: ${new Date().toISOString()}`,
    ``,
    `This PR is opened automatically when a phase agent starts.`,
    `It is marked \`ready for review\` by the agent when the phase completes,`,
    `which triggers the \`pr-ready.yml\` workflow to merge it and kick the next phase.`,
    ``,
    `**Do not merge manually** — let the agent drive it.`,
    ``,
    `**If you see this as draft for >2h**, the agent may be stuck. Check the Cursor dashboard.`,
  ].join("\n"));

  const prUrl = gh(
    `pr create --repo "${repo}" --base main --head "${branch}" --draft --title "${title}" --body-file "${bodyFile}"`,
  );

  // Extract PR number from URL (last segment)
  const prNumber = parseInt(prUrl.split("/").at(-1) ?? "0", 10);

  // Clean up temp body file
  try { fs.unlinkSync(bodyFile); } catch { /* ignore */ }

  // Return to main so the agent can commit on main
  gitExec(`checkout main`);

  console.log(`📋 Tracking PR #${prNumber} opened (draft): ${prUrl}`);
  return { number: prNumber, branch, url: prUrl };
}

// ---------------------------------------------------------------------------
// Mark in-progress + status commit (on main, before opening tracking PR)
// ---------------------------------------------------------------------------

function markInProgress(status: StatusJson, step: string): void {
  switch (step) {
    case "phase3-p0": status.phase3 = { ...status.phase3, p0: "in-progress" }; break;
    case "phase3-p1": status.phase3 = { ...status.phase3, p1: "in-progress" }; break;
    case "phase3-p2": status.phase3 = { ...status.phase3, p2: "in-progress" }; break;
    case "phase3-p3": status.phase3 = { ...status.phase3, p3: "in-progress" }; break;
    case "fa-account-session": status.fa_account_session = { ...status.fa_account_session, slice1: "in-progress" }; break;
  }

  writeStatus(status);

  try {
    gitExec(`config user.email "github-actions[bot]@users.noreply.github.com"`);
    gitExec(`config user.name "github-actions[bot]"`);
    gitExec(`add docs/state/status.json`);
    gitExec(`commit -m "chore(orchestrator): mark ${step} as in-progress [skip ci]"`);
    gitExec(`push`);
    console.log(`📝 docs/state/status.json updated: ${step} → in-progress`);
  } catch (err) {
    console.warn("⚠️  Could not commit status update (non-fatal):", err);
  }
}

// ---------------------------------------------------------------------------
// Preflight
// ---------------------------------------------------------------------------

interface PhaseRequirements {
  agents?: string[];
  skills?: string[];
  rules?: string[];
  commands?: string[];
}

const PHASE_REQUIREMENTS: Record<string, PhaseRequirements> = {
  "phase3-p1": {
    agents: ["monorepo-explorer", "monorepo-analyst"],
    skills: ["explore-monorepo"],
    rules: ["71-monorepo-context.mdc"],
  },
  "phase3-p2": {
    agents: ["drizzle-persistence", "domain-guardian"],
    skills: ["add-drizzle-migration", "add-driven-adapter"],
    rules: ["75-drizzle.mdc"],
  },
  "phase3-p3": {
    agents: ["auth-better-auth", "nextjs-routes"],
    skills: ["add-better-auth-flow", "add-route-handler"],
    rules: ["76-better-auth.mdc", "77-nextjs.mdc"],
  },
  "fa-account-session": {
    agents: ["auth-better-auth", "nextjs-routes", "security-pii"],
    skills: ["add-better-auth-flow", "add-page-route", "add-server-action"],
    rules: ["76-better-auth.mdc", "77-nextjs.mdc"],
    commands: ["implement", "review"],
  },
};

async function runPreflight(nextStep: string): Promise<boolean> {
  const requirements = PHASE_REQUIREMENTS[nextStep];
  if (!requirements) {
    console.log(`✅ Preflight: no .cursor/ requirements for "${nextStep}" — proceeding.`);
    return true;
  }

  const cwd = process.cwd();
  const missing: Required<PhaseRequirements> = { agents: [], skills: [], rules: [], commands: [] };

  for (const a of requirements.agents ?? []) {
    if (!fs.existsSync(path.join(cwd, `.cursor/agents/execution/${a}.md`))) missing.agents.push(`.cursor/agents/execution/${a}.md`);
  }
  for (const s of requirements.skills ?? []) {
    if (!fs.existsSync(path.join(cwd, `.cursor/skills/execution/${s}/SKILL.md`))) missing.skills.push(`.cursor/skills/execution/${s}/SKILL.md`);
  }
  for (const r of requirements.rules ?? []) {
    if (!fs.existsSync(path.join(cwd, `.cursor/rules/${r}`))) missing.rules.push(`.cursor/rules/${r}`);
  }
  for (const c of requirements.commands ?? []) {
    if (!fs.existsSync(path.join(cwd, `.cursor/commands/${c}.md`))) missing.commands.push(`.cursor/commands/${c}.md`);
  }

  const allMissing = [...missing.agents, ...missing.skills, ...missing.rules, ...missing.commands];

  if (allMissing.length === 0) {
    console.log(`✅ Preflight: all .cursor/ artifacts present for "${nextStep}" — proceeding.`);
    return true;
  }

  console.log(`\n🔧 Preflight: ${allMissing.length} missing .cursor/ artifact(s) for "${nextStep}":`);
  allMissing.forEach(f => console.log(`   - ${f}`));
  console.log(`\n   Firing setup agent to create missing artifacts first…\n`);

  const setupPrompt = `Read docs/state/HANDOFF.md for project context.
The phase about to execute is: "${nextStep}"

The following .cursor/ artifacts are MISSING and must be created BEFORE execution begins.
Create each one now, following the conventions and voice of the existing artifacts in .cursor/.

Missing artifacts:
${allMissing.map(f => `- ${f}`).join('\n')}

Guidelines:
- For agents: follow the structure of .cursor/agents/execution/architect.md
- For skills: follow the structure of existing skills in .cursor/skills/execution/
- For rules: follow the .mdc structure and numbering convention of existing .cursor/rules/ files
- For commands: follow the structure of .cursor/commands/implement.md
- Do NOT touch source code or docs/state/ files

When done, commit with:
  git add .cursor/
  git commit -m "ci: add .cursor/ setup for ${nextStep} [skip ci]"
  git push`.trim();

  try {
    const result = await Agent.prompt(setupPrompt, {
      apiKey: apiKey!,
      cloud: {
        repos: [{ url: `https://github.com/${repo}` }],
        autoCreatePR: false,
        skipReviewerRequest: true,
      },
    });

    if (result.status === "error") {
      console.error(`❌ Preflight setup agent failed for "${nextStep}".`);
      return false;
    }

    console.log(`✅ Preflight setup agent completed.`);
    return true;
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(`❌ Preflight setup agent failed to start: ${err.message}`);
      return false;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log(`\n🤖 Phase Orchestrator`);
console.log(`   Merged PR : #${mergedPrNumber}`);
console.log(`   Head branch: ${mergedHeadBranch}`);
console.log(`   Repo       : ${repo}\n`);

const status = readStatus();
if (!status) process.exit(0);

const nextStep = determineNextStep(status);

if (!nextStep) {
  console.log("🏁 No next automated step. All phases complete or manual decision required.");
  process.exit(0);
}

const promptTemplate = PHASE_PROMPTS[nextStep];
if (!promptTemplate) {
  console.error(`❌ No prompt defined for step "${nextStep}". Add it to PHASE_PROMPTS.`);
  process.exit(1);
}

console.log(`🚀 Next step: ${nextStep}`);

// 1. Mark in-progress on main (idempotency guard)
markInProgress(status, nextStep);

// 2. Preflight check
const preflightOk = await runPreflight(nextStep);
if (!preflightOk) {
  console.error(`❌ Preflight failed for "${nextStep}". Halting.`);
  process.exit(2);
}

// 3. Open draft tracking PR — agent will call `gh pr ready <n>` when done
console.log(`\n📋 Opening draft tracking PR for ${nextStep}…`);
const trackingPR = openTrackingPR(nextStep);

// 4. Inject tracking PR info into the prompt
const prompt = promptTemplate
  .replace(/\{TRACKING_PR_NUMBER\}/g, String(trackingPR.number))
  .replace(/\{REPO\}/g, repo!);

console.log(`🚀 Firing Cursor cloud agent for ${nextStep}…\n`);

try {
  const result = await Agent.prompt(prompt, {
    apiKey: apiKey!,
    cloud: {
      repos: [{ url: `https://github.com/${repo}` }],
      autoCreatePR: false,
      skipReviewerRequest: true,
    },
  });

  if (result.status === "error") {
    console.error(`\n❌ Agent run for "${nextStep}" failed. Tracking PR #${trackingPR.number} remains draft.`);
    console.error(`   Check the Cursor dashboard. The draft PR is your signal that intervention is needed.`);
    process.exit(2);
  }

  // ---------------------------------------------------------------------------
  // Post-agent validation
  // The SDK may return "success" even if the agent didn't complete all required
  // steps. We verify two hard post-conditions before claiming victory:
  //   1. Tracking PR is no longer a draft (agent called `gh pr ready`)
  //   2. Phase status in status.json was updated to "complete"
  // ---------------------------------------------------------------------------
  console.log(`\n🔍 Verifying post-agent conditions for "${nextStep}"…`);

  // 1. Check tracking PR draft state
  let trackingPRIsDraft = true;
  try {
    const prJson = execSync(
      `gh pr view ${trackingPR.number} --repo "${repo}" --json isDraft`,
      { encoding: "utf8" }
    ).trim();
    const prData = JSON.parse(prJson) as { isDraft: boolean };
    trackingPRIsDraft = prData.isDraft;
  } catch {
    console.warn(`⚠️  Could not query tracking PR #${trackingPR.number} state (non-fatal).`);
  }

  if (trackingPRIsDraft) {
    console.error(`\n❌ Post-agent check FAILED: tracking PR #${trackingPR.number} is still a draft.`);
    console.error(`   The agent did NOT call \`gh pr ready ${trackingPR.number}\`.`);
    console.error(`   Work may be on a branch but PRs were not opened/signaled.`);
    console.error(`   Manual intervention required — check open branches and open PRs manually.`);
    process.exit(2);
  }

  // 2. Check status.json was updated to "complete"
  const freshStatus = readStatus();
  let phaseIsComplete = false;
  if (freshStatus) {
    switch (nextStep) {
      case "phase3-p0": phaseIsComplete = freshStatus.phase3?.p0 === "complete"; break;
      case "phase3-p1": phaseIsComplete = freshStatus.phase3?.p1 === "complete"; break;
      case "phase3-p2": phaseIsComplete = freshStatus.phase3?.p2 === "complete"; break;
      case "phase3-p3": phaseIsComplete = freshStatus.phase3?.p3 === "complete"; break;
      case "fa-account-session": phaseIsComplete = freshStatus.fa_account_session?.slice1 === "complete"; break;
    }
  }

  if (!phaseIsComplete) {
    console.error(`\n❌ Post-agent check FAILED: docs/state/status.json still shows "${nextStep}" as not "complete".`);
    console.error(`   The agent did not update the status file.`);
    console.error(`   Tracking PR #${trackingPR.number} state: ${trackingPRIsDraft ? "draft" : "ready"}.`);
    console.error(`   Manual intervention required.`);
    process.exit(2);
  }

  console.log(`✅ Post-agent checks passed: tracking PR #${trackingPR.number} is ready, status.json updated.`);
  console.log(`\n✅ Agent for "${nextStep}" completed successfully.`);
  process.exit(0);
} catch (err) {
  if (err instanceof CursorAgentError) {
    console.error(`❌ Agent failed to start: ${err.message} (retryable=${err.isRetryable})`);
    process.exit(1);
  }
  throw err;
}
