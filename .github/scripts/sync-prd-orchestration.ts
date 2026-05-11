/**
 * Sync orchestration.pipeline.json + status.json from:
 * - docs/prd/PRD.md Flow Inventory (v0 = Yes rows, in table order)
 * - docs/state/orchestration.prd-flow-map.json (slice paths per flow)
 *
 * Appends slice workload steps chained after attachAfterStepId when slices are not
 * already present in the pipeline (matched by workload.scopeSliceFile).
 *
 * CLI:
 *   --print-flow-keys    Print normalized keys for current PRD Yes flows (maintainer helper)
 *   --strict             Exit 1 if any PRD Yes flow is missing from manifest flows map
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PRD_PATH = path.join(ROOT, "docs/prd/PRD.md");
const MAP_PATH = path.join(ROOT, "docs/state/orchestration.prd-flow-map.json");
const PIPELINE_PATH = path.join(ROOT, "docs/state/orchestration.pipeline.json");
const STATUS_PATH = path.join(ROOT, "docs/state/status.json");

type PhaseStatus = "not-started" | "in-progress" | "complete" | "blocked";

interface StatusJson {
  orchestration?: {
    steps?: Record<string, PhaseStatus>;
    blocker?: string;
  };
  [key: string]: unknown;
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
  workload: PipelineWorkloadSlice;
}

interface PipelineConfig {
  version: number;
  description?: string;
  steps: PipelineStepRow[];
}

interface SliceRefObj {
  file: string;
  title?: string;
  notes?: string;
}

type SliceRef = string | SliceRefObj;

interface FlowEntry {
  slices: SliceRef[];
}

interface PrdFlowMapFile {
  version: number;
  attachAfterStepId: string;
  flows: Record<string, FlowEntry>;
}

interface FlowInventoryRow {
  flow: string;
  v0Yes: boolean;
}

export function normalizeFlowCell(flowCell: string): string {
  return flowCell
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function parseFlowInventory(prdContent: string): FlowInventoryRow[] {
  const lines = prdContent.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === "# Flow Inventory");
  if (start === -1) return [];

  const rows: FlowInventoryRow[] = [];
  for (let j = start + 1; j < lines.length; j++) {
    const line = lines[j];
    if (line.startsWith("# ") && !line.startsWith("##")) break;
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (cells.length < 2) continue;
    const [flowCell, v0Cell] = cells;
    if (!flowCell || flowCell.toLowerCase() === "flow") continue;
    if (flowCell.includes("---")) continue;
    rows.push({
      flow: flowCell,
      v0Yes: /^\s*yes\b/i.test(v0Cell ?? ""),
    });
  }
  return rows;
}

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function inferFeatureAreaFile(sliceRelPath: string, sliceContent: string): string {
  const rel = sliceContent.match(/\]\(\.\.\/feature-areas\/([^)]+\.md)\)/);
  if (rel?.[1]) {
    const p = path.join(ROOT, "docs/product/feature-areas", rel[1]);
    if (fs.existsSync(p)) return `docs/product/feature-areas/${rel[1]}`;
  }
  const stem = path.basename(sliceRelPath, ".md").split("--")[0];
  const candidate = path.join(ROOT, "docs/product/feature-areas", `${stem}.md`);
  if (fs.existsSync(candidate)) {
    return `docs/product/feature-areas/${stem}.md`;
  }
  throw new Error(`Cannot infer feature area file for ${sliceRelPath} (fix Parent Feature Area link or add docs/product/feature-areas/${stem}.md)`);
}

function sliceTitleFromMarkdown(content: string, fallback: string): string {
  const m = content.match(/^#\s+Scope Slice:\s*(.+)$/m);
  return (m?.[1] ?? fallback).trim();
}

function orchStepIdFromSlicePath(sliceRel: string): string {
  const base = path.basename(sliceRel, ".md").replace(/[^a-zA-Z0-9-]+/g, "-");
  const id = `orch-${base}`;
  return id.length > 96 ? id.slice(0, 96) : id;
}

function normalizeSliceRef(ref: SliceRef): SliceRefObj {
  return typeof ref === "string" ? { file: ref } : ref;
}

function pipelineHasSlice(pipeline: PipelineConfig, scopeSliceFile: string): boolean {
  return pipeline.steps.some(
    (s) =>
      s.workload &&
      typeof s.workload === "object" &&
      "kind" in s.workload &&
      s.workload.kind === "slice" &&
      (s.workload as PipelineWorkloadSlice).scopeSliceFile === scopeSliceFile,
  );
}

function main(): void {
  const argv = new Set(process.argv.slice(2));
  const printKeys = argv.has("--print-flow-keys");
  const strict =
    argv.has("--strict") || process.env.PRD_SYNC_STRICT === "1" || process.env.PRD_SYNC_STRICT === "true";

  if (!fs.existsSync(PRD_PATH)) {
    console.error(`❌ Missing ${PRD_PATH}`);
    process.exit(1);
  }

  const prdContent = fs.readFileSync(PRD_PATH, "utf8");
  const inventory = parseFlowInventory(prdContent);
  const yesFlows = inventory.filter((r) => r.v0Yes);

  if (printKeys) {
    console.log("Normalized Flow Inventory keys (v0 Yes), PRD table order:\n");
    for (const row of yesFlows) {
      console.log(`  "${normalizeFlowCell(row.flow)}"`);
    }
    process.exit(0);
  }

  if (!fs.existsSync(MAP_PATH)) {
    console.error(`❌ Missing ${MAP_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(PIPELINE_PATH)) {
    console.error(`❌ Missing ${PIPELINE_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(STATUS_PATH)) {
    console.error(`❌ Missing ${STATUS_PATH}`);
    process.exit(1);
  }

  const mapFile = loadJson<PrdFlowMapFile>(MAP_PATH);
  const manifestKeys = new Set(Object.keys(mapFile.flows ?? {}));

  const pipeline = loadJson<PipelineConfig>(PIPELINE_PATH);
  const attachId = mapFile.attachAfterStepId;
  if (!pipeline.steps.some((s) => s.id === attachId)) {
    console.error(`❌ attachAfterStepId "${attachId}" not found in orchestration.pipeline.json`);
    process.exit(1);
  }

  /** Ordered slice files from PRD Yes flows × manifest */
  const orderedSlices: SliceRefObj[] = [];

  for (const row of yesFlows) {
    const nk = normalizeFlowCell(row.flow);
    const entry = mapFile.flows[nk];
    if (!entry) {
      const msg = `⚠️  PRD Flow Inventory row has no manifest entry: "${nk}" (original: "${row.flow}")`;
      if (strict) {
        console.error(`❌ ${msg}`);
        process.exit(1);
      }
      console.warn(msg);
      console.warn(`    Fix: add key to docs/state/orchestration.prd-flow-map.json (run --print-flow-keys)`);
      continue;
    }
    for (const ref of entry.slices ?? []) {
      orderedSlices.push(normalizeSliceRef(ref));
    }
  }

  for (const mk of manifestKeys) {
    const stillInPrd = yesFlows.some((r) => normalizeFlowCell(r.flow) === mk);
    if (!stillInPrd) {
      console.warn(`⚠️  Manifest flow key not in current PRD Flow Inventory (v0 Yes): "${mk}"`);
    }
  }

  let prevDep = attachId;
  const toAppend: PipelineStepRow[] = [];
  const existingIds = new Set(pipeline.steps.map((s) => s.id));

  for (const sliceRef of orderedSlices) {
    const rel = sliceRef.file;
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      console.error(`❌ Mapped slice file missing: ${rel}`);
      process.exit(1);
    }
    if (pipelineHasSlice(pipeline, rel)) {
      const existing = pipeline.steps.find(
        (s) => s.workload.kind === "slice" && s.workload.scopeSliceFile === rel,
      );
      if (existing) prevDep = existing.id;
      continue;
    }

    const content = fs.readFileSync(abs, "utf8");
    const fa = inferFeatureAreaFile(rel, content);
    const title = sliceRef.title?.trim() || sliceTitleFromMarkdown(content, path.basename(rel, ".md"));
    const stepId = orchStepIdFromSlicePath(rel);
    if (existingIds.has(stepId)) {
      console.error(`❌ Generated step id collision: ${stepId} (${rel})`);
      process.exit(1);
    }

    const workload: PipelineWorkloadSlice = {
      kind: "slice",
      title,
      featureAreaFile: fa,
      scopeSliceFile: rel,
      userStoryFile: null,
      planFile: null,
      notes:
        sliceRef.notes ??
        "Auto-appended from docs/prd PRD Flow Inventory + orchestration.prd-flow-map.json. Create user story + plan if not present before implementing.",
    };

    toAppend.push({
      id: stepId,
      dependsOn: [prevDep],
      workload,
    });

    existingIds.add(stepId);
    prevDep = stepId;
  }

  if (toAppend.length === 0) {
    console.log("ℹ️  PRD sync: no new slice steps to append (already in pipeline or manifest empty).");
    process.exit(0);
  }

  pipeline.steps.push(...toAppend);
  fs.writeFileSync(PIPELINE_PATH, `${JSON.stringify(pipeline, null, 2)}\n`);

  const status = loadJson<StatusJson>(STATUS_PATH);
  status.orchestration ??= {};
  status.orchestration.steps ??= {};
  for (const s of toAppend) {
    if (status.orchestration.steps![s.id] === undefined) {
      status.orchestration.steps![s.id] = "not-started";
    }
  }
  fs.writeFileSync(STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`);

  console.log(`✅ PRD sync appended ${toAppend.length} slice step(s): ${toAppend.map((s) => s.id).join(", ")}`);
}

main();
