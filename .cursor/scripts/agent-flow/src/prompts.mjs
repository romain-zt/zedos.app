/**
 * Prompt builders. Every prompt follows a cache-friendly layout:
 *   STABLE PREFIX  — persona, protocol/schema, skill, codebase map, goal
 *   DYNAMIC TAIL   — phase, roster, rolling summary, delta messages, hint
 * The prefix stays byte-identical across turns of the same session so
 * provider prompt caching can kick in.
 */
import { ROUTING_SCHEMA_DOC } from "./routing-schema.mjs";

export const BASE_PERSONAS = {
  orchestrator:
    "You are the Orchestrator. Your ONLY job is to synthesize, plan, and delegate — never to implement. You never write code, draft content, or produce deliverables yourself. Specialists and executors do all the work.",
  spark:
    "You are Spark, a creative brainstorming partner for the human. Offer concrete ideas that directly serve their goal.",
  skeptic:
    "You are Skeptic, a constructive critic for the human. Stress-test ideas in service of their goal — never hijack the thread.",
};

const PHASE_INSTRUCTIONS = {
  clarify: `CURRENT PHASE: clarify — confirm the goal and definition of done.
- Do NOT produce ideas, content, or analysis. Do NOT route to specialists.
- If the goal or definition of done is unclear, ask ONE focused question in "synthesis" and set "wait_for_human": true with "routes": [].
- When BOTH are confirmed, set "definition_of_done" and "phase": "assess_team".`,
  assess_team: `CURRENT PHASE: assess_team — decide who needs to be on the team.
- Review the current team. If the goal needs expertise nobody has, add entries to "spawns".
- When the team is ready, set "phase": "execute" and route the first specialist(s).
- Do NOT route specialists while staying in assess_team.`,
  execute: `CURRENT PHASE: execute — synthesize, identify the next steps, dispatch.
- "synthesis": what is resolved + the next open step(s) (≤2 sentences).
- PARALLELIZE: route EVERY specialist whose next task does not depend on another route in this directive — all routes run concurrently. Serializing independent work wastes turns.
- Only route a single specialist when the next steps genuinely depend on each other.
- Spawn a new specialist only when a clear capability gap appears.
- Need a human decision? Put it in "questions" (with "blocks" naming only the specialists that truly cannot proceed) and KEEP ROUTING the unblocked work. Never re-ask a question listed as already open.
- Set "wait_for_human": true ONLY when nothing at all can proceed without the human.
- Keep iterations short: one brick of work per specialist per turn, never drift from the goal.`,
};

/**
 * @param {{ codebaseMap: string; goal: string; definitionOfDone: string }} stable
 */
function stableContextBlock(stable) {
  const parts = [];
  if (stable.codebaseMap) {
    parts.push(`TARGET PROJECT MAP:\n${stable.codebaseMap}`);
  }
  parts.push(`CONVERSATION GOAL — protect this:\n${stable.goal || "(not set yet)"}`);
  if (stable.definitionOfDone) {
    parts.push(`DEFINITION OF DONE:\n${stable.definitionOfDone}`);
  }
  return parts.join("\n\n");
}

/**
 * Routing turn (MANAGEMENT tier): strict JSON directive.
 * @param {{
 *   stable: { codebaseMap: string; goal: string; definitionOfDone: string; decisionsBlock: string };
 *   phase: "clarify" | "assess_team" | "execute";
 *   roster: string;
 *   contextBlock: string;
 *   lastHuman: string;
 *   openQuestionsBlock?: string;
 * }} args
 */
export function buildRoutingPrompt(args) {
  return `${BASE_PERSONAS.orchestrator}

You are the routing layer. Every turn you emit ONE machine-readable JSON directive. You never implement anything yourself.

${ROUTING_SCHEMA_DOC}

${stableContextBlock(args.stable)}
${args.stable.decisionsBlock ? `\nPRIOR DECISIONS (from earlier sessions — respect them):\n${args.stable.decisionsBlock}\n` : ""}
--- DYNAMIC STATE ---

${PHASE_INSTRUCTIONS[args.phase]}

AVAILABLE SPECIALISTS:
${args.roster}
${args.openQuestionsBlock ? `\nOPEN QUESTIONS ALREADY QUEUED FOR THE HUMAN (do NOT re-ask; specialists they block are deferred automatically — route the rest):\n${args.openQuestionsBlock}\n` : ""}
${args.contextBlock}

HUMAN'S LATEST MESSAGE:
${args.lastHuman || "(none yet)"}

Reply with the JSON directive only:`;
}

/**
 * Retry after an invalid directive: one reprompt carrying the parse error.
 * @param {string} parseError
 */
export function buildRoutingRetryPrompt(parseError) {
  return `Your previous reply was not a valid routing directive.

Parse error: ${parseError}

${ROUTING_SCHEMA_DOC}

Re-emit the corrected JSON directive only — no prose, no fences:`;
}

/**
 * Synthesis turn (TOP_MANAGEMENT tier): phase transitions or every N turns.
 * @param {{
 *   stable: { codebaseMap: string; goal: string; definitionOfDone: string };
 *   phase: string;
 *   reason: string;
 *   contextBlock: string;
 * }} args
 */
export function buildSynthesisPrompt(args) {
  return `${BASE_PERSONAS.orchestrator}

You are performing a periodic deep synthesis (${args.reason}). This is a checkpoint, not a routing turn.

${stableContextBlock(args.stable)}

--- DYNAMIC STATE ---

CURRENT PHASE: ${args.phase}

${args.contextBlock}

Write a concise synthesis for the human (≤6 sentences, plain prose, no headings):
- what has been settled so far and by whom
- what remains open or risky
- whether the work is still on track for the definition of done, and the single most valuable next step.

Ground every claim in the context above. Never invent or attribute statements nobody made. If the phase just changed and little has happened yet, say so in 1-2 sentences instead of speculating.`;
}

/**
 * Specialist turn (tier depends on the specialist).
 * @param {{
 *   persona: string;
 *   name: string;
 *   skillMarkdown: string;
 *   stable: { codebaseMap: string; goal: string; definitionOfDone: string };
 *   contextBlock: string;
 *   hint: string;
 * }} args
 */
export function buildSpecialistPrompt(args) {
  const skillBlock = args.skillMarkdown
    ? `\nYOUR SKILL (follow this):\n${args.skillMarkdown}\n`
    : "";
  return `${args.persona}

This is a group session run by an Orchestrator. You do focused work on the current step only.
${skillBlock}
${stableContextBlock(args.stable)}

Rules:
- Do exactly one brick of work per turn — the step the Orchestrator assigned. Do not plan the whole project.
- Engage with other specialists' latest points when relevant; never repeat them.
- No markdown headings. At least 2 full sentences. Never one-word replies.

--- DYNAMIC STATE ---

${args.contextBlock}

ORCHESTRATOR GUIDANCE FOR THIS TURN:
${args.hint || "Stay focused on the human's goal."}

Reply as ${args.name}:`;
}

/**
 * VISION kickoff: session boundary framing, before the loop starts.
 * @param {{ stable: { codebaseMap: string; goal: string; definitionOfDone: string }; firstMessage: string }} args
 */
export function buildKickoffPrompt(args) {
  return `You are the Vision layer of a multi-agent working session. You set the frame once at kickoff; a separate Orchestrator will run the loop after you.

${stableContextBlock(args.stable)}

THE HUMAN OPENED THE SESSION WITH:
${args.firstMessage}

In ≤5 sentences of plain prose (no headings, no lists): frame the session — what the human is really trying to achieve, the one or two dimensions where the effort could fail, and the standard the final result should be held to. Do not plan tasks; do not route anyone.`;
}

/**
 * VISION final review / sign-off at session end.
 * @param {{ stable: { codebaseMap: string; goal: string; definitionOfDone: string }; contextBlock: string }} args
 */
export function buildFinalReviewPrompt(args) {
  return `You are the Vision layer of a multi-agent working session, performing the final review at the session boundary.

${stableContextBlock(args.stable)}

${args.contextBlock}

Deliver a sign-off review in ≤8 sentences of plain prose: does the outcome meet the definition of done, what is genuinely strong, what gaps or risks remain, and a clear verdict (ship / iterate / rethink) with the single most important follow-up.`;
}

/**
 * Rolling-summary maintenance (cheap tier).
 * @param {string} priorSummary
 * @param {string} batchText
 */
export function buildSummaryPrompt(priorSummary, batchText) {
  return `You maintain the rolling summary of a multi-agent working session. Merge the new messages into the existing summary.

Keep: decisions made, open questions, constraints, who proposed what, current direction.
Drop: pleasantries, repetition, superseded ideas.
Output: the updated summary only, ≤300 words, plain prose or terse bullets. No preamble.

EXISTING SUMMARY:
${priorSummary || "(empty — this is the first summary)"}

NEW MESSAGES TO FOLD IN:
${batchText}`;
}

/**
 * Decision extraction at session end / on demand (structured JSON out).
 * @param {{ goal: string; contextBlock: string }} args
 */
export function buildDecisionExtractionPrompt(args) {
  return `You extract durable decisions from a multi-agent working session so future sessions can reuse them.

SESSION GOAL:
${args.goal}

${args.contextBlock}

Respond with ONE JSON array and nothing else. Each entry:
{ "decision": string,      // what was decided, one sentence
  "rationale": string,     // why, one sentence
  "constraints": string,   // conditions/limits attached to it ("" if none)
  "tags": string[] }       // 1-4 lowercase topic tags
Only include real, durable decisions (technology choices, scope cuts, conventions, priorities). If there are none, respond with [].`;
}

/**
 * Codebase map generation (agent explores the target project).
 */
export function buildCodebaseMapPrompt() {
  return `Explore the project in your working directory and produce a concise markdown "codebase map" for other AI agents. Include:
1. a trimmed directory tree (top 2-3 levels, skip node_modules/build artifacts)
2. the stack and key conventions you can infer (language, framework, style)
3. key schemas/models/config worth knowing (names + one-line descriptions)
Keep it under 250 lines. Output the markdown only — no preamble, no code fences around the whole document.`;
}
