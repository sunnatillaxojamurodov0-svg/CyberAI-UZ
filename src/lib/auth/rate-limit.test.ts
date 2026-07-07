import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLimit = vi.fn();
const mockRun = vi.fn();
const mockFirst = vi.fn();
const mockBind = vi.fn(() => ({ first: mockFirst, run: mockRun }));
const mockPrepare = vi.fn(() => ({ bind: mockBind }));

vi.mock("@/lib/db", () => ({
  requireDb: vi.fn(() => ({
    prepare: mockPrepare,
  })),
  getEnv: vi.fn(() => ({
    MY_RATE_LIMITER_GLOBAL: { limit: mockLimit },
    MY_RATE_LIMITER_CHAT: { limit: mockLimit },
    MY_RATE_LIMITER_AUTH: { limit: mockLimit },
    MY_RATE_LIMITER_API: { limit: mockLimit },
  })),
}));

vi.mock("@/lib/analytics", () => ({
  writeAnalytics: vi.fn(),
}));

import { checkRateLimit, rateLimitKey } from "./rate-limit";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("rateLimitKey", () => {
  it("combines ip and endpoint with colon", () => {
    expect(rateLimitKey("127.0.0.1", "/api/auth/login")).toBe("127.0.0.1:/api/auth/login");
  });
});

describe("checkRateLimit", () => {
  it("uses edge rate limiter when available", async () => {
    mockLimit.mockResolvedValueOnce({ success: true });

    const result = await checkRateLimit("test-key", "auth");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
    expect(mockLimit).toHaveBeenCalledWith({ key: "test-key" });
  });

  it("returns blocked when edge limiter rejects", async () => {
    mockLimit.mockResolvedValueOnce({ success: false });

    const result = await checkRateLimit("test-key", "auth");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("falls back to D1 when edge limiter errors", async () => {
    mockLimit.mockRejectedValueOnce(new Error("edge unavailable"));
    mockRun.mockResolvedValueOnce(undefined);
    mockRun.mockResolvedValueOnce(undefined);
    mockFirst.mockResolvedValueOnce({ count: 1 });

    const result = await checkRateLimit("test-key", "auth");
    expect(result.allowed).toBe(true);
    expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining("rate_limits"));
  });

  it("blocks when D1 count exceeds max", async () => {
    mockRun.mockResolvedValueOnce(undefined);
    mockRun.mockResolvedValueOnce(undefined);
    mockFirst.mockResolvedValueOnce({ count: 11 });

    const result = await checkRateLimit("test-key", "auth");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("fails closed for auth category on D1 error", async () => {
    mockRun.mockRejectedValueOnce(new Error("db down"));

    const result = await checkRateLimit("test-key", "auth");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("fails open for non-sensitive categories on D1 error", async () => {
    mockRun.mockRejectedValueOnce(new Error("db down"));

    const result = await checkRateLimit("test-key", "api");
    expect(result.allowed).toBe(true);
  });

  it("uses the correct D1 defaults", async () => {
    mockLimit.mockRejectedValueOnce(new Error("edge down"));
    mockRun.mockResolvedValueOnce(undefined);
    mockRun.mockResolvedValueOnce(undefined);
    mockFirst.mockResolvedValueOnce({ count: 1 });

    const result = await checkRateLimit("test-key", "register");
    expect(result.allowed).toBe(true);
    expect(result.resetAt).toBeGreaterThan(0);
  });
});
