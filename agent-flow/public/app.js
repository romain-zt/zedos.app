/* ── Element refs ── */
const tokenGate       = document.getElementById("token-gate");
const tokenForm       = document.getElementById("token-form");
const tokenInput      = document.getElementById("token-input");
const tokenError      = document.getElementById("token-error");
const sessionGate     = document.getElementById("session-gate");
const sessionListEl   = document.getElementById("session-list");
const sessionCreate   = document.getElementById("session-create-form");
const sessionNameEl   = document.getElementById("session-name");
const logoutBtn       = document.getElementById("logout");
const appEl           = document.getElementById("app");
const sessionTitleEl  = document.getElementById("session-title");
const backBtn         = document.getElementById("back-to-sessions");
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
const questionsPanel  = document.getElementById("questions-panel");
const questionsListEl = document.getElementById("questions-list");
const questionsCount  = document.getElementById("questions-count");
const form            = document.getElementById("form");
const input           = document.getElementById("input");
const topicInput      = document.getElementById("topic");
const sendBtn         = document.getElementById("send");
const pauseBtn        = document.getElementById("pause");
const forceStopBtn    = document.getElementById("force-stop");
const reviewBtn       = document.getElementById("review-btn");
const goalBar         = document.getElementById("goal-bar");
const goalText        = document.getElementById("goal-text");
const phasePill       = document.getElementById("phase-pill");
const hintEl          = document.getElementById("hint");

/* ── State ── */
let token = localStorage.getItem("agentflow_token") || "";
let currentSessionId = localStorage.getItem("agentflow_session") || "";
let participants = {};
let agentBindings = {};
const typing = new Set();
const agentStreams = {};

let selectedAgent    = null;
let brainstormActive = false;
let agentsPaused     = false;
let waitingForHuman  = false;
/** Concurrent active authors: author id → elapsed ms. */
const activeAuthors  = new Map();
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

function authHeaders() {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function cursorAgentUrl(agentId) {
  if (!agentId) return null;
  return `https://cursor.com/agents/${encodeURIComponent(agentId)}`;
}

function phaseLabel(phase) {
  return {
    thinking: "Thinking", tool: "Using tool", writing: "Writing", status: "Starting",
    task: "Task", done: "Done", routing: "Routing", synthesis: "Synthesizing",
    specialist: "Active", idle: "Idle",
  }[phase] || phase;
}

/* ── View switching ── */
function showView(view) {
  tokenGate.hidden = view !== "token";
  sessionGate.hidden = view !== "sessions";
  appEl.hidden = view !== "app";
}

/* ── Token gate ── */
async function verifyToken() {
  try {
    const res = await fetch("/api/sessions", { headers: authHeaders() });
    return res.ok;
  } catch {
    return false;
  }
}

tokenForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  token = tokenInput.value.trim();
  if (!token) return;
  if (await verifyToken()) {
    localStorage.setItem("agentflow_token", token);
    tokenError.hidden = true;
    enterSessionPicker();
  } else {
    tokenError.hidden = false;
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("agentflow_token");
  token = "";
  showView("token");
});

/* ── Session picker ── */
async function enterSessionPicker() {
  showView("sessions");
  const res = await fetch("/api/sessions", { headers: authHeaders() });
  if (!res.ok) { showView("token"); return; }
  const { sessions } = await res.json();
  renderSessionList(sessions);
}

function renderSessionList(sessions) {
  const active = sessions.filter((s) => s.status === "active");
  const archived = sessions.filter((s) => s.status !== "active");
  sessionListEl.innerHTML = "";
  if (active.length === 0 && archived.length === 0) {
    sessionListEl.innerHTML = `<li class="session-empty">No sessions yet — create one above.</li>`;
  }
  for (const s of [...active, ...archived]) {
    const li = document.createElement("li");
    li.className = "session-item" + (s.status !== "active" ? " archived" : "");
    const date = new Date(s.updated_at).toLocaleString();
    li.innerHTML = `
      <button type="button" class="session-open">
        <span class="session-name">${escapeHtml(s.name)}</span>
        <span class="session-meta">${s.message_count} messages · ${escapeHtml(date)}${s.status !== "active" ? " · archived" : ""}</span>
      </button>
      ${s.status === "active" ? `<button type="button" class="session-archive" title="Archive (extracts decisions)">⏹</button>` : ""}`;
    li.querySelector(".session-open").addEventListener("click", () => openSession(s.id, s.name));
    li.querySelector(".session-archive")?.addEventListener("click", async () => {
      li.style.opacity = "0.5";
      await fetch(`/api/sessions/${s.id}/archive`, { method: "POST", headers: authHeaders() });
      enterSessionPicker();
    });
    sessionListEl.appendChild(li);
  }
}

sessionCreate.addEventListener("submit", async (e) => {
  e.preventDefault();
  const res = await fetch("/api/sessions", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name: sessionNameEl.value.trim() }),
  });
  if (!res.ok) return;
  const { session } = await res.json();
  sessionNameEl.value = "";
  openSession(session.id, session.name);
});

backBtn.addEventListener("click", () => {
  currentSessionId = "";
  localStorage.removeItem("agentflow_session");
  ws?.close();
  enterSessionPicker();
});

function openSession(id, name) {
  currentSessionId = id;
  localStorage.setItem("agentflow_session", id);
  sessionTitleEl.textContent = name || "Agent Flow";
  showView("app");
  connectWebSocket();
}

/* ── Agent cards ── */
function agentStatusText(id) {
  if (activeAuthors.has(id)) {
    const s = agentStreams[id];
    const p = s && STREAMING_PHASES.has(s.phase) ? phaseLabel(s.phase) : "Working";
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

function renderAgentList() {
  agentListEl.innerHTML = "";
  for (const [id, p] of Object.entries(participants)) {
    if (id === "human") continue;

    const isActive   = activeAuthors.has(id);
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

function refreshAgentCard(id) {
  const card = agentListEl.querySelector(`[data-id="${CSS.escape(id)}"]`);
  if (!card) { renderAgentList(); return; }

  const p        = participants[id];
  const isActive = activeAuthors.has(id);
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

/* ── Stream panel ── */
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
  const isLive = activeAuthors.has(selectedAgent) && s && STREAMING_PHASES.has(s.phase);

  streamPulseEl.hidden = !isLive;
  streamPhaseEl.textContent = isLive
    ? phaseLabel(s.phase)
    : s?.text
      ? "Last activity"
      : "No activity yet";

  if (s?.text) {
    streamBodyEl.innerHTML = `<div class="stream-text">${escapeHtml(s.text)}</div>`;
    if (isLive) streamBodyEl.scrollTop = streamBodyEl.scrollHeight;
  } else {
    streamBodyEl.innerHTML = `<p class="stream-empty">No activity recorded yet for this agent.</p>`;
  }
}

/* ── Chat ── */
function appendMessage({ id, author, text }) {
  const el  = document.createElement("article");
  const cls = author === "human" ? "human"
    : author === "system" ? "system"
    : author === "orchestrator" ? "orchestrator"
    : author === "vision" ? "vision"
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

/* ── Question queue ── */
function renderQuestions(questions) {
  const open = questions || [];
  if (open.length === 0) {
    questionsPanel.hidden = true;
    return;
  }
  questionsPanel.hidden = false;
  questionsCount.textContent = String(open.length);
  questionsListEl.innerHTML = "";
  for (const q of open) {
    const li = document.createElement("li");
    li.className = "question-item";
    li.innerHTML = `
      <p class="question-text">${escapeHtml(q.question)}</p>
      ${q.blocks?.length ? `<p class="question-blocks">Blocks: ${escapeHtml(q.blocks.join(", "))}</p>` : ""}
      <form class="question-answer">
        <input type="text" placeholder="Your answer…" aria-label="Answer" required />
        <button type="submit">Answer</button>
      </form>`;
    li.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const inputEl = li.querySelector("input");
      const text = inputEl.value.trim();
      if (!text || ws?.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ type: "answer_question", questionId: q.id, text }));
      li.querySelector("button").disabled = true;
      inputEl.disabled = true;
    });
    questionsListEl.appendChild(li);
  }
}

/* ── Goal + phase ── */
function showGoal(goal) {
  const text = (goal || "").trim();
  if (!text) { goalBar.hidden = true; return; }
  goalText.textContent = text;
  goalBar.hidden = false;
}

function showPhase(phase) {
  if (!phase) { phasePill.hidden = true; return; }
  phasePill.textContent = { clarify: "1 · Clarify", assess_team: "2 · Team", execute: "3 · Execute" }[phase] || phase;
  phasePill.hidden = false;
}

/* ── Status pill ── */
function updateStatus() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    statusEl.textContent = "Reconnecting…";
    statusEl.className   = "status";
    return;
  }
  if (waitingForHuman) {
    statusEl.textContent = "Your turn";
    statusEl.className   = "status live";
    return;
  }
  if (agentsPaused && !brainstormActive) {
    statusEl.textContent = "Paused";
    statusEl.className   = "status";
    return;
  }
  if (brainstormActive || activeAuthors.size > 0) {
    const names = [...activeAuthors.keys()].map((a) => participants[a]?.name || a);
    statusEl.textContent = names.length ? `${names.join(" + ")} working…` : "Agents working…";
    statusEl.className   = "status live";
    return;
  }
  statusEl.textContent = "Live";
  statusEl.className   = "status live";
}

function updateComposerState() {
  const ok = ws?.readyState === WebSocket.OPEN;
  sendBtn.disabled    = !ok;
  input.disabled      = !ok;
  topicInput.disabled = !ok;
  pauseBtn.textContent = (agentsPaused && !brainstormActive) ? "Resume" : "Pause";
  pauseBtn.disabled = !ok;
  forceStopBtn.disabled = !ok || (!brainstormActive && activeAuthors.size === 0);
  reviewBtn.disabled = !ok || brainstormActive;
}

/* ── Heartbeat ticker ── */
function startHeartbeatTicker() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    for (const [author, elapsed] of activeAuthors) {
      activeAuthors.set(author, elapsed + 1000);
      refreshAgentCard(author);
    }
    updateStatus();
  }, 1000);
}

/* ── WS message handler ── */
function handleServerMessage(data) {
  switch (data.type) {

    case "init":
      for (const k of Object.keys(agentStreams)) delete agentStreams[k];
      loopPhase        = "idle";
      participants     = data.participants;
      agentBindings    = data.agentBindings || {};
      brainstormActive = data.brainstormActive;
      agentsPaused     = data.agentsPaused;
      waitingForHuman  = data.waitingForHuman;
      activeAuthors.clear();
      for (const [author, elapsed] of Object.entries(data.activeAuthors || {})) {
        activeAuthors.set(author, elapsed || 0);
      }
      topicInput.value = data.sessionTopic || "";
      sessionTitleEl.textContent = data.sessionName || "Agent Flow";
      showGoal(data.conversationGoal || "");
      showPhase(data.orchestratorPhase);
      renderAgentList();
      renderStreamPanel();
      renderAssets(data.assets || []);
      renderQuestions(data.openQuestions || []);
      chatEl.innerHTML = "";
      for (const msg of data.messages) appendMessage(msg);
      updateStatus();
      updateComposerState();
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
      agentsPaused     = data.paused || !data.active;
      updateStatus();
      updateComposerState();
      break;

    case "waiting_for_human":
      waitingForHuman = data.active;
      updateStatus();
      updateComposerState();
      break;

    case "goal_update":
      if (data.topic) topicInput.value = data.topic;
      showGoal(data.goal);
      showPhase(data.orchestratorPhase);
      break;

    case "assets_update":
      renderAssets(data.assets);
      break;

    case "queue_update":
      renderQuestions(data.questions || []);
      break;

    case "activity_start":
      activeAuthors.set(data.author, 0);
      agentStreams[data.author] = { phase: "status", text: "", ts: data.ts };
      refreshAgentCard(data.author);
      if (selectedAgent === data.author) renderStreamPanel();
      updateStatus();
      updateComposerState();
      break;

    case "activity": {
      const prev = agentStreams[data.author];
      if (STREAMING_PHASES.has(data.phase)) {
        agentStreams[data.author] = { phase: data.phase, text: data.detail || "", ts: data.ts };
      } else if (!prev || !STREAMING_PHASES.has(prev.phase)) {
        agentStreams[data.author] = { phase: data.phase, text: prev?.text || data.detail || "", ts: data.ts };
      }
      refreshAgentCard(data.author);
      if (selectedAgent === data.author) renderStreamPanel();
      updateStatus();
      break;
    }

    case "activity_end":
      activeAuthors.delete(data.author);
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
      updateStatus();
      if (data.author) refreshAgentCard(data.author);
      break;

    case "heartbeat":
      if (activeAuthors.has(data.author)) {
        activeAuthors.set(data.author, data.elapsedMs);
      }
      break;

    case "system":
      appendMessage({ id: `sys-${Date.now()}`, author: "system", text: data.text });
      break;

    case "error":
      appendMessage({ id: `err-${Date.now()}`, author: "system", text: data.text });
      break;

    default:
      break;
  }
}

/* ── WebSocket ── */
function connectWebSocket() {
  if (!token || !currentSessionId) return;
  if (ws?.readyState === WebSocket.OPEN) { ws.close(); }
  ws = new WebSocket(`${wsProto}://${location.host}/?token=${encodeURIComponent(token)}`);

  ws.addEventListener("open", () => {
    if (reconnectTimer) { clearInterval(reconnectTimer); reconnectTimer = null; }
    ws.send(JSON.stringify({ type: "join_session", sessionId: currentSessionId }));
    updateStatus();
    updateComposerState();
    startHeartbeatTicker();
  });

  ws.addEventListener("close", () => {
    updateStatus();
    updateComposerState();
    if (!appEl.hidden && !reconnectTimer) reconnectTimer = setInterval(connectWebSocket, 3000);
  });

  ws.addEventListener("message", (e) => {
    try { handleServerMessage(JSON.parse(e.data)); } catch { /* ignore */ }
  });
}

/* ── Composer events ── */
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
  const resuming = agentsPaused && !brainstormActive;
  ws.send(JSON.stringify({ type: resuming ? "resume_agents" : "pause_agents" }));
});

forceStopBtn.addEventListener("click", () => {
  if (ws?.readyState !== WebSocket.OPEN || forceStopBtn.disabled) return;
  ws.send(JSON.stringify({ type: "force_stop" }));
});

reviewBtn.addEventListener("click", () => {
  if (ws?.readyState !== WebSocket.OPEN || reviewBtn.disabled) return;
  ws.send(JSON.stringify({ type: "final_review" }));
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
});

streamCloseBtn.addEventListener("click", () => selectAgent(null));

/* ── Boot ── */
(async function boot() {
  if (!token) { showView("token"); return; }
  if (!(await verifyToken())) { showView("token"); return; }
  if (currentSessionId) {
    // Re-open the last session directly; falls back to picker if it's gone.
    const res = await fetch("/api/sessions", { headers: authHeaders() });
    if (res.ok) {
      const { sessions } = await res.json();
      const s = sessions.find((x) => x.id === currentSessionId && x.status === "active");
      if (s) { openSession(s.id, s.name); return; }
    }
  }
  enterSessionPicker();
})();
