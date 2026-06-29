-- Fix leaderboard duplicates: add unique constraint and clean up existing duplicates

-- First, keep only the best score per user+challenge (delete duplicates)
DELETE FROM leaderboard
WHERE id NOT IN (
  SELECT MIN(id)
  FROM leaderboard
  GROUP BY user_id, challenge_id
);

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user_challenge
  ON leaderboard(user_id, challenge_id);
