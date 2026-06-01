import { requireDb } from "../db";

interface D1PreparedStatement {
  bind(...args: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

const DAILY_LIMIT = 100;
const ANONYMOUS_KEY = "__anonymous__";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function quotaKey(userId: string | null): string {
  return userId || ANONYMOUS_KEY;
}

export async function checkAiQuota(
  userId: string | null,
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const db = requireDb<D1Database>();
    const date = today();
    const key = quotaKey(userId);

    const row = await db
      .prepare("SELECT count FROM ai_usage WHERE user_id = ? AND date = ?")
      .bind(key, date)
      .first<{ count: number }>();

    const used = row?.count ?? 0;
    return { allowed: used < DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - used) };
  } catch {
    return { allowed: true, remaining: 1 };
  }
}

export async function incrementAiUsage(userId: string | null): Promise<void> {
  try {
    const db = requireDb<D1Database>();
    const date = today();
    const key = quotaKey(userId);

    const row = await db
      .prepare("SELECT count FROM ai_usage WHERE user_id = ? AND date = ?")
      .bind(key, date)
      .first<{ count: number }>();

    if (row) {
      await db
        .prepare("UPDATE ai_usage SET count = count + 1 WHERE user_id = ? AND date = ?")
        .bind(key, date)
        .run();
    } else {
      await db
        .prepare("INSERT INTO ai_usage (user_id, date, count) VALUES (?, ?, 1)")
        .bind(key, date)
        .run();
    }
  } catch {
    /* quota tracking failure is non-fatal */
  }
}
