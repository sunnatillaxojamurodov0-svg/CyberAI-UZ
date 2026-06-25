import { describe, it, expect, vi, beforeEach } from "vitest";

let mockEnv: Record<string, unknown> = {};

vi.mock("@/lib/db", () => ({
  getEnv: vi.fn(() => mockEnv),
}));

import {
  writeAnalytics,
  trackAiUsage,
  trackModelSwitch,
  trackInjectionAttempt,
  trackSessionStart,
  trackSessionEnd,
} from "@/lib/analytics";

describe("Analytics", () => {
  beforeEach(() => {
    mockEnv = {};
  });

  describe("writeAnalytics", () => {
    it("should not throw when ANALYTICS is not available", () => {
      expect(() => writeAnalytics("chat", "success", "user-1", "/api/chat", 100)).not.toThrow();
    });

    it("should write data point to analytics dataset", () => {
      const writeDataPoint = vi.fn();
      mockEnv = { ANALYTICS: { writeDataPoint } };

      writeAnalytics("chat", "success", "user-1", "/api/chat", 150, {
        model: "gpt-4",
        tokens: 500,
      });

      expect(writeDataPoint).toHaveBeenCalledTimes(1);
      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[0]).toBe("chat");
      expect(call.blobs[1]).toBe("success");
      expect(call.blobs[2]).toBe("registered");
      expect(call.blobs[3]).toBe("/api/chat");
      expect(call.blobs[4]).toBe("gpt-4");
      expect(call.doubles[1]).toBe(150);
      expect(call.doubles[2]).toBe(500);
      expect(call.indexes[0]).toBe("user-1");
    });

    it("should use anonymous for null userId", () => {
      const writeDataPoint = vi.fn();
      mockEnv = { ANALYTICS: { writeDataPoint } };

      writeAnalytics("login", "success", null, "/api/auth", 50);

      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[2]).toBe("anonymous");
      expect(call.indexes[0]).toBe("anonymous");
    });

    it("should handle missing extra fields with defaults", () => {
      const writeDataPoint = vi.fn();
      mockEnv = { ANALYTICS: { writeDataPoint } };

      writeAnalytics("error", "error", "user-1", "/api/test", 0);

      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[4]).toBe("");
      expect(call.blobs[5]).toBe("");
      expect(call.doubles[2]).toBe(0);
    });

    it("should not throw if analytics writeDataPoint throws", () => {
      mockEnv = {
        ANALYTICS: {
          writeDataPoint: () => {
            throw new Error("analytics error");
          },
        },
      };
      expect(() => writeAnalytics("chat", "error", null, "/api/chat", 0)).not.toThrow();
    });
  });

  describe("trackAiUsage", () => {
    it("should write AI usage analytics", () => {
      const writeDataPoint = vi.fn();
      mockEnv = { ANALYTICS: { writeDataPoint } };

      trackAiUsage(
        "user-1",
        "gpt-4",
        "gpt-4",
        200,
        { prompt: 100, completion: 50, total: 150 },
        true,
      );

      expect(writeDataPoint).toHaveBeenCalledTimes(1);
      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[0]).toBe("ai_usage");
      expect(call.blobs[1]).toBe("success");
    });

    it("should record error status on failure", () => {
      const writeDataPoint = vi.fn();
      mockEnv = { ANALYTICS: { writeDataPoint } };

      trackAiUsage("user-1", "gpt-4", "gpt-4", 200, { prompt: 0, completion: 0, total: 0 }, false);

      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[1]).toBe("error");
    });

    it("should track fallback model switch", () => {
      const writeDataPoint = vi.fn();
      mockEnv = { ANALYTICS: { writeDataPoint } };

      trackAiUsage(
        "user-1",
        "gpt-3.5",
        "gpt-4",
        100,
        { prompt: 50, completion: 25, total: 75 },
        true,
        true,
      );

      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[7]).toBe("true");
    });
  });

  describe("trackModelSwitch", () => {
    it("should write model switch analytics", () => {
      const writeDataPoint = vi.fn();
      mockEnv = { ANALYTICS: { writeDataPoint } };

      trackModelSwitch("user-1", "gpt-4", "gpt-3.5", "rate limit");

      expect(writeDataPoint).toHaveBeenCalledTimes(1);
      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[0]).toBe("model_switch");
      expect(call.blobs[1]).toBe("warning");
    });
  });

  describe("trackInjectionAttempt", () => {
    it("should write injection attempt analytics", () => {
      const writeDataPoint = vi.fn();
      mockEnv = { ANALYTICS: { writeDataPoint } };

      trackInjectionAttempt("user-1", 0.95, ["sql_injection", "xss"]);

      expect(writeDataPoint).toHaveBeenCalledTimes(1);
      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[0]).toBe("injection_blocked");
      expect(call.blobs[1]).toBe("denied");
    });
  });

  describe("trackSessionStart", () => {
    it("should write session start analytics", () => {
      const writeDataPoint = vi.fn();
      mockEnv = { ANALYTICS: { writeDataPoint } };

      trackSessionStart("user-1", "session-abc");

      expect(writeDataPoint).toHaveBeenCalledTimes(1);
      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[0]).toBe("session_start");
    });
  });

  describe("trackSessionEnd", () => {
    it("should write session end analytics with duration", () => {
      const writeDataPoint = vi.fn();
      mockEnv = { ANALYTICS: { writeDataPoint } };

      trackSessionEnd("user-1", "session-abc", 30000);

      expect(writeDataPoint).toHaveBeenCalledTimes(1);
      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[0]).toBe("session_end");
      expect(call.doubles[1]).toBe(30000);
    });
  });
});
