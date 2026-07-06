import { describe, it, expect, vi, beforeEach } from "vitest";
import { monitoring, initMonitoring } from "@/lib/monitoring";

describe("Monitoring", () => {
  beforeEach(() => {
    initMonitoring({});
  });

  describe("init", () => {
    it("should initialize without errors", () => {
      expect(() => initMonitoring({})).not.toThrow();
    });
  });

  describe("trackMetric", () => {
    it("should not throw when analytics is not available", () => {
      expect(() =>
        monitoring.trackMetric({
          name: "test_metric",
          value: 42,
          timestamp: Date.now(),
          tags: { key: "value" },
        }),
      ).not.toThrow();
    });

    it("should write to analytics when available", () => {
      const writeDataPoint = vi.fn();
      initMonitoring({ ANALYTICS: { writeDataPoint } });

      monitoring.trackMetric({
        name: "test_metric",
        value: 42,
        timestamp: 1000,
        tags: { env: "test" },
      });

      expect(writeDataPoint).toHaveBeenCalledWith({
        blobs: ["test_metric", JSON.stringify({ env: "test" })],
        doubles: [42, 1000],
      });
    });

    it("should handle analytics write errors gracefully", () => {
      const writeDataPoint = vi.fn().mockImplementation(() => {
        throw new Error("Write failed");
      });
      initMonitoring({ ANALYTICS: { writeDataPoint } });

      expect(() =>
        monitoring.trackMetric({
          name: "test_metric",
          value: 1,
          timestamp: Date.now(),
        }),
      ).not.toThrow();
    });
  });

  describe("log", () => {
    it("should not throw when analytics is not available", () => {
      expect(() =>
        monitoring.log({
          level: "info",
          message: "test log",
          timestamp: Date.now(),
        }),
      ).not.toThrow();
    });

    it("should write log entry to analytics", () => {
      const writeDataPoint = vi.fn();
      initMonitoring({ ANALYTICS: { writeDataPoint } });

      monitoring.log({
        level: "error",
        message: "something broke",
        timestamp: 2000,
        context: { detail: "info" },
      });

      expect(writeDataPoint).toHaveBeenCalledWith({
        blobs: ["error", "something broke", JSON.stringify({ detail: "info" })],
        doubles: [2000],
      });
    });
  });

  describe("trackRequest", () => {
    it("should track HTTP request metrics", () => {
      const writeDataPoint = vi.fn();
      initMonitoring({ ANALYTICS: { writeDataPoint } });

      monitoring.trackRequest("/api/test", "GET", 200, 150);

      expect(writeDataPoint).toHaveBeenCalledTimes(1);
      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[0]).toBe("http_request");
      expect(call.doubles[0]).toBe(150);
    });
  });

  describe("trackError", () => {
    it("should log error with context", () => {
      const writeDataPoint = vi.fn();
      initMonitoring({ ANALYTICS: { writeDataPoint } });

      const error = new Error("Test error");
      monitoring.trackError(error, { userId: "123" });

      expect(writeDataPoint).toHaveBeenCalledTimes(1);
      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[0]).toBe("error");
      expect(call.blobs[1]).toBe("Test error");
    });
  });

  describe("trackAIUsage", () => {
    it("should track AI usage metrics", () => {
      const writeDataPoint = vi.fn();
      initMonitoring({ ANALYTICS: { writeDataPoint } });

      monitoring.trackAIUsage("user-1", "gpt-4", 500, true);

      expect(writeDataPoint).toHaveBeenCalledTimes(1);
      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[0]).toBe("ai_usage");
    });

    it("should use anonymous for null userId", () => {
      const writeDataPoint = vi.fn();
      initMonitoring({ ANALYTICS: { writeDataPoint } });

      monitoring.trackAIUsage(null, "gpt-4", 500, true);

      const call = writeDataPoint.mock.calls[0][0];
      const tags = JSON.parse(call.blobs[1]);
      expect(tags.userId).toBe("anonymous");
    });
  });

  describe("trackAuth", () => {
    it("should track auth events", () => {
      const writeDataPoint = vi.fn();
      initMonitoring({ ANALYTICS: { writeDataPoint } });

      monitoring.trackAuth("login", "user-1", true);

      expect(writeDataPoint).toHaveBeenCalledTimes(1);
      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[0]).toBe("auth_event");
      expect(call.doubles[0]).toBe(1);
    });

    it("should track failed auth with value 0", () => {
      const writeDataPoint = vi.fn();
      initMonitoring({ ANALYTICS: { writeDataPoint } });

      monitoring.trackAuth("login", "user-1", false);

      const call = writeDataPoint.mock.calls[0][0];
      expect(call.doubles[0]).toBe(0);
    });
  });

  describe("trackChallenge", () => {
    it("should track challenge events", () => {
      const writeDataPoint = vi.fn();
      initMonitoring({ ANALYTICS: { writeDataPoint } });

      monitoring.trackChallenge("user-1", "challenge-1", "completed", 85);

      expect(writeDataPoint).toHaveBeenCalledTimes(1);
      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[0]).toBe("challenge_event");
      expect(call.doubles[0]).toBe(85);
    });
  });
});
