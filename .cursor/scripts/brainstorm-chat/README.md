# Brainstorm Chat

Live multi-agent brainstorm: **you** + **Orchestrator** + **Spark** + **Skeptic** (+ dynamically spawned specialists) — all on **composer-2.5** via the Cursor SDK (local runtime). Sessions persist across reloads.

## Setup

```bash
cd .cursor/scripts/brainstorm-chat
npm install
```

Ensure repo root `.env` has:

```bash
CURSOR_API_KEY=cursor_...
```

## Run

```bash
npm start
# → http://localhost:3847
```

Optional: `CHAT_PORT=4000 npm start`

## Flow

1. Open the page — **You**, **Orchestrator**, **Spark**, **Skeptic**
2. Set a **goal / topic**, send your message
3. **Orchestrator** routes who speaks next, can **spawn new specialists** with skills when relevant
4. **Live activity** panel shows thinking, tools, elapsed time — so you know it's not stuck
5. **Force stop** anytime; send a new message to steer

## Persistence

Session data is stored in `.data/` (gitignored):

- `state.json` — goal, pause state, turn count
- `messages.jsonl` — full conversation
- `agent-bindings.json` — SDK agent IDs (resume after restart)
- `participants.json` — dynamically spawned specialists
- `skills/` — generated SKILL.md files per specialist
- `assets.json` — files created by agents (Write/Edit tools)

Reload the page or restart the server — conversation continues.

## Orchestrator spawn syntax

The Orchestrator can add specialists mid-session:

```
[SPAWN: legal_expert|Legal Expert|legal|You review ideas for legal risk.]
[ROUTE: legal_expert]
```

With a custom skill body:

```
[SPAWN_SKILL: researcher|Researcher|research|You find facts.|# Research protocol\n- Cite sources\n- Flag uncertainty]
[ROUTE: researcher]
```

## Next steps

- Wire agent turns to GitHub Issues / PR comments
- Manual “poke agent” buttons
- Cloud agents against a repo URL for CI-hosted brainstorms
