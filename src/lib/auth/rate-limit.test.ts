import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimitKey } from "@/lib/auth/rate-limit";

vi.mock("@/lib/analytics", () => ({
  writeAnalytics: vi.fn(),
}));

describe("Rate Limit", () => {
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
});
