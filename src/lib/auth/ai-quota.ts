import { requireDb } from "../db";
import { getUserSubscription, getPlanLimits } from "../stripe";
import type { Plan } from "../stripe";

interface D1PreparedStatement {
  bind(...args: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

const ANONYMOUS_KEY = "__anonymous__";

function today(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function quotaKey(userId: string | null): string {
  return userId || ANONYMOUS_KEY;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AiQuotaResult {
  allowed: boolean;
  remaining: number;
  tokensRemaining: number;
  plan: Plan;
}

export async function checkAiQuota(userId: string | null): Promise<AiQuotaResult> {
  try {
    const db = requireDb<D1Database>();
    const date = today();
    const key = quotaKey(userId);

    let plan: Plan = "free";
    if (userId) {
      const subscription = await getUserSubscription(userId);
      if (subscription?.status === "active") {
        plan = subscription.plan;
      }
    }

    const limits = getPlanLimits(plan);

    if (limits.aiMessagesPerDay === -1) {
      return { allowed: true, remaining: -1, tokensRemaining: -1, plan };
    }

    const row = await db
      .prepare("SELECT count FROM ai_usage WHERE user_id = ? AND date = ?")
      .bind(key, date)
      .first<{ count: number }>();

    const tokenRow = await db
      .prepare(
        "SELECT COALESCE(SUM(total_tokens), 0) as total FROM ai_token_usage WHERE user_id = ? AND date = ?",
      )
      .bind(key, date)
      .first<{ total: number }>();

    const used = row?.count ?? 0;
    const tokensUsed = tokenRow?.total ?? 0;
    const tokensRemaining =
      limits.maxTokensPerDay === -1 ? -1 : Math.max(0, limits.maxTokensPerDay - tokensUsed);

    return {
      allowed:
        used < limits.aiMessagesPerDay &&
        (limits.maxTokensPerDay === -1 || tokensUsed < limits.maxTokensPerDay),
      remaining: Math.max(0, limits.aiMessagesPerDay - used),
      tokensRemaining,
      plan,
    };
  } catch {
    return { allowed: true, remaining: 1, tokensRemaining: 10000, plan: "free" };
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

export async function trackTokenUsage(
  userId: string | null,
  model: string,
  usage: TokenUsage,
): Promise<void> {
  try {
    const db = requireDb<D1Database>();
    const date = today();
    const key = quotaKey(userId);

    await db
      .prepare(
        "INSERT INTO ai_token_usage (user_id, date, prompt_tokens, completion_tokens, total_tokens, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        key,
        date,
        usage.promptTokens,
        usage.completionTokens,
        usage.totalTokens,
        model,
        Math.floor(Date.now() / 1000),
      )
      .run();
  } catch {
    /* token tracking failure is non-fatal */
  }
}

export async function getTokenUsage(
  userId: string | null,
): Promise<{ totalTokens: number; promptTokens: number; completionTokens: number }> {
  try {
    const db = requireDb<D1Database>();
    const date = today();
    const key = quotaKey(userId);

    const row = await db
      .prepare(
        "SELECT COALESCE(SUM(prompt_tokens), 0) as prompt, COALESCE(SUM(completion_tokens), 0) as completion, COALESCE(SUM(total_tokens), 0) as total FROM ai_token_usage WHERE user_id = ? AND date = ?",
      )
      .bind(key, date)
      .first<{ prompt: number; completion: number; total: number }>();

    return {
      promptTokens: row?.prompt ?? 0,
      completionTokens: row?.completion ?? 0,
      totalTokens: row?.total ?? 0,
    };
  } catch {
    return { totalTokens: 0, promptTokens: 0, completionTokens: 0 };
  }
}
