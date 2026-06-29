-- Challenge ratings table
CREATE TABLE IF NOT EXISTS challenge_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  difficulty_rating INTEGER NOT NULL CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(challenge_id, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_challenge_ratings_challenge ON challenge_ratings(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_ratings_user ON challenge_ratings(user_id);
