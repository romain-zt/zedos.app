/**
 * agent-flow server: HTTP (static UI + session API) and WebSocket (live
 * session stream), both behind bearer-token auth.
 */
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, extname, resolve } from "path";
import { fileURLToPath } from "url";
import { config as loadEnv } from "dotenv";
import { WebSocketServer } from "ws";
import { Cursor } from "@cursor/sdk";
import { createDb } from "./db.mjs";
import { createAuth } from "./auth.mjs";
import { createModelLadder } from "./models.mjs";
import { createContextEngine } from "./context-engine.mjs";
import { createMemory } from "./memory.mjs";
import { createOrchestrator } from "./orchestrator.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");

loadEnv({ path: join(__dirname, "..", ".env") });

const PORT = Number(process.env.PORT || 3900);
const apiKey = process.env.CURSOR_API_KEY?.trim();
if (!apiKey) {
  console.error("Missing CURSOR_API_KEY — set it in agent-flow/.env");
  process.exit(1);
}
const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("Missing DATABASE_URL — set it in agent-flow/.env");
  process.exit(1);
}
const workspaceDir = resolve(
  process.env.WORKSPACE_DIR?.trim() || process.env.TARGET_PROJECT_DIR?.trim() || process.cwd(),
);

const auth = createAuth(process.env.AUTH_TOKEN?.trim() || "");
const db = createDb(databaseUrl);
const ladder = createModelLadder(process.env);
const engine = createContextEngine({
  windowSize: Number(process.env.CONTEXT_WINDOW_MESSAGES || 30),
});

await db.migrate();

// Validate configured model ids against the SDK catalog (non-fatal).
try {
  const models = await Cursor.models.list({ apiKey });
  const problems = ladder.validate(models);
  if (problems.length > 0) {
    console.warn(`⚠️  Model config problems (runs may fail):\n  ${problems.join("\n  ")}`);
  } else {
    console.log(
      `Model ladder: VISION=${ladder.ids.VISION} TOP_MGMT=${ladder.ids.TOP_MANAGEMENT} MGMT=${ladder.ids.MANAGEMENT} EXEC=${ladder.ids.EXECUTION}`,
    );
  }
} catch (err) {
  console.warn(`Could not validate models against SDK catalog: ${err.message}`);
}

// memory ↔ orchestrator have a circular dependency (memory needs one-shot
// agent runs; the orchestrator needs memory for prompts). Resolve it with a
// deferred reference.
/** @type {(tier: string, prompt: string, label: string) => Promise<string>} */
let runOneShotRef = async () => {
  throw new Error("orchestrator not ready");
};
const memory = createMemory({
  db,
  workspaceDir,
  runOneShot: (tier, prompt, label) => runOneShotRef(tier, prompt, label),
});
const orchestrator = createOrchestrator({
  db,
  ladder,
  engine,
  memory,
  apiKey,
  workspaceDir,
  synthesisEveryNTurns: Number(process.env.SYNTHESIS_EVERY_N_TURNS || 8),
  maxTurnsPerCycle: Number(process.env.MAX_AGENT_TURNS_PER_CYCLE || 24),
});
runOneShotRef = (tier, prompt, label) =>
  orchestrator.runOneShot(/** @type {any} */ (tier), prompt, label);

// ── WebSocket client registry (session-scoped broadcast) ──────────────────

const wss = new WebSocketServer({ noServer: true });
/** @type {Map<import('ws').WebSocket, { sessionId: string | null }>} */
const clients = new Map();

/** @param {string} sessionId @param {object} payload */
function emitToSession(sessionId, payload) {
  const data = JSON.stringify(payload);
  for (const [socket, meta] of clients) {
    if (meta.sessionId === sessionId && socket.readyState === 1) socket.send(data);
  }
}

/** @param {string} sessionId */
function emitterFor(sessionId) {
  return (payload) => emitToSession(sessionId, payload);
}

// ── HTTP API ───────────────────────────────────────────────────────────────

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

/** @param {import('http').IncomingMessage} req */
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function serveStatic(req, res) {
  const path = req.url === "/" ? "/index.html" : (req.url || "/").split("?")[0];
  const file = join(PUBLIC_DIR, path);
  if (!file.startsWith(PUBLIC_DIR) || !existsSync(file)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": MIME[extname(file)] || "text/plain" });
  res.end(readFileSync(file));
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
async function handleApi(req, res) {
  if (!auth.isAuthorized(req)) {
    sendJson(res, 401, { error: "unauthorized" });
    return;
  }
  const url = new URL(req.url || "/", "http://local");
  const path = url.pathname;

  // GET /api/sessions — list
  if (req.method === "GET" && path === "/api/sessions") {
    sendJson(res, 200, { sessions: await db.listSessions() });
    return;
  }

  // POST /api/sessions — create { name }
  if (req.method === "POST" && path === "/api/sessions") {
    const body = await readBody(req);
    const name = String(body.name || "").trim() || `Session ${new Date().toISOString().slice(0, 16)}`;
    const session = await db.createSession(name);
    sendJson(res, 201, { session });
    return;
  }

  // POST /api/sessions/:id/archive
  const archiveMatch = path.match(/^\/api\/sessions\/([0-9a-f-]{36})\/archive$/);
  if (req.method === "POST" && archiveMatch) {
    const sessionId = archiveMatch[1];
    const session = await db.getSession(sessionId);
    if (!session) {
      sendJson(res, 404, { error: "session not found" });
      return;
    }
    // Session boundary: extract decisions into cross-session memory, best effort.
    try {
      const rt = await orchestrator.attach(sessionId, emitterFor(sessionId));
      if (rt.messages.length > 3) await orchestrator.extractSessionDecisions(rt);
      await orchestrator.detach(rt);
    } catch (err) {
      console.warn(`decision extraction on archive failed: ${err.message}`);
    }
    await db.archiveSession(sessionId);
    sendJson(res, 200, { ok: true });
    return;
  }

  // POST /api/codebase-map/refresh — regenerate the target project map
  if (req.method === "POST" && path === "/api/codebase-map/refresh") {
    try {
      const markdown = await memory.refreshCodebaseMap();
      sendJson(res, 200, { ok: true, bytes: markdown.length });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // GET /api/codebase-map
  if (req.method === "GET" && path === "/api/codebase-map") {
    sendJson(res, 200, await db.getCodebaseMap());
    return;
  }

  // GET /api/decisions
  if (req.method === "GET" && path === "/api/decisions") {
    sendJson(res, 200, { decisions: await db.listDecisions(100) });
    return;
  }

  // GET /api/skills
  if (req.method === "GET" && path === "/api/skills") {
    sendJson(res, 200, { skills: await memory.listSkills() });
    return;
  }

  sendJson(res, 404, { error: "not found" });
}

const server = createServer((req, res) => {
  if ((req.url || "").startsWith("/api/")) {
    handleApi(req, res).catch((err) => {
      console.error("api error:", err);
      sendJson(res, 500, { error: "internal error" });
    });
    return;
  }
  serveStatic(req, res);
});

// ── WebSocket: auth on upgrade, session-scoped messaging ──────────────────

server.on("upgrade", (req, socket, head) => {
  if (!auth.isAuthorized(req)) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

wss.on("connection", (socket) => {
  clients.set(socket, { sessionId: null });
  socket.on("close", () => clients.delete(socket));

  socket.on("message", async (raw) => {
    let data;
    try {
      data = JSON.parse(String(raw));
    } catch {
      return;
    }
    const meta = clients.get(socket);
    if (!meta) return;

    try {
      // Join (or switch to) a session; replies with the full snapshot.
      if (data.type === "join_session") {
        const sessionId = String(data.sessionId || "");
        const session = await db.getSession(sessionId);
        if (!session) {
          socket.send(JSON.stringify({ type: "error", text: "Session not found." }));
          return;
        }
        meta.sessionId = sessionId;
        const rt = await orchestrator.attach(sessionId, emitterFor(sessionId));
        socket.send(JSON.stringify({ type: "init", ...(await orchestrator.snapshot(rt)) }));
        return;
      }

      if (!meta.sessionId) {
        socket.send(JSON.stringify({ type: "error", text: "Join a session first." }));
        return;
      }
      const rt = await orchestrator.attach(meta.sessionId, emitterFor(meta.sessionId));

      if (data.type === "sync") {
        socket.send(JSON.stringify({ type: "init", ...(await orchestrator.snapshot(rt)) }));
      } else if (data.type === "human_message") {
        const text = String(data.text || "").trim();
        if (!text) return;
        const topic = typeof data.topic === "string" ? data.topic.trim() : "";
        await orchestrator.onHumanMessage(rt, text, topic);
      } else if (data.type === "answer_question") {
        const questionId = String(data.questionId || "").trim();
        const text = String(data.text || "").trim();
        if (!questionId || !text) return;
        await orchestrator.onAnswerQuestion(rt, questionId, text);
      } else if (data.type === "force_stop") {
        await orchestrator.forceStop(rt);
      } else if (data.type === "pause_agents") {
        await orchestrator.forceStop(rt);
      } else if (data.type === "resume_agents") {
        await orchestrator.resume(rt);
      } else if (data.type === "final_review") {
        await orchestrator.runFinalReview(rt);
      } else if (data.type === "extract_decisions") {
        await orchestrator.extractSessionDecisions(rt);
      }
    } catch (err) {
      console.error("ws message error:", err);
      socket.send(JSON.stringify({ type: "system", text: `Server error: ${err.message}` }));
    }
  });
});

// Heartbeat for stuck-run visibility — one beat per concurrent active author.
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, rt] of orchestrator.runtimes) {
    for (const [author, since] of rt.activeAuthors) {
      emitToSession(sessionId, {
        type: "heartbeat",
        author,
        elapsedMs: now - since,
        ts: now,
      });
    }
  }
}, 3000);

// ── Lifecycle ──────────────────────────────────────────────────────────────

async function shutdown() {
  console.log("\nShutting down…");
  for (const rt of [...orchestrator.runtimes.values()]) {
    await orchestrator.detach(rt).catch(() => {});
  }
  wss.close();
  server.close();
  await db.close().catch(() => {});
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", (err) => {
  if (err?.code === "EPIPE") {
    console.error("SDK pipe closed (EPIPE) — continuing");
    return;
  }
  console.error(err);
  process.exit(1);
});

// Generate an initial codebase map (tree fallback) if none exists yet, so
// the stable prompt prefix has project context from the first turn.
const existingMap = await db.getCodebaseMap();
if (!existingMap.markdown) {
  const { generateTreeFallback } = await import("./memory.mjs");
  await db.saveCodebaseMap(generateTreeFallback(workspaceDir));
  console.log("Seeded codebase map with directory tree (refresh via POST /api/codebase-map/refresh)");
}

server.listen(PORT, () => {
  console.log(`agent-flow → http://localhost:${PORT}`);
  console.log(`workspace: ${workspaceDir}`);
});
