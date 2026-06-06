import { requireDb, getEnv } from "../db";

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  error?: string;
  meta?: Record<string, unknown>;
}

interface D1PreparedStatement {
  bind(...args: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

/* ── Types ───────────────────────────────────────────────────── */

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: AuthUser;
  token?: string;
}

/* ── Password hashing (PBKDF2 via Web Crypto API) ───────────── */

const PBKDF2_ITERATIONS = 100_000;

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );
  const hash = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${salt}:${hash}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const computed = await hashPassword(password, salt);
  return computed === stored;
}

/* ── Token generation & hashing ─────────────────────────────── */

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ── Auth operations ────────────────────────────────────────── */

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const MIN_PASSWORD_LENGTH = 8;

export async function registerUser(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResult> {
  try {
    const db = requireDb<D1Database>();

    const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) {
      return { ok: false, error: "This email is already registered." };
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
    }

    const id = crypto.randomUUID();
    const salt = crypto.randomUUID();
    const passwordHash = await hashPassword(password, salt);
    const now = Math.floor(Date.now() / 1000);

    await db
      .prepare(
        "INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(id, email, passwordHash, name ?? null, now, now)
      .run();

    const token = generateToken();
    const tokenHash = await sha256(token);
    const expiresAt = now + SESSION_TTL;

    await db
      .prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
      .bind(tokenHash, id, now, expiresAt)
      .run();

    return {
      ok: true,
      user: { id, email, name: name ?? null, avatar_url: null },
      token,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Registration failed." };
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    const db = requireDb<D1Database>();

    const row = await db
      .prepare("SELECT id, email, password_hash, name, avatar_url FROM users WHERE email = ?")
      .bind(email)
      .first<{
        id: string;
        email: string;
        password_hash: string;
        name: string | null;
        avatar_url: string | null;
      }>();
    if (!row) {
      return { ok: false, error: "Invalid email or password." };
    }

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) {
      return { ok: false, error: "Invalid email or password." };
    }

    // Clean up expired sessions for this user
    const now = Math.floor(Date.now() / 1000);
    await db
      .prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at < ?")
      .bind(row.id, now)
      .run();

    const token = generateToken();
    const tokenHash = await sha256(token);
    const expiresAt = now + SESSION_TTL;

    await db
      .prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
      .bind(tokenHash, row.id, now, expiresAt)
      .run();

    return {
      ok: true,
      user: { id: row.id, email: row.email, name: row.name, avatar_url: row.avatar_url },
      token,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Login failed." };
  }
}

export async function verifySession(token: string): Promise<AuthResult> {
  try {
    const db = requireDb<D1Database>();
    const tokenHash = await sha256(token);
    const now = Math.floor(Date.now() / 1000);

    const row = await db
      .prepare(
        `SELECT u.id, u.email, u.name, u.avatar_url
         FROM sessions s JOIN users u ON s.user_id = u.id
         WHERE s.id = ? AND s.expires_at > ?`,
      )
      .bind(tokenHash, now)
      .first<{ id: string; email: string; name: string | null; avatar_url: string | null }>();
    if (!row) {
      return { ok: false, error: "Invalid or expired session." };
    }

    return { ok: true, user: row, token };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Session verification failed.",
    };
  }
}

export async function logoutUser(token: string): Promise<{ ok: boolean }> {
  try {
    const db = requireDb<D1Database>();
    const tokenHash = await sha256(token);
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(tokenHash).run();
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const match = cookie.match(/cyberai_session=([^;]+)/);
  return match ? match[1] : null;
}

export function setSessionCookie(token: string): string {
  return `cyberai_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL}`;
}

export function clearSessionCookie(): string {
  return `cyberai_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

/* ── Google OAuth ──────────────────────────────────────────── */

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

async function exchangeGoogleCode(code: string, redirectUri?: string): Promise<string> {
  const env = getEnv();
  const clientId = env.GOOGLE_CLIENT_ID as string;
  const clientSecret = env.GOOGLE_CLIENT_SECRET as string;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri:
        redirectUri ||
        `${new URL(String(env.REDIRECT_URI || "http://localhost:8080")).origin}/auth/callback`,
      grant_type: "authorization_code",
    }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(data.error ?? "Failed to exchange Google code");
  return data.access_token;
}

async function fetchGoogleUser(accessToken: string): Promise<GoogleUser> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const user = (await res.json()) as GoogleUser;
  if (!user.email) throw new Error("Google account has no email");
  return user;
}

export async function signInWithGoogle(code: string, redirectUri?: string): Promise<AuthResult> {
  try {
    const db = requireDb<D1Database>();
    const accessToken = await exchangeGoogleCode(code, redirectUri);
    const googleUser = await fetchGoogleUser(accessToken);
    const googleId = googleUser.id;

    const existing = await db
      .prepare("SELECT id, email, name, avatar_url FROM users WHERE google_id = ?")
      .bind(googleId)
      .first<{ id: string; email: string; name: string | null; avatar_url: string | null }>();

    let user: { id: string; email: string; name: string | null; avatar_url: string | null };
    const now = Math.floor(Date.now() / 1000);

    if (existing) {
      user = existing;
      await db
        .prepare("UPDATE users SET name = ?, avatar_url = ?, updated_at = ? WHERE id = ?")
        .bind(googleUser.name, googleUser.picture, now, user.id)
        .run();
    } else {
      const id = crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO users (id, email, google_id, name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id, googleUser.email, googleId, googleUser.name, googleUser.picture, now, now)
        .run();
      user = { id, email: googleUser.email, name: googleUser.name, avatar_url: googleUser.picture };
    }

    await db
      .prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at < ?")
      .bind(user.id, now)
      .run();

    const token = generateToken();
    const tokenHash = await sha256(token);
    const expiresAt = now + SESSION_TTL;

    await db
      .prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
      .bind(tokenHash, user.id, now, expiresAt)
      .run();

    return { ok: true, user, token };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Google sign-in failed." };
  }
}

/* ── GitHub OAuth ──────────────────────────────────────────── */

interface GitHubUser {
  id: number;
  login: string;
  email: string;
  name: string;
  avatar_url: string;
}

async function exchangeGithubCode(code: string): Promise<string> {
  const env = getEnv();
  const clientId = env.GITHUB_CLIENT_ID as string;
  const clientSecret = env.GITHUB_CLIENT_SECRET as string;

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(data.error ?? "Failed to exchange GitHub code");
  return data.access_token;
}

async function fetchGithubUser(accessToken: string): Promise<GitHubUser> {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  const user = (await res.json()) as GitHubUser;
  if (!user.email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });
    const emails = (await emailsRes.json()) as {
      email: string;
      primary: boolean;
      verified: boolean;
    }[];
    const primary = emails.find((e) => e.primary && e.verified);
    user.email = primary?.email ?? emails[0]?.email ?? `${user.login}@github.local`;
  }
  return user;
}

export async function signInWithGithub(code: string): Promise<AuthResult> {
  try {
    const db = requireDb<D1Database>();
    const accessToken = await exchangeGithubCode(code);
    const githubUser = await fetchGithubUser(accessToken);
    const githubId = String(githubUser.id);

    const existing = await db
      .prepare("SELECT id, email, name, avatar_url FROM users WHERE github_id = ?")
      .bind(githubId)
      .first<{ id: string; email: string; name: string | null; avatar_url: string | null }>();

    let user: { id: string; email: string; name: string | null; avatar_url: string | null };
    const now = Math.floor(Date.now() / 1000);

    if (existing) {
      user = existing;
      await db
        .prepare("UPDATE users SET name = ?, avatar_url = ?, updated_at = ? WHERE id = ?")
        .bind(githubUser.name || githubUser.login, githubUser.avatar_url, now, user.id)
        .run();
    } else {
      const id = crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO users (id, email, github_id, name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          id,
          githubUser.email,
          githubId,
          githubUser.name || githubUser.login,
          githubUser.avatar_url,
          now,
          now,
        )
        .run();
      user = {
        id,
        email: githubUser.email,
        name: githubUser.name || githubUser.login,
        avatar_url: githubUser.avatar_url,
      };
    }

    await db
      .prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at < ?")
      .bind(user.id, now)
      .run();

    const token = generateToken();
    const tokenHash = await sha256(token);
    const expiresAt = now + SESSION_TTL;

    await db
      .prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
      .bind(tokenHash, user.id, now, expiresAt)
      .run();

    return { ok: true, user, token };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "GitHub sign-in failed." };
  }
}
