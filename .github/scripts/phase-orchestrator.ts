import { Agent, CursorAgentError, type RunResult } from "@cursor/sdk";
import { buildCursorCloudOptions } from "./cursor-sdk-options";
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
/** When set, the orchestrator runs as a worker for this specific step ID only (dispatched by coordinator). */
const stepId = process.env.STEP_ID?.trim() || "";

/**
 * Maximum number of consecutive remediation runs before the orchestrator auto-blocks a step.
 * Prevents infinite agent-refire loops when an agent keeps exploring without committing.
 */
const MAX_REMEDIATION_RUNS = 5;

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

A **draft tracking PR already exists**: PR #{TRACKING_PR_NUMBER}, head \`{TRACKING_PR_BRANCH}\` → base \`{TRACKING_BASE}\`. Automation **only auto-merges that PR** (and stacked dependents via pr-cascade.yml). Commits that exist only on PRs that target \`main\` directly will **not** be included when the tracking PR merges.

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

  "fa-account-session-slice2": `Read docs/state/HANDOFF.md first, then:
  - docs/product/feature-areas/account-session.md (FA boundaries)
  - docs/product/scope-slices/account-session--session-persistence-protected-routes.md (slice definition)
  - .cursor/rules/76-better-auth.mdc (auth implementation rules)
  - .cursor/rules/77-nextjs.mdc (Next.js App Router patterns)

PREREQUISITE CHECK: verify that Slice 1 (sign-up/sign-in) is complete:
  - apps/web/app/(auth)/sign-up/page.tsx exists OR apps/web/app/sign-up/page.tsx exists
  - packages/auth/src/guards.ts exports requireSession and requireUser
  If any are missing, set docs/state/status.json -> fa_account_session.slice2 = "blocked" + blocker message, and STOP.

Governance step: if docs/execution/user-stories/account-session--session-persistence--protected-routes.md does NOT exist, create it now:
  - User story covering: middleware route protection, protected-route redirect with return URL, explicit sign-out, session expiry redirect, public routes allowlist
  - Use template at .cursor/templates/execution/user-story.template.md
  Then create docs/execution/plans/account-session--session-persistence--protected-routes.plan.md
  - Touched files: apps/web/middleware.ts, apps/web/app/(dashboard)/layout.tsx (or equivalent), any sign-out action
  - Use template at .cursor/templates/execution/implementation-plan.template.md

Execute FA-account-session, Slice 2: session persistence and protected routes.
Key behaviors:
- Middleware (apps/web/middleware.ts): protect signed-in routes; redirect to /sign-in?from=<url> when no session
- Public routes allowlist: /sign-up, /sign-in, /api/auth/*, /share/* remain accessible without session
- Sign-out server action: destroys session, redirects to /sign-in
- Session persistence handled by better-auth JWT (7-day default, already configured in packages/auth/)
Architecture: middleware uses requireSession from @repo/auth; sign-out uses better-auth client; Result<T,E> throughout.
Open draft PRs stacked on \`{TRACKING_PR_BRANCH}\`.

When done:
  - Set docs/state/status.json -> fa_account_session.slice2 = "complete" and commit + push on \`{TRACKING_PR_BRANCH}\`
  - Run: gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
If blocked:
  - Set fa_account_session.slice2 = "blocked" and fa_account_session.blocker = "<one-line reason>"
  - Write "Current Blocker" in docs/state/HANDOFF.md
  - Update tracking PR description: gh pr edit {TRACKING_PR_NUMBER} --repo {REPO} --body "BLOCKED: <reason>"
  - Commit + push docs/state/ files
  - STOP — do not call gh pr ready`,

  "cursor-self-improve": `Read docs/state/HANDOFF.md first, then read .cursor/rules/80-change-policy.mdc and .cursor/commands/improve-config.md.

Your task: audit the .cursor/ governance system and apply improvements. This is a meta-improvement pass to keep the governance system current for Phase 4 feature areas.

Steps:
1. Scan .cursor/rules/*.mdc — check for:
   - References to commands, agents, skills, or paths that no longer exist
   - Priority bands in execution-loop.mdc §4 that still reflect FA statuses accurately
   - Any v0 FAs that need updated status references
2. Scan .cursor/agents/execution/*.md — check for:
   - Agent files referencing outdated model slugs (verify against Cursor documented list)
   - Missing agent coverage for Phase 4 FAs (project-workspace, prd-versioning, guided-clarification)
3. Scan .cursor/skills/execution/*/SKILL.md — check for:
   - Missing skills for upcoming FAs (e.g., add-page-route is present; verify add-usecase and add-driving-endpoint cover the patterns needed)
4. Update execution-loop.mdc §4 priority bands if any FA status has changed (account-session is now partially done; dashboard-shell is now validated)
5. Apply improvements using /improve-config semantics — write only .cursor/** files
6. Add an entry to docs/EXECUTION_LOG.md logging this governance audit

Commit all improvements:
  git add .cursor/ docs/EXECUTION_LOG.md
  git commit -m "ci: governance self-improvement audit Phase 4 [skip ci]"
  git push

When done:
  - Set docs/state/status.json -> cursor_self_improve.status = "complete" and commit + push on \`{TRACKING_PR_BRANCH}\`
  - Run: gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
If blocked:
  - Set cursor_self_improve.status = "blocked" and cursor_self_improve.blocker = "<one-line reason>"
  - STOP — do not call gh pr ready`,

  "fa-dashboard-shell-slice1": `Read docs/state/HANDOFF.md first, then:
  - docs/product/feature-areas/dashboard-shell.md (FA boundaries)
  - docs/product/scope-slices/dashboard-shell--signed-in-home.md (slice definition)
  - docs/prd/PRD.md §"Global Product Picture", §"MVP Completeness Checklist (under construction)", §"Out of Scope"
  - .cursor/rules/77-nextjs.mdc (Next.js App Router patterns)
  - .cursor/rules/72-hexagonal-boundaries.mdc

PREREQUISITE CHECK: verify that account-session FA is sufficiently complete:
  - apps/web/middleware.ts exists (session protection)
  - packages/auth/src/guards.ts exists
  If missing, set docs/state/status.json -> fa_dashboard_shell.slice1 = "blocked" + blocker message, and STOP.

Governance step: if docs/execution/user-stories/dashboard-shell--signed-in-home--orientation.md does NOT exist, create it:
  - User story ACs: /dashboard route exists and is protected; founder sees navigation toward projects/PRD; non-v0 areas labeled as under construction; no 404 on first load
  - Use .cursor/templates/execution/user-story.template.md
  Then create docs/execution/plans/dashboard-shell--signed-in-home--orientation.plan.md
  - Touched files: apps/web/app/(dashboard)/page.tsx or apps/web/app/dashboard/page.tsx, layout files, navigation component
  - Use .cursor/templates/execution/implementation-plan.template.md

Execute FA-dashboard-shell, Slice 1: signed-in home orientation.
Key behaviors to implement:
- /dashboard route (protected via middleware): founder's post-sign-in landing page
- Navigation structure to PRD workflows and project workspace (links, not full implementations)
- "Under construction" labels for deferred roadmap areas (services, feature split, Cursor packaging, user stories, test-first delivery)
- Clean, simple layout — this is the shell that future FAs will plug into; keep it minimal and extensible
Architecture: Next.js App Router server components; requireSession from @repo/auth for layout guard; Result<T,E> for any server actions.
Open draft PRs stacked on \`{TRACKING_PR_BRANCH}\`.

When done:
  - Set docs/state/status.json -> fa_dashboard_shell.slice1 = "complete" and commit + push on \`{TRACKING_PR_BRANCH}\`
  - Run: gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
If blocked:
  - Set fa_dashboard_shell.slice1 = "blocked" and fa_dashboard_shell.blocker = "<one-line reason>"
  - Write "Current Blocker" in docs/state/HANDOFF.md
  - Update tracking PR: gh pr edit {TRACKING_PR_NUMBER} --repo {REPO} --body "BLOCKED: <reason>"
  - Commit + push docs/state/ files
  - STOP — do not call gh pr ready`,

  "fa-dashboard-shell-slice2": `Read docs/state/HANDOFF.md first, then:
  - docs/product/feature-areas/dashboard-shell.md (FA boundaries)
  - docs/product/scope-slices/dashboard-shell--under-construction-placeholders.md (slice definition)
  - docs/prd/PRD.md §"Out of Scope", §"MVP Completeness Checklist (under construction)"
  - .cursor/rules/77-nextjs.mdc

PREREQUISITE CHECK: verify Slice 1 (signed-in home) is complete:
  - apps/web/app/(dashboard)/page.tsx or apps/web/app/dashboard/page.tsx exists
  If missing, set docs/state/status.json -> fa_dashboard_shell.slice2 = "blocked" + blocker message, and STOP.

Governance step: if docs/execution/user-stories/dashboard-shell--under-construction--placeholders.md does NOT exist, create it:
  - ACs: all non-v0 roadmap areas have visible under-construction labels; no 404 links; labels are non-interactive or show a tooltip; founder understands v0 scope clearly
  Then create docs/execution/plans/dashboard-shell--under-construction--placeholders.plan.md

Execute FA-dashboard-shell, Slice 2: under-construction placeholders.
Key behaviors to implement:
- Placeholder UI for each non-v0 roadmap area: services/feature split, Cursor packaging, user stories, test-first delivery, architecture analysis
- Consistent visual treatment: "Under construction" or "Coming soon" label; non-interactive or shows a tooltip
- No dead links or 404s when founder interacts with placeholder areas
Architecture: static Next.js components; no server-side data fetching needed; purely presentational.
Open draft PRs stacked on \`{TRACKING_PR_BRANCH}\`.

When done:
  - Set docs/state/status.json -> fa_dashboard_shell.slice2 = "complete" and commit + push on \`{TRACKING_PR_BRANCH}\`
  - Run: gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
If blocked:
  - Set fa_dashboard_shell.slice2 = "blocked" and fa_dashboard_shell.blocker = "<one-line reason>"
  - Write "Current Blocker" in docs/state/HANDOFF.md
  - Update tracking PR: gh pr edit {TRACKING_PR_NUMBER} --repo {REPO} --body "BLOCKED: <reason>"
  - Commit + push docs/state/ files
  - STOP — do not call gh pr ready`,
};

// Human-readable titles for the tracking PRs (optional overrides; slice steps synthesize titles)
const PHASE_TITLES: Record<string, string> = {
  "phase3-p0": "chore(orchestrator): [tracking] phase3-p0 — Turborepo scaffold",
  "phase3-p1": "chore(orchestrator): [tracking] phase3-p1 — package extraction",
  "phase3-p2": "chore(orchestrator): [tracking] phase3-p2 — Drizzle migration",
  "phase3-p3": "chore(orchestrator): [tracking] phase3-p3 — better-auth migration",
  "fa-account-session": "chore(orchestrator): [tracking] fa-account-session — sign-up/sign-in",
  "fa-account-session-slice2": "chore(orchestrator): [tracking] fa-account-session-slice2 — session persistence",
  "cursor-self-improve": "chore(orchestrator): [tracking] cursor-self-improve — governance audit",
  "fa-dashboard-shell-slice1": "chore(orchestrator): [tracking] fa-dashboard-shell-slice1 — signed-in home",
  "fa-dashboard-shell-slice2": "chore(orchestrator): [tracking] fa-dashboard-shell-slice2 — under-construction",
};

function getTrackingTitle(stepRow: PipelineStepRow): string {
  const custom = PHASE_TITLES[stepRow.id];
  if (custom) return custom;
  if (stepRow.workload.kind === "slice") {
    const slug = path.basename(stepRow.workload.scopeSliceFile, ".md");
    return `chore(orchestrator): [tracking] ${stepRow.id} — ${slug}`;
  }
  return `chore(orchestrator): [tracking] ${stepRow.id}`;
}

// ---------------------------------------------------------------------------
// Status file + orchestration.pipeline.json schema
// ---------------------------------------------------------------------------

type PhaseStatus = "not-started" | "in-progress" | "complete" | "blocked";

interface StatusJson {
  /** Canonical per-step state for the orchestration pipeline (preferred). Legacy phase3 / fa_* fields stay in sync for bundled steps. */
  orchestration?: {
    steps?: Record<string, PhaseStatus>;
    blocker?: string;
    /** Per-step count of consecutive remediation runs. Reset to 0 on success. Used as circuit-breaker against infinite agent loops. */
    remediation_counts?: Record<string, number>;
  };
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
const PIPELINE_PATH = path.join(process.cwd(), "docs/state/orchestration.pipeline.json");

interface PipelineWorkloadBundled {
  kind: "bundled";
  promptKey: string;
}

interface PipelineWorkloadSlice {
  kind: "slice";
  title: string;
  featureAreaFile: string;
  scopeSliceFile: string;
  userStoryFile: string | null;
  planFile: string | null;
  notes?: string;
}

interface PipelineStepRow {
  id: string;
  dependsOn: string[];
  workload: PipelineWorkloadBundled | PipelineWorkloadSlice;
}

interface PipelineConfig {
  version: number;
  steps: PipelineStepRow[];
}

let pipelineMemo: PipelineConfig | undefined;

function loadPipeline(): PipelineConfig {
  if (pipelineMemo) return pipelineMemo;
  if (!fs.existsSync(PIPELINE_PATH)) {
    console.error("❌ Missing docs/state/orchestration.pipeline.json — add it under docs/state/ so CI can schedule work.");
    process.exit(1);
  }
  try {
    pipelineMemo = JSON.parse(fs.readFileSync(PIPELINE_PATH, "utf8")) as PipelineConfig;
  } catch (e) {
    console.error("❌ Invalid JSON in docs/state/orchestration.pipeline.json:", e);
    process.exit(1);
  }
  if (!pipelineMemo?.steps?.length) {
    console.error("❌ orchestration.pipeline.json must define a non-empty steps[] array.");
    process.exit(1);
  }
  return pipelineMemo!;
}

function pipelineStepById(stepId: string): PipelineStepRow {
  const row = loadPipeline().steps.find((s) => s.id === stepId);
  if (!row) {
    console.error(`❌ Step "${stepId}" is not listed in docs/state/orchestration.pipeline.json`);
    process.exit(1);
  }
  return row!;
}

/** Resolve status for a pipeline step: canonical orchestration map first, then legacy fields (bundled steps). */
function resolveStepStatus(status: StatusJson, stepId: string): PhaseStatus | undefined {
  const c = status.orchestration?.steps?.[stepId];
  if (c !== undefined) return c;
  switch (stepId) {
    case "phase3-p0":
      return status.phase3?.p0;
    case "phase3-p1":
      return status.phase3?.p1;
    case "phase3-p2":
      return status.phase3?.p2;
    case "phase3-p3":
      return status.phase3?.p3;
    case "fa-account-session":
      return status.fa_account_session?.slice1;
    default:
      return undefined;
  }
}

/** Write canonical + legacy (when applicable) step state in-memory (caller persists status.json). */
function writeCanonicalStepState(status: StatusJson, stepId: string, value: PhaseStatus): void {
  if (!status.orchestration) status.orchestration = {};
  if (!status.orchestration.steps) status.orchestration.steps = {};
  status.orchestration.steps[stepId] = value;

  switch (stepId) {
    case "phase3-p0":
      status.phase3 = { ...status.phase3, p0: value };
      break;
    case "phase3-p1":
      status.phase3 = { ...status.phase3, p1: value };
      break;
    case "phase3-p2":
      status.phase3 = { ...status.phase3, p2: value };
      break;
    case "phase3-p3":
      status.phase3 = { ...status.phase3, p3: value };
      break;
    case "fa-account-session":
      status.fa_account_session = { ...status.fa_account_session, slice1: value };
      break;
    default:
      break;
  }
}

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
    throw err;
  }
}

function writeStatus(updated: StatusJson): void {
  fs.writeFileSync(STATUS_PATH, JSON.stringify(updated, null, 2) + "\n", "utf8");
}

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

/** Returns all pipeline steps that are ready to execute in parallel.
 *  A step is "ready" when: all dependsOn are "complete", and the step itself is
 *  not "complete", "in-progress", or "blocked". In-progress steps are skipped
 *  (a worker is already running for them) rather than blocking the whole pipeline.
 */
function determineReadySteps(status: StatusJson): string[] {
  const cfg = loadPipeline();
  const statusMap = new Map<string, PhaseStatus | undefined>();
  for (const s of cfg.steps) statusMap.set(s.id, resolveStepStatus(status, s.id));

  const ready: string[] = [];
  const blocked: string[] = [];

  for (const row of cfg.steps) {
    const stepStatus = statusMap.get(row.id);

    if (stepStatus === "complete" || stepStatus === "in-progress") continue;

    if (stepStatus === "blocked") {
      console.log(`⏭️  Skipping "${row.id}" (blocked). Will try next eligible step.`);
      blocked.push(row.id);
      continue;
    }

    const unmetDep = row.dependsOn.find((dep) => statusMap.get(dep) !== "complete");
    if (unmetDep) {
      const depStatus = statusMap.get(unmetDep);
      if (depStatus === "blocked") {
        console.log(`⏭️  Skipping "${row.id}" (dependency "${unmetDep}" is blocked).`);
        blocked.push(row.id);
      } else {
        console.log(`⏭️  Skipping "${row.id}" (dependency "${unmetDep}" is ${depStatus ?? "not-started"}).`);
      }
      continue;
    }

    ready.push(row.id);
  }

  if (blocked.length > 0) {
    console.log(`\n🚧 Blocked steps: ${blocked.join(", ")}`);
    console.log("   Check docs/state/status.json for blocker details.");
  }

  return ready;
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

function ensureOnTrackingMergeBaseBranch(): void {
  gitExec(`fetch origin`);
  try {
    gitExec(`checkout ${trackingBase}`);
    gitExec(`pull origin ${trackingBase} --ff-only`);
    return;
  } catch {
    /* try detach from remote */
  }
  try {
    gitExec(`checkout -B ${trackingBase} origin/${trackingBase}`);
  } catch (e2) {
    console.error(
      `❌ Could not check out orchestrator merge base '${trackingBase}'. Ensure the branch exists on origin.`,
    );
    throw e2;
  }
}

interface TrackingPR {
  number: number;
  branch: string;
  url: string;
}

function openTrackingPR(stepRow: PipelineStepRow): TrackingPR {
  const step = stepRow.id;
  ensureOnTrackingMergeBaseBranch();

  const branch = `orchestrator/tracking-${step}-${Date.now()}`;
  const title = getTrackingTitle(stepRow);

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

  try {
    gitExec(`checkout ${trackingBase}`);
  } catch {
    gitExec(`checkout main`);
  }

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
  for (const row of loadPipeline().steps) {
    if (resolveStepStatus(s, row.id) === "in-progress") return row.id;
  }
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

function phaseCompleteOnStatus(stepId: string, st: StatusJson): boolean {
  return resolveStepStatus(st, stepId) === "complete";
}

function phaseBlockedOnStatus(stepId: string, st: StatusJson): boolean {
  return resolveStepStatus(st, stepId) === "blocked";
}

function applyBlockedMirror(mainS: StatusJson, remoteS: StatusJson, stepId: string): void {
  const blockerFromRemote =
    remoteS.orchestration?.blocker ?? remoteS.phase3?.blocker ?? remoteS.fa_account_session?.blocker;

  if (!mainS.orchestration) mainS.orchestration = {};
  mainS.orchestration.steps ??= {};
  mainS.orchestration.steps[stepId] = "blocked";
  if (blockerFromRemote) mainS.orchestration.blocker = blockerFromRemote;

  switch (stepId) {
    case "phase3-p0":
      mainS.phase3 = {
        ...mainS.phase3,
        p0: "blocked",
        blocker: remoteS.phase3?.blocker ?? mainS.phase3?.blocker ?? blockerFromRemote,
      };
      break;
    case "phase3-p1":
      mainS.phase3 = {
        ...mainS.phase3,
        p1: "blocked",
        blocker: remoteS.phase3?.blocker ?? mainS.phase3?.blocker ?? blockerFromRemote,
      };
      break;
    case "phase3-p2":
      mainS.phase3 = {
        ...mainS.phase3,
        p2: "blocked",
        blocker: remoteS.phase3?.blocker ?? mainS.phase3?.blocker ?? blockerFromRemote,
      };
      break;
    case "phase3-p3":
      mainS.phase3 = {
        ...mainS.phase3,
        p3: "blocked",
        blocker: remoteS.phase3?.blocker ?? mainS.phase3?.blocker ?? blockerFromRemote,
      };
      break;
    case "fa-account-session":
      mainS.fa_account_session = {
        ...mainS.fa_account_session,
        slice1: "blocked",
        blocker: remoteS.fa_account_session?.blocker ?? mainS.fa_account_session?.blocker ?? blockerFromRemote,
      };
      break;
    default:
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
    gitExec(`config user.email "github-actions[bot]@users.noreply.github.com"`);
    gitExec(`config user.name "github-actions[bot]"`);
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

function markInProgress(status: StatusJson, stepId: string): void {
  writeCanonicalStepState(status, stepId, "in-progress");
  writeStatus(status);

  try {
    gitExec(`config user.email "github-actions[bot]@users.noreply.github.com"`);
    gitExec(`config user.name "github-actions[bot]"`);
    gitExec(`add docs/state/status.json`);
    gitExec(`commit -m "chore(orchestrator): mark ${stepId} as in-progress [skip ci]"`);
    gitExec(`push`);
    console.log(`📝 docs/state/status.json updated: ${stepId} → in-progress`);
  } catch (err) {
    console.warn("⚠️  Could not commit status update (non-fatal):", err);
  }
}

// ---------------------------------------------------------------------------
// Reset in-progress back to not-started (on failure / timeout)
// ---------------------------------------------------------------------------

function resetInProgress(stepId: string): void {
  try {
    gitExec(`checkout main`);
    gitExec(`pull origin main --ff-only`);
  } catch { /* may already be on main */ }

  const current = readStatus();
  if (!current) return;

  if (resolveStepStatus(current, stepId) !== "in-progress") return;
  writeCanonicalStepState(current, stepId, "not-started");

  writeStatus(current);

  try {
    gitExec(`config user.email "github-actions[bot]@users.noreply.github.com"`);
    gitExec(`config user.name "github-actions[bot]"`);
    gitExec(`add docs/state/status.json`);
    gitExec(`commit -m "chore(orchestrator): reset ${stepId} from in-progress to not-started (agent failed) [skip ci]"`);
    gitExec(`push`);
    console.log(`🔄 Reset ${stepId} → not-started (will retry on next cron).`);
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
  /** Preflight baseline for dynamically declared slice rows */
  __slice__: {
    agents: ["architect", "implementer", "reviewer", "domain-guardian"],
    skills: ["add-usecase", "add-zod-contract", "add-route-handler"],
    rules: ["70-execution-bridge.mdc", "72-hexagonal-boundaries.mdc", "73-result-rop.mdc", "74-contracts-zod.mdc", "77-nextjs.mdc"],
    commands: ["plan", "implement", "review"],
  },
};

/** GitHub Actions requires % / CR / LF escaping in workflow commands. */
function githubNoticeBody(text: string): string {
  return text.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

/** Log + job summary + ::notice so CI shows a direct link while the cloud run is in progress. */
function emitCursorCloudRunTelemetry(args: { label: string; agentId: string; runId: string }): void {
  const { label, agentId, runId } = args;
  const dashboardUrl = `https://cursor.com/agents/${agentId}`;
  const streamUrl = `https://api.cursor.com/v1/agents/${agentId}/runs/${runId}/stream`;

  console.log(`\n📎 Cursor cloud agent — ${label}`);
  console.log(`   Dashboard : ${dashboardUrl}`);
  console.log(`   Run id    : ${runId}`);
  console.log(`   Stream API: ${streamUrl}`);

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    const md =
      `### Cursor cloud agent — ${label}\n\n` +
      `- [Open in Cursor](${dashboardUrl})\n` +
      `- Run id: \`${runId}\`\n` +
      `- Agent id: \`${agentId}\`\n` +
      `- Stream (SSE, needs \`CURSOR_API_KEY\`): \`${streamUrl}\`\n\n`;
    fs.appendFileSync(summaryPath, md);
  }

  console.log(
    `::notice title=Cursor cloud agent::${githubNoticeBody(`${label}: ${dashboardUrl}`)}`,
  );
}

/**
 * Like `Agent.prompt`, but emits agent/run URLs as soon as the cloud run starts (links stay valid for hours).
 */
async function runOneCloudPrompt(message: string, label: string): Promise<RunResult> {
  const opts = buildCursorCloudOptions(apiKey!, repo!);
  const agent = await Agent.create(opts);
  try {
    const run = await agent.send(message);
    emitCursorCloudRunTelemetry({ label, agentId: run.agentId, runId: run.id });
    return await run.wait();
  } finally {
    await agent[Symbol.asyncDispose]();
  }
}

function preflightRequirementsForStep(stepId: string): PhaseRequirements | undefined {
  if (stepId !== "__slice__" && stepId in PHASE_REQUIREMENTS) return PHASE_REQUIREMENTS[stepId];
  const row = pipelineStepById(stepId);
  if (row.workload.kind === "slice") return PHASE_REQUIREMENTS.__slice__;
  return undefined;
}

async function runPreflight(nextStep: string): Promise<boolean> {
  const requirements = preflightRequirementsForStep(nextStep);
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
    const result = await runOneCloudPrompt(setupPrompt, `preflight:${nextStep}`);

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

function canonicalOrchestrationHint(stepId: string): string {
  return `## Canonical pipeline bookkeeping

Current pipeline step id: \\\`${stepId}\\\`.

Set \\\`docs/state/status.json\\\` → \\\`orchestration.steps["${stepId}"]\\\` to \\\`"complete"\\\` or \\\`"blocked"\\\` before you declare the step done (set \\\`orchestration.blocker\\\` too when blocked). Mirror legacy \\\`phase3.*\\\` / \\\`fa_account_session.*\\\` fields whenever your workload instructions mention them.

`;
}

function bundledWorkloadMarkdown(promptKey: string): string {
  const tmpl = PHASE_PROMPTS[promptKey];
  if (!tmpl) {
    throw new Error(`Missing PHASE_PROMPTS entry for bundled promptKey="${promptKey}"`);
  }
  return tmpl;
}

function sliceWorkloadMarkdown(stepRow: PipelineStepRow, w: PipelineWorkloadSlice): string {
  const us = w.userStoryFile?.trim()
    ? `- User story: \\\`${w.userStoryFile}\\\`\n`
    : `- User story: if none is linked yet, create one per governance from the Scope Slice once it is ready-for-user-stories — do not silently invent scope beyond the Slice file.\n`;
  const plan = w.planFile?.trim()
    ? `- Implementation plan (already approved): \\\`${w.planFile}\\\`\n`
    : `- Implementation plan: if missing, produce one via /.cursor/commands/plan (\`approved\` required before code). Until then set this step \\\`blocked\\\` + NEED_HUMAN referencing the Slice path.\n`;

  const notes = w.notes?.trim() ? `\nOperator notes — ${w.notes.trim()}\n` : "";

  return `${canonicalOrchestrationHint(stepRow.id)}## Slice workload — ${w.title}

Read \\\`docs/state/HANDOFF.md\\\`, then anchor on:

- Feature Area: \\\`${w.featureAreaFile}\\\`
- Scope Slice: \\\`${w.scopeSliceFile}\\\`

${us}${plan}
${notes}
### Execution rules

1. Respect hex boundaries + RoP + Zod contracts (rules 70, 72–74, 77 as applicable).
2. Stack concrete implementation PRs on \\\`{TRACKING_PR_BRANCH}\\\` exactly like bundled phases — no orphan drafts to \\\`${trackingBase}\\\`.
3. \\\`pnpm typecheck\\\` and \\\`pnpm build\\\` must pass on heads you push (plus any Slice-specific gates).
4. Complete: \\\`orchestration.steps["${stepRow.id}"] = "complete"\\\`, commit \\\`docs/state\\\` on the tracking branch, then \\\`gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}\\\`.
5. If blocked awaiting a human/policy decision: \\\`blocked\\\`, refresh HANDOFF, **omit** \\\`gh pr ready\\\`.

`;
}

function workloadMarkdownForRow(stepRow: PipelineStepRow): string {
  const w = stepRow.workload;
  if (w.kind === "bundled") return bundledWorkloadMarkdown(w.promptKey);
  return sliceWorkloadMarkdown(stepRow, w);
}

function validateRunnableStep(stepId: string): void {
  const row = pipelineStepById(stepId);
  if (row.workload.kind === "bundled") {
    if (!PHASE_PROMPTS[row.workload.promptKey]) {
      console.error(`❌ PHASE_PROMPTS["${row.workload.promptKey}"] missing for bundled pipeline step "${stepId}"`);
      process.exit(1);
    }
    return;
  }
  const cwd = process.cwd();
  for (const rel of [row.workload.featureAreaFile, row.workload.scopeSliceFile]) {
    if (!fs.existsSync(path.join(cwd, rel))) {
      console.error(`❌ Slice step "${stepId}" references missing file: ${rel}`);
      process.exit(1);
    }
  }
}

function buildOrchestratorPrompt(stepId: string, trackingPR: TrackingPR, remediate: boolean): string {
  const stepRow = pipelineStepById(stepId);
  const body = workloadMarkdownForRow(stepRow);
  const canonical = stepRow.workload.kind === "slice" ? "" : canonicalOrchestrationHint(stepId);
  const remediation = remediate
    ? `## Remediation pass (mandatory context)

Step **${stepId}** is **in-progress**. Draft tracking PR **#${trackingPR.number}** (\`${trackingPR.branch}\` → \`${trackingBase}\`) already exists.
Automation is re-invoking you to **continue** until the work merges upstream or you block it cleanly:

- Rebase/repair \`${trackingPR.branch}\` onto \`${trackingBase}\`; keep stacked dependents consistent.
- Clear failing CI checks and reviewer feedback with additional commits (push to stacked heads too).
- Success: \\\`orchestration.steps["${stepId}"]\\\` becomes \\\`complete\\\`, mirror legacy status fields whenever applicable, \\\`git push\\\`, then \\\`gh pr ready ${trackingPR.number} --repo ${repo}\\\`.
- Human stall: \\\`blocked\\\`, populate \\\`orchestration.blocker\\\` (\`NEED_HUMAN:\` when appropriate), update HANDOFF, **do not** call \\\`gh pr ready\\\`.

`
    : "";
  return `${remediation}${canonical}${ORCHESTRATOR_BRANCH_RULES}${body}`
    .replace(/\{TRACKING_PR_NUMBER\}/g, String(trackingPR.number))
    .replace(/\{TRACKING_PR_BRANCH\}/g, trackingPR.branch)
    .replace(/\{REPO\}/g, repo!)
    .replace(/\{TRACKING_BASE\}/g, trackingBase);
}

async function executeAgentRun(step: string, trackingPR: TrackingPR, remediate: boolean): Promise<void> {
  validateRunnableStep(step);
  const prompt = buildOrchestratorPrompt(step, trackingPR, remediate);
  console.log(`🚀 Firing Cursor cloud agent for ${step}${remediate ? " (remediation)" : ""}…\n`);

  try {
    const result = await runOneCloudPrompt(
      prompt,
      remediate ? `${step} (remediation)` : step,
    );

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
  console.log(`   Tracking base : ${trackingBase}`);
  console.log(`   Mode          : ${stepId ? `worker (${stepId})` : "coordinator"}\n`);

  let status = readStatus();
  if (!status) {
    process.exit(0);
    return;
  }

  // ---------------------------------------------------------------------------
  // Worker mode — execute exactly one step (dispatched by coordinator)
  // ---------------------------------------------------------------------------
  if (stepId) {
    const currentStepStatus = resolveStepStatus(status, stepId);

    if (currentStepStatus === "in-progress") {
      const draftPR = findDraftTrackingPR(stepId);
      if (draftPR) {
        // Circuit breaker: auto-block the step after too many consecutive remediation attempts
        // to prevent the cron from endlessly refiring an agent that only explores without committing.
        if (!status.orchestration) status.orchestration = {};
        if (!status.orchestration.remediation_counts) status.orchestration.remediation_counts = {};
        const prevCount = status.orchestration.remediation_counts[stepId] ?? 0;
        const remCount = prevCount + 1;
        status.orchestration.remediation_counts[stepId] = remCount;

        if (remCount > MAX_REMEDIATION_RUNS) {
          const blocker = `NEED_HUMAN: step "${stepId}" exceeded ${MAX_REMEDIATION_RUNS} remediation runs (agent kept exploring without committing). Review the Cursor agent dashboard and reset manually once the underlying issue is resolved.`;
          console.error(`\n❌ Circuit breaker triggered for "${stepId}" (${remCount} runs > limit ${MAX_REMEDIATION_RUNS}).`);
          console.error(`   Auto-blocking. Blocker: ${blocker}`);
          writeCanonicalStepState(status, stepId, "blocked");
          if (!status.orchestration) status.orchestration = {};
          status.orchestration.blocker = blocker;
          writeStatus(status);
          try {
            gitExec(`config user.email "github-actions[bot]@users.noreply.github.com"`);
            gitExec(`config user.name "github-actions[bot]"`);
            gitExec(`add docs/state/status.json`);
            gitExec(
              `commit -m "chore(orchestrator): auto-block ${stepId} after ${MAX_REMEDIATION_RUNS} remediation attempts [skip ci]"`,
            );
            gitExec(`push`);
            console.log(`📌 Auto-blocked "${stepId}" — orchestrator will skip it on next run.`);
          } catch (err) {
            console.warn("⚠️  Could not commit auto-block state (non-fatal):", err);
          }
          process.exit(2);
        }

        // Persist incremented counter so concurrent cron ticks can see it.
        writeStatus(status);
        try {
          gitExec(`config user.email "github-actions[bot]@users.noreply.github.com"`);
          gitExec(`config user.name "github-actions[bot]"`);
          gitExec(`add docs/state/status.json`);
          gitExec(
            `commit -m "chore(orchestrator): remediation run ${remCount}/${MAX_REMEDIATION_RUNS} for ${stepId} [skip ci]"`,
          );
          gitExec(`push`);
        } catch (err) {
          console.warn("⚠️  Could not persist remediation count (non-fatal):", err);
        }

        console.log(`🔁 Remediation ${remCount}/${MAX_REMEDIATION_RUNS}: "${stepId}" in-progress — re-using draft PR #${draftPR.number}.`);
        validateRunnableStep(stepId);
        const preflightOk = await runPreflight(stepId);
        if (!preflightOk) {
          console.error(`❌ Preflight failed for "${stepId}". Halting.`);
          process.exit(2);
        }
        await executeAgentRun(stepId, draftPR, true);
        return;
      }
      console.log(
        `⚠️  Worker: "${stepId}" is in-progress but no open draft tracking PR for base '${trackingBase}'. Resetting.`,
      );
      resetInProgress(stepId);
      status = readStatus();
      if (!status) { process.exit(0); return; }
    }

    validateRunnableStep(stepId);

    const preflightOk = await runPreflight(stepId);
    if (!preflightOk) {
      console.error(`❌ Preflight failed for "${stepId}". Halting.`);
      process.exit(2);
    }

    // Idempotency guard: reuse an existing draft PR opened by a concurrent run.
    const existingPR = findDraftTrackingPR(stepId);
    if (existingPR) {
      console.log(`♻️  Reusing existing draft tracking PR #${existingPR.number} for "${stepId}" (concurrent run guard).`);
      await executeAgentRun(stepId, existingPR, false);
      return;
    }

    console.log(`\n📋 Opening draft tracking PR for ${stepId}…`);
    const trackingPR = openTrackingPR(pipelineStepById(stepId));
    await executeAgentRun(stepId, trackingPR, false);
    return;
  }

  // ---------------------------------------------------------------------------
  // Coordinator mode — fan-out across all ready steps
  // ---------------------------------------------------------------------------

  // 1. Reset orphaned in-progress steps (in-progress but no tracking PR)
  for (const row of loadPipeline().steps) {
    if (resolveStepStatus(status, row.id) !== "in-progress") continue;
    const draftPR = findDraftTrackingPR(row.id);
    if (!draftPR) {
      console.log(
        `⚠️  "${row.id}" is in-progress but has no open draft tracking PR for base '${trackingBase}'. Resetting.`,
      );
      resetInProgress(row.id);
    }
  }

  status = readStatus();
  if (!status) { process.exit(0); return; }

  // 2. Collect in-progress steps that DO have tracking PRs — dispatch remediation workers.
  const remediationSteps: string[] = [];
  for (const row of loadPipeline().steps) {
    if (resolveStepStatus(status, row.id) !== "in-progress") continue;
    if (findDraftTrackingPR(row.id)) remediationSteps.push(row.id);
  }

  // 3. Collect all steps whose dependencies are complete and which haven't started.
  const readySteps = determineReadySteps(status);

  if (readySteps.length === 0 && remediationSteps.length === 0) {
    console.log("🏁 No next automated step. All phases complete or manual decision required.");
    process.exit(0);
  }

  // 4. Validate all ready steps upfront, then mark each in-progress sequentially
  //    (sequential commits prevent git push races on status.json).
  for (const step of readySteps) validateRunnableStep(step);
  for (const step of readySteps) {
    markInProgress(status, step);
    status = readStatus() ?? status;
  }

  // 5. Dispatch one worker per step (ready + remediation) — these run as parallel GHA jobs.
  const toDispatch = [...new Set([...readySteps, ...remediationSteps])];
  console.log(`\n🔀 Dispatching ${toDispatch.length} parallel worker(s): ${toDispatch.join(", ")}`);

  for (const step of toDispatch) {
    try {
      execSync(
        `gh workflow run phase-orchestrator.yml --repo "${repo}" -f step_id="${step}" -f reason="parallel dispatch (${step})"`,
        { stdio: "inherit" },
      );
      console.log(`  ✅ Dispatched: ${step}`);
    } catch (err) {
      console.warn(`  ⚠️  Dispatch failed for "${step}" (non-fatal — next cron will retry):`, err);
    }
  }
}

await mainOrchestrator();
