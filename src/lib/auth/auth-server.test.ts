import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRun = vi.fn();
const mockFirst = vi.fn();
const mockBind = vi.fn(() => ({ first: mockFirst, run: mockRun }));
const mockPrepare = vi.fn(() => ({ bind: mockBind }));

vi.mock("@/lib/db", () => ({
  requireDb: vi.fn(() => ({
    prepare: mockPrepare,
  })),
  getEnv: vi.fn(() => ({
    MAX_LOGIN_ATTEMPTS: "3",
    LOCKOUT_DURATION_MINUTES: "5",
    RESEND_API_KEY: "",
    APP_URL: "http://localhost:5173",
  })),
}));

import {
  hashPassword,
  verifyPassword,
  recordLoginAttempt,
  isAccountLocked,
  clearLoginAttempts,
  registerUser,
  loginUser,
  logoutUser,
  verifySession,
  getSessionToken,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  createPasswordResetToken,
  resetPassword,
  createVerificationToken,
  verifyEmail,
  isEmailVerified,
} from "./auth-server";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("hashPassword / verifyPassword", () => {
  it("produces a consistent format: salt:hash", async () => {
    const result = await hashPassword("myPassword123", "test-salt-12345");
    expect(result).toContain("test-salt-12345:");
  });

  it("verifyPassword returns true for matching password", async () => {
    const hashed = await hashPassword("securePass1!", "salt123");
    const valid = await verifyPassword("securePass1!", hashed);
    expect(valid).toBe(true);
  });

  it("verifyPassword returns false for wrong password", async () => {
    const hashed = await hashPassword("correctPass1!", "salt456");
    const valid = await verifyPassword("wrongPass1!", hashed);
    expect(valid).toBe(false);
  });
});

describe("recordLoginAttempt", () => {
  it("records a successful attempt and clears failures", async () => {
    mockRun.mockResolvedValueOnce(undefined);
    mockRun.mockResolvedValueOnce(undefined);

    const result = await recordLoginAttempt("test@test.com", "127.0.0.1", true);
    expect(result.locked).toBe(false);
    expect(result.attemptsRemaining).toBe(3);
  });

  it("records a failed attempt and returns remaining count", async () => {
    mockRun.mockResolvedValueOnce(undefined);
    mockFirst.mockResolvedValueOnce({ count: 1 });

    const result = await recordLoginAttempt("test@test.com", "127.0.0.1", false);
    expect(result.locked).toBe(false);
    expect(result.attemptsRemaining).toBe(2);
  });

  it("locks account after max failed attempts", async () => {
    mockRun.mockResolvedValueOnce(undefined);
    mockFirst.mockResolvedValueOnce({ count: 3 });

    const result = await recordLoginAttempt("test@test.com", "127.0.0.1", false);
    expect(result.locked).toBe(true);
    expect(result.attemptsRemaining).toBe(0);
    expect(result.lockoutExpires).toBeGreaterThan(0);
  });

  it("gracefully handles db error - returns safe defaults", async () => {
    mockRun.mockRejectedValueOnce(new Error("DB error"));

    const result = await recordLoginAttempt("test@test.com", "127.0.0.1", false);
    expect(result.locked).toBe(false);
    expect(result.attemptsRemaining).toBe(3);
  });
});

describe("isAccountLocked", () => {
  it("returns locked=false when no failed attempts", async () => {
    mockFirst.mockResolvedValueOnce({ count: 0 });

    const result = await isAccountLocked("test@test.com");
    expect(result.locked).toBe(false);
  });

  it("returns locked=true when threshold reached", async () => {
    mockFirst.mockResolvedValueOnce({ count: 3 });

    const result = await isAccountLocked("test@test.com");
    expect(result.locked).toBe(true);
    expect(result.lockoutExpires).toBeGreaterThan(0);
  });
});

describe("clearLoginAttempts", () => {
  it("deletes login attempts for email", async () => {
    mockRun.mockResolvedValueOnce(undefined);
    await expect(clearLoginAttempts("test@test.com")).resolves.toBeUndefined();
    expect(mockPrepare).toHaveBeenCalledWith("DELETE FROM login_attempts WHERE email = ?");
  });

  it("does not throw on error", async () => {
    mockRun.mockRejectedValueOnce(new Error("fail"));
    await expect(clearLoginAttempts("test@test.com")).resolves.toBeUndefined();
  });
});

describe("registerUser", () => {
  it("registers a new user", async () => {
    mockFirst.mockResolvedValueOnce(null);
    mockRun.mockResolvedValueOnce(undefined);

    const result = await registerUser("new@test.com", "password12345", "New User");
    expect(result.ok).toBe(true);
    if (result.ok && result.user) {
      expect(result.user.email).toBe("new@test.com");
      expect(result.user.name).toBe("New User");
    }
  });

  it("rejects duplicate email", async () => {
    mockFirst.mockResolvedValueOnce({ id: "existing-id" });

    const result = await registerUser("existing@test.com", "password12345");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("already registered");
    }
  });

  it("rejects short password", async () => {
    const result = await registerUser("test@test.com", "short");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("at least 12");
    }
  });
});

describe("loginUser", () => {
  let passwordHash: string;

  beforeEach(async () => {
    passwordHash = await hashPassword("correctPass1!", "saltsalt123");
  });

  it("returns auth result with token on valid credentials", async () => {
    const mockUser = {
      id: "user-1",
      email: "user@test.com",
      password_hash: passwordHash,
      name: "Test User",
      avatar_url: null,
    };
    mockFirst.mockResolvedValueOnce(mockUser);
    mockRun.mockResolvedValueOnce(undefined);
    mockRun.mockResolvedValueOnce(undefined);

    const result = await loginUser("user@test.com", "correctPass1!", false);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user?.email).toBe("user@test.com");
      expect(result.token).toBeTruthy();
      expect(result.expiresAt).toBeGreaterThan(0);
    }
  });

  it("rejects non-existent user", async () => {
    mockFirst.mockResolvedValueOnce(null);

    const result = await loginUser("ghost@test.com", "password12345");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Invalid email or password");
  });

  it("rejects wrong password", async () => {
    const mockUser = {
      id: "user-1",
      email: "user@test.com",
      password_hash: passwordHash,
      name: "Test User",
      avatar_url: null,
    };
    mockFirst.mockResolvedValueOnce(mockUser);

    const result = await loginUser("user@test.com", "wrongPassword1!");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Invalid email or password");
  });
});

describe("verifySession", () => {
  it("returns user for valid session", async () => {
    const sessionRow = {
      id: "user-1",
      email: "user@test.com",
      name: "Test",
      avatar_url: null,
      is_admin: 0,
    };
    mockFirst.mockResolvedValueOnce(sessionRow);

    const result = await verifySession("valid-token");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user?.email).toBe("user@test.com");
    }
  });

  it("rejects expired/invalid session", async () => {
    mockFirst.mockResolvedValueOnce(null);

    const result = await verifySession("bad-token");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Invalid or expired");
  });

  it("handles database errors gracefully", async () => {
    mockFirst.mockRejectedValueOnce(new Error("DB fail"));

    const result = await verifySession("token");
    expect(result.ok).toBe(false);
  });
});

describe("logoutUser", () => {
  it("deletes session", async () => {
    mockRun.mockResolvedValueOnce(undefined);
    const result = await logoutUser("test-token");
    expect(result).toEqual({ ok: true });
  });

  it("does not throw on error", async () => {
    mockRun.mockRejectedValueOnce(new Error("fail"));
    const result = await logoutUser("test-token");
    expect(result).toEqual({ ok: true });
  });
});

describe("cookie helpers", () => {
  it("getSessionToken extracts token from cookie header", () => {
    const req = new Request("https://example.com", {
      headers: { cookie: "cyberai_session=abc123; other=val" },
    });
    expect(getSessionToken(req)).toBe("abc123");
  });

  it("getSessionToken returns null without cookie", () => {
    const req = new Request("https://example.com");
    expect(getSessionToken(req)).toBeNull();
  });

  it("setSessionCookie produces correct format", () => {
    const cookie = setSessionCookie("tok123", 3600);
    expect(cookie).toContain("cyberai_session=tok123");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Max-Age=3600");
  });

  it("clearSessionCookie expires immediately", () => {
    const cookie = clearSessionCookie();
    expect(cookie).toContain("Max-Age=0");
  });
});

describe("requireAuth", () => {
  it("returns 401 when no session token", async () => {
    const req = new Request("https://example.com");
    const result = await requireAuth(req);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("returns user when session valid", async () => {
    const req = new Request("https://example.com", {
      headers: { cookie: "cyberai_session=valid-token" },
    });
    mockFirst.mockResolvedValueOnce({
      id: "user-1",
      email: "user@test.com",
      name: "Test",
      avatar_url: null,
      is_admin: 0,
    });

    const result = await requireAuth(req);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.email).toBe("user@test.com");
    }
  });
});

describe("password reset", () => {
  it("createPasswordResetToken returns token for existing user", async () => {
    mockFirst.mockResolvedValueOnce({ id: "user-1" });
    mockRun.mockResolvedValueOnce(undefined);
    mockRun.mockResolvedValueOnce(undefined);

    const result = await createPasswordResetToken("user@test.com");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.token).toBeTruthy();
  });

  it("createPasswordResetToken returns ok even for unknown email (no enumeration)", async () => {
    mockFirst.mockResolvedValueOnce(null);

    const result = await createPasswordResetToken("ghost@test.com");
    expect(result.ok).toBe(true);
    expect(result.token).toBeUndefined();
  });

  it("resetPassword resets with valid token", async () => {
    mockFirst.mockResolvedValueOnce({ id: "reset-id", user_id: "user-1" });
    mockRun.mockResolvedValueOnce(undefined);
    mockRun.mockResolvedValueOnce(undefined);
    mockRun.mockResolvedValueOnce(undefined);

    const result = await resetPassword("valid-token", "newPassword123!");
    expect(result.ok).toBe(true);
  });

  it("resetPassword rejects expired token", async () => {
    mockFirst.mockResolvedValueOnce(null);

    const result = await resetPassword("expired-token", "newPassword123!");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Invalid or expired");
  });

  it("resetPassword enforces minimum length", async () => {
    mockFirst.mockResolvedValueOnce({ id: "reset-id", user_id: "user-1" });

    const result = await resetPassword("valid-token", "short");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("at least 12");
  });
});

describe("email verification", () => {
  it("createVerificationToken stores token and returns it", async () => {
    mockRun.mockResolvedValueOnce(undefined);
    mockRun.mockResolvedValueOnce(undefined);

    const token = await createVerificationToken("user-1");
    expect(token).toBeTruthy();
  });

  it("verifyEmail returns ok for valid token", async () => {
    mockFirst.mockResolvedValueOnce({ id: "vt-id", user_id: "user-1" });
    mockRun.mockResolvedValueOnce(undefined);
    mockRun.mockResolvedValueOnce(undefined);

    const result = await verifyEmail("valid-token");
    expect(result.ok).toBe(true);
  });

  it("verifyEmail rejects invalid token", async () => {
    mockFirst.mockResolvedValueOnce(null);

    const result = await verifyEmail("bad-token");
    expect(result.ok).toBe(false);
  });

  it("isEmailVerified returns true when verified", async () => {
    mockFirst.mockResolvedValueOnce({ email_verified: 1 });
    const result = await isEmailVerified("user-1");
    expect(result).toBe(true);
  });

  it("isEmailVerified returns false when not verified", async () => {
    mockFirst.mockResolvedValueOnce({ email_verified: 0 });
    const result = await isEmailVerified("user-1");
    expect(result).toBe(false);
  });
});
