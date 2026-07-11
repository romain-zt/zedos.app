/**
 * Memory layer v1 (cross-session):
 *  (a) persistent skills library — Postgres, survives session resets
 *  (b) decision log — structured entries extracted via an agent call
 *  (c) codebase map — generated markdown of the target project, refreshed
 *      on demand, injected into the stable prompt prefix
 */
import { readdirSync, statSync } from "fs";
import { join, basename } from "path";
import {
  buildCodebaseMapPrompt,
  buildDecisionExtractionPrompt,
} from "./prompts.mjs";

const IGNORED_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", "out", ".turbo",
  ".cache", "coverage", "__pycache__", ".venv", "venv", ".data", "target",
]);

/**
 * Deterministic fallback map: a plain directory tree, used when the agent
 * call fails or has not run yet.
 * @param {string} rootDir
 */
export function generateTreeFallback(rootDir, maxDepth = 3) {
  /** @type {string[]} */
  const lines = [`# Codebase map (auto tree of ${basename(rootDir)})`, ""];
  function walk(dir, depth, prefix) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = readdirSync(dir).filter((e) => !e.startsWith(".") && !IGNORED_DIRS.has(e));
    } catch {
      return;
    }
    entries.sort();
    for (const entry of entries.slice(0, 40)) {
      const full = join(dir, entry);
      let isDir = false;
      try {
        isDir = statSync(full).isDirectory();
      } catch {
        continue;
      }
      lines.push(`${prefix}- ${entry}${isDir ? "/" : ""}`);
      if (isDir) walk(full, depth + 1, prefix + "  ");
    }
  }
  walk(rootDir, 1, "");
  return lines.join("\n");
}

/**
 * @param {{
 *   db: ReturnType<import('./db.mjs').createDb>;
 *   workspaceDir: string;
 *   runOneShot: (tier: string, prompt: string, label: string) => Promise<string>;
 * }} deps
 */
export function createMemory({ db, workspaceDir, runOneShot }) {
  // ── (c) Codebase map ──────────────────────────────────────────────────

  /**
   * Refresh the codebase map. Tries an EXECUTION agent exploring the
   * workspace; falls back to a plain tree when the run fails.
   */
  async function refreshCodebaseMap() {
    let markdown = "";
    try {
      markdown = await runOneShot("EXECUTION", buildCodebaseMapPrompt(), "codebase-map");
    } catch (err) {
      console.warn(`codebase map agent failed: ${err.message}`);
    }
    if (!markdown?.trim()) {
      markdown = generateTreeFallback(workspaceDir);
    }
    await db.saveCodebaseMap(markdown.trim());
    return markdown.trim();
  }

  async function getCodebaseMap() {
    const { markdown } = await db.getCodebaseMap();
    return markdown;
  }

  // ── (b) Decision log ─────────────────────────────────────────────────

  /**
   * Extract structured decisions from a session transcript via an agent
   * call, store them in Postgres.
   * @param {{ sessionId: string; goal: string; contextBlock: string }} args
   * @returns {Promise<number>} number of decisions stored
   */
  async function extractDecisions({ sessionId, goal, contextBlock }) {
    const raw = await runOneShot(
      "MANAGEMENT",
      buildDecisionExtractionPrompt({ goal, contextBlock }),
      "decision-extraction",
    );
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return 0;
    /** @type {unknown} */
    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return 0;
    }
    if (!Array.isArray(parsed)) return 0;
    let stored = 0;
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const e = /** @type {Record<string, unknown>} */ (entry);
      if (typeof e.decision !== "string" || !e.decision.trim()) continue;
      await db.insertDecision({
        session_id: sessionId,
        decision: e.decision.trim(),
        rationale: typeof e.rationale === "string" ? e.rationale.trim() : "",
        constraints: typeof e.constraints === "string" ? e.constraints.trim() : "",
        tags: Array.isArray(e.tags) ? e.tags.filter((t) => typeof t === "string").slice(0, 4) : [],
      });
      stored++;
    }
    return stored;
  }

  /** Recent decisions rendered for the orchestrator's stable prefix. */
  async function decisionsBlock(limit = 12) {
    const decisions = await db.listDecisions(limit);
    if (decisions.length === 0) return "";
    return decisions
      .map((d) => {
        const cons = d.constraints ? ` [constraints: ${d.constraints}]` : "";
        return `- ${d.decision} (${d.rationale})${cons}`;
      })
      .join("\n");
  }

  // ── (a) Skills library ────────────────────────────────────────────────

  /**
   * Persist a skill (from a spawn directive or manual add). Skills are
   * keyed by name and survive session resets.
   * @param {{ name: string; description: string; markdown: string }} skill
   */
  async function saveSkill(skill) {
    await db.upsertSkill(skill);
  }

  /** @param {string} name */
  async function getSkillMarkdown(name) {
    if (!name) return "";
    const skill = await db.getSkill(name);
    return skill?.markdown ?? "";
  }

  return {
    refreshCodebaseMap,
    getCodebaseMap,
    extractDecisions,
    decisionsBlock,
    saveSkill,
    getSkillMarkdown,
    listSkills: () => db.listSkills(),
  };
}
