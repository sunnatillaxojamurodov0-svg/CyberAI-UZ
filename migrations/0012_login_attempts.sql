CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  success INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at);
