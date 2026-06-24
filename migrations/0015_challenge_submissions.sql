CREATE TABLE IF NOT EXISTS challenge_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1,
  scenario TEXT NOT NULL,
  objectives TEXT DEFAULT '',
  flag TEXT NOT NULL,
  hints TEXT DEFAULT '',
  writeup TEXT DEFAULT '',
  submitted_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  review_notes TEXT DEFAULT '',
  reviewed_by TEXT,
  reviewed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_challenge_submissions_status ON challenge_submissions(status);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_submitted_by ON challenge_submissions(submitted_by);
