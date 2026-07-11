/**
 * Session runtimes and the orchestration loop.
 *
 * Model tiering:
 *   VISION          — kickoff framing + final review (session boundaries only)
 *   TOP_MANAGEMENT  — synthesis on phase transitions or every N turns
 *   MANAGEMENT      — per-turn routing (strict JSON), Skeptic
 *   EXECUTION       — Spark, dynamic specialists, summaries, codebase map
 * A failed run escalates one tier up and retries once.
 */
import { randomUUID, createHash } from "crypto";
import { Agent } from "@cursor/sdk";
import { parseRoutingDirective } from "./routing-schema.mjs";
import {
  BASE_PERSONAS,
  buildRoutingPrompt,
  buildRoutingRetryPrompt,
  buildSynthesisPrompt,
  buildSpecialistPrompt,
  buildKickoffPrompt,
  buildFinalReviewPrompt,
  buildSummaryPrompt,
} from "./prompts.mjs";

/** @typedef {import('./models.mjs').Tier} Tier */
/** @typedef {{ id: string; author: string; text: string; ts: number }} Msg */

const BUILTIN_PARTICIPANTS = {
  human: { name: "You", label: "Human", color: "#16a34a", tier: "EXECUTION" },
  vision: { name: "Vision", label: "Agent · framing & review", color: "#e11d48", persona: "", tier: "VISION" },
  orchestrator: { name: "Orchestrator", label: "Agent · routing", color: "#d97706", persona: BASE_PERSONAS.orchestrator, tier: "MANAGEMENT" },
  spark: { name: "Spark", label: "Agent · creative", color: "#7c3aed", persona: BASE_PERSONAS.spark, tier: "EXECUTION" },
  skeptic: { name: "Skeptic", label: "Agent · critical", color: "#0891b2", persona: BASE_PERSONAS.skeptic, tier: "MANAGEMENT" },
};

const PERSISTENT_AGENT_AUTHORS = ["orchestrator", "spark", "skeptic"];

function colorFromId(id) {
  const hash = createHash("sha256").update(id).digest("hex");
  const hue = parseInt(hash.slice(0, 6), 16) % 360;
  return `hsl(${hue} 55% 52%)`;
}

/** @param {unknown} args */
function extractAssetPath(args) {
  if (!args || typeof args !== "object") return null;
  const a = /** @type {Record<string, unknown>} */ (args);
  if (typeof a.path === "string") return a.path;
  if (typeof a.file_path === "string") return a.file_path;
  if (typeof a.target_file === "string") return a.target_file;
  return null;
}

/**
 * @param {{
 *   db: ReturnType<import('./db.mjs').createDb>;
 *   ladder: ReturnType<import('./models.mjs').createModelLadder>;
 *   engine: ReturnType<import('./context-engine.mjs').createContextEngine>;
 *   memory: ReturnType<import('./memory.mjs').createMemory>;
 *   apiKey: string;
 *   workspaceDir: string;
 *   synthesisEveryNTurns: number;
 *   maxTurnsPerCycle: number;
 * }} deps
 */
export function createOrchestrator(deps) {
  const { db, ladder, engine, memory, apiKey, workspaceDir } = deps;

  /** @type {Map<string, SessionRuntime>} */
  const runtimes = new Map();

  /**
   * One-shot agent run: ephemeral agent, no persisted transcript. Used for
   * synthesis, kickoff, review, summaries, decision extraction, codebase map.
   * @param {Tier} tier
   * @param {string} prompt
   * @param {string} label
   * @param {{ emit?: (payload: object) => void; author?: string }} [opts]
   */
  async function runOneShot(tier, prompt, label, opts = {}) {
    const agent = await Agent.create({
      apiKey,
      name: `agent-flow ${label}`,
      model: ladder.selectionFor(tier),
      local: { cwd: workspaceDir, settingSources: [] },
    });
    try {
      const run = await agent.send(prompt, { local: { force: true } });
      const text = await collectRun(run, opts.author ?? label, opts.emit, () => false);
      const result = await run.wait();
      if (result.status === "error") throw new Error(`one-shot ${label} run errored`);
      return text;
    } finally {
      await agent[Symbol.asyncDispose]?.().catch(() => {});
    }
  }

  /**
   * Stream a run, forwarding activity events, and return the final text.
   * @param {import('@cursor/sdk').Run} run
   * @param {string} author
   * @param {((payload: object) => void) | undefined} emit
   * @param {() => boolean} isStopped
   */
  async function collectRun(run, author, emit, isStopped) {
    const state = { writing: "", thinking: "" };
    for await (const event of run.stream()) {
      if (isStopped()) break;
      if (!emit) continue;
      forwardStreamEvent(event, author, emit, state);
    }
    if (isStopped()) {
      if (run.supports?.("cancel")) await run.cancel().catch(() => {});
      return "";
    }
    const result = await run.wait();
    const text = typeof result.result === "string" ? result.result.trim() : "";
    emit?.({ type: "activity", author, phase: "done", detail: text ? `${text.length} chars` : "Finished", ts: Date.now() });
    return text;
  }

  /** Merge partial stream chunks that may re-send overlapping text. */
  function appendChunk(prev, chunk) {
    if (!chunk) return prev;
    if (!prev) return chunk;
    if (chunk.startsWith(prev)) return chunk;
    if (prev.endsWith(chunk)) return prev;
    for (let overlap = Math.min(prev.length, chunk.length); overlap > 0; overlap--) {
      if (prev.endsWith(chunk.slice(0, overlap))) return prev + chunk.slice(overlap);
    }
    return prev + chunk;
  }

  /**
   * @param {import('@cursor/sdk').SDKMessage} event
   * @param {string} author
   * @param {(payload: object) => void} emit
   * @param {{ writing: string; thinking: string }} state
   */
  function forwardStreamEvent(event, author, emit, state) {
    if (event.type === "thinking") {
      state.thinking = appendChunk(state.thinking, event.text || "");
      emit({ type: "activity", author, phase: "thinking", detail: state.thinking || "Thinking…", ts: Date.now() });
    } else if (event.type === "tool_call") {
      const label =
        event.status === "running" ? `Running ${event.name}…`
          : event.status === "completed" ? `Done ${event.name}`
            : `${event.name} failed`;
      emit({ type: "activity", author, phase: "tool", detail: label, tool: event.name, args: event.args, ts: Date.now() });
    } else if (event.type === "status") {
      emit({ type: "activity", author, phase: "status", detail: event.message || event.status, ts: Date.now() });
    } else if (event.type === "assistant") {
      const text = event.message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      if (text) {
        state.writing = appendChunk(state.writing, text);
        emit({ type: "activity", author, phase: "writing", detail: state.writing, ts: Date.now() });
      }
    } else if (event.type === "task") {
      emit({ type: "activity", author, phase: "task", detail: event.text || event.status || "Working on subtask…", ts: Date.now() });
    }
  }

  /**
   * Attach (or create) the runtime for a session.
   * @param {string} sessionId
   * @param {(payload: object) => void} emit broadcast to this session's clients
   */
  async function attach(sessionId, emit) {
    let rt = runtimes.get(sessionId);
    if (rt) {
      rt.emit = emit;
      return rt;
    }
    const session = await db.getSession(sessionId);
    if (!session) throw new Error(`unknown session ${sessionId}`);
    rt = await createRuntime(session, emit);
    runtimes.set(sessionId, rt);
    return rt;
  }

  /** @typedef {Awaited<ReturnType<typeof createRuntime>>} SessionRuntime */

  /**
   * @param {NonNullable<Awaited<ReturnType<typeof db.getSession>>>} session
   * @param {(payload: object) => void} emit
   */
  async function createRuntime(session, emit) {
    const messages = await db.listMessages(session.id);
    const participantRows = await db.listParticipants(session.id);
    const bindingRows = await db.listBindings(session.id);

    /** @type {Record<string, { name: string; label: string; color: string; persona?: string; skill_name?: string | null; tier: string; builtin?: boolean }>} */
    const dynamicParticipants = {};
    for (const p of participantRows) {
      dynamicParticipants[p.author_id] = {
        name: p.name, label: p.label, color: p.color, persona: p.persona,
        skill_name: p.skill_name, tier: p.tier,
      };
    }

    /** @type {Map<string, { agent_id: string; last_seen_ts: number }>} */
    const bindings = new Map(bindingRows.map((b) => [b.author_id, { agent_id: b.agent_id, last_seen_ts: b.last_seen_ts }]));

    const rt = {
      session,
      messages,
      dynamicParticipants,
      bindings,
      /** @type {Record<string, import('@cursor/sdk').SDKAgent>} */
      agents: {},
      emit,
      loopRunning: false,
      forceStop: false,
      /** @type {Set<import('@cursor/sdk').Run>} */
      activeRuns: new Set(),
      /** Concurrent active authors: author id → run start ts. */
      /** @type {Map<string, number>} */
      activeAuthors: new Map(),
    };
    return rt;
  }

  // ── Participant helpers ─────────────────────────────────────────────────

  /** @param {SessionRuntime} rt */
  function allParticipants(rt) {
    return { ...BUILTIN_PARTICIPANTS, ...rt.dynamicParticipants };
  }

  /** @param {SessionRuntime} rt */
  function specialistIds(rt) {
    return ["spark", "skeptic", ...Object.keys(rt.dynamicParticipants)];
  }

  /** @param {SessionRuntime} rt @param {string} author @returns {Tier} */
  function tierFor(rt, author) {
    const p = allParticipants(rt)[author];
    return /** @type {Tier} */ (p?.tier || "EXECUTION");
  }

  /** @param {SessionRuntime} rt @param {string} author */
  function nameOf(rt, author) {
    return allParticipants(rt)[author]?.name || author;
  }

  // ── Agent lifecycle ─────────────────────────────────────────────────────

  /** @param {SessionRuntime} rt @param {string} author */
  function agentOptions(rt, author) {
    return {
      apiKey,
      name: `${nameOf(rt, author)} · ${rt.session.name}`,
      model: ladder.selectionFor(tierFor(rt, author)),
      local: { cwd: workspaceDir, settingSources: [] },
    };
  }

  /** @param {SessionRuntime} rt @param {string} author */
  async function freshAgent(rt, author) {
    await rt.agents[author]?.[Symbol.asyncDispose]?.().catch(() => {});
    const agent = await Agent.create(agentOptions(rt, author));
    rt.agents[author] = agent;
    const prev = rt.bindings.get(author);
    rt.bindings.set(author, { agent_id: agent.agentId, last_seen_ts: prev?.last_seen_ts ?? 0 });
    await db.bindAgent(rt.session.id, author, agent.agentId);
    rt.emit({ type: "agent_bindings_update", agentBindings: bindingsView(rt) });
    return agent;
  }

  /** @param {SessionRuntime} rt @param {string} author */
  async function getOrResumeAgent(rt, author) {
    if (rt.agents[author]) return rt.agents[author];
    const bound = rt.bindings.get(author);
    if (bound?.agent_id) {
      try {
        const agent = await Agent.resume(bound.agent_id, agentOptions(rt, author));
        rt.agents[author] = agent;
        return agent;
      } catch (err) {
        console.warn(`resume ${author} failed (${err.message}); creating fresh agent`);
      }
    }
    return freshAgent(rt, author);
  }

  /** @param {SessionRuntime} rt */
  function bindingsView(rt) {
    return Object.fromEntries([...rt.bindings].map(([a, b]) => [a, b.agent_id]));
  }

  // ── Context building ────────────────────────────────────────────────────

  /** @param {SessionRuntime} rt @param {string} author */
  function contextBlockFor(rt, author) {
    const lastSeen = rt.bindings.get(author)?.last_seen_ts ?? 0;
    const { delta, skipped } = engine.deltaFor(rt.messages, lastSeen);
    return {
      block: engine.renderContextBlock(
        { rollingSummary: rt.session.rolling_summary, delta, skipped },
        (a) => nameOf(rt, a),
      ),
      maxTs: delta.at(-1)?.ts ?? lastSeen,
    };
  }

  /** @param {SessionRuntime} rt */
  async function stablePrefix(rt) {
    return {
      codebaseMap: await memory.getCodebaseMap(),
      goal: rt.session.goal || rt.session.topic || "(not set yet)",
      definitionOfDone: rt.session.definition_of_done,
    };
  }

  /** Full-thread context block for boundary calls (review, decisions). */
  function boundaryContextBlock(rt) {
    const { delta, skipped } = engine.deltaFor(rt.messages, 0);
    return engine.renderContextBlock(
      { rollingSummary: rt.session.rolling_summary, delta, skipped },
      (a) => nameOf(rt, a),
    );
  }

  // ── Message + state persistence ─────────────────────────────────────────

  /** @param {SessionRuntime} rt @param {string} author @param {string} text */
  async function postMessage(rt, author, text) {
    /** @type {Msg} */
    const message = { id: randomUUID(), author, text, ts: Date.now() };
    rt.messages.push(message);
    await db.insertMessage({ ...message, session_id: rt.session.id });
    rt.emit({ type: "message", ...message });
    return message;
  }

  /** @param {SessionRuntime} rt @param {Partial<typeof rt.session>} patch */
  async function patchSession(rt, patch) {
    Object.assign(rt.session, patch);
    await db.updateSession(rt.session.id, patch);
  }

  /** @param {SessionRuntime} rt @param {string} author @param {number} ts */
  async function markSeen(rt, author, ts) {
    const b = rt.bindings.get(author);
    if (!b) return;
    b.last_seen_ts = ts;
    await db.setLastSeen(rt.session.id, author, ts);
  }

  /**
   * Atomic turn bump (DB-side increment) — safe under parallel specialists.
   * @param {SessionRuntime} rt
   */
  async function bumpTurns(rt) {
    const value = await db.incrementTurns(rt.session.id);
    rt.session.turns_this_cycle = Math.max(rt.session.turns_this_cycle, value);
  }

  // ── Human question queue ────────────────────────────────────────────────

  /** @param {SessionRuntime} rt */
  async function emitQueueUpdate(rt) {
    const questions = await db.listOpenQuestions(rt.session.id);
    rt.emit({ type: "queue_update", questions });
    return questions;
  }

  /**
   * Enqueue directive questions, skipping duplicates of still-open items.
   * @param {SessionRuntime} rt
   * @param {import('./routing-schema.mjs').RoutingDirective["questions"]} questions
   */
  async function enqueueQuestions(rt, questions) {
    if (questions.length === 0) return;
    const open = await db.listOpenQuestions(rt.session.id);
    const openTexts = new Set(open.map((q) => q.question.trim().toLowerCase()));
    let added = 0;
    for (const q of questions) {
      if (openTexts.has(q.text.trim().toLowerCase())) continue;
      await db.enqueueQuestion({ session_id: rt.session.id, question: q.text, blocks: q.blocks });
      added++;
    }
    if (added > 0) {
      await emitQueueUpdate(rt);
      rt.emit({ type: "system", text: `Orchestrator queued ${added} question${added === 1 ? "" : "s"} for you — work continues on unblocked tasks.` });
    }
  }

  // ── Agent turn execution with escalation ────────────────────────────────

  /**
   * Run one turn for a persistent agent. On a failed run (error or empty
   * result) the same prompt is retried once on the next tier up.
   * @param {SessionRuntime} rt
   * @param {string} author
   * @param {string} prompt
   * @returns {Promise<string | null>}
   */
  async function runTurn(rt, author, prompt) {
    if (rt.forceStop) return null;
    const agent = await getOrResumeAgent(rt, author);
    const baseTier = tierFor(rt, author);

    const startedAt = Date.now();
    rt.activeAuthors.set(author, startedAt);
    rt.emit({ type: "typing", author, active: true });
    rt.emit({ type: "activity_start", author, label: nameOf(rt, author), ts: startedAt });

    try {
      let text = await attemptRun(rt, agent, author, prompt, null);
      if (text || rt.forceStop) return text || null;

      const escalated = ladder.escalate(baseTier);
      if (escalated !== baseTier) {
        rt.emit({
          type: "system",
          text: `${nameOf(rt, author)} run failed on ${baseTier} (${ladder.ids[baseTier]}) — escalating to ${escalated} (${ladder.ids[escalated]}).`,
        });
        text = await attemptRun(rt, agent, author, prompt, ladder.selectionFor(escalated));
        if (text) return text;
      }
      return null;
    } finally {
      rt.activeAuthors.delete(author);
      rt.emit({ type: "typing", author, active: false });
      rt.emit({ type: "activity_end", author, ts: Date.now() });
    }
  }

  /**
   * @param {SessionRuntime} rt
   * @param {import('@cursor/sdk').SDKAgent} agent
   * @param {string} author
   * @param {string} prompt
   * @param {import('@cursor/sdk').ModelSelection | null} modelOverride
   */
  async function attemptRun(rt, agent, author, prompt, modelOverride) {
    /** @type {import('@cursor/sdk').Run} */
    let run;
    try {
      run = await agent.send(prompt, {
        local: { force: true },
        ...(modelOverride ? { model: modelOverride } : {}),
      });
    } catch (err) {
      if (/already has active run|agent_busy/i.test(String(err?.message))) {
        const fresh = await freshAgent(rt, author);
        run = await fresh.send(prompt, {
          local: { force: true },
          ...(modelOverride ? { model: modelOverride } : {}),
        });
      } else {
        rt.emit({ type: "system", text: `${nameOf(rt, author)} failed to start: ${err.message}` });
        return "";
      }
    }
    rt.activeRuns.add(run);
    const emitWithAssets = (payload) => {
      if (
        payload.type === "activity" &&
        payload.phase === "tool" &&
        ["Write", "write", "Edit", "edit"].includes(payload.tool)
      ) {
        const path = extractAssetPath(payload.args);
        if (path) {
          db.recordAsset({ session_id: rt.session.id, path, author, tool: payload.tool })
            .then(() => db.listAssets(rt.session.id))
            .then((assets) => rt.emit({ type: "assets_update", assets }))
            .catch(() => {});
        }
      }
      rt.emit(payload);
    };
    try {
      return await collectRun(run, author, emitWithAssets, () => rt.forceStop);
    } catch (err) {
      rt.emit({ type: "system", text: `${nameOf(rt, author)} run error: ${err.message}` });
      return "";
    } finally {
      rt.activeRuns.delete(run);
    }
  }

  // ── Spawning ────────────────────────────────────────────────────────────

  /**
   * @param {SessionRuntime} rt
   * @param {{ id: string; name: string; label: string; persona: string; skill?: string }} spawn
   */
  async function spawnSpecialist(rt, spawn) {
    if (BUILTIN_PARTICIPANTS[spawn.id] || rt.dynamicParticipants[spawn.id]) return;

    // Skills live in the cross-session library; reuse if one already exists.
    let skillName = null;
    const existing = await memory.getSkillMarkdown(spawn.id);
    if (existing) {
      skillName = spawn.id;
    } else if (spawn.skill) {
      await memory.saveSkill({ name: spawn.id, description: spawn.label, markdown: spawn.skill });
      skillName = spawn.id;
    }

    const participant = {
      name: spawn.name,
      label: spawn.label,
      color: colorFromId(spawn.id),
      persona: spawn.persona,
      skill_name: skillName,
      tier: "EXECUTION",
    };
    rt.dynamicParticipants[spawn.id] = participant;
    await db.upsertParticipant(rt.session.id, {
      author_id: spawn.id,
      name: spawn.name,
      label: spawn.label,
      color: participant.color,
      persona: spawn.persona,
      skill_name: skillName,
      tier: "EXECUTION",
    });
    await freshAgent(rt, spawn.id);
    rt.emit({ type: "participants_update", participants: allParticipants(rt), agentBindings: bindingsView(rt) });
    rt.emit({ type: "system", text: `Orchestrator added ${spawn.name} (${spawn.label}) to the session.` });
  }

  // ── Orchestrator turns ──────────────────────────────────────────────────

  /**
   * Routing turn on MANAGEMENT: strict JSON directive, one retry carrying
   * the parse error.
   * @param {SessionRuntime} rt
   * @returns {Promise<import('./routing-schema.mjs').RoutingDirective | null>}
   */
  async function runRoutingTurn(rt) {
    const stable = await stablePrefix(rt);
    const decisionsBlock = await memory.decisionsBlock();
    const { block, maxTs } = contextBlockFor(rt, "orchestrator");
    const lastHuman = [...rt.messages].reverse().find((m) => m.author === "human")?.text ?? "";

    const roster = specialistIds(rt)
      .map((id) => `- ${id} — ${allParticipants(rt)[id].label}`)
      .join("\n");

    const openQuestions = await db.listOpenQuestions(rt.session.id);
    const openQuestionsBlock = openQuestions
      .map((q) => `- "${q.question}" (blocks: ${q.blocks.length > 0 ? q.blocks.join(", ") : "nothing"})`)
      .join("\n");

    const prompt = buildRoutingPrompt({
      stable: { ...stable, decisionsBlock },
      phase: /** @type {any} */ (rt.session.phase),
      roster,
      contextBlock: block,
      lastHuman,
      openQuestionsBlock,
    });

    rt.emit({ type: "loop_phase", phase: "routing", author: "orchestrator", ts: Date.now() });
    let raw = await runTurn(rt, "orchestrator", prompt);
    if (!raw) return null;

    let parsed = parseRoutingDirective(raw, { knownSpecialists: specialistIds(rt) });
    if (!parsed.ok) {
      rt.emit({ type: "system", text: `Routing directive invalid (${parsed.error}) — reprompting once.` });
      raw = await runTurn(rt, "orchestrator", buildRoutingRetryPrompt(parsed.error));
      if (!raw) return null;
      parsed = parseRoutingDirective(raw, { knownSpecialists: specialistIds(rt) });
      if (!parsed.ok) {
        rt.emit({ type: "system", text: `Routing directive still invalid (${parsed.error}) — pausing. Send a message to steer.` });
        return null;
      }
    }

    const message = await postMessage(rt, "orchestrator", parsed.directive.synthesis);
    await markSeen(rt, "orchestrator", Math.max(maxTs, message.ts));
    return parsed.directive;
  }

  /**
   * Deep synthesis on TOP_MANAGEMENT (one-shot; does not touch the routing
   * agent's transcript). Posted to the thread as the orchestrator.
   * @param {SessionRuntime} rt
   * @param {string} reason
   */
  async function runSynthesisTurn(rt, reason) {
    const stable = await stablePrefix(rt);
    rt.emit({ type: "loop_phase", phase: "synthesis", author: "orchestrator", ts: Date.now() });
    rt.emit({ type: "activity_start", author: "orchestrator", label: "Orchestrator (synthesis)", ts: Date.now() });
    try {
      const text = await runOneShot(
        "TOP_MANAGEMENT",
        buildSynthesisPrompt({
          stable,
          phase: rt.session.phase,
          reason,
          contextBlock: boundaryContextBlock(rt),
        }),
        "synthesis",
        { emit: rt.emit, author: "orchestrator" },
      );
      if (text) {
        await postMessage(rt, "orchestrator", `[synthesis] ${text}`);
        await patchSession(rt, { turns_since_synthesis: 0 });
      }
    } catch (err) {
      rt.emit({ type: "system", text: `Synthesis failed (${err.message}) — continuing without it.` });
    } finally {
      rt.emit({ type: "activity_end", author: "orchestrator", ts: Date.now() });
    }
  }

  /**
   * VISION kickoff framing — runs once, on the session's first human message.
   * @param {SessionRuntime} rt
   * @param {string} firstMessage
   */
  async function runKickoff(rt, firstMessage) {
    const stable = await stablePrefix(rt);
    rt.emit({ type: "activity_start", author: "vision", label: "Vision", ts: Date.now() });
    try {
      const text = await runOneShot(
        "VISION",
        buildKickoffPrompt({ stable, firstMessage }),
        "kickoff",
        { emit: rt.emit, author: "vision" },
      );
      if (text) await postMessage(rt, "vision", text);
    } catch (err) {
      rt.emit({ type: "system", text: `Vision kickoff failed (${err.message}) — continuing without it.` });
    } finally {
      rt.emit({ type: "activity_end", author: "vision", ts: Date.now() });
    }
  }

  /**
   * VISION final review — session boundary, on demand.
   * @param {SessionRuntime} rt
   */
  async function runFinalReview(rt) {
    const stable = await stablePrefix(rt);
    rt.emit({ type: "activity_start", author: "vision", label: "Vision (final review)", ts: Date.now() });
    try {
      const text = await runOneShot(
        "VISION",
        buildFinalReviewPrompt({ stable, contextBlock: boundaryContextBlock(rt) }),
        "final-review",
        { emit: rt.emit, author: "vision" },
      );
      if (text) await postMessage(rt, "vision", `[final review] ${text}`);
      return text;
    } finally {
      rt.emit({ type: "activity_end", author: "vision", ts: Date.now() });
    }
  }

  // ── Specialist turns ────────────────────────────────────────────────────

  /** @param {SessionRuntime} rt @param {string} author */
  async function runSpecialistTurn(rt, author) {
    const p = allParticipants(rt)[author];
    if (!p) {
      rt.emit({ type: "system", text: `Unknown specialist "${author}" — skipping.` });
      return false;
    }
    const stable = await stablePrefix(rt);
    const skillMarkdown = await memory.getSkillMarkdown(p.skill_name ?? "");
    const { block, maxTs } = contextBlockFor(rt, author);
    const prompt = buildSpecialistPrompt({
      persona: p.persona || `You are ${p.name}, ${p.label}.`,
      name: p.name,
      skillMarkdown,
      stable,
      contextBlock: block,
      hint: rt.session.last_hint,
    });
    rt.emit({ type: "loop_phase", phase: "specialist", author, ts: Date.now() });
    const text = await runTurn(rt, author, prompt);
    if (!text?.trim()) return false;
    const message = await postMessage(rt, author, text.trim());
    await markSeen(rt, author, Math.max(maxTs, message.ts));
    await bumpTurns(rt);
    return true;
  }

  // ── Rolling summary maintenance ─────────────────────────────────────────

  /** @param {SessionRuntime} rt */
  async function maintainRollingSummary(rt) {
    const updated = await engine.updateRollingSummary(
      rt.session,
      rt.messages,
      (prior, batch) => runOneShot("EXECUTION", buildSummaryPrompt(prior, batch), "rolling-summary"),
      (a) => nameOf(rt, a),
    );
    if (updated) {
      await patchSession(rt, {
        rolling_summary: updated.rollingSummary,
        summarized_until: updated.summarizedUntil,
      });
    }
  }

  // ── The loop ────────────────────────────────────────────────────────────

  /** @param {SessionRuntime} rt */
  async function loop(rt) {
    if (rt.loopRunning) return;
    rt.loopRunning = true;
    rt.forceStop = false;
    rt.emit({ type: "brainstorm_active", active: true, paused: false });

    try {
      while (!rt.forceStop) {
        if (rt.session.turns_this_cycle >= deps.maxTurnsPerCycle) {
          await patchSession(rt, { waiting_for_human: true });
          rt.emit({ type: "waiting_for_human", active: true });
          rt.emit({ type: "system", text: "Turn limit reached — your input is needed to continue." });
          break;
        }

        const phaseBefore = rt.session.phase;
        const directive = await runRoutingTurn(rt);
        if (!directive) {
          if (!rt.forceStop) {
            rt.emit({ type: "system", text: "Orchestrator turn failed — paused. Send a message to continue." });
          }
          break;
        }

        for (const spawn of directive.spawns) {
          await spawnSpecialist(rt, spawn);
        }

        await enqueueQuestions(rt, directive.questions);

        await bumpTurns(rt);
        const patch = {
          turns_since_synthesis: rt.session.turns_since_synthesis + 1,
          last_hint: directive.synthesis,
        };
        if (directive.definition_of_done) patch.definition_of_done = directive.definition_of_done;
        if (directive.phase !== rt.session.phase) patch.phase = directive.phase;
        await patchSession(rt, patch);

        if (directive.phase !== phaseBefore) {
          rt.emit({ type: "system", text: `Orchestrator moved to phase "${directive.phase}".` });
          rt.emit({ type: "goal_update", goal: rt.session.goal, topic: rt.session.topic, definitionOfDone: rt.session.definition_of_done, orchestratorPhase: rt.session.phase });
          await runSynthesisTurn(rt, `phase transition to ${directive.phase}`);
        } else if (rt.session.turns_since_synthesis >= deps.synthesisEveryNTurns) {
          await runSynthesisTurn(rt, `periodic checkpoint (every ${deps.synthesisEveryNTurns} turns)`);
        }

        if (rt.forceStop) break;

        // Routes blocked by open human questions are deferred, not dropped —
        // the orchestrator re-routes them once the answer arrives.
        const openQuestions = await db.listOpenQuestions(rt.session.id);
        const blockedIds = new Set(openQuestions.flatMap((q) => q.blocks));
        const routes = directive.routes.filter((r) => !blockedIds.has(r));
        const deferred = directive.routes.filter((r) => blockedIds.has(r));
        if (deferred.length > 0) {
          rt.emit({ type: "system", text: `Deferred ${deferred.join(", ")} — blocked by open question${openQuestions.length === 1 ? "" : "s"}.` });
        }

        if (directive.wait_for_human || (routes.length === 0 && directive.spawns.length === 0)) {
          await patchSession(rt, { waiting_for_human: true });
          rt.emit({ type: "waiting_for_human", active: true });
          const pending = openQuestions.length > 0
            ? ` Open questions:\n${openQuestions.map((q) => `• ${q.question}`).join("\n")}`
            : "";
          rt.emit({ type: "system", text: `Orchestrator needs your input before continuing.${pending}` });
          break;
        }

        if (routes.length > 0) {
          if (routes.length > 1) {
            rt.emit({ type: "system", text: `Dispatching ${routes.join(" + ")} in parallel…` });
          }
          const results = await Promise.all(routes.map((r) => runSpecialistTurn(rt, r)));
          if (results.some((ok) => !ok) && !rt.forceStop) {
            rt.emit({ type: "system", text: "A specialist turn failed — paused. Send a message or resume to continue." });
            break;
          }
        }

        await maintainRollingSummary(rt);
        if (rt.forceStop) break;
      }
    } finally {
      rt.loopRunning = false;
      rt.emit({ type: "brainstorm_active", active: false, paused: rt.forceStop });
      rt.emit({ type: "loop_phase", phase: "idle", ts: Date.now() });
    }
  }

  // ── Public control surface ──────────────────────────────────────────────

  /**
   * Human sent a message: interrupt anything running, record, restart loop.
   * @param {SessionRuntime} rt
   * @param {string} text
   * @param {string} [topic]
   */
  async function onHumanMessage(rt, text, topic) {
    const isFirst = !rt.messages.some((m) => m.author === "human");
    await stop(rt);

    await postMessage(rt, "human", text);
    const patch = {
      waiting_for_human: false,
      turns_this_cycle: 0,
    };
    if (topic?.trim()) {
      patch.topic = topic.trim();
      patch.goal = topic.trim();
    } else if (!rt.session.goal) {
      patch.goal = text;
    }
    await patchSession(rt, patch);
    rt.emit({ type: "waiting_for_human", active: false });
    rt.emit({ type: "goal_update", goal: rt.session.goal, topic: rt.session.topic, definitionOfDone: rt.session.definition_of_done, orchestratorPhase: rt.session.phase });

    rt.forceStop = false;
    if (isFirst) {
      // VISION boundary: kickoff framing once per session, outside the loop.
      await runKickoff(rt, text);
    }
    loop(rt).catch((err) => {
      console.error("loop error:", err);
      rt.emit({ type: "system", text: `Loop stopped: ${err.message}` });
    });
  }

  /** @param {SessionRuntime} rt */
  async function stop(rt) {
    rt.forceStop = true;
    for (const run of rt.activeRuns) {
      if (run.supports?.("cancel")) await run.cancel().catch(() => {});
    }
    for (let i = 0; i < 50 && rt.loopRunning; i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    rt.forceStop = false;
  }

  /** @param {SessionRuntime} rt */
  async function forceStop(rt) {
    await stop(rt);
    rt.emit({ type: "brainstorm_active", active: false, paused: true });
    rt.emit({ type: "system", text: "Agents stopped. Send a message or resume when ready." });
  }

  /** @param {SessionRuntime} rt */
  async function resume(rt) {
    if (rt.loopRunning) return;
    rt.forceStop = false;
    // Like a human message, resume opens a fresh cycle — otherwise a loop
    // paused at the turn limit would immediately hit the limit again.
    await patchSession(rt, { turns_this_cycle: 0, waiting_for_human: false });
    rt.emit({ type: "waiting_for_human", active: false });
    loop(rt).catch((err) => {
      console.error("loop error:", err);
      rt.emit({ type: "system", text: `Loop stopped: ${err.message}` });
    });
  }

  /**
   * Human answered a queued question: record it, drop it into the thread as
   * a tagged human message, and restart the loop so blocked work re-routes.
   * @param {SessionRuntime} rt
   * @param {string} questionId
   * @param {string} text
   */
  async function onAnswerQuestion(rt, questionId, text) {
    const answered = await db.answerQuestion(questionId, text);
    if (!answered) {
      rt.emit({ type: "system", text: "That question was not found or is already answered." });
      return;
    }
    await postMessage(rt, "human", `[answer to Q: ${answered.question}] ${text}`);
    await patchSession(rt, { waiting_for_human: false, turns_this_cycle: 0 });
    rt.emit({ type: "waiting_for_human", active: false });
    await emitQueueUpdate(rt);
    if (!rt.loopRunning) {
      rt.forceStop = false;
      loop(rt).catch((err) => {
        console.error("loop error:", err);
        rt.emit({ type: "system", text: `Loop stopped: ${err.message}` });
      });
    }
  }

  /**
   * Session end / on-demand: extract decisions into the cross-session log.
   * @param {SessionRuntime} rt
   */
  async function extractSessionDecisions(rt) {
    const count = await memory.extractDecisions({
      sessionId: rt.session.id,
      goal: rt.session.goal || rt.session.topic,
      contextBlock: boundaryContextBlock(rt),
    });
    rt.emit({ type: "system", text: `Decision log updated — ${count} entr${count === 1 ? "y" : "ies"} stored.` });
    return count;
  }

  /** @param {SessionRuntime} rt */
  async function detach(rt) {
    await stop(rt);
    for (const agent of Object.values(rt.agents)) {
      await agent[Symbol.asyncDispose]?.().catch(() => {});
    }
    runtimes.delete(rt.session.id);
  }

  /** Snapshot for the UI init payload. */
  async function snapshot(rt) {
    const now = Date.now();
    return {
      sessionId: rt.session.id,
      sessionName: rt.session.name,
      participants: allParticipants(rt),
      agentBindings: bindingsView(rt),
      messages: rt.messages,
      brainstormActive: rt.loopRunning,
      agentsPaused: !rt.loopRunning,
      waitingForHuman: rt.session.waiting_for_human,
      sessionTopic: rt.session.topic,
      conversationGoal: rt.session.goal,
      definitionOfDone: rt.session.definition_of_done,
      orchestratorPhase: rt.session.phase,
      activeAuthors: Object.fromEntries(
        [...rt.activeAuthors].map(([author, since]) => [author, now - since]),
      ),
      openQuestions: await db.listOpenQuestions(rt.session.id),
    };
  }

  return {
    attach,
    detach,
    runtimes,
    runOneShot,
    onHumanMessage,
    onAnswerQuestion,
    forceStop,
    resume,
    runFinalReview,
    extractSessionDecisions,
    snapshot,
    PERSISTENT_AGENT_AUTHORS,
  };
}
