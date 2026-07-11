-- agent-flow initial schema

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY,
  name          TEXT NOT NULL,
  topic         TEXT NOT NULL DEFAULT '',
  goal          TEXT NOT NULL DEFAULT '',
  definition_of_done TEXT NOT NULL DEFAULT '',
  phase         TEXT NOT NULL DEFAULT 'clarify',
  status        TEXT NOT NULL DEFAULT 'active',      -- active | archived
  waiting_for_human BOOLEAN NOT NULL DEFAULT FALSE,
  turns_this_cycle  INTEGER NOT NULL DEFAULT 0,
  turns_since_synthesis INTEGER NOT NULL DEFAULT 0,
  rolling_summary   TEXT NOT NULL DEFAULT '',
  summarized_until  BIGINT NOT NULL DEFAULT 0,        -- ts of last summarized message
  last_hint     TEXT NOT NULL DEFAULT '',
  created_at    BIGINT NOT NULL,
  updated_at    BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY,
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  author      TEXT NOT NULL,
  text        TEXT NOT NULL,
  ts          BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_session_ts ON messages(session_id, ts);

CREATE TABLE IF NOT EXISTS participants (
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  author_id   TEXT NOT NULL,
  name        TEXT NOT NULL,
  label       TEXT NOT NULL,
  color       TEXT NOT NULL,
  persona     TEXT NOT NULL DEFAULT '',
  skill_name  TEXT,
  tier        TEXT NOT NULL DEFAULT 'EXECUTION',
  PRIMARY KEY (session_id, author_id)
);

CREATE TABLE IF NOT EXISTS agent_bindings (
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  author_id   TEXT NOT NULL,
  agent_id    TEXT NOT NULL,
  -- ts of the last message this agent has seen (delta context tracking)
  last_seen_ts BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, author_id)
);

-- Cross-session memory: decision log
CREATE TABLE IF NOT EXISTS decisions (
  id          UUID PRIMARY KEY,
  session_id  UUID REFERENCES sessions(id) ON DELETE SET NULL,
  decision    TEXT NOT NULL,
  rationale   TEXT NOT NULL DEFAULT '',
  constraints TEXT NOT NULL DEFAULT '',
  tags        TEXT[] NOT NULL DEFAULT '{}',
  created_at  BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_decisions_tags ON decisions USING GIN(tags);

-- Cross-session memory: persistent skills library (survives session resets)
CREATE TABLE IF NOT EXISTS skills (
  name        TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  markdown    TEXT NOT NULL,
  created_at  BIGINT NOT NULL,
  updated_at  BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
  id          UUID PRIMARY KEY,
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  path        TEXT NOT NULL,
  author      TEXT NOT NULL,
  tool        TEXT NOT NULL,
  ts          BIGINT NOT NULL,
  UNIQUE (session_id, path, author)
);

-- Cross-session memory: codebase map of the target project
CREATE TABLE IF NOT EXISTS codebase_map (
  id          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  markdown    TEXT NOT NULL DEFAULT '',
  refreshed_at BIGINT NOT NULL DEFAULT 0
);
INSERT INTO codebase_map (id) VALUES (1) ON CONFLICT DO NOTHING;
