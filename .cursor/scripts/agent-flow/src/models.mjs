/**
 * 4-tier model ladder, env-configurable. Escalation goes one level up on
 * failed runs (EXECUTION → MANAGEMENT → TOP_MANAGEMENT → VISION).
 *
 * Tier duties:
 * - VISION:         session kickoff framing + final review (session boundaries only)
 * - TOP_MANAGEMENT: synthesis on phase changes / every N turns, escalation target
 * - MANAGEMENT:     per-turn routing (strict JSON), work splitting, Skeptic
 * - EXECUTION:      specialists, Spark, code bricks, drafts
 */

/** @typedef {"VISION" | "TOP_MANAGEMENT" | "MANAGEMENT" | "EXECUTION"} Tier */

export const TIERS = /** @type {const} */ (["EXECUTION", "MANAGEMENT", "TOP_MANAGEMENT", "VISION"]);

const DEFAULTS = {
  VISION: "claude-fable-5",
  TOP_MANAGEMENT: "claude-opus-4-6",
  MANAGEMENT: "claude-sonnet-4-6",
  EXECUTION: "composer-2.5",
};

/** Params per model family. Composer models take no thinking/effort params. */
function paramsFor(id) {
  if (/^composer/.test(id) || /^default$/.test(id)) return undefined;
  if (/^(gpt|codex)/.test(id)) return [{ id: "reasoning", value: "medium" }];
  if (/^(claude|kimi|glm)/.test(id)) {
    return [
      { id: "thinking", value: "true" },
      { id: "effort", value: "medium" },
    ];
  }
  return undefined;
}

/**
 * @param {NodeJS.ProcessEnv} env
 */
export function createModelLadder(env) {
  /** @type {Record<Tier, string>} */
  const ids = {
    VISION: env.MODEL_VISION?.trim() || DEFAULTS.VISION,
    TOP_MANAGEMENT: env.MODEL_TOP_MGMT?.trim() || DEFAULTS.TOP_MANAGEMENT,
    MANAGEMENT: env.MODEL_MANAGEMENT?.trim() || DEFAULTS.MANAGEMENT,
    EXECUTION: env.MODEL_EXECUTION?.trim() || DEFAULTS.EXECUTION,
  };

  /**
   * @param {Tier} tier
   * @returns {import('@cursor/sdk').ModelSelection}
   */
  function selectionFor(tier) {
    const id = ids[tier] || DEFAULTS.EXECUTION;
    const params = paramsFor(id);
    return params ? { id, params } : { id };
  }

  /**
   * One level up from the given tier; VISION is the ceiling.
   * @param {Tier} tier
   * @returns {Tier}
   */
  function escalate(tier) {
    const i = TIERS.indexOf(tier);
    return TIERS[Math.min(i + 1, TIERS.length - 1)];
  }

  /**
   * Verify configured ids against the SDK's model list; returns a list of
   * problems (empty when everything checks out).
   * @param {Array<{ id: string }>} available
   */
  function validate(available) {
    const known = new Set(available.map((m) => m.id));
    const problems = [];
    for (const [tier, id] of Object.entries(ids)) {
      if (!known.has(id)) problems.push(`${tier}: unknown model id "${id}"`);
    }
    return problems;
  }

  return { ids, selectionFor, escalate, validate };
}
