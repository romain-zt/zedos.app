import { Agent, CursorAgentError } from "@cursor/sdk";
import fs from "node:fs";
import path from "node:path";
import { execSync, execFileSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const apiKey = process.env.CURSOR_API_KEY;
const repo = process.env.REPO;
const mergedHeadBranch = process.env.MERGED_HEAD_BRANCH ?? "";
const mergedPrNumber = process.env.MERGED_PR_NUMBER ?? "";
const orchestratorEnabled = process.env.ORCHESTRATOR_ENABLED !== "false";
/** Open tracking PRs against `main` or a long-lived integration branch, e.g. `feature/my-epic` */
const trackingBase = (process.env.ORCHESTRATOR_TRACKING_BASE ?? "main").trim() || "main";

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
// Each prompt receives `{TRACKING_PR_NUMBER}`, `{TRACKING_PR_BRANCH}`, and `{REPO}`
// placeholders that the orchestrator fills in before firing the agent.
// The agent MUST call `gh pr ready {TRACKING_PR_NUMBER}` as its final act
// to signal completion and trigger the next orchestrator run via
// the pr-ready.yml workflow.

const ORCHESTRATOR_BRANCH_RULES = `## Orchestrator branch rules (mandatory)

A **draft tracking PR already exists**: PR #{TRACKING_PR_NUMBER}, head \`{TRACKING_PR_BRANCH}\` → base \`main\`. Automation **only auto-merges that PR** (and stacked dependents via pr-cascade.yml). Commits that exist only on PRs that target \`main\` directly will **not** be included when the tracking PR merges.

- **Primary branch:** check out and push **all** implementation work to \`{TRACKING_PR_BRANCH}\` (\`git fetch origin && git checkout {TRACKING_PR_BRANCH}\`). The open draft PR will grow to include your diff.
- **Merge target for this tracking PR:** base branch is \`{TRACKING_BASE}\` (often \`main\`; for large epics set repo variable \`ORCHESTRATOR_TRACKING_BASE\` to e.g. \`feature/my-epic\` so sub-tasks merge into the integration branch one-by-one, then merge \`feature/my-epic\` → \`main\` when done).
- **Multiple PRs for this phase:** stack them — first additional PR must use \`gh pr create --base {TRACKING_PR_BRANCH} ...\` (draft). Each next PR uses \`--base\` = the **previous** feature branch name. Never open phase work as a standalone PR to \`{TRACKING_BASE}\` only unless it is stacked this way.
- **Human blocker:** if work cannot proceed without a person (secrets, product call, access), set the phase to \`"blocked"\` in docs/state/status.json with \`blocker\` starting with \`NEED_HUMAN:\` (recommended), update HANDOFF, do **not** call \`gh pr ready\`. The orchestrator will mirror that state to \`main\` and skip this phase so it can pick the next eligible task.
- **status.json / HANDOFF.md:** commit them on \`{TRACKING_PR_BRANCH}\` with the rest of the phase so they merge with the code.

`;

const PHASE_PROMPTS: Record<string, string> = {
  "phase3-p0": `Read docs/state/HANDOFF.md and docs/execution/plans/turborepo-migration--phase-0-scaffold.plan.md.
Execute Phase 3 Phase 0: scaffold the Turborepo root.
- Add root package.json, pnpm-workspace.yaml, turbo.jsonc, .changeset/, .npmrc, tsconfig.base.json
- Move zedos/nextjs_space/ → apps/web/
- Verify the app still builds after the move: pnpm typecheck && pnpm build must pass
If you split into multiple PRs (e.g. P0-a workspace init, P0-b CI hygiene), stack them on \`{TRACKING_PR_BRANCH}\` as described in the branch rules above — do not open parallel drafts to \`main\` only.
When all PRs are open and gates pass:
  - Set docs/state/status.json -> phase3.p0 = "complete" and commit + push on \`{TRACKING_PR_BRANCH}\`
  - Run: gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
If blocked at any point:
  - Set docs/state/status.json -> phase3.p0 = "blocked" and phase3.blocker = "<one-line reason>"
  - Write a "Current Blocker" section in docs/state/HANDOFF.md
  - Update the tracking PR description with the blocker: gh pr edit {TRACKING_PR_NUMBER} --repo {REPO} --body "BLOCKED: <reason>"
  - Commit + push docs/state/status.json and docs/state/HANDOFF.md on \`{TRACKING_PR_BRANCH}\`
  - STOP — do not call gh pr ready`,

  "phase3-p1": `Read docs/state/HANDOFF.md first, then read docs/execution/plans/turborepo-migration--phase-1-package-extraction.plan.md.
The plan contains exact file paths for every operation. Follow it precisely.

Execute Phase 3 Phase 1: extract @repo/result, @repo/contracts, @repo/db, @repo/auth from apps/web/.
Extraction order matters (dependency order): result → contracts → db → auth.
Open one draft PR per package, each stacked on \`{TRACKING_PR_BRANCH}\` or the previous package branch (never orphan drafts to \`main\` only). After each PR passes pnpm typecheck && pnpm build, open the next.
The pr-cascade.yml workflow will rebase and merge stacked drafts when the parent branch merges.

Architecture rules in .cursor/rules/ apply — especially 72-hexagonal-boundaries.mdc and 73-result-rop.mdc.

When all 4 PRs are open and the final verification gate passes:
  - Set docs/state/status.json -> phase3.p1 = "complete" and commit + push on \`{TRACKING_PR_BRANCH}\`
  - Run: gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
If blocked at any point:
  - Set docs/state/status.json -> phase3.p1 = "blocked" and phase3.blocker = "<one-line reason>"
  - Write a "Current Blocker" section in docs/state/HANDOFF.md
  - Update the tracking PR description with the blocker: gh pr edit {TRACKING_PR_NUMBER} --repo {REPO} --body "BLOCKED: <reason>"
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
  - Set docs/state/status.json -> phase3.p2 = "complete" and commit + push on \`{TRACKING_PR_BRANCH}\`
  - Run: gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
If blocked:
  - Set phase3.p2 = "blocked" and phase3.blocker = "<one-line reason>"
  - Write "Current Blocker" in docs/state/HANDOFF.md
  - Update the tracking PR description with the blocker: gh pr edit {TRACKING_PR_NUMBER} --repo {REPO} --body "BLOCKED: <reason>"
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
  - Set docs/state/status.json -> phase3.p3 = "complete" and commit + push on \`{TRACKING_PR_BRANCH}\`
  - Run: gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
If blocked:
  - Set phase3.p3 = "blocked" and phase3.blocker = "<one-line reason>"
  - Write "Current Blocker" in docs/state/HANDOFF.md
  - Update the tracking PR description with the blocker: gh pr edit {TRACKING_PR_NUMBER} --repo {REPO} --body "BLOCKED: <reason>"
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
Open draft PRs per the user story test plan, stacked on \`{TRACKING_PR_BRANCH}\` (or the previous branch in the stack) — not as unrelated PRs to \`main\` only.

When done:
  - Set docs/state/status.json -> fa_account_session.slice1 = "complete" and commit + push on \`{TRACKING_PR_BRANCH}\`
  - Run: gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
If blocked:
  - Set fa_account_session.slice1 = "blocked" and fa_account_session.blocker = "<one-line reason>"
  - Write "Current Blocker" in docs/state/HANDOFF.md
  - Update the tracking PR description with the blocker: gh pr edit {TRACKING_PR_NUMBER} --repo {REPO} --body "BLOCKED: <reason>"
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

  // Ordered pipeline — blocked steps are skipped, not halted on.
  // Dependencies: p0 → p1 → p2 → p3 → fa-account-session
  // A blocked dependency blocks its dependents too.
  const pipeline: { key: string; status: PhaseStatus | undefined; dependsOn: string[] }[] = [
    { key: "phase3-p0", status: p3.p0, dependsOn: [] },
    { key: "phase3-p1", status: p3.p1, dependsOn: ["phase3-p0"] },
    { key: "phase3-p2", status: p3.p2, dependsOn: ["phase3-p1"] },
    { key: "phase3-p3", status: p3.p3, dependsOn: ["phase3-p2"] },
    { key: "fa-account-session", status: fa.slice1, dependsOn: ["phase3-p3"] },
  ];

  const statusMap = new Map(pipeline.map((s) => [s.key, s.status]));
  const blocked: string[] = [];

  for (const step of pipeline) {
    if (step.status === "complete") continue;

    if (step.status === "blocked") {
      console.log(`⏭️  Skipping "${step.key}" (blocked). Will try next eligible step.`);
      blocked.push(step.key);
      continue;
    }

    // Check if any dependency is not complete (incomplete or blocked)
    const unmetDep = step.dependsOn.find((dep) => {
      const depStatus = statusMap.get(dep);
      return depStatus !== "complete";
    });

    if (unmetDep) {
      const depStatus = statusMap.get(unmetDep);
      if (depStatus === "blocked") {
        console.log(`⏭️  Skipping "${step.key}" (dependency "${unmetDep}" is blocked).`);
        blocked.push(step.key);
      } else {
        console.log(`⏭️  Skipping "${step.key}" (dependency "${unmetDep}" is ${depStatus ?? "not-started"}).`);
      }
      continue;
    }

    return step.key;
  }

  if (blocked.length > 0) {
    console.log(`\n🚧 Blocked steps: ${blocked.join(", ")}`);
    console.log("   No unblocked work available. Check docs/state/status.json for blocker details.");
  }

  return null;
}

// ---------------------------------------------------------------------------
// Tracking PR
// ---------------------------------------------------------------------------
// Opens a draft PR on the phase's tracking branch. The docs/state/tracking/
// stub bootstraps the branch; agents must push all implementation commits here
// (see ORCHESTRATOR_BRANCH_RULES) or stack dependent draft PRs on this branch.
// When `gh pr ready` runs, pr-ready.yml merges the tracking branch; stacked
// work is advanced by pr-cascade.yml after each merge.

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
    `Merge base: \`${trackingBase}\``,
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
    `pr create --repo "${repo}" --base "${trackingBase}" --head "${branch}" --draft --title "${title}" --body-file "${bodyFile}"`,
  );

  // Extract PR number from URL (last segment)
  const prNumber = parseInt(prUrl.split("/").at(-1) ?? "0", 10);

  // Clean up temp body file
  try { fs.unlinkSync(bodyFile); } catch { /* ignore */ }

  // Stay on main in this CI clone; prompts direct the Cursor agent to checkout {TRACKING_PR_BRANCH}.
  gitExec(`checkout main`);

  console.log(`📋 Tracking PR #${prNumber} opened (draft): ${prUrl}`);
  return { number: prNumber, branch, url: prUrl };
}

/** Read docs/state/status.json at rev like origin/my-branch */
function readStatusFromGitRev(revLike: string): StatusJson | null {
  try {
    const spec = `${revLike}:docs/state/status.json`;
    const raw = execFileSync("git", ["show", spec], {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    });
    return JSON.parse(raw) as StatusJson;
  } catch {
    return null;
  }
}

function getInProgressStep(s: StatusJson): string | null {
  const p3 = s.phase3 ?? {};
  const fa = s.fa_account_session ?? {};
  if (p3.p0 === "in-progress") return "phase3-p0";
  if (p3.p1 === "in-progress") return "phase3-p1";
  if (p3.p2 === "in-progress") return "phase3-p2";
  if (p3.p3 === "in-progress") return "phase3-p3";
  if (fa.slice1 === "in-progress") return "fa-account-session";
  return null;
}

function extractStepFromTrackingTitle(title: string): string | null {
  if (!title.startsWith("chore(orchestrator): [tracking]")) return null;
  const m = title.match(/\[tracking\]\s+(\S+)/u);
  return m?.[1] ?? null;
}

interface GhPrListRow {
  number: number;
  title: string;
  headRefName: string;
  isDraft: boolean;
  url: string;
  baseRefName: string;
}

function findDraftTrackingPR(step: string): TrackingPR | null {
  try {
    const raw = gh(
      `pr list --repo "${repo}" --state open --json number,title,headRefName,isDraft,url,baseRefName`,
    );
    const prs = JSON.parse(raw) as GhPrListRow[];
    for (const pr of prs) {
      if (!pr.isDraft) continue;
      if (extractStepFromTrackingTitle(pr.title) !== step) continue;
      if (pr.baseRefName !== trackingBase) {
        console.log(`   …skipping PR #${pr.number} (base '${pr.baseRefName}' ≠ orchestrator base '${trackingBase}')`);
        continue;
      }
      return { number: pr.number, branch: pr.headRefName, url: pr.url };
    }
  } catch (e) {
    console.warn("⚠️  findDraftTrackingPR failed:", e);
  }
  return null;
}

function phaseCompleteOnStatus(step: string, st: StatusJson): boolean {
  switch (step) {
    case "phase3-p0": return st.phase3?.p0 === "complete";
    case "phase3-p1": return st.phase3?.p1 === "complete";
    case "phase3-p2": return st.phase3?.p2 === "complete";
    case "phase3-p3": return st.phase3?.p3 === "complete";
    case "fa-account-session": return st.fa_account_session?.slice1 === "complete";
    default: return false;
  }
}

function phaseBlockedOnStatus(step: string, st: StatusJson): boolean {
  switch (step) {
    case "phase3-p0": return st.phase3?.p0 === "blocked";
    case "phase3-p1": return st.phase3?.p1 === "blocked";
    case "phase3-p2": return st.phase3?.p2 === "blocked";
    case "phase3-p3": return st.phase3?.p3 === "blocked";
    case "fa-account-session": return st.fa_account_session?.slice1 === "blocked";
    default: return false;
  }
}

function applyBlockedMirror(mainS: StatusJson, remoteS: StatusJson, step: string): void {
  switch (step) {
    case "phase3-p0":
      mainS.phase3 = { ...mainS.phase3, p0: "blocked", blocker: remoteS.phase3?.blocker ?? mainS.phase3?.blocker };
      break;
    case "phase3-p1":
      mainS.phase3 = { ...mainS.phase3, p1: "blocked", blocker: remoteS.phase3?.blocker ?? mainS.phase3?.blocker };
      break;
    case "phase3-p2":
      mainS.phase3 = { ...mainS.phase3, p2: "blocked", blocker: remoteS.phase3?.blocker ?? mainS.phase3?.blocker };
      break;
    case "phase3-p3":
      mainS.phase3 = { ...mainS.phase3, p3: "blocked", blocker: remoteS.phase3?.blocker ?? mainS.phase3?.blocker };
      break;
    case "fa-account-session":
      mainS.fa_account_session = {
        ...mainS.fa_account_session,
        slice1: "blocked",
        blocker: remoteS.fa_account_session?.blocker ?? mainS.fa_account_session?.blocker,
      };
      break;
  }
}

/** Copy blocked phase state from agent branch into main so the pipeline can skip and continue */
function syncBlockedFromRemoteToMain(step: string, remoteRev: string): boolean {
  const remoteS = readStatusFromGitRev(remoteRev);
  if (!remoteS || !phaseBlockedOnStatus(step, remoteS)) return false;
  try {
    gitExec(`checkout main`);
    gitExec(`pull origin main --ff-only`);
  } catch { /* */ }
  const mainS = readStatus();
  if (!mainS) return false;
  applyBlockedMirror(mainS, remoteS, step);
  writeStatus(mainS);
  try {
    gitExec(`add docs/state/status.json`);
    gitExec(`commit -m "chore(orchestrator): mirror blocked state for ${step} from agent branch [skip ci]"`);
    gitExec(`push`);
    console.log(`📌 Mirrored '${step}' → blocked on main (orchestrator will skip this step).`);
    return true;
  } catch (err) {
    console.warn("⚠️  Could not commit blocked mirror to main:", err);
    return false;
  }
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
// Reset in-progress back to not-started (on failure / timeout)
// ---------------------------------------------------------------------------

function resetInProgress(step: string): void {
  try {
    gitExec(`checkout main`);
    gitExec(`pull origin main --ff-only`);
  } catch { /* may already be on main */ }

  const current = readStatus();
  if (!current) return;

  switch (step) {
    case "phase3-p0": if (current.phase3?.p0 === "in-progress") current.phase3.p0 = "not-started"; break;
    case "phase3-p1": if (current.phase3?.p1 === "in-progress") current.phase3.p1 = "not-started"; break;
    case "phase3-p2": if (current.phase3?.p2 === "in-progress") current.phase3.p2 = "not-started"; break;
    case "phase3-p3": if (current.phase3?.p3 === "in-progress") current.phase3.p3 = "not-started"; break;
    case "fa-account-session": if (current.fa_account_session?.slice1 === "in-progress") current.fa_account_session.slice1 = "not-started"; break;
  }

  writeStatus(current);

  try {
    gitExec(`add docs/state/status.json`);
    gitExec(`commit -m "chore(orchestrator): reset ${step} from in-progress to not-started (agent failed) [skip ci]"`);
    gitExec(`push`);
    console.log(`🔄 Reset ${step} → not-started (will retry on next cron).`);
  } catch (err) {
    console.warn("⚠️  Could not commit status reset (non-fatal):", err);
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

function buildOrchestratorPrompt(step: string, trackingPR: TrackingPR, remediate: boolean): string {
  const tmpl = PHASE_PROMPTS[step];
  if (!tmpl) {
    throw new Error(`No PHASE_PROMPTS entry for "${step}"`);
  }
  const remediation = remediate
    ? `## Remediation pass (mandatory context)

Phase **${step}** is **in-progress**. Draft tracking PR **#${trackingPR.number}** (\`${trackingPR.branch}\` → \`${trackingBase}\`) already exists.
Automation is re-invoking you to **continue** until the phase ships or is explicitly blocked:

- Resolve Merge conflicts — rebase \`${trackingPR.branch}\` onto the latest \`${trackingBase}\`; keep stacked child branches consistent.
- Fix failing CI, review comments, and branch-protection checks; push to \`${trackingPR.branch}\` (and stacked heads as needed).
- When fully done: set the matching field in docs/state/status.json to \`"complete"\` on \`${trackingPR.branch}\`, commit, push, then \`gh pr ready ${trackingPR.number} --repo ${repo}\`.
- If blocked by a human (secrets, product/legal, irreversible decision): set the phase to \`"blocked"\` with \`blocker\` beginning \`NEED_HUMAN:\`, update HANDOFF, do **not** call \`gh pr ready\`. The orchestrator will copy \`blocked\` onto \`main\` and advance to other pipeline work.

`
    : "";
  return `${remediation}${ORCHESTRATOR_BRANCH_RULES}${tmpl}`
    .replace(/\{TRACKING_PR_NUMBER\}/g, String(trackingPR.number))
    .replace(/\{TRACKING_PR_BRANCH\}/g, trackingPR.branch)
    .replace(/\{REPO\}/g, repo!)
    .replace(/\{TRACKING_BASE\}/g, trackingBase);
}

async function executeAgentRun(step: string, trackingPR: TrackingPR, remediate: boolean): Promise<void> {
  const prompt = buildOrchestratorPrompt(step, trackingPR, remediate);
  console.log(`🚀 Firing Cursor cloud agent for ${step}${remediate ? " (remediation)" : ""}…\n`);

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
      console.error(`\n❌ Agent run for "${step}" failed. Check the Cursor dashboard.`);
      if (!findDraftTrackingPR(step)) {
        resetInProgress(step);
      }
      process.exit(2);
    }

    console.log(`\n🔍 Verifying post-agent conditions for "${step}"…`);

    try {
      gitExec(`fetch origin ${trackingPR.branch}`);
    } catch {
      console.warn(`⚠️  git fetch origin ${trackingPR.branch} failed — status check may fail.`);
    }

    const remoteRev = `origin/${trackingPR.branch}`;

    let trackingPRIsDraft = true;
    try {
      const prJson = execSync(
        `gh pr view ${trackingPR.number} --repo "${repo}" --json isDraft`,
        { encoding: "utf8" },
      ).trim();
      const prData = JSON.parse(prJson) as { isDraft: boolean };
      trackingPRIsDraft = prData.isDraft;
    } catch {
      console.warn(`⚠️  Could not query tracking PR #${trackingPR.number} state (non-fatal).`);
    }

    const freshStatus = readStatusFromGitRev(remoteRev);
    const phaseIsComplete = freshStatus ? phaseCompleteOnStatus(step, freshStatus) : false;

    if (trackingPRIsDraft) {
      if (syncBlockedFromRemoteToMain(step, remoteRev)) {
        console.log("✅ Phase marked blocked on main; orchestrator can pick other work.");
        process.exit(0);
      }
      console.log(
        `\n⏳ Tracking PR #${trackingPR.number} still draft — leaving phase in-progress for next remediation run (schedule/webhook).`,
      );
      process.exit(0);
    }

    if (!phaseIsComplete) {
      if (syncBlockedFromRemoteToMain(step, remoteRev)) {
        process.exit(0);
      }
      console.error(
        `\n❌ Post-agent check FAILED: docs/state/status.json on '${remoteRev}' does not show "${step}" as complete.`,
      );
      resetInProgress(step);
      process.exit(2);
    }

    console.log(`✅ Post-agent checks passed: tracking PR #${trackingPR.number} is ready, status.json complete.`);
    console.log(`\n✅ Agent for "${step}" completed successfully.`);
    process.exit(0);
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(`❌ Agent failed to start: ${err.message} (retryable=${err.isRetryable})`);
      if (!findDraftTrackingPR(step)) {
        resetInProgress(step);
      }
      process.exit(1);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function mainOrchestrator(): Promise<void> {
  console.log(`\n🤖 Phase Orchestrator`);
  console.log(`   Merged PR     : #${mergedPrNumber}`);
  console.log(`   Head branch   : ${mergedHeadBranch}`);
  console.log(`   Repo          : ${repo}`);
  console.log(`   Tracking base : ${trackingBase}\n`);

  let status = readStatus();
  if (!status) {
    process.exit(0);
  }

  const inProg = getInProgressStep(status);
  if (inProg) {
    const draftPR = findDraftTrackingPR(inProg);
    if (draftPR) {
      console.log(`🔁 Remediation: "${inProg}" in-progress — re-using draft PR #${draftPR.number}.`);
      if (!PHASE_PROMPTS[inProg]) {
        console.error(`❌ No prompt defined for step "${inProg}". Add it to PHASE_PROMPTS.`);
        process.exit(1);
      }
      const preflightOk = await runPreflight(inProg);
      if (!preflightOk) {
        console.error(`❌ Preflight failed for "${inProg}". Halting.`);
        process.exit(2);
      }
      await executeAgentRun(inProg, draftPR, true);
      return;
    }
    console.log(
      `⚠️  "${inProg}" is in-progress on main but no open draft tracking PR for base '${trackingBase}'. Resetting.`,
    );
    resetInProgress(inProg);
    status = readStatus();
    if (!status) {
      process.exit(0);
    }
  }

  const nextStep = determineNextStep(status);
  if (!nextStep) {
    console.log("🏁 No next automated step. All phases complete or manual decision required.");
    process.exit(0);
  }

  if (!PHASE_PROMPTS[nextStep]) {
    console.error(`❌ No prompt defined for step "${nextStep}". Add it to PHASE_PROMPTS.`);
    process.exit(1);
  }

  console.log(`🚀 Next step: ${nextStep}`);

  markInProgress(status, nextStep);

  const preflightOk = await runPreflight(nextStep);
  if (!preflightOk) {
    console.error(`❌ Preflight failed for "${nextStep}". Halting.`);
    process.exit(2);
  }

  console.log(`\n📋 Opening draft tracking PR for ${nextStep}…`);
  const trackingPR = openTrackingPR(nextStep);
  await executeAgentRun(nextStep, trackingPR, false);
}

await mainOrchestrator();
