-- Add index on chat_sessions.user_id for chat history queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
