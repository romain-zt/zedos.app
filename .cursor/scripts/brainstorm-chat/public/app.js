/* ── Element refs ── */
const chatEl          = document.getElementById("chat");
const agentListEl     = document.getElementById("agent-list");
const streamPanelEl   = document.getElementById("stream-panel");
const streamNameEl    = document.getElementById("stream-name");
const streamPhaseEl   = document.getElementById("stream-phase");
const streamBodyEl    = document.getElementById("stream-body");
const streamPulseEl   = document.getElementById("stream-pulse");
const streamCloseBtn  = document.getElementById("stream-close");
const assetsAccordion = document.getElementById("assets-accordion");
const assetsListEl    = document.getElementById("assets-list");
const assetsCountEl   = document.getElementById("assets-count");
const statusEl        = document.getElementById("status");
const form            = document.getElementById("form");
const input           = document.getElementById("input");
const topicInput      = document.getElementById("topic");
const sendBtn         = document.getElementById("send");
const pauseBtn        = document.getElementById("pause");
const forceStopBtn    = document.getElementById("force-stop");
const goalBar         = document.getElementById("goal-bar");
const goalText        = document.getElementById("goal-text");
const hintEl          = document.getElementById("hint");

/* ── State ── */
/** @type {Record<string, { name: string; label: string; color: string }>} */
let participants = {};
/** @type {Record<string, string>} */
let agentBindings = {};
/** @type {Set<string>} */
const typing = new Set();
/**
 * Per-agent streaming state.
 * @type {Record<string, { phase: string; text: string; ts: number }>}
 */
const agentStreams = {};

let selectedAgent    = null;
let brainstormActive = false;
let agentsPaused     = false;
let waitingForHuman  = false;
let autoRetrying     = false;
let autoRetryInSec   = 0;
let activeAuthor     = null;
let activeElapsedMs  = 0;
let loopPhase        = "idle";
let heartbeatTimer   = null;
let reconnectTimer   = null;

const STREAMING_PHASES = new Set(["writing", "thinking"]);
const wsProto = location.protocol === "https:" ? "wss" : "ws";
let ws = null;

/* ── Utilities ── */
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function cursorAgentUrl(agentId) {
  if (!agentId) return null;
  return `https://cursor.com/agents/${encodeURIComponent(agentId)}`;
}

function phaseLabel(phase) {
  return { thinking: "Thinking", tool: "Using tool", writing: "Writing", status: "Starting", task: "Task", done: "Done", routing: "Routing", specialist: "Active", idle: "Idle" }[phase] || phase;
}

/* ── Agent card status text ── */
function agentStatusText(id) {
  if (activeAuthor === id) {
    const p = loopPhase !== "idle" ? phaseLabel(loopPhase) : "Working";
    return `${p}…`;
  }
  if (typing.has(id)) return "Starting…";
  const s = agentStreams[id];
  if (s?.text) {
    const snippet = s.text.replace(/[\n\r]+/g, " ").trim();
    return snippet.length > 56 ? snippet.slice(0, 56) + "…" : snippet;
  }
  return "Idle";
}

/* ── Render agent list ── */
function renderAgentList() {
  agentListEl.innerHTML = "";
  for (const [id, p] of Object.entries(participants)) {
    if (id === "human") continue;

    const isActive   = activeAuthor === id;
    const isSelected = selectedAgent === id;
    const agentId    = agentBindings[id];
    const url        = cursorAgentUrl(agentId);
    const status     = agentStatusText(id);
    const isLive     = isActive && STREAMING_PHASES.has(agentStreams[id]?.phase);

    const card = document.createElement("button");
    card.type = "button";
    card.className = "agent-card" + (isActive ? " active" : "") + (isSelected ? " selected" : "");
    card.dataset.id = id;
    card.setAttribute("aria-pressed", isSelected ? "true" : "false");
    card.setAttribute("aria-label", `${p.name} — ${status}`);

    card.innerHTML = `
      <span class="agent-dot" style="background:${p.color};${isActive ? "" : "opacity:.55"}"></span>
      <div class="agent-info">
        <span class="agent-name"${isActive ? ` style="color:${p.color}"` : ""}>${escapeHtml(p.name)}</span>
        <span class="agent-status${isLive ? " live" : ""}">${escapeHtml(status)}</span>
      </div>
      ${url ? `<a class="agent-ext-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(p.name)} in Cursor" title="Open in Cursor" onclick="event.stopPropagation()">↗</a>` : ""}`;

    card.addEventListener("click", () => selectAgent(isSelected ? null : id));
    agentListEl.appendChild(card);
  }
}

/* Update a single card's status without full re-render */
function refreshAgentCard(id) {
  const card = agentListEl.querySelector(`[data-id="${CSS.escape(id)}"]`);
  if (!card) { renderAgentList(); return; }

  const p        = participants[id];
  const isActive = activeAuthor === id;
  const isLive   = isActive && STREAMING_PHASES.has(agentStreams[id]?.phase);
  const status   = agentStatusText(id);

  card.className = "agent-card" + (isActive ? " active" : "") + (selectedAgent === id ? " selected" : "");

  const dot     = card.querySelector(".agent-dot");
  const nameEl  = card.querySelector(".agent-name");
  const statEl  = card.querySelector(".agent-status");

  if (dot)    { dot.style.background = p?.color || "#888"; dot.style.opacity = isActive ? "1" : "0.55"; }
  if (nameEl) { nameEl.style.color = isActive ? (p?.color || "") : ""; }
  if (statEl) { statEl.textContent = status; statEl.className = "agent-status" + (isLive ? " live" : ""); }
}

/* ── Select agent / stream panel ── */
function selectAgent(id) {
  selectedAgent = id;
  renderAgentList();
  renderStreamPanel();
}

function renderStreamPanel() {
  if (!selectedAgent) { streamPanelEl.hidden = true; return; }

  const p = participants[selectedAgent];
  if (!p) { streamPanelEl.hidden = true; return; }

  streamPanelEl.hidden = false;
  streamNameEl.textContent = p.name;
  streamNameEl.style.color = p.color;

  const s      = agentStreams[selectedAgent];
  const isLive = activeAuthor === selectedAgent && s && STREAMING_PHASES.has(s.phase);

  streamPulseEl.hidden = !isLive;
  streamPhaseEl.textContent = isLive
    ? phaseLabel(s.phase)
    : s?.text
      ? "Last session"
      : "No activity yet";

  if (s?.text) {
    streamBodyEl.innerHTML = `<div class="stream-text">${escapeHtml(s.text)}</div>`;
    if (isLive) streamBodyEl.scrollTop = streamBodyEl.scrollHeight;
  } else {
    streamBodyEl.innerHTML = `<p class="stream-empty">No activity recorded yet for this agent.</p>`;
  }
}

/* ── Append chat message ── */
function appendMessage({ id, author, text }) {
  const el  = document.createElement("article");
  const cls = author === "human" ? "human"
    : author === "system" ? "system"
    : author === "orchestrator" ? "orchestrator"
    : "agent";
  el.className = `msg ${cls}`;
  el.dataset.id = id;

  if (author === "system") {
    el.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
  } else {
    const p       = participants[author];
    const color   = p?.color || "#888";
    const mention = author === "human" ? "@me" : `@${p?.name || author}`;
    el.innerHTML  = `
      <span class="msg-mention" style="color:${color}">${escapeHtml(mention)}</span>
      <div class="msg-bubble">${escapeHtml(text)}</div>`;
  }

  chatEl.appendChild(el);
  chatEl.scrollTop = chatEl.scrollHeight;
}

/* ── Assets ── */
function renderAssets(assets) {
  if (!assets?.length) {
    assetsAccordion.hidden = true;
    return;
  }
  assetsAccordion.hidden = false;
  assetsCountEl.textContent = String(assets.length);
  assetsCountEl.hidden = false;
  assetsListEl.innerHTML = assets
    .map(a => `<li><span class="asset-tool">${escapeHtml(a.tool)}</span> <code>${escapeHtml(a.path)}</code></li>`)
    .join("");
}

/* ── Goal bar ── */
function showGoal(goal) {
  const text = (goal || "").trim();
  if (!text) { goalBar.hidden = true; return; }
  goalText.textContent = text;
  goalBar.hidden = false;
}

/* ── Status pill ── */
function updateStatus() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    statusEl.textContent = "Reconnecting…";
    statusEl.className   = "status";
    return;
  }
  if (autoRetrying) {
    statusEl.textContent = autoRetryInSec > 0 ? `Retry in ${autoRetryInSec}s` : "Retrying…";
    statusEl.className   = "status retrying";
    return;
  }
  if (waitingForHuman) {
    statusEl.textContent = "Your turn";
    statusEl.className   = "status live";
    return;
  }
  if (agentsPaused) {
    statusEl.textContent = "Paused";
    statusEl.className   = "status";
    return;
  }
  if (brainstormActive || activeAuthor) {
    const name = activeAuthor ? (participants[activeAuthor]?.name || activeAuthor) : "";
    statusEl.textContent = name ? `${name} working…` : "Agents working…";
    statusEl.className   = "status live";
    return;
  }
  statusEl.textContent = "Live";
  statusEl.className   = "status live";
}

/* ── Composer state ── */
function updateComposerState() {
  const ok = ws?.readyState === WebSocket.OPEN;
  sendBtn.disabled    = !ok;
  input.disabled      = !ok;
  topicInput.disabled = !ok;
  pauseBtn.textContent = agentsPaused ? "Resume" : "Pause";
  pauseBtn.disabled = !ok || (agentsPaused && waitingForHuman);
  forceStopBtn.disabled = !ok || (agentsPaused && !brainstormActive && !activeAuthor && !autoRetrying);
}

/* ── Heartbeat ticker ── */
function startHeartbeatTicker() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    if (activeAuthor && !autoRetrying) activeElapsedMs += 1000;
    updateStatus();
    if (activeAuthor) refreshAgentCard(activeAuthor);
  }, 1000);
}

/* ── Resume on reconnect ── */
function maybeResumeFlow(data) {
  if (!ws || ws.readyState !== WebSocket.OPEN || !data.messages?.length || data.waitingForHuman || data.brainstormActive) return;
  ws.send(JSON.stringify({ type: "resume_agents" }));
}

/* ── WebSocket message handler ── */
function handleServerMessage(data) {
  switch (data.type) {

    case "init":
      // Reset per-agent streams on session reload
      for (const k of Object.keys(agentStreams)) delete agentStreams[k];
      loopPhase        = "idle";
      participants     = data.participants;
      agentBindings    = data.agentBindings || {};
      brainstormActive = data.brainstormActive;
      agentsPaused     = data.agentsPaused;
      waitingForHuman  = data.waitingForHuman;
      autoRetrying     = data.autoRetrying || false;
      autoRetryInSec   = data.autoRetryInSec || 0;
      activeAuthor     = data.activeAuthor || null;
      activeElapsedMs  = data.activeElapsedMs || 0;
      topicInput.value = data.sessionTopic || "";
      showGoal(data.conversationGoal || "");
      renderAgentList();
      renderStreamPanel();
      renderAssets(data.assets || []);
      chatEl.innerHTML = "";
      for (const msg of data.messages) appendMessage(msg);
      updateStatus();
      updateComposerState();
      maybeResumeFlow(data);
      break;

    case "participants_update":
      participants = data.participants;
      if (data.agentBindings) agentBindings = data.agentBindings;
      renderAgentList();
      break;

    case "agent_bindings_update":
      agentBindings = data.agentBindings || {};
      renderAgentList();
      break;

    case "message":
      appendMessage(data);
      break;

    case "typing":
      if (data.active) typing.add(data.author);
      else             typing.delete(data.author);
      refreshAgentCard(data.author);
      updateStatus();
      updateComposerState();
      break;

    case "brainstorm_active":
      brainstormActive = data.active;
      agentsPaused     = data.paused;
      updateStatus();
      updateComposerState();
      break;

    case "waiting_for_human":
      waitingForHuman = data.active;
      updateStatus();
      updateComposerState();
      break;

    case "auto_retry":
      autoRetrying   = data.active;
      autoRetryInSec = data.inSec || 0;
      if (data.hint) {
        hintEl.textContent = data.hint;
        hintEl.classList.toggle("retrying", autoRetrying);
      }
      updateStatus();
      updateComposerState();
      break;

    case "goal_update":
      if (data.topic) topicInput.value = data.topic;
      showGoal(data.goal);
      break;

    case "assets_update":
      renderAssets(data.assets);
      break;

    case "activity_start":
      autoRetrying   = false;
      autoRetryInSec = 0;
      hintEl.classList.remove("retrying");
      activeAuthor    = data.author;
      activeElapsedMs = 0;
      // Clear previous stream for this agent
      agentStreams[data.author] = { phase: "status", text: "", ts: data.ts };
      refreshAgentCard(data.author);
      if (selectedAgent === data.author) renderStreamPanel();
      updateStatus();
      updateComposerState();
      break;

    case "activity": {
      const prev = agentStreams[data.author];
      if (STREAMING_PHASES.has(data.phase)) {
        // Progressive text — always update with full accumulated text
        agentStreams[data.author] = { phase: data.phase, text: data.detail || "", ts: data.ts };
      } else if (!prev || !STREAMING_PHASES.has(prev.phase)) {
        // Non-streaming event: update phase but keep existing text
        agentStreams[data.author] = { phase: data.phase, text: prev?.text || data.detail || "", ts: data.ts };
      }
      refreshAgentCard(data.author);
      if (selectedAgent === data.author) renderStreamPanel();
      updateStatus();
      break;
    }

    case "activity_end":
      if (activeAuthor === data.author) activeAuthor = null;
      if (agentStreams[data.author]) {
        agentStreams[data.author] = { ...agentStreams[data.author], phase: "done" };
      }
      refreshAgentCard(data.author);
      if (selectedAgent === data.author) renderStreamPanel();
      updateStatus();
      updateComposerState();
      break;

    case "loop_phase":
      loopPhase = data.phase;
      if (data.author) activeAuthor = data.author;
      updateStatus();
      if (activeAuthor) refreshAgentCard(activeAuthor);
      break;

    case "heartbeat":
      if (data.author === activeAuthor) {
        activeElapsedMs = data.elapsedMs;
      }
      break;

    case "system":
      appendMessage({ id: `sys-${Date.now()}`, author: "system", text: data.text });
      break;

    default:
      break;
  }
}

/* ── WebSocket connection ── */
function connectWebSocket() {
  if (ws?.readyState === WebSocket.OPEN) return;
  ws = new WebSocket(`${wsProto}://${location.host}`);

  ws.addEventListener("open", () => {
    if (reconnectTimer) { clearInterval(reconnectTimer); reconnectTimer = null; }
    ws.send(JSON.stringify({ type: "sync" }));
    updateStatus();
    updateComposerState();
    startHeartbeatTicker();
  });

  ws.addEventListener("close", () => {
    updateStatus();
    updateComposerState();
    if (!reconnectTimer) reconnectTimer = setInterval(connectWebSocket, 3000);
  });

  ws.addEventListener("message", (e) => {
    try { handleServerMessage(JSON.parse(e.data)); } catch { /* ignore */ }
  });
}

connectWebSocket();

/* ── Event listeners ── */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || ws?.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type: "human_message", text, topic: topicInput.value.trim() }));
  input.value = "";
  input.focus();
});

pauseBtn.addEventListener("click", () => {
  if (ws?.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type: agentsPaused ? "resume_agents" : "pause_agents" }));
});

forceStopBtn.addEventListener("click", () => {
  if (ws?.readyState !== WebSocket.OPEN || forceStopBtn.disabled) return;
  ws.send(JSON.stringify({ type: "force_stop" }));
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
});

streamCloseBtn.addEventListener("click", () => selectAgent(null));
