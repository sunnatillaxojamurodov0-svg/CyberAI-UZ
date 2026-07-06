import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

let mockDb: unknown = null;

vi.mock("@/lib/db", () => ({
  requireDb: vi.fn(() => {
    if (!mockDb) throw new Error("DB not available in tests");
    return mockDb;
  }),
  getEnv: vi.fn(() => ({})),
}));

/* Reference TOTP computation for generating valid codes in tests */
async function referenceTOTP(base32Secret: string, timeCounter: number): Promise<string> {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of base32Secret.toUpperCase()) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const key = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < key.length; i++) {
    key[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }

  const buf = new ArrayBuffer(8);
  new DataView(buf).setUint32(4, timeCounter, false);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new Uint8Array(buf)));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    1000000;
  return code.toString().padStart(6, "0");
}

const KNOWN_SECRET = "JBSWY3DPEHPK3PXP";
const FIXED_TIME = 1767225660000;
const TIME_STEP = 30;

function makeD1Mock() {
  const rows: Record<string, unknown> = {};
  const run = vi.fn().mockResolvedValue({});
  const first = vi.fn().mockImplementation(async () => {
    return rows["result"] ?? null;
  });
  const bind = vi.fn().mockReturnValue({ first, run });
  const prepare = vi.fn().mockReturnValue({ bind });
  return {
    prepare,
    bind,
    first,
    run,
    setFirstResult(val: unknown) {
      rows["result"] = val;
    },
  };
}

describe("TOTP Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_TIME));
    mockDb = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("module exports", () => {
    it("should export all expected functions", async () => {
      const mod = await import("@/lib/auth/totp");
      expect(mod.setup2FA).toBeDefined();
      expect(mod.enable2FA).toBeDefined();
      expect(mod.disable2FA).toBeDefined();
      expect(mod.verify2FA).toBeDefined();
      expect(mod.is2FAEnabled).toBeDefined();
      expect(mod.get2FASecret).toBeDefined();
    });
  });

  describe("setup2FA", () => {
    it("should reject when DB is not available", async () => {
      const { setup2FA } = await import("@/lib/auth/totp");
      await expect(setup2FA("user-123")).rejects.toThrow("DB not available in tests");
    });

    it("should generate a secret and QR URL", async () => {
      const d1 = makeD1Mock();
      mockDb = d1;

      const { setup2FA } = await import("@/lib/auth/totp");
      const result = await setup2FA("user-123");

      expect(result.secret).toBeDefined();
      expect(result.secret.length).toBeGreaterThan(0);
      expect(result.qrCodeUrl).toContain("otpauth://totp/");
      expect(result.qrCodeUrl).toContain("CyberAI");
      expect(result.qrCodeUrl).toContain(result.secret);
      expect(result.qrCodeUrl).toContain("algorithm=SHA1");
      expect(result.qrCodeUrl).toContain("digits=6");
      expect(result.qrCodeUrl).toContain("period=30");
    });

    it("should delete existing 2FA before inserting", async () => {
      const d1 = makeD1Mock();
      mockDb = d1;

      const { setup2FA } = await import("@/lib/auth/totp");
      await setup2FA("user-123");

      const deleteCall = d1.prepare.mock.calls.find(
        (c: string[]) => typeof c[0] === "string" && c[0].includes("DELETE"),
      );
      const insertCall = d1.prepare.mock.calls.find(
        (c: string[]) => typeof c[0] === "string" && c[0].includes("INSERT"),
      );
      expect(deleteCall).toBeDefined();
      expect(insertCall).toBeDefined();
    });
  });

  describe("enable2FA", () => {
    it("should reject when DB is not available", async () => {
      const { enable2FA } = await import("@/lib/auth/totp");
      await expect(enable2FA("user-123", "123456")).rejects.toThrow("DB not available in tests");
    });

    it("should return error when no pending 2FA setup exists", async () => {
      const d1 = makeD1Mock();
      d1.setFirstResult(null);
      mockDb = d1;

      const { enable2FA } = await import("@/lib/auth/totp");
      const result = await enable2FA("user-123", "123456");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("2FA setup not initiated.");
    });

    it("should verify TOTP and enable 2FA with correct code", async () => {
      const timeCounter = Math.floor(FIXED_TIME / 1000 / TIME_STEP);
      const validCode = await referenceTOTP(KNOWN_SECRET, timeCounter);

      const d1 = makeD1Mock();
      d1.setFirstResult({ secret: KNOWN_SECRET });
      mockDb = d1;

      const { enable2FA } = await import("@/lib/auth/totp");
      const result = await enable2FA("user-123", validCode);

      expect(result.ok).toBe(true);

      const updateCall = d1.prepare.mock.calls.find(
        (c: string[]) => typeof c[0] === "string" && c[0].includes("UPDATE"),
      );
      expect(updateCall).toBeDefined();
    });

    it("should reject with invalid TOTP code", async () => {
      const d1 = makeD1Mock();
      d1.setFirstResult({ secret: KNOWN_SECRET });
      mockDb = d1;

      const { enable2FA } = await import("@/lib/auth/totp");
      const result = await enable2FA("user-123", "000000");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Invalid verification code.");
    });
  });

  describe("disable2FA", () => {
    it("should reject when DB is not available", async () => {
      const { disable2FA } = await import("@/lib/auth/totp");
      await expect(disable2FA("user-123", "123456")).rejects.toThrow("DB not available in tests");
    });

    it("should return error when 2FA is not enabled", async () => {
      const d1 = makeD1Mock();
      d1.setFirstResult(null);
      mockDb = d1;

      const { disable2FA } = await import("@/lib/auth/totp");
      const result = await disable2FA("user-123", "123456");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("2FA is not enabled.");
    });

    it("should verify TOTP and disable 2FA with correct code", async () => {
      const timeCounter = Math.floor(FIXED_TIME / 1000 / TIME_STEP);
      const validCode = await referenceTOTP(KNOWN_SECRET, timeCounter);

      const d1 = makeD1Mock();
      d1.setFirstResult({ secret: KNOWN_SECRET });
      mockDb = d1;

      const { disable2FA } = await import("@/lib/auth/totp");
      const result = await disable2FA("user-123", validCode);

      expect(result.ok).toBe(true);
    });

    it("should reject with invalid code when disabling", async () => {
      const d1 = makeD1Mock();
      d1.setFirstResult({ secret: KNOWN_SECRET });
      mockDb = d1;

      const { disable2FA } = await import("@/lib/auth/totp");
      const result = await disable2FA("user-123", "999999");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Invalid verification code.");
    });
  });

  describe("verify2FA", () => {
    it("should reject when DB is not available", async () => {
      const { verify2FA } = await import("@/lib/auth/totp");
      await expect(verify2FA("user-123", "123456")).rejects.toThrow("DB not available in tests");
    });

    it("should return error when 2FA is not enabled", async () => {
      const d1 = makeD1Mock();
      d1.setFirstResult(null);
      mockDb = d1;

      const { verify2FA } = await import("@/lib/auth/totp");
      const result = await verify2FA("user-123", "123456");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("2FA is not enabled.");
    });

    it("should accept a valid TOTP code", async () => {
      const timeCounter = Math.floor(FIXED_TIME / 1000 / TIME_STEP);
      const validCode = await referenceTOTP(KNOWN_SECRET, timeCounter);

      const d1 = makeD1Mock();
      d1.setFirstResult({ secret: KNOWN_SECRET });
      mockDb = d1;

      const { verify2FA } = await import("@/lib/auth/totp");
      const result = await verify2FA("user-123", validCode);

      expect(result.ok).toBe(true);
    });

    it("should accept a TOTP code from adjacent time window", async () => {
      const timeCounter = Math.floor(FIXED_TIME / 1000 / TIME_STEP);
      const prevCode = await referenceTOTP(KNOWN_SECRET, timeCounter - 1);

      const d1 = makeD1Mock();
      d1.setFirstResult({ secret: KNOWN_SECRET });
      mockDb = d1;

      const { verify2FA } = await import("@/lib/auth/totp");
      const result = await verify2FA("user-123", prevCode);

      expect(result.ok).toBe(true);
    });

    it("should reject an invalid TOTP code", async () => {
      const d1 = makeD1Mock();
      d1.setFirstResult({ secret: KNOWN_SECRET });
      mockDb = d1;

      const { verify2FA } = await import("@/lib/auth/totp");
      const result = await verify2FA("user-123", "000000");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Invalid verification code.");
    });
  });

  describe("is2FAEnabled", () => {
    it("should return true when user has 2FA enabled", async () => {
      const d1 = makeD1Mock();
      d1.setFirstResult({ enabled: 1 });
      mockDb = d1;

      const { is2FAEnabled } = await import("@/lib/auth/totp");
      const result = await is2FAEnabled("user-123");

      expect(result).toBe(true);
    });

    it("should return false when user has no 2FA", async () => {
      const d1 = makeD1Mock();
      d1.setFirstResult(null);
      mockDb = d1;

      const { is2FAEnabled } = await import("@/lib/auth/totp");
      const result = await is2FAEnabled("user-123");

      expect(result).toBe(false);
    });

    it("should return false when DB is unavailable", async () => {
      mockDb = null;

      const { is2FAEnabled } = await import("@/lib/auth/totp");
      const result = await is2FAEnabled("user-123");

      expect(result).toBe(false);
    });
  });

  describe("get2FASecret", () => {
    it("should return the secret when it exists", async () => {
      const d1 = makeD1Mock();
      d1.setFirstResult({ secret: KNOWN_SECRET });
      mockDb = d1;

      const { get2FASecret } = await import("@/lib/auth/totp");
      const result = await get2FASecret("user-123");

      expect(result).toBe(KNOWN_SECRET);
    });

    it("should return null when no secret exists", async () => {
      const d1 = makeD1Mock();
      d1.setFirstResult(null);
      mockDb = d1;

      const { get2FASecret } = await import("@/lib/auth/totp");
      const result = await get2FASecret("user-123");

      expect(result).toBeNull();
    });

    it("should return null when DB is unavailable", async () => {
      mockDb = null;

      const { get2FASecret } = await import("@/lib/auth/totp");
      const result = await get2FASecret("user-123");

      expect(result).toBeNull();
    });
  });
});
