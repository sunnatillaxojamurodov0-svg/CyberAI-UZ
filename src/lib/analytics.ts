import { getEnv } from "./db";

export type AnalyticEvent =
  | "chat"
  | "hint"
  | "login"
  | "register"
  | "queue"
  | "ratelimit"
  | "error"
  | "quota";

type Status = "success" | "denied" | "error";

export function writeAnalytics(
  event: AnalyticEvent,
  status: Status,
  userId: string | null,
  endpoint: string,
  latencyMs: number,
  extra?: { model?: string; error?: string },
) {
  try {
    const env = getEnv();
    const dataset = env.ANALYTICS as { writeDataPoint: (p: { blobs?: string[]; doubles?: number[]; indexes?: string[] }) => void } | undefined;
    if (!dataset) return;

    dataset.writeDataPoint({
      blobs: [
        event,
        status,
        userId ? "registered" : "anonymous",
        endpoint,
        extra?.model ?? "",
        extra?.error ?? "",
      ],
      doubles: [1, latencyMs],
      indexes: [userId ?? "anonymous"],
    });
  } catch {
    /* non-fatal */
  }
}
