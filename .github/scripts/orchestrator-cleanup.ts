/**
 * Orchestrator Cleanup
 *
 * Runs every hour to keep tracking PRs and pipeline state consistent:
 *
 * 1. DUPLICATE PRs — when multiple tracking PRs exist for the same step,
 *    keep the best one (non-draft > draft, newest wins on tie) and close the rest.
 *
 * 2. STUCK READY PRs — tracking PRs that are non-draft (ready for review) but
 *    haven't been merged within STALE_READY_MINUTES. The pr-ready.yml trigger
 *    fires only on the draft→ready transition; if the workflow missed it, the
 *    PR just sits there. This script re-merges it.
 *
 * 3. ORPHANED IN-PROGRESS STEPS — pipeline steps marked in-progress in
 *    status.json but with no open draft tracking PR (the branch or PR was
 *    deleted out-of-band). Reset them to not-started so the next orchestrator
 *    cron can pick them up.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const repo = process.env.REPO ?? "";
const trackingBase = (process.env.ORCHESTRATOR_TRACKING_BASE ?? "main").trim() || "main";
/** Close + reset a "ready" tracking PR if it's been open for longer than this. */
const STALE_READY_MINUTES = parseInt(process.env.STALE_READY_MINUTES ?? "30", 10);

if (!repo) {
  console.error("❌ REPO env var is required (e.g. owner/repo).");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gh(cmd: string): string {
  return execSync(`gh ${cmd}`, { encoding: "utf8" }).trim();
}

function ghSilent(cmd: string): boolean {
  try {
    execSync(`gh ${cmd}`, { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

function git(cmd: string): void {
  execSync(`git ${cmd}`, { stdio: "inherit" });
}

function extractStepFromTitle(title: string): string | null {
  if (!title.startsWith("chore(orchestrator): [tracking]")) return null;
  const m = title.match(/\[tracking\]\s+(\S+)/u);
  return m?.[1] ?? null;
}

interface PrRow {
  number: number;
  title: string;
  headRefName: string;
  isDraft: boolean;
  url: string;
  baseRefName: string;
  createdAt: string;
  mergeable: string;
  mergeStateStatus: string;
}

interface StatusJson {
  orchestration?: { steps?: Record<string, string> };
  [key: string]: unknown;
}

function listOpenTrackingPRs(): PrRow[] {
  const raw = gh(
    `pr list --repo "${repo}" --state open --json number,title,headRefName,isDraft,url,baseRefName,createdAt,mergeable,mergeStateStatus`,
  );
  const all = JSON.parse(raw) as PrRow[];
  return all.filter((pr) => extractStepFromTitle(pr.title) !== null && pr.baseRefName === trackingBase);
}

function readStatusJson(): StatusJson | null {
  const p = path.join(process.cwd(), "docs/state/status.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as StatusJson;
  } catch {
    return null;
  }
}

function writeStatusJson(s: StatusJson): void {
  const p = path.join(process.cwd(), "docs/state/status.json");
  fs.writeFileSync(p, JSON.stringify(s, null, 2) + "\n", "utf8");
}

function resolveStepStatus(status: StatusJson, stepId: string): string | undefined {
  return status.orchestration?.steps?.[stepId];
}

function minutesAgo(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / 60_000;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("🧹 Orchestrator cleanup starting…");
  console.log(`   repo: ${repo}  |  trackingBase: ${trackingBase}  |  staleReadyMin: ${STALE_READY_MINUTES}`);

  // Ensure we're on the tracking base branch and up-to-date.
  try {
    git(`checkout ${trackingBase}`);
    git(`pull origin ${trackingBase} --ff-only`);
  } catch {
    // May already be detached or on the right branch — proceed anyway.
  }

  const prs = listOpenTrackingPRs();
  console.log(`\n📋 Found ${prs.length} open tracking PR(s):\n${prs.map((p) => `  #${p.number} [${p.isDraft ? "draft" : "ready"}] ${extractStepFromTitle(p.title)}`).join("\n") || "  (none)"}`);

  if (prs.length === 0) {
    console.log("\n✅ Nothing to clean up.");
    maybeResetOrphans([]);
    return;
  }

  // -------------------------------------------------------------------------
  // 1. Group by step — detect duplicates
  // -------------------------------------------------------------------------
  const byStep = new Map<string, PrRow[]>();
  for (const pr of prs) {
    const step = extractStepFromTitle(pr.title)!;
    if (!byStep.has(step)) byStep.set(step, []);
    byStep.get(step)!.push(pr);
  }

  const survivingPRs: PrRow[] = [];

  for (const [step, stepPRs] of byStep) {
    if (stepPRs.length === 1) {
      survivingPRs.push(stepPRs[0]!);
      continue;
    }

    console.log(`\n⚠️  Step "${step}" has ${stepPRs.length} open tracking PRs — picking best one.`);

    // Pick the winner: non-draft > draft; among equals, highest PR number (newest).
    const sorted = [...stepPRs].sort((a, b) => {
      if (a.isDraft !== b.isDraft) return a.isDraft ? 1 : -1; // non-draft first
      return b.number - a.number; // newest first
    });
    const winner = sorted[0]!;
    const losers = sorted.slice(1);

    console.log(`  ✅ Keeping  #${winner.number} [${winner.isDraft ? "draft" : "ready"}]`);
    for (const loser of losers) {
      console.log(`  🗑  Closing #${loser.number} [${loser.isDraft ? "draft" : "ready"}]`);
      ghSilent(
        `pr close ${loser.number} --repo "${repo}" ` +
        `--comment "Closing: duplicate tracking PR for step \`${step}\`. ` +
        `PR #${winner.number} is the canonical tracking PR." ` +
        `--delete-branch`,
      );
    }

    survivingPRs.push(winner);
  }

  // -------------------------------------------------------------------------
  // 2. Attempt to merge stuck "ready" (non-draft) tracking PRs
  // -------------------------------------------------------------------------
  console.log("\n🔍 Checking for stuck ready tracking PRs…");

  for (const pr of survivingPRs) {
    if (pr.isDraft) continue;

    const age = minutesAgo(pr.createdAt);
    const step = extractStepFromTitle(pr.title)!;

    if (age < STALE_READY_MINUTES) {
      console.log(`  ⏳ PR #${pr.number} (${step}) has been ready for ${age.toFixed(1)}min — too recent, skipping.`);
      continue;
    }

    if (pr.mergeable !== "MERGEABLE" || pr.mergeStateStatus === "BLOCKED") {
      console.log(`  ⚠️  PR #${pr.number} (${step}) is not mergeable (mergeable=${pr.mergeable}, state=${pr.mergeStateStatus}) — skipping auto-merge.`);
      continue;
    }

    console.log(`  🚀 PR #${pr.number} (${step}) has been ready for ${age.toFixed(1)}min — auto-merging.`);
    const ok = ghSilent(
      `pr merge ${pr.number} --repo "${repo}" --merge ` +
      `--subject "chore(orchestrator): complete phase tracking PR #${pr.number}" ` +
      `--delete-branch`,
    );

    if (ok) {
      console.log(`  ✅ Merged PR #${pr.number}.`);
      // Dispatch orchestrator to advance the chain.
      ghSilent(`workflow run phase-orchestrator.yml --repo "${repo}" -f reason="cleanup: merged stuck ready tracking PR #${pr.number}"`);
      // Remove from surviving list so orphan check below treats this step as no longer in-progress via PR.
      survivingPRs.splice(survivingPRs.indexOf(pr), 1);
    } else {
      console.warn(`  ⚠️  Merge failed for PR #${pr.number} — will retry next run.`);
    }
  }

  // -------------------------------------------------------------------------
  // 3. Reset orphaned in-progress steps (in-progress in status.json but no draft PR)
  // -------------------------------------------------------------------------
  maybeResetOrphans(survivingPRs);

  console.log("\n✅ Cleanup complete.");
}

function maybeResetOrphans(survivingPRs: PrRow[]): void {
  const status = readStatusJson();
  if (!status) return;

  const steps = status.orchestration?.steps ?? {};
  const inProgressSteps = Object.entries(steps)
    .filter(([, v]) => v === "in-progress")
    .map(([k]) => k);

  if (inProgressSteps.length === 0) {
    console.log("\nℹ️  No in-progress steps found in status.json.");
    return;
  }

  console.log(`\n🔍 Checking ${inProgressSteps.length} in-progress step(s) for orphans…`);

  const draftStepIds = new Set(
    survivingPRs.filter((p) => p.isDraft).map((p) => extractStepFromTitle(p.title)!),
  );

  let anyReset = false;
  for (const stepId of inProgressSteps) {
    if (draftStepIds.has(stepId)) {
      console.log(`  ✅ ${stepId} has an active draft tracking PR — OK.`);
      continue;
    }
    console.log(`  🔄 ${stepId} is in-progress but has no draft tracking PR — resetting to not-started.`);
    if (!status.orchestration) status.orchestration = {};
    if (!status.orchestration.steps) status.orchestration.steps = {};
    status.orchestration.steps[stepId] = "not-started";
    anyReset = true;
  }

  if (!anyReset) return;

  writeStatusJson(status);

  try {
    git(`config user.email "github-actions[bot]@users.noreply.github.com"`);
    git(`config user.name "github-actions[bot]"`);
    git(`add docs/state/status.json`);
    git(`commit -m "chore(orchestrator): cleanup — reset orphaned in-progress steps [skip ci]"`);
    git(`push`);
    console.log("  📝 Committed orphan reset to status.json.");
  } catch (err) {
    console.warn("  ⚠️  Could not commit status reset (non-fatal):", err);
  }
}

await main();
