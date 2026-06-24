import { requireDb } from "./db";

interface D1PreparedStatement {
  bind(...args: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

async function generateUserFlag(challengeId: string, userId: string): Promise<string> {
  const data = `${challengeId}:${userId}:${Date.now()}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `CTF{${hashHex.slice(0, 16)}}`;
}

export async function getDynamicFlag(
  challengeId: string,
  userId: string,
): Promise<{ flag: string; isDynamic: boolean }> {
  try {
    const db = requireDb<D1Database>();

    const challenge = await db
      .prepare("SELECT flag, dynamic_flags FROM challenges WHERE id = ?")
      .bind(challengeId)
      .first<{ flag: string; dynamic_flags?: number }>();

    if (!challenge) {
      return { flag: "", isDynamic: false };
    }

    if (!challenge.dynamic_flags) {
      return { flag: challenge.flag, isDynamic: false };
    }

    const existingFlag = await db
      .prepare("SELECT dynamic_flag FROM user_flags WHERE challenge_id = ? AND user_id = ?")
      .bind(challengeId, userId)
      .first<{ dynamic_flag: string }>();

    if (existingFlag) {
      return { flag: existingFlag.dynamic_flag, isDynamic: true };
    }

    const newFlag = await generateUserFlag(challengeId, userId);
    const now = Math.floor(Date.now() / 1000);

    await db
      .prepare("INSERT INTO user_flags (id, challenge_id, user_id, dynamic_flag, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), challengeId, userId, newFlag, now)
      .run();

    return { flag: newFlag, isDynamic: true };
  } catch {
    return { flag: "", isDynamic: false };
  }
}

export async function verifyFlag(
  challengeId: string,
  userId: string,
  submittedFlag: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const db = requireDb<D1Database>();

    const challenge = await db
      .prepare("SELECT flag FROM challenges WHERE id = ?")
      .bind(challengeId)
      .first<{ flag: string }>();

    if (!challenge) {
      return { valid: false, error: "Challenge not found" };
    }

    const { flag: correctFlag, isDynamic } = await getDynamicFlag(challengeId, userId);

    if (isDynamic) {
      if (submittedFlag.trim() === correctFlag.trim()) {
        await db
          .prepare("UPDATE user_challenges SET status = 'completed', completed_at = ? WHERE user_id = ? AND challenge_id = ?")
          .bind(Math.floor(Date.now() / 1000), userId, challengeId)
          .run();
        return { valid: true };
      }
    } else {
      if (submittedFlag.trim() === challenge.flag.trim()) {
        await db
          .prepare("UPDATE user_challenges SET status = 'completed', completed_at = ? WHERE user_id = ? AND challenge_id = ?")
          .bind(Math.floor(Date.now() / 1000), userId, challengeId)
          .run();
        return { valid: true };
      }
    }

    return { valid: false, error: "Invalid flag" };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : "Verification failed" };
  }
}

export async function enableDynamicFlags(challengeId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = requireDb<D1Database>();
    await db
      .prepare("UPDATE challenges SET dynamic_flags = 1 WHERE id = ?")
      .bind(challengeId)
      .run();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to enable dynamic flags" };
  }
}

export async function disableDynamicFlags(challengeId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = requireDb<D1Database>();
    await db
      .prepare("UPDATE challenges SET dynamic_flags = 0 WHERE id = ?")
      .bind(challengeId)
      .run();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to disable dynamic flags" };
  }
}
