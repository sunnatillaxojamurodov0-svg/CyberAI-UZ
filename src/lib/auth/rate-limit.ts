import { getEnv, requireDb } from "../db";

interface D1PreparedStatement {
  bind(...args: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

interface RateLimiterBinding {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  global: { windowSeconds: 60, maxRequests: 500 },
  auth: { windowSeconds: 60, maxRequests: 10 },
  register: { windowSeconds: 3600, maxRequests: 5 },
  chat: { windowSeconds: 60, maxRequests: 30 },
  api: { windowSeconds: 60, maxRequests: 100 },
};

const EDGE_BINDING: Record<string, string> = {
  global: "MY_RATE_LIMITER_GLOBAL",
  chat: "MY_RATE_LIMITER_CHAT",
  auth: "MY_RATE_LIMITER_AUTH",
  api: "MY_RATE_LIMITER_API",
};

import { writeAnalytics } from "../analytics";

export async function checkRateLimit(
  key: string,
  category: keyof typeof DEFAULTS = "auth",
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const bindingName = EDGE_BINDING[category];
  if (bindingName) {
    try {
      const env = getEnv();
      const limiter = env[bindingName] as RateLimiterBinding | undefined;
      if (limiter) {
        const { success } = await limiter.limit({ key });
        const config = DEFAULTS[category];
        const now = Math.floor(Date.now() / 1000);
        const windowEnd = Math.ceil(now / config.windowSeconds) * config.windowSeconds;
        return {
          allowed: success,
          remaining: success ? config.maxRequests - 1 : 0,
          resetAt: windowEnd,
        };
      }
    } catch {
      /* fall through to D1 */
    }
  }

  try {
    const db = requireDb<D1Database>();
    const config = DEFAULTS[category];
    const now = Math.floor(Date.now() / 1000);
    const windowStart = Math.floor(now / config.windowSeconds) * config.windowSeconds;
    const windowEnd = windowStart + config.windowSeconds;

    const row = await db
      .prepare("SELECT count FROM rate_limits WHERE key = ? AND window_start = ?")
      .bind(key, windowStart)
      .first<{ count: number }>();

    const currentCount = row?.count ?? 0;

    if (currentCount >= config.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: windowEnd };
    }

    if (row) {
      await db
        .prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ? AND window_start = ?")
        .bind(key, windowStart)
        .run();
    } else {
      await db
        .prepare("INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)")
        .bind(key, windowStart)
        .run();
    }

    return { allowed: true, remaining: config.maxRequests - currentCount - 1, resetAt: windowEnd };
  } catch {
    // Fail closed for auth and chat (expensive/sensitive routes), open for others
    const failClosed = category === "auth" || category === "chat";
    return { allowed: !failClosed, remaining: failClosed ? 0 : 1, resetAt: 0 };
  }
}

export function rateLimitKey(ip: string, endpoint: string): string {
  return `${ip}:${endpoint}`;
}
