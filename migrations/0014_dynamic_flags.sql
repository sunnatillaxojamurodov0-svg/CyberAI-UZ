ALTER TABLE challenges ADD COLUMN dynamic_flags INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS user_flags (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  dynamic_flag TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_user_flags_challenge ON user_flags(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_flags_user ON user_flags(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_flags_unique ON user_flags(challenge_id, user_id);
