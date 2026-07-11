# Agent Flow

Multi-agent orchestration for working on a real codebase. A human sets a goal; an Orchestrator routes turns between Spark (creative), Skeptic (critic), and dynamically spawned specialists — all running as Cursor SDK local agents with their working directory pointed at **your target project**. Everything persists in Postgres, with cross-session memory (decision log, skills library, codebase map).

## Quickstart — point it at a new project

```bash
# 1. copy agent-flow anywhere (or clone the repo)
cp -r agent-flow ~/my-tools/agent-flow && cd ~/my-tools/agent-flow

# 2. configure
cp .env.example .env
#    edit .env: set CURSOR_API_KEY, AUTH_TOKEN, TARGET_PROJECT_DIR=/abs/path/to/your/project

# 3. run
docker compose up -d --build

# 4. open http://localhost:3900 — enter your AUTH_TOKEN, create a session, send a message
```

That's it. Agents run inside the container with your project bind-mounted at `/workspace`, so files they read/write land in your real project directory.

## Architecture

```
agent-flow/
├── src/
│   ├── server.mjs          HTTP (static UI + session API) + WebSocket, bearer-token auth
│   ├── orchestrator.mjs    session runtimes, the loop, agent lifecycle, tier escalation
│   ├── routing-schema.mjs  strict JSON control protocol (parse + validate + retry)
│   ├── prompts.mjs         cache-friendly prompts (stable prefix, dynamic tail)
│   ├── context-engine.mjs  delta context + rolling summary (fixes double context growth)
│   ├── memory.mjs          decision log, skills library, codebase map
│   ├── models.mjs          4-tier model ladder, env-configurable
│   ├── db.mjs              Postgres access + startup migrations
│   └── auth.mjs            AUTH_TOKEN bearer auth (HTTP + WS)
├── migrations/             SQL, applied automatically at startup
├── public/                 UI: token gate, session picker, chat, live activity stream
├── scripts/smoke.mjs       end-to-end smoke test against a running server
├── Dockerfile
└── docker-compose.yml      app + pgvector/pgvector:pg16
```

### The loop

1. **Vision kickoff** (once per session, on the first human message): frames the session.
2. **Routing turn** every cycle: the Orchestrator emits a strict JSON directive —
   `{ synthesis, routes[], spawns[], questions[], phase, definition_of_done, wait_for_human }`.
   Invalid JSON gets exactly one reprompt carrying the parse error.
3. **Phases**: `clarify` (confirm goal + definition of done) → `assess_team` (spawn missing specialists) → `execute` (dispatch — all routes in a directive run in parallel; independent tasks should be routed together).
   **Question queue**: `questions[]` entries are queued for the human (`human_queue` table) without stopping the loop; each may name the specialists it `blocks`. Blocked routes are deferred, everything else keeps running. The loop only pauses when open questions remain and no unblocked route is left. Answer via the UI panel or the `answer_question` WS command — the answer lands in the thread as a tagged human message and the loop restarts.
4. **Deep synthesis** runs on phase transitions or every `SYNTHESIS_EVERY_N_TURNS` turns (default 8), on the TOP_MANAGEMENT tier.
5. **Vision final review** on demand (Review button) — session boundary sign-off.
6. **Archiving a session** extracts structured decisions into the cross-session log.

### Model tiers

| Tier | Default model | Used for |
|---|---|---|
| VISION | `claude-fable-5` | session kickoff framing, final review — session boundaries only |
| TOP_MANAGEMENT | `claude-opus-4-6` | deep synthesis on phase changes / every N turns; escalation target |
| MANAGEMENT | `claude-sonnet-4-6` | per-turn routing (strict JSON), Skeptic |
| EXECUTION | `composer-2.5` | Spark, spawned specialists, code bricks, rolling summaries, codebase map |

A failed run (error or empty result) retries **once, one tier up**. Override any tier via `MODEL_VISION`, `MODEL_TOP_MGMT`, `MODEL_MANAGEMENT`, `MODEL_EXECUTION`. Valid ids are whatever `Cursor.models.list()` returns for your account; the server validates your config at startup and warns on unknown ids.

### Context strategy (why prompts stay small)

Agents are resumed across turns, so the SDK already keeps their own transcript. Prompts therefore contain only:

- **stable prefix** (identical bytes across turns → provider prompt caching): persona, skill, codebase map, goal, definition of done, prior decisions
- **dynamic tail**: rolling summary of older messages + only the messages that agent hasn't seen yet (tracked per-agent via `last_seen_ts`), capped at `CONTEXT_WINDOW_MESSAGES` (default 30) verbatim

Older messages are folded into the per-session rolling summary by a cheap EXECUTION-tier call.

### Cross-session memory

- **Decision log** (`decisions` table): on archive (or the `extract_decisions` WS command), an agent extracts `{ decision, rationale, constraints, tags[] }` entries. Recent decisions are injected into the Orchestrator's stable prefix.
- **Skills library** (`skills` table): skills attached to spawned specialists persist across sessions and are reused when a specialist with the same id is spawned again.
- **Codebase map** (`codebase_map` table): markdown map of the target project, injected into every stable prefix. Seeded with a directory tree at first startup; refresh with a full agent-generated map via `POST /api/codebase-map/refresh` (bearer token required).

## Running natively (without the app container)

The SDK local runtime works fine in Docker, but if you prefer running on the host:

```bash
docker compose up -d postgres          # Postgres only (exposed on host port 5433)
# in .env: DATABASE_URL=postgresql://agentflow:agentflow@localhost:5433/agentflow
npm install
npm start                              # agents use TARGET_PROJECT_DIR as cwd directly
```

## API (all require `Authorization: Bearer $AUTH_TOKEN`)

- `GET /api/sessions` · `POST /api/sessions {name}` · `POST /api/sessions/:id/archive`
- `GET /api/decisions` · `GET /api/skills`
- `GET /api/codebase-map` · `POST /api/codebase-map/refresh`
- WebSocket (`?token=`): `join_session`, `human_message`, `answer_question`, `force_stop`, `pause_agents`, `resume_agents`, `final_review`, `extract_decisions`, `sync`

## Smoke test

With the stack running:

```bash
node scripts/smoke.mjs http://localhost:3900 "$AUTH_TOKEN"
```

Creates a session, sends a goal, and passes once the Orchestrator emits a valid JSON directive and at least one specialist replies.

## Notes & limitations

- **Cursor SDK in Docker**: no separate `cursor-agent` CLI is needed — the `@cursor/sdk` npm package bundles the local agent runtime, and the platform packages (`@cursor/sdk-linux-*`) ship the required `rg`/sandbox binaries. Agent state lives under `~/.cursor` in the container, persisted via the `cursor-state` volume.
- Sessions survive restarts (Postgres + resumed SDK agents), but a container rebuild that wipes the `cursor-state` volume loses SDK transcripts — the app recovers by creating fresh agents; the rolling summary + delta context rebuilds their working context.
- Auth is a single shared bearer token — fine for a trusted team behind a firewall; put a reverse proxy with TLS in front for anything else.
- pgvector is included in the Postgres image but no vector search is wired up yet (decision/skill retrieval is recency-based v1).
