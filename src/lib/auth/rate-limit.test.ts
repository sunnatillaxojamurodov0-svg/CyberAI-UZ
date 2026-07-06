import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimitKey } from "@/lib/auth/rate-limit";

let mockDb: unknown = null;
let mockEnv: Record<string, unknown> = {};

vi.mock("@/lib/db", () => ({
  requireDb: vi.fn(() => {
    if (!mockDb) throw new Error("DB not available");
    return mockDb;
  }),
  getEnv: vi.fn(() => mockEnv),
}));

vi.mock("@/lib/analytics", () => ({
  writeAnalytics: vi.fn(),
}));

function makeD1Mock(firstResult: unknown = null) {
  const run = vi.fn().mockResolvedValue({});
  const first = vi.fn().mockResolvedValue(firstResult);
  const bind = vi.fn().mockReturnValue({ first, run });
  const prepare = vi.fn().mockReturnValue({ bind });
  return { prepare, bind, first, run };
}

describe("Rate Limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:01:00Z"));
    mockDb = null;
    mockEnv = {};
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rateLimitKey", () => {
    it("should combine ip and endpoint with colon separator", () => {
      const key = rateLimitKey("192.168.1.1", "/api/auth/login");
      expect(key).toBe("192.168.1.1:/api/auth/login");
    });

    it("should handle IPv6 addresses", () => {
      const key = rateLimitKey("::1", "/api/chat");
      expect(key).toBe("::1:/api/chat");
    });

    it("should handle empty values", () => {
      const key = rateLimitKey("", "");
      expect(key).toBe(":");
    });

    it("should preserve special characters in endpoint", () => {
      const key = rateLimitKey("10.0.0.1", "/api/auth?type=register");
      expect(key).toBe("10.0.0.1:/api/auth?type=register");
    });
  });

  describe("checkRateLimit", () => {
    it("should use edge binding when available and allow request", async () => {
      const limiter = { limit: vi.fn().mockResolvedValue({ success: true }) };
      mockEnv = { MY_RATE_LIMITER_AUTH: limiter };

      const { checkRateLimit } = await import("@/lib/auth/rate-limit");
      const result = await checkRateLimit("test-key", "auth");

      expect(limiter.limit).toHaveBeenCalledWith({ key: "test-key" });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.resetAt).toBeGreaterThan(0);
    });

    it("should use edge binding and deny when rate limited", async () => {
      const limiter = { limit: vi.fn().mockResolvedValue({ success: false }) };
      mockEnv = { MY_RATE_LIMITER_AUTH: limiter };

      const { checkRateLimit } = await import("@/lib/auth/rate-limit");
      const result = await checkRateLimit("test-key", "auth");

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should fall through to D1 when edge binding throws", async () => {
      const limiter = {
        limit: vi.fn().mockRejectedValue(new Error("binding error")),
      };
      mockEnv = { MY_RATE_LIMITER_AUTH: limiter };

      const d1 = makeD1Mock(null);
      mockDb = d1;

      const { checkRateLimit } = await import("@/lib/auth/rate-limit");
      const result = await checkRateLimit("test-key", "auth");

      expect(result.allowed).toBe(true);
      expect(d1.prepare).toHaveBeenCalled();
    });

    it("should fall through to D1 when edge binding is not present", async () => {
      mockEnv = {};
      const d1 = makeD1Mock(null);
      mockDb = d1;

      const { checkRateLimit } = await import("@/lib/auth/rate-limit");
      const result = await checkRateLimit("test-key", "auth");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it("should INSERT on first request via D1", async () => {
      mockEnv = {};
      const d1 = makeD1Mock(null);
      mockDb = d1;

      const { checkRateLimit } = await import("@/lib/auth/rate-limit");
      await checkRateLimit("test-key", "auth");

      const insertCall = d1.prepare.mock.calls.find(
        (c: string[]) => typeof c[0] === "string" && c[0].includes("INSERT"),
      );
      expect(insertCall).toBeDefined();
    });

    it("should UPDATE on subsequent requests via D1", async () => {
      mockEnv = {};
      const d1 = makeD1Mock({ count: 3 });
      mockDb = d1;

      const { checkRateLimit } = await import("@/lib/auth/rate-limit");
      const result = await checkRateLimit("test-key", "auth");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(6);

      const updateCall = d1.prepare.mock.calls.find(
        (c: string[]) => typeof c[0] === "string" && c[0].includes("UPDATE"),
      );
      expect(updateCall).toBeDefined();
    });

    it("should deny when D1 count exceeds maxRequests", async () => {
      mockEnv = {};
      const d1 = makeD1Mock({ count: 10 });
      mockDb = d1;

      const { checkRateLimit } = await import("@/lib/auth/rate-limit");
      const result = await checkRateLimit("test-key", "auth");

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should allow with fallback when both edge and D1 fail", async () => {
      mockEnv = {};
      mockDb = null;

      const { checkRateLimit } = await import("@/lib/auth/rate-limit");
      const result = await checkRateLimit("test-key", "auth");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
      expect(result.resetAt).toBe(0);
    });

    it("should use chat config for chat category", async () => {
      const limiter = { limit: vi.fn().mockResolvedValue({ success: true }) };
      mockEnv = { MY_RATE_LIMITER_CHAT: limiter };

      const { checkRateLimit } = await import("@/lib/auth/rate-limit");
      const result = await checkRateLimit("test-key", "chat");

      expect(limiter.limit).toHaveBeenCalledWith({ key: "test-key" });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(29);
    });

    it("should use global config for global category", async () => {
      const limiter = { limit: vi.fn().mockResolvedValue({ success: true }) };
      mockEnv = { MY_RATE_LIMITER_GLOBAL: limiter };

      const { checkRateLimit } = await import("@/lib/auth/rate-limit");
      const result = await checkRateLimit("test-key", "global");

      expect(result.remaining).toBe(499);
    });
  });
});
