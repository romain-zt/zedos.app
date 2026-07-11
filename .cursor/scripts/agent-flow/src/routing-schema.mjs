/**
 * Strict JSON control protocol for the orchestrator, replacing free-text
 * [ROUTE:]/[SPAWN:] tags. The orchestrator must emit a single JSON object:
 *
 * {
 *   "synthesis": "≤2 sentences of status for the human",
 *   "routes": ["spark", "skeptic"],          // or [] when waiting/spawning
 *   "spawns": [{ "id", "name", "label", "persona", "skill?" }],
 *   "questions": [{ "id", "text", "blocks?" }],  // queued for the human, non-blocking
 *   "phase": "clarify" | "assess_team" | "execute",
 *   "definition_of_done": "one line" | null,
 *   "wait_for_human": false
 * }
 */

export const PHASES = /** @type {const} */ (["clarify", "assess_team", "execute"]);

/**
 * @typedef {{
 *   synthesis: string;
 *   routes: string[];
 *   spawns: Array<{ id: string; name: string; label: string; persona: string; skill?: string }>;
 *   questions: Array<{ id: string; text: string; blocks: string[] }>;
 *   phase: "clarify" | "assess_team" | "execute";
 *   definition_of_done: string | null;
 *   wait_for_human: boolean;
 * }} RoutingDirective
 */

export const ROUTING_SCHEMA_DOC = `Respond with ONE JSON object and nothing else (no markdown fences, no prose before or after):
{
  "synthesis": string,            // <=2 sentences of status/synthesis for the human. Never empty.
  "routes": string[],             // specialist ids to dispatch next. List ALL specialists whose tasks are
                                  // independent of each other — they run IN PARALLEL. [] if waiting or only spawning.
  "spawns": [                     // new specialists to create. [] if none.
    { "id": string,               // snake_case identifier
      "name": string,             // display name
      "label": string,            // short role label
      "persona": string,          // one-line persona
      "skill": string }           // OPTIONAL markdown skill body
  ],
  "questions": [                  // OPTIONAL questions for the human. They are QUEUED — the loop keeps
                                  // running on everything not blocked by them. [] if none.
    { "id": string,               // short id, e.g. "q1"
      "text": string,             // the question, self-contained
      "blocks": string[] }        // OPTIONAL specialist ids that must NOT run until this is answered
  ],
  "phase": "clarify" | "assess_team" | "execute",   // the phase to be in AFTER this turn
  "definition_of_done": string | null,              // set once agreed with the human, else null
  "wait_for_human": boolean       // FULL STOP — only when NOTHING can proceed without the human.
                                  // Prefer "questions" + routing the unblocked work instead.
}`;

/**
 * Extract the first top-level JSON object from raw model output. Tolerates
 * markdown fences and prose around the object, but the object itself must
 * be valid JSON.
 * @param {string} raw
 * @returns {unknown}
 */
function extractJson(raw) {
  const text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : text;
  try {
    return JSON.parse(candidate);
  } catch {
    /* fall through to brace scan */
  }
  const start = candidate.indexOf("{");
  if (start === -1) throw new Error("no JSON object found in reply");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        return JSON.parse(candidate.slice(start, i + 1));
      }
    }
  }
  throw new Error("unterminated JSON object in reply");
}

/** @param {string} s */
function normalizeId(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * Validate a parsed object against the routing schema. Throws with a
 * precise error message (fed back to the model on retry).
 * @param {unknown} obj
 * @param {{ knownSpecialists: string[] }} ctx
 * @returns {RoutingDirective}
 */
function validateDirective(obj, ctx) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("top-level value must be a JSON object");
  }
  const o = /** @type {Record<string, unknown>} */ (obj);

  if (typeof o.synthesis !== "string" || !o.synthesis.trim()) {
    throw new Error('"synthesis" must be a non-empty string');
  }

  if (!Array.isArray(o.routes) || o.routes.some((r) => typeof r !== "string")) {
    throw new Error('"routes" must be an array of strings');
  }

  const spawnsRaw = o.spawns ?? [];
  if (!Array.isArray(spawnsRaw)) throw new Error('"spawns" must be an array');
  const spawns = spawnsRaw.map((s, idx) => {
    if (!s || typeof s !== "object") throw new Error(`"spawns[${idx}]" must be an object`);
    const sp = /** @type {Record<string, unknown>} */ (s);
    for (const field of ["id", "name", "label", "persona"]) {
      if (typeof sp[field] !== "string" || !(/** @type {string} */ (sp[field]).trim())) {
        throw new Error(`"spawns[${idx}].${field}" must be a non-empty string`);
      }
    }
    return {
      id: normalizeId(/** @type {string} */ (sp.id)),
      name: String(sp.name).trim(),
      label: String(sp.label).trim(),
      persona: String(sp.persona).trim(),
      ...(typeof sp.skill === "string" && sp.skill.trim() ? { skill: sp.skill.trim() } : {}),
    };
  });

  const questionsRaw = o.questions ?? [];
  if (!Array.isArray(questionsRaw)) throw new Error('"questions" must be an array');
  const questions = questionsRaw.map((q, idx) => {
    if (!q || typeof q !== "object") throw new Error(`"questions[${idx}]" must be an object`);
    const qq = /** @type {Record<string, unknown>} */ (q);
    if (typeof qq.text !== "string" || !qq.text.trim()) {
      throw new Error(`"questions[${idx}].text" must be a non-empty string`);
    }
    const blocksRaw = qq.blocks ?? [];
    if (!Array.isArray(blocksRaw) || blocksRaw.some((b) => typeof b !== "string")) {
      throw new Error(`"questions[${idx}].blocks" must be an array of strings`);
    }
    return {
      id: typeof qq.id === "string" && qq.id.trim() ? normalizeId(qq.id) : `q${idx + 1}`,
      text: qq.text.trim(),
      blocks: blocksRaw.map(normalizeId).filter(Boolean),
    };
  });

  if (typeof o.phase !== "string" || !PHASES.includes(/** @type {any} */ (o.phase))) {
    throw new Error(`"phase" must be one of: ${PHASES.join(", ")}`);
  }

  const dod = o.definition_of_done;
  if (dod !== null && dod !== undefined && typeof dod !== "string") {
    throw new Error('"definition_of_done" must be a string or null');
  }

  if (typeof o.wait_for_human !== "boolean") {
    throw new Error('"wait_for_human" must be a boolean');
  }

  const spawnedIds = new Set(spawns.map((s) => s.id));
  const routes = o.routes.map(normalizeId).filter(Boolean);
  const known = new Set([...ctx.knownSpecialists, ...spawnedIds]);
  const unknown = routes.filter((r) => !known.has(r));
  if (unknown.length > 0) {
    throw new Error(
      `"routes" contains unknown specialists: ${unknown.join(", ")}. Known: ${[...known].join(", ")}`,
    );
  }

  return {
    synthesis: o.synthesis.trim(),
    routes: [...new Set(routes)],
    spawns,
    questions,
    phase: /** @type {RoutingDirective["phase"]} */ (o.phase),
    definition_of_done: typeof dod === "string" && dod.trim() ? dod.trim() : null,
    wait_for_human: o.wait_for_human,
  };
}

/**
 * Parse + validate raw orchestrator output.
 * @param {string} raw
 * @param {{ knownSpecialists: string[] }} ctx
 * @returns {{ ok: true; directive: RoutingDirective } | { ok: false; error: string }}
 */
export function parseRoutingDirective(raw, ctx) {
  try {
    const obj = extractJson(raw);
    return { ok: true, directive: validateDirective(obj, ctx) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
