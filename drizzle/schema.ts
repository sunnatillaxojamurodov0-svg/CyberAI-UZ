import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  githubId: text("github_id"),
  googleId: text("google_id"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export const chatSessions = sqliteTable("chat_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New Chat"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const challenges = sqliteTable("challenges", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  difficulty: integer("difficulty").notNull(),
  category: text("category").notNull(),
  scenario: text("scenario").notNull(),
  objectives: text("objectives").notNull().default("[]"),
  flag: text("flag").notNull(),
  dynamicFlags: integer("dynamic_flags").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const userChallenges = sqliteTable("user_challenges", {
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  challengeId: text("challenge_id")
    .notNull()
    .references(() => challenges.id, { onDelete: "cascade" }),
  assignedAt: integer("assigned_at").notNull(),
  completedAt: integer("completed_at"),
  status: text("status").notNull().default("pending"),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("info"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: integer("read").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const consoleSessions = sqliteTable("console_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  challengeId: text("challenge_id"),
  commandHistory: text("command_history").notNull().default("[]"),
  analysis: text("analysis"),
  createdAt: integer("created_at").notNull(),
  completedAt: integer("completed_at"),
});

export const leaderboard = sqliteTable("leaderboard", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  challengeId: text("challenge_id")
    .notNull()
    .references(() => challenges.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(0),
  timeSeconds: integer("time_seconds").notNull().default(0),
  toolsUsed: text("tools_used").notNull().default("[]"),
  hintsUsed: integer("hints_used").notNull().default(0),
  solvedAt: integer("solved_at").notNull(),
});

export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  page: text("page"),
  createdAt: integer("created_at").notNull(),
});

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").notNull(),
  windowStart: integer("window_start").notNull(),
  count: integer("count").notNull().default(0),
});

export const aiUsage = sqliteTable("ai_usage", {
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  count: integer("count").notNull().default(0),
});

export const aiTokenUsage = sqliteTable("ai_token_usage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  model: text("model"),
  createdAt: integer("created_at").notNull(),
});

export const emailVerifications = sqliteTable("email_verifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const passwordResets = sqliteTable("password_resets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: integer("expires_at").notNull(),
  used: integer("used").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const user2fa = sqliteTable("user_2fa", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  secret: text("secret").notNull(),
  enabled: integer("enabled").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const loginAttempts = sqliteTable("login_attempts", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  ipAddress: text("ip_address"),
  success: integer("success").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const userFlags = sqliteTable("user_flags", {
  id: text("id").primaryKey(),
  challengeId: text("challenge_id")
    .notNull()
    .references(() => challenges.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dynamicFlag: text("dynamic_flag").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const challengeSubmissions = sqliteTable("challenge_submissions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  difficulty: integer("difficulty").notNull().default(1),
  scenario: text("scenario").notNull(),
  objectives: text("objectives").default(""),
  flag: text("flag").notNull(),
  hints: text("hints").default(""),
  writeup: text("writeup").default(""),
  submittedBy: text("submitted_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  reviewNotes: text("review_notes").default(""),
  reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: integer("reviewed_at"),
  createdAt: integer("created_at").notNull(),
});
