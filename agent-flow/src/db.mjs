/**
 * Postgres persistence layer: migrations + data access for sessions,
 * messages, participants, agent bindings, decisions, skills, assets,
 * codebase map.
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import pg from "pg";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "migrations");

/** @typedef {{ id: string; name: string; topic: string; goal: string; definition_of_done: string; phase: string; status: string; waiting_for_human: boolean; turns_this_cycle: number; turns_since_synthesis: number; rolling_summary: string; summarized_until: number; last_hint: string; created_at: number; updated_at: number }} SessionRow */
/** @typedef {{ id: string; session_id: string; author: string; text: string; ts: number }} MessageRow */
/** @typedef {{ author_id: string; name: string; label: string; color: string; persona: string; skill_name: string | null; tier: string }} ParticipantRow */
/** @typedef {{ author_id: string; agent_id: string; last_seen_ts: number }} BindingRow */

/**
 * @param {string} databaseUrl
 */
export function createDb(databaseUrl) {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 10,
    ssl: /sslmode=require/.test(databaseUrl) ? { rejectUnauthorized: false } : undefined,
  });

  async function migrate() {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name TEXT PRIMARY KEY,
         applied_at BIGINT NOT NULL
       )`,
    );
    const { rows } = await pool.query("SELECT name FROM schema_migrations");
    const applied = new Set(rows.map((r) => r.name));
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (name, applied_at) VALUES ($1, $2)",
          [file, Date.now()],
        );
        await client.query("COMMIT");
        console.log(`migration applied: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`migration ${file} failed: ${err.message}`);
      } finally {
        client.release();
      }
    }
  }

  // ── Sessions ──────────────────────────────────────────────────────────

  /** @param {string} name */
  async function createSession(name) {
    const id = randomUUID();
    const now = Date.now();
    await pool.query(
      `INSERT INTO sessions (id, name, created_at, updated_at) VALUES ($1, $2, $3, $3)`,
      [id, name, now],
    );
    return getSession(id);
  }

  /** @param {string} id @returns {Promise<SessionRow | null>} */
  async function getSession(id) {
    const { rows } = await pool.query("SELECT * FROM sessions WHERE id = $1", [id]);
    return rows[0] ? normalizeSession(rows[0]) : null;
  }

  function normalizeSession(row) {
    return {
      ...row,
      created_at: Number(row.created_at),
      updated_at: Number(row.updated_at),
      summarized_until: Number(row.summarized_until),
    };
  }

  async function listSessions() {
    const { rows } = await pool.query(
      `SELECT s.*, (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) AS message_count
       FROM sessions s ORDER BY s.updated_at DESC`,
    );
    return rows.map((r) => ({ ...normalizeSession(r), message_count: Number(r.message_count) }));
  }

  /**
   * @param {string} id
   * @param {Partial<SessionRow>} patch
   */
  async function updateSession(id, patch) {
    const fields = [];
    const values = [];
    let i = 1;
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = $${i++}`);
      values.push(v);
    }
    fields.push(`updated_at = $${i++}`);
    values.push(Date.now());
    values.push(id);
    await pool.query(
      `UPDATE sessions SET ${fields.join(", ")} WHERE id = $${i}`,
      values,
    );
  }

  /** @param {string} id */
  async function archiveSession(id) {
    await updateSession(id, { status: "archived" });
  }

  /**
   * Atomic turn-counter bump — safe when parallel specialists finish
   * concurrently (no read-modify-write race).
   * @param {string} id
   * @returns {Promise<number>} the new turns_this_cycle value
   */
  async function incrementTurns(id) {
    const { rows } = await pool.query(
      `UPDATE sessions SET turns_this_cycle = turns_this_cycle + 1, updated_at = $2
       WHERE id = $1 RETURNING turns_this_cycle`,
      [id, Date.now()],
    );
    return Number(rows[0]?.turns_this_cycle ?? 0);
  }

  // ── Messages ──────────────────────────────────────────────────────────

  /** @param {string} sessionId @returns {Promise<MessageRow[]>} */
  async function listMessages(sessionId) {
    const { rows } = await pool.query(
      "SELECT * FROM messages WHERE session_id = $1 ORDER BY ts ASC, id ASC",
      [sessionId],
    );
    return rows.map((r) => ({ ...r, ts: Number(r.ts) }));
  }

  /** @param {MessageRow} message */
  async function insertMessage(message) {
    await pool.query(
      "INSERT INTO messages (id, session_id, author, text, ts) VALUES ($1, $2, $3, $4, $5)",
      [message.id, message.session_id, message.author, message.text, message.ts],
    );
  }

  // ── Participants (dynamic specialists) ───────────────────────────────

  /** @param {string} sessionId @returns {Promise<ParticipantRow[]>} */
  async function listParticipants(sessionId) {
    const { rows } = await pool.query(
      "SELECT author_id, name, label, color, persona, skill_name, tier FROM participants WHERE session_id = $1",
      [sessionId],
    );
    return rows;
  }

  /** @param {string} sessionId @param {ParticipantRow} p */
  async function upsertParticipant(sessionId, p) {
    await pool.query(
      `INSERT INTO participants (session_id, author_id, name, label, color, persona, skill_name, tier)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (session_id, author_id) DO UPDATE
       SET name = $3, label = $4, color = $5, persona = $6, skill_name = $7, tier = $8`,
      [sessionId, p.author_id, p.name, p.label, p.color, p.persona, p.skill_name, p.tier],
    );
  }

  // ── Agent bindings ────────────────────────────────────────────────────

  /** @param {string} sessionId @returns {Promise<BindingRow[]>} */
  async function listBindings(sessionId) {
    const { rows } = await pool.query(
      "SELECT author_id, agent_id, last_seen_ts FROM agent_bindings WHERE session_id = $1",
      [sessionId],
    );
    return rows.map((r) => ({ ...r, last_seen_ts: Number(r.last_seen_ts) }));
  }

  /** @param {string} sessionId @param {string} authorId @param {string} agentId */
  async function bindAgent(sessionId, authorId, agentId) {
    await pool.query(
      `INSERT INTO agent_bindings (session_id, author_id, agent_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id, author_id) DO UPDATE SET agent_id = $3`,
      [sessionId, authorId, agentId],
    );
  }

  /** @param {string} sessionId @param {string} authorId @param {number} ts */
  async function setLastSeen(sessionId, authorId, ts) {
    await pool.query(
      "UPDATE agent_bindings SET last_seen_ts = $3 WHERE session_id = $1 AND author_id = $2",
      [sessionId, authorId, ts],
    );
  }

  /** @param {string} sessionId @param {string} authorId */
  async function deleteBinding(sessionId, authorId) {
    await pool.query(
      "DELETE FROM agent_bindings WHERE session_id = $1 AND author_id = $2",
      [sessionId, authorId],
    );
  }

  // ── Human question queue ──────────────────────────────────────────────

  /** @typedef {{ id: string; session_id: string; question: string; blocks: string[]; status: string; answer: string; created_at: number; answered_at: number | null }} QueueRow */

  /** @param {{ session_id: string; question: string; blocks: string[] }} q @returns {Promise<QueueRow>} */
  async function enqueueQuestion(q) {
    const id = randomUUID();
    const now = Date.now();
    const { rows } = await pool.query(
      `INSERT INTO human_queue (id, session_id, question, blocks, created_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, q.session_id, q.question, q.blocks, now],
    );
    return normalizeQueueRow(rows[0]);
  }

  /** @param {string} sessionId @returns {Promise<QueueRow[]>} */
  async function listOpenQuestions(sessionId) {
    const { rows } = await pool.query(
      "SELECT * FROM human_queue WHERE session_id = $1 AND status = 'open' ORDER BY created_at ASC",
      [sessionId],
    );
    return rows.map(normalizeQueueRow);
  }

  /** @param {string} id @returns {Promise<QueueRow | null>} */
  async function getQuestion(id) {
    const { rows } = await pool.query("SELECT * FROM human_queue WHERE id = $1", [id]);
    return rows[0] ? normalizeQueueRow(rows[0]) : null;
  }

  /** @param {string} id @param {string} answer @returns {Promise<QueueRow | null>} */
  async function answerQuestion(id, answer) {
    const { rows } = await pool.query(
      `UPDATE human_queue SET status = 'answered', answer = $2, answered_at = $3
       WHERE id = $1 AND status = 'open' RETURNING *`,
      [id, answer, Date.now()],
    );
    return rows[0] ? normalizeQueueRow(rows[0]) : null;
  }

  function normalizeQueueRow(row) {
    return {
      ...row,
      created_at: Number(row.created_at),
      answered_at: row.answered_at === null ? null : Number(row.answered_at),
    };
  }

  // ── Decisions (cross-session memory) ─────────────────────────────────

  /** @param {{ session_id: string | null; decision: string; rationale: string; constraints: string; tags: string[] }} d */
  async function insertDecision(d) {
    await pool.query(
      `INSERT INTO decisions (id, session_id, decision, rationale, constraints, tags, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [randomUUID(), d.session_id, d.decision, d.rationale, d.constraints, d.tags, Date.now()],
    );
  }

  /** @param {number} limit */
  async function listDecisions(limit = 50) {
    const { rows } = await pool.query(
      "SELECT * FROM decisions ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
    return rows.map((r) => ({ ...r, created_at: Number(r.created_at) }));
  }

  // ── Skills library (cross-session memory) ────────────────────────────

  /** @param {{ name: string; description: string; markdown: string }} s */
  async function upsertSkill(s) {
    const now = Date.now();
    await pool.query(
      `INSERT INTO skills (name, description, markdown, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4)
       ON CONFLICT (name) DO UPDATE SET description = $2, markdown = $3, updated_at = $4`,
      [s.name, s.description, s.markdown, now],
    );
  }

  /** @param {string} name */
  async function getSkill(name) {
    const { rows } = await pool.query("SELECT * FROM skills WHERE name = $1", [name]);
    return rows[0] ?? null;
  }

  async function listSkills() {
    const { rows } = await pool.query(
      "SELECT name, description, updated_at FROM skills ORDER BY name",
    );
    return rows.map((r) => ({ ...r, updated_at: Number(r.updated_at) }));
  }

  // ── Assets ────────────────────────────────────────────────────────────

  /** @param {{ session_id: string; path: string; author: string; tool: string }} asset */
  async function recordAsset(asset) {
    await pool.query(
      `INSERT INTO assets (id, session_id, path, author, tool, ts)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (session_id, path, author) DO NOTHING`,
      [randomUUID(), asset.session_id, asset.path, asset.author, asset.tool, Date.now()],
    );
  }

  /** @param {string} sessionId */
  async function listAssets(sessionId) {
    const { rows } = await pool.query(
      "SELECT id, path, author, tool, ts FROM assets WHERE session_id = $1 ORDER BY ts ASC",
      [sessionId],
    );
    return rows.map((r) => ({ ...r, ts: Number(r.ts) }));
  }

  // ── Codebase map ──────────────────────────────────────────────────────

  async function getCodebaseMap() {
    const { rows } = await pool.query("SELECT markdown, refreshed_at FROM codebase_map WHERE id = 1");
    return rows[0]
      ? { markdown: rows[0].markdown, refreshed_at: Number(rows[0].refreshed_at) }
      : { markdown: "", refreshed_at: 0 };
  }

  /** @param {string} markdown */
  async function saveCodebaseMap(markdown) {
    await pool.query(
      "UPDATE codebase_map SET markdown = $1, refreshed_at = $2 WHERE id = 1",
      [markdown, Date.now()],
    );
  }

  return {
    pool,
    migrate,
    createSession,
    getSession,
    listSessions,
    updateSession,
    archiveSession,
    incrementTurns,
    enqueueQuestion,
    listOpenQuestions,
    getQuestion,
    answerQuestion,
    listMessages,
    insertMessage,
    listParticipants,
    upsertParticipant,
    listBindings,
    bindAgent,
    setLastSeen,
    deleteBinding,
    insertDecision,
    listDecisions,
    upsertSkill,
    getSkill,
    listSkills,
    recordAsset,
    listAssets,
    getCodebaseMap,
    saveCodebaseMap,
    close: () => pool.end(),
  };
}
