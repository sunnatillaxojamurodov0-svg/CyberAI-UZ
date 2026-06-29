-- Admin PIN storage
CREATE TABLE IF NOT EXISTS admin_pins (
  user_id TEXT PRIMARY KEY,
  pin_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
