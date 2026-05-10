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

// Kill switch — set ORCHESTRATOR_ENABLED=false as a GitHub Actions variable to
// pause all autonomous phase advancement without touching any code.
if (!orchestratorEnabled) {
  console.log("⏸️  ORCHESTRATOR_ENABLED=false — autonomous orchestration is paused. Set it to 'true' to resume.");
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
// To add a new phase: append an entry to PHASE_PROMPTS and add the transition
// logic in determineNextStep() below. The key must match what determineNextStep
// returns.

const PHASE_PROMPTS: Record<string, string> = {
  "phase3-p0": `Read docs/state/HANDOFF.md and docs/execution/plans/turborepo-migration--phase-0-scaffold.plan.md.
Execute Phase 3 Phase 0: scaffold the Turborepo root.
- Add root package.json, pnpm-workspace.yaml, turbo.jsonc, .changeset/, .npmrc, tsconfig.base.json
- Move zedos/nextjs_space/ → apps/web/
- Verify the app still builds after the move: pnpm typecheck && pnpm build must pass
Open draft PRs for each logical unit (PR P0-a workspace init, PR P0-b CI hygiene).
When all PRs are open and gates pass:
  - Set docs/state/status.json -> phase3.p0 = "complete" and commit + push
If blocked at any point:
  - Set docs/state/status.json -> phase3.p0 = "blocked" and phase3.blocker = "<one-line reason>"
  - Write a "Current Blocker" section in docs/state/HANDOFF.md describing what failed and what the next human action is
  - Commit + push docs/state/status.json and docs/state/HANDOFF.md
  - STOP — do not continue`,

  "phase3-p1": `Read docs/state/HANDOFF.md first, then read docs/execution/plans/turborepo-migration--phase-1-package-extraction.plan.md.
The plan contains exact file paths for every operation. Follow it precisely.

Execute Phase 3 Phase 1: extract @repo/result, @repo/contracts, @repo/db, @repo/auth from apps/web/.
Extraction order matters (dependency order): result → contracts → db → auth.
Open one draft PR per package. After each PR passes pnpm typecheck && pnpm build, open the next.
The pr-cascade.yml workflow will un-draft each PR when the previous merges.

Architecture rules in .cursor/rules/ apply — especially 72-hexagonal-boundaries.mdc (no cross-layer imports) and 73-result-rop.mdc (Result<T,E> discipline).

When all 4 PRs are open and the final verification gate passes:
  - Set docs/state/status.json -> phase3.p1 = "complete" and commit + push on main (not on a branch)
If blocked at any point:
  - Set docs/state/status.json -> phase3.p1 = "blocked" and phase3.blocker = "<one-line reason>"
  - Write a "Current Blocker" section in docs/state/HANDOFF.md
  - Commit + push docs/state/ files
  - STOP`,

  "phase3-p2": `Read docs/state/HANDOFF.md first, then read docs/execution/plans/turborepo-migration--phase-2-drizzle.plan.md.
The plan contains the full Drizzle schema translation from the Prisma schema (12 models, 10 schema files) and exact file paths for all 6 repository rewrites.

Execute Phase 3 Phase 2: migrate Prisma → Drizzle ORM.
PR order: schema+config → repository rewrites → Prisma cleanup.
Critical: CreditRepository.deductCredits() must use a Drizzle transaction with SELECT FOR UPDATE (see plan).
After each PR: pnpm typecheck && pnpm build must pass before opening the next.
Also run: drizzle-kit check (must exit 0 against the database after PR-1).

When all PRs are open and final gate passes:
  - Set docs/state/status.json -> phase3.p2 = "complete" and commit + push on main
If blocked:
  - Set phase3.p2 = "blocked" and phase3.blocker = "<one-line reason>"
  - Write "Current Blocker" in docs/state/HANDOFF.md
  - Commit + push docs/state/ files
  - STOP`,

  "phase3-p3": `Read docs/state/HANDOFF.md first, then read docs/execution/plans/turborepo-migration--phase-3-better-auth.plan.md.
The plan covers the full better-auth setup: server.ts, client.ts, guards.ts (Result<T,E> pattern), Drizzle adapter wiring against @repo/db, and the disabled API-key plugin stub for v2/v3.

Execute Phase 3 Phase 3: migrate NextAuth → better-auth.
PR order: @repo/auth better-auth scaffold + DB tables → handler + session wiring → cleanup.
Critical: after PR-2, verify with grep that zero files in apps/web/ still import from 'next-auth'.
Session shape: session.user.id must be string (not string | undefined) — no as any casts allowed.
The API-key plugin stub must exist in packages/auth/src/plugins/api-key.ts (disabled).

When all PRs are open and final gate passes (including the grep check):
  - Set docs/state/status.json -> phase3.p3 = "complete" and commit + push on main
If blocked:
  - Set phase3.p3 = "blocked" and phase3.blocker = "<one-line reason>"
  - Write "Current Blocker" in docs/state/HANDOFF.md
  - Commit + push docs/state/ files
  - STOP`,

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
  If any of these are missing, set docs/state/status.json -> fa_account_session.slice1 = "blocked" + blocker message, and STOP.

Execute FA-account-session, Slice 1: sign-up and sign-in flows using better-auth.
Implement the 12 Acceptance Criteria from the user story (skip AC-11 and AC-12 which are PENDING human decisions).
Architecture: route handlers → use-cases → @repo/auth; use Result<T,E> throughout.
Open draft PRs per the user story test plan.

When done:
  - Set docs/state/status.json -> fa_account_session.slice1 = "complete" and commit + push on main
If blocked:
  - Set fa_account_session.slice1 = "blocked" and fa_account_session.blocker = "<one-line reason>"
  - Write "Current Blocker" in docs/state/HANDOFF.md
  - Commit + push docs/state/ files
  - STOP`,
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

/**
 * Returns the key of the next step to execute, or null if nothing should run.
 * Order mirrors the phase dependency chain:
 *   phase3-p0 → phase3-p1 → phase3-p2 → phase3-p3 → fa-account-session
 *
 * Rules:
 * - If any active phase is "in-progress", another agent is already running → hold.
 * - If any active phase is "blocked", log and stop.
 * - If a phase is "complete", advance to the next one.
 * - If a phase is "not-started" (or absent), that is the next step.
 */
function determineNextStep(status: StatusJson): string | null {
  const p3 = status.phase3 ?? {};
  const fa = status.fa_account_session ?? {};

  // Helper: check for in-progress anywhere first (idempotency guard)
  const allPhaseStatuses = [p3.p0, p3.p1, p3.p2, p3.p3, fa.slice1];
  if (allPhaseStatuses.some((s) => s === "in-progress")) {
    console.log("⏳ A phase is already in-progress — another agent may be running. Holding.");
    return null;
  }

  // Walk the chain
  if (p3.blocked || fa.blocker) {
    const msg = p3.blocker ?? fa.blocker;
    console.log(`🚧 Blocked: ${msg}`);
    console.log("Manual intervention required. Stopping.");
    return null;
  }

  if (p3.p0 !== "complete") {
    if (p3.p0 === "blocked") {
      console.log(`🚧 phase3-p0 is blocked: ${p3.blocker ?? "(no message)"}`);
      return null;
    }
    return "phase3-p0";
  }

  if (p3.p1 !== "complete") {
    if (p3.p1 === "blocked") {
      console.log(`🚧 phase3-p1 is blocked: ${p3.blocker ?? "(no message)"}`);
      return null;
    }
    return "phase3-p1";
  }

  if (p3.p2 !== "complete") {
    if (p3.p2 === "blocked") {
      console.log(`🚧 phase3-p2 is blocked: ${p3.blocker ?? "(no message)"}`);
      return null;
    }
    return "phase3-p2";
  }

  if (p3.p3 !== "complete") {
    if (p3.p3 === "blocked") {
      console.log(`🚧 phase3-p3 is blocked: ${p3.blocker ?? "(no message)"}`);
      return null;
    }
    return "phase3-p3";
  }

  if (fa.slice1 !== "complete") {
    if (fa.slice1 === "blocked") {
      console.log(`🚧 fa-account-session/slice1 is blocked: ${fa.blocker ?? "(no message)"}`);
      return null;
    }
    return "fa-account-session";
  }

  return null; // All phases complete
}

/**
 * Marks the given step as "in-progress" in status.json and commits + pushes.
 */
function markInProgress(status: StatusJson, step: string): void {
  switch (step) {
    case "phase3-p0":
      status.phase3 = { ...status.phase3, p0: "in-progress" };
      break;
    case "phase3-p1":
      status.phase3 = { ...status.phase3, p1: "in-progress" };
      break;
    case "phase3-p2":
      status.phase3 = { ...status.phase3, p2: "in-progress" };
      break;
    case "phase3-p3":
      status.phase3 = { ...status.phase3, p3: "in-progress" };
      break;
    case "fa-account-session":
      status.fa_account_session = { ...status.fa_account_session, slice1: "in-progress" };
      break;
  }

  writeStatus(status);

  try {
    execSync(`git config user.email "github-actions[bot]@users.noreply.github.com"`, { stdio: "inherit" });
    execSync(`git config user.name "github-actions[bot]"`, { stdio: "inherit" });
    execSync(`git add docs/state/status.json`, { stdio: "inherit" });
    execSync(`git commit -m "chore(orchestrator): mark ${step} as in-progress [skip ci]"`, { stdio: "inherit" });
    execSync(`git push`, { stdio: "inherit" });
    console.log(`📝 docs/state/status.json updated: ${step} → in-progress`);
  } catch (err) {
    // Non-fatal: the commit/push may fail if there are no changes (idempotent re-run).
    // Log but continue — firing the agent is more important.
    console.warn("⚠️  Could not commit status update:", err);
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
if (!status) {
  process.exit(0);
}

const nextStep = determineNextStep(status);

if (!nextStep) {
  console.log("🏁 No next automated step. All phases complete or manual decision required.");
  process.exit(0);
}

const prompt = PHASE_PROMPTS[nextStep];
if (!prompt) {
  console.error(`❌ No prompt defined for step "${nextStep}". Add it to PHASE_PROMPTS.`);
  process.exit(1);
}

console.log(`🚀 Next step: ${nextStep}`);
console.log(`   Firing Cursor cloud agent…\n`);

// Mark in-progress before firing (idempotency guard for concurrent runs)
markInProgress(status, nextStep);

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
    console.error(`\n❌ Agent run for "${nextStep}" failed. Check the Cursor dashboard for details.`);
    process.exit(2);
  }

  console.log(`\n✅ Agent for "${nextStep}" completed successfully.`);
  process.exit(0);
} catch (err) {
  if (err instanceof CursorAgentError) {
    console.error(`❌ Agent failed to start: ${err.message} (retryable=${err.isRetryable})`);
    process.exit(1);
  }
  throw err;
}
