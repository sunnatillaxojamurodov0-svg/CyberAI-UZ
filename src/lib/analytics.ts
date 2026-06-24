import { getEnv } from "./db";

export type AnalyticEvent =
  | "chat"
  | "hint"
  | "login"
  | "register"
  | "queue"
  | "ratelimit"
  | "error"
  | "quota"
  | "ai_usage"
  | "model_switch"
  | "injection_blocked"
  | "session_start"
  | "session_end";

type Status = "success" | "denied" | "error" | "warning";

interface AnalyticsExtra {
  model?: string;
  requestedModel?: string;
  fallback?: boolean;
  error?: string;
  tokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  attempts?: number;
  score?: number;
  threats?: string[];
}

export function writeAnalytics(
  event: AnalyticEvent,
  status: Status,
  userId: string | null,
  endpoint: string,
  latencyMs: number,
  extra?: AnalyticsExtra,
) {
  try {
    const env = getEnv();
    const dataset = env.ANALYTICS as
      | {
          writeDataPoint: (p: { blobs?: string[]; doubles?: number[]; indexes?: string[] }) => void;
        }
      | undefined;
    if (!dataset) return;

    dataset.writeDataPoint({
      blobs: [
        event,
        status,
        userId ? "registered" : "anonymous",
        endpoint,
        extra?.model ?? "",
        extra?.error ?? "",
        extra?.requestedModel ?? "",
        String(extra?.fallback ?? false),
      ],
      doubles: [
        1,
        latencyMs,
        extra?.tokens ?? 0,
        extra?.promptTokens ?? 0,
        extra?.completionTokens ?? 0,
        extra?.attempts ?? 0,
        extra?.score ?? 0,
      ],
      indexes: [userId ?? "anonymous"],
    });
  } catch {
    /* non-fatal */
  }
}

export function trackAiUsage(
  userId: string | null,
  model: string,
  requestedModel: string,
  latencyMs: number,
  tokens: { prompt: number; completion: number; total: number },
  success: boolean,
  fallback: boolean = false,
) {
  writeAnalytics("ai_usage", success ? "success" : "error", userId, "/api/chat", latencyMs, {
    model,
    requestedModel,
    fallback,
    tokens: tokens.total,
    promptTokens: tokens.prompt,
    completionTokens: tokens.completion,
  });
}

export function trackModelSwitch(
  userId: string | null,
  fromModel: string,
  toModel: string,
  reason: string,
) {
  writeAnalytics("model_switch", "warning", userId, "/api/chat", 0, {
    model: toModel,
    requestedModel: fromModel,
    fallback: true,
    error: reason,
  });
}

export function trackInjectionAttempt(userId: string | null, score: number, threats: string[]) {
  writeAnalytics("injection_blocked", "denied", userId, "/api/chat", 0, {
    score,
    threats,
  });
}

export function trackSessionStart(userId: string | null, sessionId: string) {
  writeAnalytics("session_start", "success", userId, "/session", 0, {
    error: sessionId,
  });
}

export function trackSessionEnd(userId: string | null, sessionId: string, durationMs: number) {
  writeAnalytics("session_end", "success", userId, "/session", durationMs, {
    error: sessionId,
  });
}
