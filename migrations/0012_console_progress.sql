-- Console progress: server-side persistence for CTF challenge progress
CREATE TABLE IF NOT EXISTS console_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  solved INTEGER NOT NULL DEFAULT 0,
  best_score REAL NOT NULL DEFAULT 0,
  grade TEXT NOT NULL DEFAULT '',
  points_earned INTEGER NOT NULL DEFAULT 0,
  solved_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, challenge_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_console_progress_user ON console_progress(user_id);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_console_progress_score ON console_progress(user_id, points_earned DESC);
