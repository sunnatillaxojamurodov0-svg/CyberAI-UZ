import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAdmin, isUserAdmin, adminAuthResponse } from "@/lib/auth/auth-admin";

const mockFirst = vi.fn();
const mockVerifySession = vi.fn();

vi.mock("@/lib/db", () => ({
  requireDb: vi.fn(() => ({
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: mockFirst,
      }),
    }),
  })),
}));

vi.mock("@/lib/auth/auth-server", () => ({
  getSessionToken: vi.fn((request: Request) => {
    const cookie = request.headers.get("cookie");
    if (!cookie) return null;
    const match = cookie.match(/cyberai_session=([^;]+)/);
    return match ? match[1] : null;
  }),
  verifySession: (...args: unknown[]) => mockVerifySession(...args),
}));

function requestWithCookie(token?: string): Request {
  const headers = token ? { cookie: `cyberai_session=${token}` } : {};
  return new Request("https://example.com/api/admin/challenges", { headers });
}

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session cookie is present", async () => {
    const result = await requireAdmin(requestWithCookie());
    expect(result).toEqual({ ok: false, status: 401, error: "Unauthorized" });
  });

  it("returns 401 when session is invalid", async () => {
    mockVerifySession.mockResolvedValue({ ok: false, error: "Invalid session" });

    const result = await requireAdmin(requestWithCookie("bad-token"));
    expect(result).toEqual({ ok: false, status: 401, error: "Unauthorized" });
  });

  it("returns 403 when authenticated user is not admin", async () => {
    mockVerifySession.mockResolvedValue({
      ok: true,
      user: { id: "user-1", email: "user@test.com", name: null, avatar_url: null },
    });
    mockFirst.mockResolvedValue({ is_admin: 0 });

    const result = await requireAdmin(requestWithCookie("valid-token"));
    expect(result).toEqual({ ok: false, status: 403, error: "Admin access required" });
  });

  it("returns user when authenticated admin", async () => {
    const user = { id: "admin-1", email: "admin@test.com", name: "Admin", avatar_url: null };
    mockVerifySession.mockResolvedValue({ ok: true, user });
    mockFirst.mockResolvedValue({ is_admin: 1 });

    const result = await requireAdmin(requestWithCookie("admin-token"));
    expect(result).toEqual({ ok: true, user });
  });
});

describe("isUserAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when is_admin is set", async () => {
    mockFirst.mockResolvedValue({ is_admin: 1 });
    await expect(isUserAdmin("admin-1")).resolves.toBe(true);
  });

  it("returns false when is_admin is unset", async () => {
    mockFirst.mockResolvedValue({ is_admin: 0 });
    await expect(isUserAdmin("user-1")).resolves.toBe(false);
  });
});

describe("adminAuthResponse", () => {
  it("maps 403 to JSON response", () => {
    const res = adminAuthResponse({ ok: false, status: 403, error: "Admin access required" });
    expect(res.status).toBe(403);
  });
});
