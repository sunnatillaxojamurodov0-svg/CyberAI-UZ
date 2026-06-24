import { requireDb } from "../db";

interface D1PreparedStatement {
  bind(...args: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

/* ── TOTP Implementation (RFC 6238) ────────────────────────── */

function base32Encode(buffer: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }
  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    result += alphabet[parseInt(chunk, 2)];
  }
  return result;
}

function base32Decode(encoded: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of encoded.toUpperCase()) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

async function generateSecret(): Promise<string> {
  const buffer = new Uint8Array(20);
  crypto.getRandomValues(buffer);
  return base32Encode(buffer);
}

async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return new Uint8Array(signature);
}

async function generateTOTP(secret: string, timeStep: number = 30): Promise<string> {
  const key = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, time, false);

  const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, "0");
}

async function verifyTOTP(secret: string, token: string, window: number = 1): Promise<boolean> {
  const timeStep = 30;
  const currentTime = Math.floor(Date.now() / 1000 / timeStep);

  for (let i = -window; i <= window; i++) {
    const time = currentTime + i;
    const key = base32Decode(secret);
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, time, false);

    const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;

    if (code.toString().padStart(6, "0") === token) {
      return true;
    }
  }

  return false;
}

/* ── 2FA Database Operations ───────────────────────────────── */

export async function setup2FA(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
  const db = requireDb<D1Database>();
  const secret = await generateSecret();
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare("DELETE FROM user_2fa WHERE user_id = ?")
    .bind(userId)
    .run();

  await db
    .prepare(
      "INSERT INTO user_2fa (id, user_id, secret, enabled, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(crypto.randomUUID(), userId, secret, 0, now)
    .run();

  const issuer = "CyberAI";
  const accountName = userId;
  const qrCodeUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

  return { secret, qrCodeUrl };
}

export async function enable2FA(userId: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const db = requireDb<D1Database>();

  const row = await db
    .prepare("SELECT secret FROM user_2fa WHERE user_id = ? AND enabled = 0")
    .bind(userId)
    .first<{ secret: string }>();

  if (!row) {
    return { ok: false, error: "2FA setup not initiated." };
  }

  const valid = await verifyTOTP(row.secret, token);
  if (!valid) {
    return { ok: false, error: "Invalid verification code." };
  }

  await db
    .prepare("UPDATE user_2fa SET enabled = 1 WHERE user_id = ?")
    .bind(userId)
    .run();

  return { ok: true };
}

export async function disable2FA(userId: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const db = requireDb<D1Database>();

  const row = await db
    .prepare("SELECT secret FROM user_2fa WHERE user_id = ? AND enabled = 1")
    .bind(userId)
    .first<{ secret: string }>();

  if (!row) {
    return { ok: false, error: "2FA is not enabled." };
  }

  const valid = await verifyTOTP(row.secret, token);
  if (!valid) {
    return { ok: false, error: "Invalid verification code." };
  }

  await db
    .prepare("DELETE FROM user_2fa WHERE user_id = ?")
    .bind(userId)
    .run();

  return { ok: true };
}

export async function verify2FA(userId: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const db = requireDb<D1Database>();

  const row = await db
    .prepare("SELECT secret FROM user_2fa WHERE user_id = ? AND enabled = 1")
    .bind(userId)
    .first<{ secret: string }>();

  if (!row) {
    return { ok: false, error: "2FA is not enabled." };
  }

  const valid = await verifyTOTP(row.secret, token);
  if (!valid) {
    return { ok: false, error: "Invalid verification code." };
  }

  return { ok: true };
}

export async function is2FAEnabled(userId: string): Promise<boolean> {
  try {
    const db = requireDb<D1Database>();
    const row = await db
      .prepare("SELECT enabled FROM user_2fa WHERE user_id = ? AND enabled = 1")
      .bind(userId)
      .first<{ enabled: number }>();
    return row?.enabled === 1;
  } catch {
    return false;
  }
}

export async function get2FASecret(userId: string): Promise<string | null> {
  try {
    const db = requireDb<D1Database>();
    const row = await db
      .prepare("SELECT secret FROM user_2fa WHERE user_id = ?")
      .bind(userId)
      .first<{ secret: string }>();
    return row?.secret ?? null;
  } catch {
    return null;
  }
}
