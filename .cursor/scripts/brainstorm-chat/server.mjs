import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { randomUUID, createHash } from "crypto";
import { config as loadEnv } from "dotenv";
import { WebSocketServer } from "ws";
import { Agent, CursorAgentError } from "@cursor/sdk";
import { createPersistence } from "./persistence.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "../../..");
const PUBLIC_DIR = join(__dirname, "public");
const DATA_DIR = join(__dirname, ".data");
const PORT = Number(process.env.CHAT_PORT || 3847);

loadEnv({ path: join(REPO_ROOT, ".env") });

const apiKey = process.env.CURSOR_API_KEY?.trim();
if (!apiKey) {
  console.error("Missing CURSOR_API_KEY in repo root .env");
  process.exit(1);
}

const store = createPersistence(DATA_DIR);

const BASE_PARTICIPANTS = {
  human: { name: "You", label: "Human", color: "#16a34a" },
  orchestrator: {
    name: "Orchestrator",
    label: "Agent · routes",
    color: "#d97706",
    persona:
      "You are the Orchestrator. Your ONLY job is to synthesize, plan, and delegate — never to implement. You must never write code, draft content, or produce deliverables yourself. Every turn: (1) write ≤2 sentences of synthesis or status for the human, (2) emit structured directives to route specialists. Specialists and executors do all the work.",
    builtin: true,
  },
  spark: {
    name: "Spark",
    label: "Agent · creative",
    color: "#7c3aed",
    persona:
      "You are Spark, a creative brainstorming partner for the human. Offer concrete ideas that directly serve their goal.",
    builtin: true,
  },
  skeptic: {
    name: "Skeptic",
    label: "Agent · critical",
    color: "#0891b2",
    persona:
      "You are Skeptic, a constructive critic for the human. Stress-test ideas in service of their goal — never hijack the thread.",
    builtin: true,
  },
};

/** @typedef {{ id: string; author: string; text: string; ts: number }} ChatMessage */
/** @typedef {{ name: string; label: string; color: string; persona?: string; skillPath?: string; builtin?: boolean }} ParticipantConfig */
/** @typedef {{ id: string; path: string; author: string; tool: string; ts: number }} SessionAsset */

/** @type {Record<string, ParticipantConfig>} */
let dynamicParticipants = store.loadDynamicParticipants();
/** @type {Record<string, import('@cursor/sdk').Agent>} */
const agentInstances = {};
/** @type {Record<string, string>} */
let agentBindings = store.loadAgentBindings();

/** @typedef {"clarify" | "assess_team" | "execute"} OrchestratorPhase */

/** @type {Record<string, OrchestratorPhase>} */
const ORCHESTRATOR_PHASES = {
  CLARIFY: "clarify",
  ASSESS_TEAM: "assess_team",
  EXECUTE: "execute",
};

const sessionState = store.loadState();
/** @type {ChatMessage[]} */
const messages = store.loadMessages();
/** @type {SessionAsset[]} */
let sessionAssets = store.loadAssets();

let sessionTopic = sessionState.sessionTopic;
let conversationGoal = sessionState.conversationGoal;
let definitionOfDone = sessionState.definitionOfDone || "";
let orchestratorPhase =
  sessionState.orchestratorPhase ||
  (messages.some((m) => m.author !== "human" && m.author !== "orchestrator")
    ? ORCHESTRATOR_PHASES.EXECUTE
    : ORCHESTRATOR_PHASES.CLARIFY);
let lastOrchestratorHint = sessionState.lastOrchestratorHint;
let agentsPaused = sessionState.agentsPaused;
let waitingForHuman = sessionState.waitingForHuman;
let turnsThisCycle = sessionState.turnsThisCycle;

const MAX_AGENT_TURNS_PER_CYCLE = 1024;
const MAX_AUTO_RETRIES = 5;
const AUTO_RETRY_DELAY_MS = 8000;
const STUCK_RUN_MS = 5000;
const BUILTIN_SPECIALISTS = ["spark", "skeptic"];

/**
 * PROJECT MODEL CAP: maximum model is claude-sonnet-4-6 (no Opus 4.8 / max mode).
 * Coerce any opus override (e.g. a stale CURSOR_MODEL_VISION_ID) back to Sonnet.
 * @param {string | undefined} raw
 * @param {string} fallback
 */
function cappedModelId(raw, fallback) {
  const id = raw?.trim() || fallback;
  if (/opus/i.test(id)) {
    console.warn(`⚠️  Model cap: "${id}" disallowed (no Opus / max mode). Using claude-sonnet-4-6.`);
    return "claude-sonnet-4-6";
  }
  return id;
}

/** @type {import('@cursor/sdk').ModelSelection} */
const MODEL_ORCHESTRATOR = {
  id: cappedModelId(process.env.CURSOR_MODEL_VISION_ID, "claude-sonnet-4-6"),
  params: [
    { id: "thinking", value: "true" },
    // { id: "context", value: "1m" },
    { id: "effort", value: "medium" },
  ],
};

/** @type {import('@cursor/sdk').ModelSelection} */
const MODEL_DYNAMIC_SPECIALIST = {
  id: cappedModelId(process.env.CURSOR_MODEL_MANAGER_ID, "claude-sonnet-4-6"),
  params: [
    { id: "thinking", value: "true" },
    { id: "context", value: "1m" },
    { id: "effort", value: "medium" },
  ],
};

/** Local SDK uses "default" for server-picked model (cloud "auto" is not valid locally). */
/** @type {import('@cursor/sdk').ModelSelection} */
const MODEL_DEFAULT = { id: "default" };

/** @param {string} author */
function modelForAuthor(author) {
  if (author === "orchestrator") return MODEL_ORCHESTRATOR;
  if (dynamicParticipants[author]) return MODEL_DYNAMIC_SPECIALIST;
  return MODEL_DEFAULT;
}

let loopRunning = false;
let forceStopRequested = false;
let autoRetryCount = 0;
let autoRetrying = false;
/** @type {string} */
let lastFailedAuthor = "orchestrator";
/** @type {ReturnType<typeof setTimeout> | null} */
let autoRetryTimer = null;
/** @type {ReturnType<typeof setInterval> | null} */
let autoRetryTickTimer = null;
/** @type {import('@cursor/sdk').Run | null} */
let activeRun = null;
/** @type {string | null} */
let activeAuthor = null;
/** @type {number} */
let activeRunStartedAt = 0;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function allParticipants() {
  return { ...BASE_PARTICIPANTS, ...dynamicParticipants };
}

function specialistAuthors() {
  return [...BUILTIN_SPECIALISTS, ...Object.keys(dynamicParticipants)];
}

function agentAuthors() {
  return ["orchestrator", ...specialistAuthors()];
}

function colorFromId(id) {
  const hash = createHash("sha256").update(id).digest("hex");
  const hue = parseInt(hash.slice(0, 6), 16) % 360;
  return `hsl(${hue} 55% 52%)`;
}

function persistSession() {
  store.saveState({
    sessionId: sessionState.sessionId,
    sessionTopic,
    conversationGoal,
    definitionOfDone,
    orchestratorPhase,
    lastOrchestratorHint,
    agentsPaused,
    waitingForHuman,
    turnsThisCycle,
  });
}

function serveStatic(req, res) {
  const path = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const file = join(PUBLIC_DIR, path);
  if (!file.startsWith(PUBLIC_DIR) || !existsSync(file)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": MIME[extname(file)] || "text/plain" });
  res.end(readFileSync(file));
}

/** @param {WebSocketServer} wss */
function broadcast(wss, payload) {
  const data = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(data);
  }
}

function humanMessages() {
  return messages.filter((m) => m.author === "human");
}

function lastHumanMessage() {
  return humanMessages().at(-1)?.text ?? "";
}

function updateConversationGoal({ topic, humanText }) {
  if (topic) sessionTopic = topic;
  if (topic) conversationGoal = topic;
  else if (humanText) conversationGoal = humanText;
  persistSession();
}

/** @param {WebSocketServer} wss */
function broadcastGoal(wss) {
  broadcast(wss, {
    type: "goal_update",
    goal: conversationGoal,
    topic: sessionTopic,
    definitionOfDone,
    orchestratorPhase,
  });
}

/** @param {WebSocketServer} wss */
function broadcastParticipants(wss) {
  broadcast(wss, {
    type: "participants_update",
    participants: allParticipants(),
    agentBindings: { ...agentBindings },
  });
}

/** @param {WebSocketServer} wss */
function broadcastAgentBindings(wss) {
  broadcast(wss, {
    type: "agent_bindings_update",
    agentBindings: { ...agentBindings },
  });
}

/** @param {WebSocketServer} wss */
function broadcastAssets(wss) {
  broadcast(wss, { type: "assets_update", assets: sessionAssets });
}

/** @param {WebSocketServer} wss */
function broadcastWaitState(wss) {
  broadcast(wss, { type: "waiting_for_human", active: waitingForHuman });
}

function resetSessionSignals() {
  waitingForHuman = false;
  lastOrchestratorHint = "";
  persistSession();
}

function cancelAutoRetry() {
  autoRetrying = false;
  if (autoRetryTimer) {
    clearTimeout(autoRetryTimer);
    autoRetryTimer = null;
  }
  if (autoRetryTickTimer) {
    clearInterval(autoRetryTickTimer);
    autoRetryTickTimer = null;
  }
}

/** @param {WebSocketServer} wss */
function broadcastAutoRetry(wss, active, inSec = 0, hint = "") {
  broadcast(wss, {
    type: "auto_retry",
    active,
    inSec,
    hint,
  });
}

/** @param {WebSocketServer} wss */
function resetAutoRetry(wss) {
  cancelAutoRetry();
  autoRetryCount = 0;
  broadcastAutoRetry(wss, false);
}

/**
 * @param {WebSocketServer} wss
 * @param {string} reason
 */
function scheduleAutoRetry(wss, reason) {
  if (waitingForHuman || forceStopRequested) return;
  if (autoRetryTimer) return;

  if (autoRetryCount >= MAX_AUTO_RETRIES) {
    agentsPaused = true;
    persistSession();
    cancelAutoRetry();
    broadcast(wss, {
      type: "system",
      text: `Agents paused after ${MAX_AUTO_RETRIES} auto-retries (${reason}). Send a message or Resume to continue.`,
    });
    broadcast(wss, {
      type: "brainstorm_active",
      active: false,
      paused: true,
    });
    return;
  }

  autoRetryCount += 1;
  autoRetrying = true;
  agentsPaused = true;
  persistSession();

  const delaySec = Math.ceil(AUTO_RETRY_DELAY_MS / 1000);
  const hint = `Auto-retry ${autoRetryCount}/${MAX_AUTO_RETRIES} in ${delaySec}s (${reason}).`;
  broadcast(wss, {
    type: "system",
    text: hint,
  });
  broadcastAutoRetry(wss, true, delaySec, hint);

  let remaining = delaySec;
  autoRetryTickTimer = setInterval(() => {
    remaining -= 1;
    if (remaining > 0) {
      broadcastAutoRetry(wss, true, remaining, hint);
    }
  }, 1000);

  autoRetryTimer = setTimeout(async () => {
    autoRetryTimer = null;
    if (autoRetryTickTimer) {
      clearInterval(autoRetryTickTimer);
      autoRetryTickTimer = null;
    }
    autoRetrying = false;
    broadcastAutoRetry(wss, false);
    forceStopRequested = false;
    agentsPaused = false;
    persistSession();

    const P = allParticipants();
    const failedName = P[lastFailedAuthor]?.name || lastFailedAuthor;
    try {
      await createFreshAgent(lastFailedAuthor, failedName);
      broadcast(wss, {
        type: "system",
        text: `Fresh ${failedName} agent created — resuming brainstorm…`,
      });
    } catch (err) {
      broadcast(wss, {
        type: "system",
        text: `Could not create fresh agent: ${err.message}`,
      });
    }

    broadcast(wss, {
      type: "system",
      text: `Auto-retry ${autoRetryCount}/${MAX_AUTO_RETRIES} — resuming brainstorm…`,
    });
    resumeBrainstorm(wss);
  }, AUTO_RETRY_DELAY_MS);
}

function formatHistory() {
  const P = allParticipants();
  return messages
    .map((m) => `${P[m.author]?.name || m.author}: ${m.text}`)
    .join("\n");
}

function lastMessageFrom(author) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].author === author) return messages[i];
  }
  return null;
}

function lastAgentMessage() {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (agentAuthors().includes(messages[i].author)) return messages[i];
  }
  return null;
}

function hasUnansweredHumanMessages() {
  const lastHuman = humanMessages().at(-1);
  if (!lastHuman) return false;
  const lastAgent = lastAgentMessage();
  return !lastAgent || lastHuman.ts > lastAgent.ts;
}

function shouldResumeFlowOnStartup() {
  return (
    !waitingForHuman &&
    !forceStopRequested &&
    humanMessages().length > 0
  );
}

function conversationGoalText() {
  const goal =
    conversationGoal || sessionTopic || lastHumanMessage() || "(not set yet)";
  const dod = definitionOfDone.trim();
  if (!dod) return goal;
  return `${goal}\n\nDefinition of done:\n${dod}`;
}

function orchestratorPhaseLabel(phase) {
  if (phase === ORCHESTRATOR_PHASES.CLARIFY) return "1 — Clarify goal & definition of done";
  if (phase === ORCHESTRATOR_PHASES.ASSESS_TEAM) return "2 — Assess team & skills";
  return "3 — Plan & execute (multi-agent debate)";
}

function buildOrchestratorPhaseInstructions() {
  if (orchestratorPhase === ORCHESTRATOR_PHASES.CLARIFY) {
    return `CURRENT PHASE: ${orchestratorPhaseLabel(ORCHESTRATOR_PHASES.CLARIFY)}

Your only job here: confirm the goal and definition of done. Do NOT produce any ideas, content, or analysis.
- Ask the human ONE focused question per turn if anything is unclear.
- Summarize what you understood so far in ≤1 sentence.

If goal or definition of done is still missing or ambiguous:
  [ROUTE: WAIT_FOR_HUMAN]
When BOTH are confirmed, capture and advance:
  [DEFINITION_OF_DONE: one-line summary]
  [PHASE: ASSESS_TEAM]

Do NOT route to Spark, Skeptic, or other specialists in this phase.`;
  }

  if (orchestratorPhase === ORCHESTRATOR_PHASES.ASSESS_TEAM) {
    return `CURRENT PHASE: ${orchestratorPhaseLabel(ORCHESTRATOR_PHASES.ASSESS_TEAM)}

Your only job here: decide who needs to be on the team. Do NOT produce ideas or content.
- Review current team (Spark, Skeptic, and any spawned specialists).
- If the goal requires expertise nobody has, spawn that specialist:
  [SPAWN: id|Display Name|short label|persona one-liner]
  or with a skill file:
  [SPAWN_SKILL: id|Display Name|short label|persona|skill markdown body]
- If existing team is sufficient, say so in ≤1 sentence and advance immediately.

When team is ready:
  [PHASE: EXECUTE]
  [ROUTE: <best-fit specialist or comma-separated list>]

Do NOT route to specialists before emitting [PHASE: EXECUTE].`;
  }

  return `CURRENT PHASE: ${orchestratorPhaseLabel(ORCHESTRATOR_PHASES.EXECUTE)}

Your ONLY job: synthesize what has been said, identify what is still missing, and dispatch specialists.
YOU MUST NOT implement, write code, draft content, or produce deliverables — that is the specialists' job.

Each turn, follow this exact structure:
1. ≤2 sentences: what has been resolved + what is the next open question or step.
2. Routing: dispatch the right specialist(s) for that step.

You may route to multiple specialists simultaneously using a comma-separated list:
  [ROUTE: SPARK, SKEPTIC] — both respond to the same step in parallel
  [ROUTE: SPARK] — single specialist
  [ROUTE: SKEPTIC] — single specialist
  [ROUTE: <id>] — a spawned specialist
  [ROUTE: WAIT_FOR_HUMAN] — a human decision is blocking progress

Spawn a new specialist only when a clear capability gap appears:
  [SPAWN: id|Display Name|short label|persona one-liner]

Keep iterations short. One step at a time. Never let the thread drift.`;
}

function listSpecialistsForPrompt() {
  const lines = [
    "- spark — creative ideas",
    "- skeptic — critical stress-test",
  ];
  for (const [id, p] of Object.entries(dynamicParticipants)) {
    lines.push(`- ${id} — ${p.label}`);
  }
  return lines.join("\n");
}

/**
 * @param {string} raw
 * @returns {{ text: string; routes: string[]; phase: OrchestratorPhase | null; definitionOfDone: string | null; spawns: Array<{ id: string; name: string; label: string; persona: string; skill?: string }> }}
 */
function parseOrchestratorReply(raw) {
  const lines = raw.trim().split("\n");
  /** @type {Array<{ id: string; name: string; label: string; persona: string; skill?: string }>} */
  const spawns = [];

  for (const line of lines) {
    const spawnMatch = line.trim().match(/^\[SPAWN:\s*([^|]+)\|([^|]+)\|([^|]+)\|(.+)\]\s*$/i);
    if (spawnMatch) {
      spawns.push({
        id: spawnMatch[1].trim().toLowerCase().replace(/\s+/g, "_"),
        name: spawnMatch[2].trim(),
        label: spawnMatch[3].trim(),
        persona: spawnMatch[4].trim(),
      });
      continue;
    }
    const spawnSkillMatch = line
      .trim()
      .match(/^\[SPAWN_SKILL:\s*([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|(.+)\]\s*$/i);
    if (spawnSkillMatch) {
      spawns.push({
        id: spawnSkillMatch[1].trim().toLowerCase().replace(/\s+/g, "_"),
        name: spawnSkillMatch[2].trim(),
        label: spawnSkillMatch[3].trim(),
        persona: spawnSkillMatch[4].trim(),
        skill: spawnSkillMatch[5].trim(),
      });
    }
  }

  // Parse [ROUTE: A] or [ROUTE: A, B] — supports parallel routing
  const routeLine = [...lines].reverse().find((l) => /^\[ROUTE:/i.test(l.trim()));
  const routeMatch = routeLine?.trim().match(/^\[ROUTE:\s*(.+?)\]\s*$/i);
  /** @type {string[]} */
  let routes = ["spark"];
  if (routeMatch) {
    routes = routeMatch[1]
      .split(",")
      .map((r) => {
        const key = r.trim().toUpperCase();
        if (key === "WAIT_FOR_HUMAN") return "wait";
        if (key === "SKEPTIC") return "skeptic";
        if (key === "SPARK") return "spark";
        return r.trim().toLowerCase().replace(/\s+/g, "_");
      })
      // If any target is "wait", collapse to a single wait
      .filter((r, i, arr) => !(r === "wait" && arr.indexOf("wait") !== i));
    if (routes.includes("wait")) routes = ["wait"];
  }

  const phaseLine = [...lines].reverse().find((l) => /^\[PHASE:/i.test(l.trim()));
  const phaseMatch = phaseLine?.trim().match(/^\[PHASE:\s*(.+?)\]\s*$/i);
  /** @type {OrchestratorPhase | null} */
  let phase = null;
  if (phaseMatch) {
    const key = phaseMatch[1].trim().toUpperCase();
    if (key === "CLARIFY") phase = ORCHESTRATOR_PHASES.CLARIFY;
    else if (key === "ASSESS_TEAM") phase = ORCHESTRATOR_PHASES.ASSESS_TEAM;
    else if (key === "EXECUTE") phase = ORCHESTRATOR_PHASES.EXECUTE;
  }

  const dodLine = [...lines]
    .reverse()
    .find((l) => /^\[DEFINITION_OF_DONE:/i.test(l.trim()));
  const dodMatch = dodLine?.trim().match(/^\[DEFINITION_OF_DONE:\s*(.+?)\]\s*$/i);
  const parsedDefinitionOfDone = dodMatch ? dodMatch[1].trim() : null;

  const text = lines
    .filter(
      (l) =>
        !/^\[(ROUTE|SPAWN|SPAWN_SKILL|PHASE|DEFINITION_OF_DONE):/i.test(l.trim()),
    )
    .join("\n")
    .trim();

  return { text, routes, phase, definitionOfDone: parsedDefinitionOfDone, spawns };
}

function isDegenerateReply(text) {
  return text.length > 0 && text.length < 24;
}

/** @param {WebSocketServer} wss */
function checkDegenerateLoop(wss) {
  const agentMsgs = messages
    .filter((m) => specialistAuthors().includes(m.author))
    .slice(-4);
  if (agentMsgs.length < 3) return false;
  const sample = agentMsgs[0].text.toLowerCase();
  if (!isDegenerateReply(agentMsgs[0].text)) return false;
  if (!agentMsgs.every((m) => m.text.toLowerCase() === sample)) return false;

  forceStopRequested = true;
  agentsPaused = true;
  persistSession();
  broadcast(wss, {
    type: "system",
    text: "Agents stopped — replies were repeating. Force stop or send a new message to steer.",
  });
  broadcast(wss, { type: "brainstorm_active", active: false, paused: true });
  return true;
}

function buildOrchestratorPrompt() {
  const goal = conversationGoalText();
  const history = formatHistory();
  const lastHuman = lastHumanMessage() || "(none yet)";
  const lastSpark = lastMessageFrom("spark")?.text;
  const lastSkeptic = lastMessageFrom("skeptic")?.text;

  return `${BASE_PARTICIPANTS.orchestrator.persona}

You are a pure routing layer. You synthesize inputs, define the next step, and dispatch specialists. You do not implement anything yourself.

CONVERSATION GOAL — protect this:
${goal}

HUMAN'S LATEST MESSAGE:
${lastHuman}

Available specialists:
${listSpecialistsForPrompt()}

Recent specialist output:
${lastSpark ? `- Spark: ${lastSpark}` : "- Spark: (has not spoken yet)"}
${lastSkeptic ? `- Skeptic: ${lastSkeptic}` : "- Skeptic: (has not spoken yet)"}
${Object.entries(dynamicParticipants)
  .map(([id, p]) => {
    const msg = lastMessageFrom(id)?.text;
    return msg ? `- ${p.name}: ${msg}` : `- ${p.name}: (has not spoken yet)`;
  })
  .join("\n")}

${buildOrchestratorPhaseInstructions()}

HARD RULES (never break these):
- You NEVER implement, write code, draft copy, or produce any deliverable. That is the specialists' job.
- Your output is always ≤2 sentences of synthesis + structured directives. Nothing more.
- Every turn must end with a [ROUTE:] line. No exceptions.

Route WAIT_FOR_HUMAN when a human decision blocks progress.
You may route multiple specialists simultaneously: [ROUTE: SPARK, SKEPTIC]
Avoid routing the same specialist twice in a row unless no one else has spoken.
Never let the thread drift from the goal or definition of done.

Full thread:
${history || "(just started)"}

Reply as Orchestrator:`;
}

function buildSpecialistPrompt(author) {
  const P = allParticipants();
  const who = P[author];
  const goal = conversationGoalText();
  const history = formatHistory();
  const latestHuman = lastHumanMessage() || "(waiting for the human to start)";

  const others = specialistAuthors().filter((a) => a !== author);
  const otherMsg = others
    .map((a) => lastMessageFrom(a))
    .filter(Boolean)
    .sort((a, b) => b.ts - a.ts)[0];

  let replyTo = `The human's latest message:\n"${latestHuman}"`;
  if (otherMsg && otherMsg.ts > (lastMessageFrom("human")?.ts ?? 0)) {
    const otherName = P[otherMsg.author]?.name || otherMsg.author;
    replyTo = `${otherName} just said:\n"${otherMsg.text}"\n\nEngage with that if relevant — then tie it back to the human's goal.`;
  }

  const hint = lastOrchestratorHint
    ? `ORCHESTRATOR GUIDANCE:\n${lastOrchestratorHint}\n`
    : "";

  const skillBlock = who.skillPath
    ? `YOUR SKILL (follow this):\n${store.readSkillFile(who.skillPath)}\n`
    : "";

  return `${who.persona}

This is a group brainstorm run by an Orchestrator. Read the whole thread.

CONVERSATION GOAL (never lose sight of this):
${goal}

${skillBlock}${hint}WHAT TO REPLY TO NOW:
${replyTo}

Rules:
- Follow the Orchestrator's guidance and stay on the human's goal.
- Read every message before you write.
- Respond to other specialists when relevant.
- No markdown headings. At least 2 full sentences. Never one-word replies.
- Do not repeat what someone just said.

Full thread:
${history || "(just started)"}

Reply as ${who.name}:`;
}

function baseAgentOptions(name, author) {
  return {
    apiKey,
    name,
    model: modelForAuthor(author),
    local: { cwd: REPO_ROOT, settingSources: [] },
  };
}

function isActiveRunError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return /already has active run|agent_busy/i.test(msg);
}

async function disposeAgent(author) {
  const agent = agentInstances[author];
  if (!agent) return;
  try {
    await agent[Symbol.asyncDispose]?.();
  } catch {
    /* ok */
  }
  delete agentInstances[author];
}

async function createFreshAgent(author, displayName) {
  await disposeAgent(author);
  const model = modelForAuthor(author);
  const agent = await Agent.create(baseAgentOptions(displayName, author));
  agentInstances[author] = agent;
  agentBindings[author] = agent.agentId;
  store.saveAgentBindings(agentBindings);
  broadcastAgentBindings(wss);
  console.log(`Created ${displayName} (${agent.agentId}, model=${model.id})`);
  return agent;
}

async function resumeOrCreateAgent(author, displayName) {
  const boundId = agentBindings[author];
  if (boundId) {
    try {
      const agent = await Agent.resume(boundId, baseAgentOptions(displayName, author));
      agentInstances[author] = agent;
      console.log(`Resumed ${displayName} (${boundId})`);
      return agent;
    } catch (err) {
      console.warn(`Could not resume ${author} (${boundId}): ${err.message}`);
    }
  }
  return createFreshAgent(author, displayName);
}

/**
 * @param {import('@cursor/sdk').Agent} agent
 * @param {string} prompt
 * @param {string} author
 */
async function sendToAgent(agent, prompt, author) {
  const sendOpts = { local: { force: true } };
  try {
    return await agent.send(prompt, sendOpts);
  } catch (err) {
    if (!isActiveRunError(err)) throw err;
    console.warn(`${author}: clearing stuck run and retrying…`);
    const P = allParticipants();
    const displayName = P[author]?.name || author;
    const fresh = await createFreshAgent(author, displayName);
    return fresh.send(prompt, sendOpts);
  }
}

async function initAgents() {
  await resumeOrCreateAgent("orchestrator", "Orchestrator");
  await resumeOrCreateAgent("spark", "Spark");
  await resumeOrCreateAgent("skeptic", "Skeptic");
  for (const [id, p] of Object.entries(dynamicParticipants)) {
    await resumeOrCreateAgent(id, p.name);
  }
  console.log("Agents ready");
}

/**
 * @param {{ id: string; name: string; label: string; persona: string; skill?: string }} spawn
 * @param {WebSocketServer} wss
 */
async function spawnSpecialist(spawn, wss) {
  if (BASE_PARTICIPANTS[spawn.id] || dynamicParticipants[spawn.id]) return;

  const skillMarkdown = spawn.skill
    ? `---\nname: brainstorm-${spawn.id}\ndescription: ${spawn.label}\n---\n\n${spawn.skill}`
    : `---\nname: brainstorm-${spawn.id}\ndescription: ${spawn.label}\n---\n\n# ${spawn.name}\n\n${spawn.persona}\n`;

  const skillPath = store.writeSkillFile(spawn.id, skillMarkdown);

  dynamicParticipants[spawn.id] = {
    name: spawn.name,
    label: spawn.label,
    color: colorFromId(spawn.id),
    persona: spawn.persona,
    skillPath,
  };
  store.saveDynamicParticipants(dynamicParticipants);

  await resumeOrCreateAgent(spawn.id, spawn.name);
  broadcastParticipants(wss);
  broadcast(wss, {
    type: "system",
    text: `Orchestrator added ${spawn.name} (${spawn.label}) to the brainstorm.`,
  });
}

function getAgentForAuthor(author) {
  return agentInstances[author] ?? null;
}

/**
 * @param {unknown} args
 * @returns {string | null}
 */
function extractAssetPath(args) {
  if (!args || typeof args !== "object") return null;
  const a = /** @type {Record<string, unknown>} */ (args);
  if (typeof a.path === "string") return a.path;
  if (typeof a.file_path === "string") return a.file_path;
  if (typeof a.target_file === "string") return a.target_file;
  return null;
}

function appendStreamChunk(prev, chunk) {
  if (!chunk) return prev;
  if (!prev) return chunk;
  if (chunk.startsWith(prev)) return chunk;
  if (prev.endsWith(chunk)) return prev;
  for (let overlap = Math.min(prev.length, chunk.length); overlap > 0; overlap--) {
    if (prev.endsWith(chunk.slice(0, overlap))) {
      return prev + chunk.slice(overlap);
    }
  }
  return prev + chunk;
}

/**
 * @param {import('@cursor/sdk').SDKMessage} event
 * @param {string} author
 * @param {WebSocketServer} wss
 * @param {{ writing: string; thinking: string }} streamState
 */
function handleStreamEvent(event, author, wss, streamState) {
  if (event.type === "thinking") {
    streamState.thinking = appendStreamChunk(
      streamState.thinking,
      event.text || "",
    );
    const snippet = streamState.thinking || "Thinking…";
    broadcast(wss, {
      type: "activity",
      author,
      phase: "thinking",
      detail: snippet,
      ts: Date.now(),
    });
    return;
  }

  if (event.type === "tool_call") {
    const label =
      event.status === "running"
        ? `Running ${event.name}…`
        : event.status === "completed"
          ? `Done ${event.name}`
          : `${event.name} failed`;
    broadcast(wss, {
      type: "activity",
      author,
      phase: "tool",
      detail: label,
      tool: event.name,
      ts: Date.now(),
    });

    const path = extractAssetPath(event.args) || extractAssetPath(event.result);
    if (path && ["Write", "write", "Edit", "edit"].includes(event.name)) {
      const asset = {
        id: randomUUID(),
        path,
        author,
        tool: event.name,
        ts: Date.now(),
      };
      sessionAssets = store.recordAsset(asset);
      broadcastAssets(wss);
    }
    return;
  }

  if (event.type === "status") {
    broadcast(wss, {
      type: "activity",
      author,
      phase: "status",
      detail: event.message || event.status,
      ts: Date.now(),
    });
    return;
  }

  if (event.type === "assistant") {
    const textBlocks = event.message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    if (textBlocks) {
      streamState.writing = appendStreamChunk(streamState.writing, textBlocks);
      broadcast(wss, {
        type: "activity",
        author,
        phase: "writing",
        detail: streamState.writing,
        ts: Date.now(),
      });
    }
    return;
  }

  if (event.type === "task") {
    broadcast(wss, {
      type: "activity",
      author,
      phase: "task",
      detail: event.text || event.status || "Working on subtask…",
      ts: Date.now(),
    });
  }
}

/**
 * @param {import('@cursor/sdk').Run} run
 * @param {string} author
 * @param {WebSocketServer} wss
 */
async function collectRunText(run, author, wss) {
  let streamedChars = 0;
  const streamState = { writing: "", thinking: "" };
  for await (const event of run.stream()) {
    if (forceStopRequested) break;
    handleStreamEvent(event, author, wss, streamState);
    if (event.type === "assistant") {
      for (const block of event.message.content) {
        if (block.type === "text") streamedChars += block.text.length;
      }
    }
  }

  if (forceStopRequested) {
    if (run.supports?.("cancel")) {
      try {
        await run.cancel();
      } catch {
        /* ok */
      }
    }
    return { text: "", result: { status: "cancelled" } };
  }

  const result = await run.wait();
  const text =
    typeof result.result === "string" ? result.result.trim() : "";
  broadcast(wss, {
    type: "activity",
    author,
    phase: "done",
    detail: text ? `${text.length} chars` : "Finished",
    ts: Date.now(),
  });
  return { text, result };
}

/** @param {WebSocketServer} wss */
function clearTyping(wss) {
  for (const author of agentAuthors()) {
    broadcast(wss, { type: "typing", author, active: false });
  }
}

/** @param {WebSocketServer} wss */
async function forceStopAgents(wss) {
  cancelAutoRetry();
  autoRetryCount = 0;
  broadcastAutoRetry(wss, false);
  forceStopRequested = true;
  agentsPaused = true;
  waitingForHuman = false;
  resetSessionSignals();
  persistSession();

  if (activeRun?.supports?.("cancel")) {
    try {
      await activeRun.cancel();
    } catch {
      /* ok */
    }
  }
  activeRun = null;

  if (activeAuthor) {
    broadcast(wss, {
      type: "activity_end",
      author: activeAuthor,
      reason: "stopped",
      ts: Date.now(),
    });
    activeAuthor = null;
  }

  clearTyping(wss);
  broadcastWaitState(wss);
  broadcast(wss, {
    type: "system",
    text: "Agents force-stopped. Send a message or Resume when you're ready.",
  });
  broadcast(wss, {
    type: "brainstorm_active",
    active: false,
    paused: true,
  });
}

/**
 * @param {string} text
 * @param {{ status: string; id?: string }} result
 * @param {number} elapsedMs
 */
function isFailedRun(text, result, elapsedMs) {
  if (result.status === "cancelled") return false;
  if (result.status === "error") return true;
  const trimmed = (text || "").trim();
  if (!trimmed) return true;
  if (trimmed.length < 12 && elapsedMs < STUCK_RUN_MS) return true;
  return false;
}

/**
 * @param {import('@cursor/sdk').Agent} agent
 * @param {string} prompt
 * @param {string} author
 * @param {WebSocketServer} wss
 */
async function executeAgentAttempt(agent, prompt, author, wss) {
  const run = await sendToAgent(agent, prompt, author);
  activeRun = run;
  const started = Date.now();
  const { text, result } = await collectRunText(run, author, wss);
  const elapsed = Date.now() - started;
  return { text, result, elapsed };
}

/**
 * @param {import('@cursor/sdk').Agent} agent
 * @param {string} prompt
 * @param {string} author
 * @param {WebSocketServer} wss
 */
async function runAgent(agent, prompt, author, wss) {
  if (forceStopRequested) return null;

  const P = allParticipants();
  const displayName = P[author]?.name || author;
  let currentAgent = agent;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (forceStopRequested) return null;

    activeAuthor = author;
    activeRunStartedAt = Date.now();

    broadcast(wss, { type: "typing", author, active: true });
    broadcast(wss, {
      type: "activity_start",
      author,
      label: displayName,
      ts: activeRunStartedAt,
    });
    broadcast(wss, {
      type: "loop_phase",
      phase: author === "orchestrator" ? "routing" : "specialist",
      author,
      ts: Date.now(),
    });

    try {
      const { text, result, elapsed } = await executeAgentAttempt(
        currentAgent,
        prompt,
        author,
        wss,
      );

      if (forceStopRequested || result.status === "cancelled") return null;

      if (!isFailedRun(text, result, elapsed)) {
        return text.trim();
      }

      lastFailedAuthor = author;
      const failReason =
        result.status === "error"
          ? `run ${result.id || "unknown"} errored`
          : `empty or stuck (${elapsed}ms, ${(text || "").length} chars)`;

      if (attempt < maxAttempts) {
        broadcast(wss, {
          type: "system",
          text: `${displayName} ${failReason} — starting fresh agent…`,
        });
        currentAgent = await createFreshAgent(author, displayName);
        continue;
      }

      broadcast(wss, {
        type: "system",
        text: `${displayName} still failing after fresh agent (${failReason}).`,
      });
      return null;
    } catch (err) {
      lastFailedAuthor = author;
      const msg =
        err instanceof CursorAgentError
          ? `${displayName} failed to start: ${err.message}`
          : `${displayName} error: ${err.message}`;

      if (attempt < maxAttempts) {
        broadcast(wss, {
          type: "system",
          text: `${msg} — starting fresh agent…`,
        });
        currentAgent = await createFreshAgent(author, displayName);
        continue;
      }

      broadcast(wss, { type: "system", text: msg });
      return null;
    } finally {
      activeRun = null;
      activeAuthor = null;
      broadcast(wss, { type: "typing", author, active: false });
      broadcast(wss, { type: "activity_end", author, ts: Date.now() });
    }
  }

  return null;
}

/**
 * @param {WebSocketServer} wss
 * @param {OrchestratorPhase | null} nextPhase
 */
function applyOrchestratorPhase(wss, nextPhase) {
  if (!nextPhase || nextPhase === orchestratorPhase) return;
  orchestratorPhase = nextPhase;
  persistSession();
  broadcastGoal(wss);
  broadcast(wss, {
    type: "system",
    text: `Orchestrator moved to phase ${orchestratorPhaseLabel(orchestratorPhase)}.`,
  });
}

/**
 * @param {string[]} routes
 * @returns {string[]}
 */
function enforceOrchestratorRoutes(routes) {
  if (orchestratorPhase === ORCHESTRATOR_PHASES.CLARIFY) return ["wait"];
  if (orchestratorPhase === ORCHESTRATOR_PHASES.ASSESS_TEAM) {
    return routes.includes("wait") ? ["wait"] : ["orchestrator"];
  }
  return routes;
}

/**
 * @param {WebSocketServer} wss
 * @returns {Promise<string[] | null>}
 */
async function runOrchestratorTurn(wss) {
  const agent = getAgentForAuthor("orchestrator");
  if (!agent) return null;

  const raw = await runAgent(
    agent,
    buildOrchestratorPrompt(),
    "orchestrator",
    wss,
  );
  if (!raw) return null;

  const { text, routes, phase, definitionOfDone: parsedDod, spawns } =
    parseOrchestratorReply(raw);

  if (parsedDod) {
    definitionOfDone = parsedDod;
    persistSession();
    broadcastGoal(wss);
  }

  lastOrchestratorHint = text || "Stay focused on the human's goal.";
  persistSession();

  for (const spawn of spawns) {
    await spawnSpecialist(spawn, wss);
  }

  applyOrchestratorPhase(wss, phase);

  if (text) {
    const message = {
      id: randomUUID(),
      author: "orchestrator",
      text,
      ts: Date.now(),
    };
    messages.push(message);
    store.appendMessage(message);
    broadcast(wss, { type: "message", ...message });
  }

  turnsThisCycle += 1;
  persistSession();
  return enforceOrchestratorRoutes(routes);
}

/**
 * @param {string} author
 * @param {WebSocketServer} wss
 */
async function runSpecialistTurn(author, wss) {
  const agent = getAgentForAuthor(author);
  if (!agent) {
    broadcast(wss, {
      type: "system",
      text: `Unknown specialist "${author}" — skipping.`,
    });
    return false;
  }

  const raw = await runAgent(agent, buildSpecialistPrompt(author), author, wss);
  if (!raw?.trim()) return false;

  const message = {
    id: randomUUID(),
    author,
    text: raw.trim(),
    ts: Date.now(),
  };
  messages.push(message);
  store.appendMessage(message);
  broadcast(wss, { type: "message", ...message });
  turnsThisCycle += 1;
  persistSession();

  if (checkDegenerateLoop(wss)) return false;
  return true;
}

/**
 * Run one or more specialists. When multiple are provided they execute in parallel.
 * Returns true if all succeeded, false if any failed.
 * @param {string[]} targets
 * @param {WebSocketServer} wss
 */
async function runSpecialistTargets(targets, wss) {
  const known = specialistAuthors();
  const resolved = targets.map((t) => (known.includes(t) ? t : "spark"));

  if (resolved.length === 1) {
    const ok = await runSpecialistTurn(resolved[0], wss);
    if (!ok) scheduleAutoRetry(wss, `${resolved[0]} specialist failed`);
    return ok;
  }

  // Parallel execution
  broadcast(wss, {
    type: "system",
    text: `Dispatching ${resolved.join(" + ")} in parallel…`,
  });
  const results = await Promise.all(resolved.map((r) => runSpecialistTurn(r, wss)));
  const failed = resolved.filter((_, i) => !results[i]);
  if (failed.length > 0) {
    scheduleAutoRetry(wss, `${failed.join(", ")} specialist(s) failed`);
    return false;
  }
  return true;
}

/** @param {WebSocketServer} wss */
async function brainstormLoop(wss) {
  if (loopRunning) return;
  loopRunning = true;
  broadcast(wss, { type: "brainstorm_active", active: true, paused: false });

  while (!agentsPaused && !forceStopRequested) {
    if (turnsThisCycle >= MAX_AGENT_TURNS_PER_CYCLE) {
      waitingForHuman = true;
      agentsPaused = true;
      persistSession();
      broadcastWaitState(wss);
      broadcast(wss, {
        type: "system",
        text: "Turn limit reached — your input is needed to continue.",
      });
      break;
    }

    const routes = await runOrchestratorTurn(wss);
    if (forceStopRequested || routes === null) {
      if (routes === null && !forceStopRequested) {
        scheduleAutoRetry(wss, "orchestrator turn failed");
      }
      break;
    }

    // Phase ASSESS_TEAM: orchestrator loops until team is ready
    if (routes.length === 1 && routes[0] === "orchestrator") {
      if (forceStopRequested || agentsPaused) break;
      continue;
    }

    if (routes.length === 1 && routes[0] === "wait") {
      waitingForHuman = true;
      agentsPaused = true;
      persistSession();
      broadcastWaitState(wss);
      const waitHint =
        orchestratorPhase === ORCHESTRATOR_PHASES.CLARIFY
          ? "Orchestrator needs goal clarity and a definition of done before continuing."
          : orchestratorPhase === ORCHESTRATOR_PHASES.ASSESS_TEAM
            ? "Orchestrator is assessing the team — reply if you want to steer specialist selection."
            : "Orchestrator needs your input before the brainstorm can continue.";
      broadcast(wss, { type: "system", text: waitHint });
      break;
    }

    if (!(await runSpecialistTargets(routes, wss))) break;

    if (forceStopRequested || agentsPaused) break;
  }

  loopRunning = false;
  if (!autoRetrying) {
    broadcast(wss, {
      type: "brainstorm_active",
      active: false,
      paused: agentsPaused,
    });
    broadcast(wss, { type: "loop_phase", phase: "idle", ts: Date.now() });
  }
}

/** @param {WebSocketServer} wss */
async function interruptLoop() {
  if (!loopRunning && !activeRun) return;
  forceStopRequested = true;
  if (activeRun?.supports?.("cancel")) {
    try {
      await activeRun.cancel();
    } catch {
      /* ok */
    }
  }
  for (let i = 0; i < 30 && loopRunning; i++) {
    await new Promise((r) => setTimeout(r, 100));
  }
  loopRunning = false;
  forceStopRequested = false;
  clearTyping(wss);
  broadcast(wss, { type: "brainstorm_active", active: false, paused: false });
}

/** @param {WebSocketServer} wss */
function resumeBrainstorm(wss) {
  if (waitingForHuman) return;
  cancelAutoRetry();
  forceStopRequested = false;
  agentsPaused = false;
  persistSession();
  if (loopRunning) return;
  brainstormLoop(wss)
    .then(() => {
      if (!forceStopRequested && !waitingForHuman && !agentsPaused) {
        resetAutoRetry(wss);
      }
    })
    .catch((err) => {
      console.error("brainstorm loop error:", err);
      loopRunning = false;
      broadcast(wss, {
        type: "system",
        text: `Brainstorm loop stopped: ${err.message}`,
      });
      scheduleAutoRetry(wss, "loop crash");
    });
}

/** @param {WebSocketServer} wss */
async function resetSession(wss) {
  cancelAutoRetry();
  autoRetryCount = 0;
  broadcastAutoRetry(wss, false);
  forceStopRequested = true;
  await interruptLoop(wss);
  forceStopRequested = false;
  loopRunning = false;

  if (activeRun?.supports?.("cancel")) {
    try {
      await activeRun.cancel();
    } catch {
      /* ok */
    }
  }
  activeRun = null;
  activeAuthor = null;
  activeRunStartedAt = 0;
  clearTyping(wss);

  for (const author of Object.keys(agentInstances)) {
    await disposeAgent(author);
  }

  messages.length = 0;
  dynamicParticipants = {};
  agentBindings = {};
  sessionAssets = [];
  sessionTopic = "";
  conversationGoal = "";
  definitionOfDone = "";
  orchestratorPhase = ORCHESTRATOR_PHASES.CLARIFY;
  lastOrchestratorHint = "";
  agentsPaused = false;
  waitingForHuman = false;
  turnsThisCycle = 0;

  sessionState.sessionId = randomUUID();
  store.clearSession(sessionState.sessionId);
  persistSession();

  await createFreshAgent("orchestrator", "Orchestrator");
  await createFreshAgent("spark", "Spark");
  await createFreshAgent("skeptic", "Skeptic");
  broadcastParticipants(wss);
  broadcastAssets(wss);
  broadcastGoal(wss);
  broadcastWaitState(wss);
  broadcast(wss, { type: "brainstorm_active", active: false, paused: false });
  broadcast(wss, buildInitPayload());
  broadcast(wss, {
    type: "system",
    text: "New brainstorm session — set a goal and send your first message.",
  });
}

function buildInitPayload() {
  return {
    type: "init",
    sessionId: sessionState.sessionId,
    participants: allParticipants(),
    agentBindings: { ...agentBindings },
    messages,
    assets: sessionAssets,
    brainstormActive: loopRunning,
    agentsPaused,
    waitingForHuman,
    sessionTopic,
    conversationGoal,
    definitionOfDone,
    orchestratorPhase,
    activeAuthor,
    activeElapsedMs: activeAuthor ? Date.now() - activeRunStartedAt : 0,
    autoRetrying,
    autoRetryInSec: autoRetrying ? Math.ceil(AUTO_RETRY_DELAY_MS / 1000) : 0,
  };
}

/** @param {import('ws').WebSocket} socket */
function sendInit(socket) {
  socket.send(JSON.stringify(buildInitPayload()));
}

const server = createServer(serveStatic);
const wss = new WebSocketServer({ server });

/** Heartbeat for stuck detection */
setInterval(() => {
  if (!activeAuthor || !activeRunStartedAt) return;
  const elapsed = Date.now() - activeRunStartedAt;
  broadcast(wss, {
    type: "heartbeat",
    author: activeAuthor,
    elapsedMs: elapsed,
    loopRunning,
    ts: Date.now(),
  });
}, 3000);

wss.on("connection", (socket) => {
  socket.on("message", async (raw) => {
    let data;
    try {
      data = JSON.parse(String(raw));
    } catch {
      return;
    }

    if (data.type === "fresh_start") {
      await resetSession(wss);
      return;
    }

    if (data.type === "sync") {
      sendInit(socket);
      return;
    }

    if (data.type === "human_message") {
      const text = String(data.text || "").trim();
      if (!text) return;

      const message = {
        id: randomUUID(),
        author: "human",
        text,
        ts: Date.now(),
      };
      messages.push(message);
      store.appendMessage(message);
      broadcast(wss, { type: "message", ...message });

      const topic =
        typeof data.topic === "string" ? data.topic.trim() : sessionTopic;
      updateConversationGoal({ topic: topic || undefined, humanText: text });
      broadcastGoal(wss);

      await interruptLoop(wss);
      resetSessionSignals();
      broadcastWaitState(wss);
      turnsThisCycle = 0;
      forceStopRequested = false;
      agentsPaused = false;
      resetAutoRetry(wss);
      persistSession();
      resumeBrainstorm(wss);
      return;
    }

    if (data.type === "force_stop") {
      forceStopAgents(wss);
      return;
    }

    if (data.type === "pause_agents") {
      cancelAutoRetry();
      autoRetryCount = 0;
      broadcastAutoRetry(wss, false);
      agentsPaused = true;
      persistSession();
      broadcast(wss, {
        type: "brainstorm_active",
        active: loopRunning,
        paused: true,
      });
      return;
    }

    if (data.type === "resume_agents") {
      resumeBrainstorm(wss);
    }
  });
});

async function shutdown() {
  console.log("\nShutting down…");
  agentsPaused = true;
  store.flushState({
    sessionId: sessionState.sessionId,
    sessionTopic,
    conversationGoal,
    definitionOfDone,
    orchestratorPhase,
    lastOrchestratorHint,
    agentsPaused,
    waitingForHuman,
    turnsThisCycle,
  });
  wss.close();
  server.close();
  for (const agent of Object.values(agentInstances)) {
    await agent[Symbol.asyncDispose]?.();
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("uncaughtException", (err) => {
  if (err?.code === "EPIPE") {
    console.error("SDK pipe closed (EPIPE) — skipping crash, loop may recover");
    return;
  }
  console.error(err);
  process.exit(1);
});

await initAgents();
server.listen(PORT, () => {
  console.log(`Brainstorm chat → http://localhost:${PORT}`);
  console.log(
    `Session ${sessionState.sessionId} · ${messages.length} messages persisted`,
  );
  if (Object.keys(dynamicParticipants).length) {
    console.log(
      `Dynamic specialists: ${Object.keys(dynamicParticipants).join(", ")}`,
    );
  }

  if (shouldResumeFlowOnStartup()) {
    console.log("Auto-resuming brainstorm…");
    agentsPaused = false;
    persistSession();
    resumeBrainstorm(wss);
  } else if (
    agentsPaused &&
    !waitingForHuman &&
    humanMessages().length > 0 &&
    autoRetryCount < MAX_AUTO_RETRIES &&
    hasUnansweredHumanMessages()
  ) {
    console.log("Scheduling auto-retry after prior agent failure…");
    scheduleAutoRetry(wss, "recovered paused session");
  }
});
