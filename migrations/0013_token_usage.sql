CREATE TABLE IF NOT EXISTS ai_token_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  model TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_ai_token_usage_user_date ON ai_token_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_user ON ai_token_usage(user_id);
