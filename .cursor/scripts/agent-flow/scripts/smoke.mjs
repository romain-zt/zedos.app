/**
 * End-to-end smoke test against a running agent-flow server.
 * Creates a session, sends a message, and verifies that the orchestrator
 * routes (valid JSON directive → orchestrator message) and at least one
 * specialist responds.
 *
 * Usage: node scripts/smoke.mjs [baseUrl] [token]
 */
import WebSocket from "ws";

const BASE = process.argv[2] || "http://localhost:3900";
const TOKEN = process.argv[3] || process.env.AUTH_TOKEN || "";
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 10 * 60 * 1000);

if (!TOKEN) {
  console.error("Usage: node scripts/smoke.mjs [baseUrl] [token]");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

const res = await fetch(`${BASE}/api/sessions`, {
  method: "POST",
  headers,
  body: JSON.stringify({ name: `smoke-${Date.now()}` }),
});
if (!res.ok) {
  console.error(`create session failed: ${res.status}`);
  process.exit(1);
}
const { session } = await res.json();
console.log(`session created: ${session.id}`);

const wsUrl = `${BASE.replace(/^http/, "ws")}/?token=${encodeURIComponent(TOKEN)}`;
const ws = new WebSocket(wsUrl);

let orchestratorSpoke = false;
let specialistSpoke = false;
let repliedToClarify = false;

const done = (code, msg) => {
  console.log(msg);
  try { ws.close(); } catch { /* ok */ }
  process.exit(code);
};

const timer = setTimeout(() => {
  done(1, `TIMEOUT after ${TIMEOUT_MS}ms — orchestrator: ${orchestratorSpoke}, specialist: ${specialistSpoke}`);
}, TIMEOUT_MS);

ws.on("open", () => {
  console.log("ws connected, joining session…");
  ws.send(JSON.stringify({ type: "join_session", sessionId: session.id }));
});

ws.on("message", (raw) => {
  const data = JSON.parse(String(raw));
  if (data.type === "init") {
    console.log("joined; sending human message");
    ws.send(
      JSON.stringify({
        type: "human_message",
        topic: "Name a CLI tool for renaming photo files by EXIF date",
        text: "Goal: pick ONE name for a small CLI tool that renames photos by their EXIF date. Definition of done: a single name both Spark and Skeptic accept. Keep it very short — this is a smoke test, one round is enough.",
      }),
    );
    return;
  }
  if (data.type === "message") {
    const preview = data.text.replace(/\s+/g, " ").slice(0, 110);
    console.log(`[msg] ${data.author}: ${preview}`);
    if (data.author === "orchestrator") orchestratorSpoke = true;
    if (["spark", "skeptic"].includes(data.author) || (data.author !== "human" && data.author !== "orchestrator" && data.author !== "vision")) {
      specialistSpoke = true;
    }
    if (orchestratorSpoke && specialistSpoke) {
      clearTimeout(timer);
      done(0, "SMOKE OK — orchestrator routed (valid JSON) and a specialist responded.");
    }
    return;
  }
  if (data.type === "system") {
    console.log(`[system] ${data.text}`);
    return;
  }
  if (data.type === "waiting_for_human" && data.active && !specialistSpoke && !repliedToClarify) {
    repliedToClarify = true;
    console.log("orchestrator waits for human — answering the clarifying question");
    ws.send(
      JSON.stringify({
        type: "human_message",
        text: "Confirmed: goal and definition of done are exactly as stated. No further constraints. Proceed with the existing team (Spark + Skeptic), no new specialists needed.",
      }),
    );
  }
});

ws.on("error", (err) => done(1, `ws error: ${err.message}`));
ws.on("close", () => console.log("ws closed"));
