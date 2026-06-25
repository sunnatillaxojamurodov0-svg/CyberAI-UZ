import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  requireDb: vi.fn(() => {
    throw new Error("DB not available in tests");
  }),
  getEnv: vi.fn(() => ({})),
}));

describe("TOTP Module", () => {
  describe("base32Encode and base32Decode (via module internals)", () => {
    it("should be importable without error", async () => {
      const mod = await import("@/lib/auth/totp");
      expect(mod).toBeDefined();
      expect(mod.setup2FA).toBeDefined();
      expect(mod.enable2FA).toBeDefined();
      expect(mod.disable2FA).toBeDefined();
      expect(mod.verify2FA).toBeDefined();
    });
  });

  describe("setup2FA", () => {
    it("should reject when DB is not available", async () => {
      const { setup2FA } = await import("@/lib/auth/totp");
      await expect(setup2FA("user-123")).rejects.toThrow("DB not available in tests");
    });
  });

  describe("enable2FA", () => {
    it("should reject when DB is not available", async () => {
      const { enable2FA } = await import("@/lib/auth/totp");
      await expect(enable2FA("user-123", "123456")).rejects.toThrow("DB not available in tests");
    });
  });

  describe("disable2FA", () => {
    it("should reject when DB is not available", async () => {
      const { disable2FA } = await import("@/lib/auth/totp");
      await expect(disable2FA("user-123", "123456")).rejects.toThrow("DB not available in tests");
    });
  });

  describe("verify2FA", () => {
    it("should reject when DB is not available", async () => {
      const { verify2FA } = await import("@/lib/auth/totp");
      await expect(verify2FA("user-123", "123456")).rejects.toThrow("DB not available in tests");
    });
  });
});
