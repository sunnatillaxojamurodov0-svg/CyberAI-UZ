import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPlanLimits, getUserSubscription } from "@/lib/stripe";

vi.mock("@/lib/db", () => ({
  getEnv: vi.fn(() => ({
    cyberai_db: {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue({}),
    },
    STRIPE_SECRET_KEY: "sk_test_fake",
    STRIPE_WEBHOOK_SECRET: "whsec_fake",
  })),
}));

describe("Stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPlanLimits", () => {
    it("should return free plan limits", () => {
      const limits = getPlanLimits("free");
      expect(limits.aiMessagesPerDay).toBe(50);
      expect(limits.challengesPerDay).toBe(3);
      expect(limits.maxHistory).toBe(50);
    });

    it("should return pro plan limits", () => {
      const limits = getPlanLimits("pro");
      expect(limits.aiMessagesPerDay).toBe(-1);
      expect(limits.challengesPerDay).toBe(-1);
      expect(limits.maxHistory).toBe(200);
    });

    it("should return enterprise plan limits", () => {
      const limits = getPlanLimits("enterprise");
      expect(limits.aiMessagesPerDay).toBe(-1);
      expect(limits.challengesPerDay).toBe(-1);
      expect(limits.maxHistory).toBe(-1);
    });
  });

  describe("getUserSubscription", () => {
    it("should return null for user without subscription", async () => {
      const result = await getUserSubscription("user-123");
      expect(result).toBeNull();
    });
  });
});
