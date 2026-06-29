import { requireDb } from "../db";
import { getSessionToken, verifySession, type AuthUser } from "./auth-server";

interface D1PreparedStatement {
  bind(...args: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

export type AdminAuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; status: 401 | 403; error: string };

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const db = requireDb<D1Database>();
    const row = await db
      .prepare("SELECT is_admin FROM users WHERE id = ?")
      .bind(userId)
      .first<{ is_admin: number }>();
    return Boolean(row?.is_admin);
  } catch {
    return false;
  }
}

/** Verify session and enforce admin role from DB. */
export async function requireAdmin(request: Request): Promise<AdminAuthResult> {
  const token = getSessionToken(request);
  if (!token) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const session = await verifySession(token);
  if (!session.ok || !session.user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const admin = await isUserAdmin(session.user.id);
  if (!admin) {
    return { ok: false, status: 403, error: "Admin access required" };
  }

  return { ok: true, user: session.user };
}

export function adminAuthResponse(result: Extract<AdminAuthResult, { ok: false }>): Response {
  return new Response(JSON.stringify({ error: result.error }), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
}
