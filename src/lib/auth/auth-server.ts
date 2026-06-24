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
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60; // 15 minutes

/* ── Login attempt tracking ─────────────────────────────────── */

export async function recordLoginAttempt(
  email: string,
  ip: string,
  success: boolean,
): Promise<{ locked: boolean; attemptsRemaining: number; lockoutExpires?: number }> {
  try {
    const db = requireDb<D1Database>();
    const now = Math.floor(Date.now() / 1000);

    await db
      .prepare(
        "INSERT INTO login_attempts (id, email, ip_address, success, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(crypto.randomUUID(), email, ip, success ? 1 : 0, now)
      .run();

    if (success) {
      await db
        .prepare("DELETE FROM login_attempts WHERE email = ? AND success = 0")
        .bind(email)
        .run();
      return { locked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS };
    }

    const cutoff = now - LOCKOUT_DURATION;
    const recentFailed = await db
      .prepare(
        "SELECT COUNT(*) as count FROM login_attempts WHERE email = ? AND success = 0 AND created_at > ?",
      )
      .bind(email, cutoff)
      .first<{ count: number }>();

    const failedCount = recentFailed?.count ?? 0;

    if (failedCount >= MAX_LOGIN_ATTEMPTS) {
      const lockoutExpires = now + LOCKOUT_DURATION;
      return { locked: true, attemptsRemaining: 0, lockoutExpires };
    }

    return {
      locked: false,
      attemptsRemaining: MAX_LOGIN_ATTEMPTS - failedCount,
    };
  } catch {
    return { locked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS };
  }
}

export async function isAccountLocked(email: string): Promise<{ locked: boolean; lockoutExpires?: number }> {
  try {
    const db = requireDb<D1Database>();
    const now = Math.floor(Date.now() / 1000);
    const cutoff = now - LOCKOUT_DURATION;

    const recentFailed = await db
      .prepare(
        "SELECT COUNT(*) as count FROM login_attempts WHERE email = ? AND success = 0 AND created_at > ?",
      )
      .bind(email, cutoff)
      .first<{ count: number }>();

    const failedCount = recentFailed?.count ?? 0;

    if (failedCount >= MAX_LOGIN_ATTEMPTS) {
      const lockoutExpires = now + LOCKOUT_DURATION;
      return { locked: true, lockoutExpires };
    }

    return { locked: false };
  } catch {
    return { locked: false };
  }
}

export async function clearLoginAttempts(email: string): Promise<void> {
  try {
    const db = requireDb<D1Database>();
    await db
      .prepare("DELETE FROM login_attempts WHERE email = ?")
      .bind(email)
      .run();
  } catch {
    // non-fatal
  }
}

/* ── Auth operations ────────────────────────────────────────── */

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
        "INSERT INTO users (id, email, password_hash, name, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(id, email, passwordHash, name ?? null, 0, now, now)
      .run();

    return {
      ok: true,
      user: { id, email, name: name ?? null, avatar_url: null },
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

/* ── Email verification ────────────────────────────────────── */

const VERIFICATION_TTL = 24 * 60 * 60; // 24 hours

export async function createVerificationToken(userId: string): Promise<string> {
  const db = requireDb<D1Database>();
  const token = generateToken();
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + VERIFICATION_TTL;

  await db
    .prepare("DELETE FROM email_verifications WHERE user_id = ?")
    .bind(userId)
    .run();

  await db
    .prepare(
      "INSERT INTO email_verifications (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(crypto.randomUUID(), userId, tokenHash, expiresAt, now)
    .run();

  return token;
}

export async function verifyEmail(token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = requireDb<D1Database>();
    const tokenHash = await sha256(token);
    const now = Math.floor(Date.now() / 1000);

    const row = await db
      .prepare(
        "SELECT id, user_id FROM email_verifications WHERE token_hash = ? AND expires_at > ?",
      )
      .bind(tokenHash, now)
      .first<{ id: string; user_id: string }>();

    if (!row) {
      return { ok: false, error: "Invalid or expired verification link." };
    }

    await db
      .prepare("UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?")
      .bind(now, row.user_id)
      .run();

    await db
      .prepare("DELETE FROM email_verifications WHERE id = ?")
      .bind(row.id)
      .run();

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Verification failed." };
  }
}

export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const db = requireDb<D1Database>();
    const row = await db
      .prepare("SELECT email_verified FROM users WHERE id = ?")
      .bind(userId)
      .first<{ email_verified: number }>();
    return row?.email_verified === 1;
  } catch {
    return false;
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const env = getEnv();
  const resendKey = env.RESEND_API_KEY as string;

  if (!resendKey) {
    console.log(`[DEV] Verification link: ${env.APP_URL || "http://localhost:5173"}/auth/verify?token=${token}`);
    return;
  }

  const verifyUrl = `${env.APP_URL || "https://app.cyberaiuz.workers.dev"}/auth/verify?token=${token}`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "CyberAI <noreply@cyberaiuz.workers.dev>",
      to: email,
      subject: "Verify your CyberAI account",
      html: `
        <div style="font-family: monospace; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #10b981;">Verify your email</h2>
          <p>Click the button below to verify your CyberAI account:</p>
          <a href="${verifyUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Verify Email
          </a>
          <p style="margin-top: 24px; color: #666; font-size: 12px;">
            This link expires in 24 hours. If you didn't create an account, ignore this email.
          </p>
        </div>
      `,
    }),
  });
}

/* ── Password reset ────────────────────────────────────────── */

const RESET_TTL = 60 * 60; // 1 hour

export async function createPasswordResetToken(email: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const db = requireDb<D1Database>();

    const user = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(email)
      .first<{ id: string }>();

    if (!user) {
      return { ok: true };
    }

    const token = generateToken();
    const tokenHash = await sha256(token);
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + RESET_TTL;

    await db
      .prepare("DELETE FROM password_resets WHERE user_id = ?")
      .bind(user.id)
      .run();

    await db
      .prepare(
        "INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(crypto.randomUUID(), user.id, tokenHash, expiresAt, now)
      .run();

    return { ok: true, token };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create reset token." };
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = requireDb<D1Database>();
    const tokenHash = await sha256(token);
    const now = Math.floor(Date.now() / 1000);

    const row = await db
      .prepare(
        "SELECT id, user_id FROM password_resets WHERE token_hash = ? AND expires_at > ? AND used = 0",
      )
      .bind(tokenHash, now)
      .first<{ id: string; user_id: string }>();

    if (!row) {
      return { ok: false, error: "Invalid or expired reset link." };
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
    }

    const salt = crypto.randomUUID();
    const passwordHash = await hashPassword(newPassword, salt);

    await db
      .prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
      .bind(passwordHash, now, row.user_id)
      .run();

    await db
      .prepare("UPDATE password_resets SET used = 1 WHERE id = ?")
      .bind(row.id)
      .run();

    await db
      .prepare("DELETE FROM sessions WHERE user_id = ?")
      .bind(row.user_id)
      .run();

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Password reset failed." };
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const env = getEnv();
  const resendKey = env.RESEND_API_KEY as string;

  if (!resendKey) {
    console.log(`[DEV] Reset link: ${env.APP_URL || "http://localhost:5173"}/auth/reset-password?token=${token}`);
    return;
  }

  const resetUrl = `${env.APP_URL || "https://app.cyberaiuz.workers.dev"}/auth/reset-password?token=${token}`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "CyberAI <noreply@cyberaiuz.workers.dev>",
      to: email,
      subject: "Reset your CyberAI password",
      html: `
        <div style="font-family: monospace; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #10b981;">Reset your password</h2>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Reset Password
          </a>
          <p style="margin-top: 24px; color: #666; font-size: 12px;">
            This link expires in 1 hour. If you didn't request a password reset, ignore this email.
          </p>
        </div>
      `,
    }),
  });
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
