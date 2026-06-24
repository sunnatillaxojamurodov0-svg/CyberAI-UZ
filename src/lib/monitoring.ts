import { getEnv } from "@/lib/db";

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface LogEntry {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

class Monitoring {
  private env: Record<string, unknown> | null = null;

  init(env: Record<string, unknown>) {
    this.env = env;
  }

  private getAnalytics() {
    if (!this.env) return null;
    return this.env.ANALYTICS as
      | { writeDataPoint: (data: { blobs: string[]; doubles: number[] }) => void }
      | undefined;
  }

  trackMetric(metric: Metric) {
    const analytics = this.getAnalytics();
    if (analytics) {
      try {
        analytics.writeDataPoint({
          blobs: [metric.name, JSON.stringify(metric.tags || {})],
          doubles: [metric.value, metric.timestamp],
        });
      } catch (e) {
        console.error("Failed to write metric:", e);
      }
    }
  }

  log(entry: LogEntry) {
    const analytics = this.getAnalytics();
    if (analytics) {
      try {
        analytics.writeDataPoint({
          blobs: [entry.level, entry.message, JSON.stringify(entry.context || {})],
          doubles: [entry.timestamp],
        });
      } catch (e) {
        console.error("Failed to write log:", e);
      }
    }
  }

  trackRequest(path: string, method: string, status: number, duration: number) {
    this.trackMetric({
      name: "http_request",
      value: duration,
      timestamp: Date.now(),
      tags: { path, method, status: String(status) },
    });
  }

  trackError(error: Error, context?: Record<string, unknown>) {
    this.log({
      level: "error",
      message: error.message,
      timestamp: Date.now(),
      context: {
        ...context,
        stack: error.stack,
        name: error.name,
      },
    });
  }

  trackAIUsage(userId: string | null, model: string, duration: number, success: boolean) {
    this.trackMetric({
      name: "ai_usage",
      value: duration,
      timestamp: Date.now(),
      tags: {
        userId: userId || "anonymous",
        model,
        success: String(success),
      },
    });
  }

  trackAuth(event: "login" | "register" | "logout", userId: string | null, success: boolean) {
    this.trackMetric({
      name: "auth_event",
      value: success ? 1 : 0,
      timestamp: Date.now(),
      tags: { event, userId: userId || "anonymous" },
    });
  }

  trackChallenge(userId: string, challengeId: string, status: string, score: number) {
    this.trackMetric({
      name: "challenge_event",
      value: score,
      timestamp: Date.now(),
      tags: { userId, challengeId, status },
    });
  }
}

export const monitoring = new Monitoring();

export function initMonitoring(env: Record<string, unknown>) {
  monitoring.init(env);
}
