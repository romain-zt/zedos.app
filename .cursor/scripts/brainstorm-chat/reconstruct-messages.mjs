#!/usr/bin/env node
/**
 * Rebuild messages.jsonl from Cursor agent transcripts when APFS snapshot
 * recovery is blocked (mount_apfs: Operation not permitted).
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, ".data");
const TRANSCRIPTS_ROOT = join(
  process.env.HOME || "",
  ".cursor/projects/Users-romainpiveteau-Projects-AI-lenue-paris/agent-transcripts",
);

const AUTHOR_MAP = {
  You: "human",
  Orchestrator: "orchestrator",
  Spark: "spark",
  Skeptic: "skeptic",
  "Maison Lens": "maison_lens",
  "Payload Architect": "payload_architect",
};

const AUTHOR_PATTERN =
  /^(You|Orchestrator|Spark|Skeptic|Maison Lens|Payload Architect): (.*)$/;

/** @param {string} thread */
function parseThread(thread) {
  const lines = thread.split("\n");
  /** @type {Array<{ author: string; text: string }>} */
  const messages = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(AUTHOR_PATTERN);
    if (match) {
      if (current?.text.trim()) messages.push(current);
      current = {
        author: AUTHOR_MAP[match[1]] || match[1].toLowerCase().replace(/\s+/g, "_"),
        text: match[2],
      };
      continue;
    }
    if (current) current.text += `\n${line}`;
  }
  if (current?.text.trim()) messages.push(current);

  return messages.map((m, i) => ({
    id: randomUUID(),
    author: m.author,
    text: m.text.trim(),
    ts: 1_700_000_000_000 + i,
  }));
}

/** @returns {string} */
function findLongestThread() {
  let best = "";
  if (!existsSync(TRANSCRIPTS_ROOT)) {
    throw new Error(`Transcripts not found: ${TRANSCRIPTS_ROOT}`);
  }

  const agentDirs = readdirSync(TRANSCRIPTS_ROOT).filter((n) =>
    n.startsWith("agent-"),
  );

  for (const dir of agentDirs) {
    const jsonl = join(TRANSCRIPTS_ROOT, dir, `${dir}.jsonl`);
    if (!existsSync(jsonl)) continue;
    let raw;
    try {
      raw = readFileSync(jsonl, "utf8");
    } catch {
      continue;
    }
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      let data;
      try {
        data = JSON.parse(line);
      } catch {
        continue;
      }
      if (data.role !== "user") continue;
      const text = data.message?.content?.[0]?.text || "";
      const idx = text.indexOf("Full thread:");
      if (idx < 0) continue;
      const slice = text.slice(idx);
      if (slice.length > best.length) best = slice;
    }
  }

  if (!best) throw new Error("No Full thread block found in agent transcripts.");
  return best;
}

function dedupeMessages(messages) {
  /** @type {typeof messages} */
  const out = [];
  for (const msg of messages) {
    const prev = out.at(-1);
    if (
      prev &&
      prev.author === msg.author &&
      prev.text === msg.text
    ) {
      continue;
    }
    out.push(msg);
  }
  return out;
}

const thread = findLongestThread();
const parsed = dedupeMessages(parseThread(thread));
const outPath = join(DATA_DIR, "messages.jsonl");

writeFileSync(
  outPath,
  parsed.map((m) => JSON.stringify(m)).join("\n") + "\n",
);

console.log(`Reconstructed ${parsed.length} messages → ${outPath}`);
console.log(
  "By author:",
  Object.entries(
    parsed.reduce((acc, m) => {
      acc[m.author] = (acc[m.author] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([k, v]) => `${k}=${v}`)
    .join(", "),
);
