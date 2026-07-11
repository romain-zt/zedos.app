-- Question queue: orchestrator questions for the human that should NOT
-- stop the loop. Open items block only the specialists listed in `blocks`;
-- everything else keeps running.

CREATE TABLE IF NOT EXISTS human_queue (
  id          UUID PRIMARY KEY,
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  -- specialist author_ids blocked until this is answered (may be empty)
  blocks      TEXT[] NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'open',   -- open | answered
  answer      TEXT NOT NULL DEFAULT '',
  created_at  BIGINT NOT NULL,
  answered_at BIGINT
);
CREATE INDEX IF NOT EXISTS idx_human_queue_session_status ON human_queue(session_id, status);
