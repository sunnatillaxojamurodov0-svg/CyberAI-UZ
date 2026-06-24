interface UsageMessage {
  userId: string;
  date: string;
}

interface D1Result {
  count: number;
}

import { writeAnalytics } from "../lib/analytics";

export async function processAiUsageBatch(
  messages: { body: UsageMessage }[],
  db: {
    prepare: (sql: string) => {
      bind: (...args: unknown[]) => {
        first: <T>() => Promise<T | null>;
        run: () => Promise<unknown>;
      };
    };
  },
): Promise<void> {
  const startTime = Date.now();
  let processed = 0;
  for (const msg of messages) {
    const { userId, date } = msg.body;

    try {
      const row = await db
        .prepare("SELECT count FROM ai_usage WHERE user_id = ? AND date = ?")
        .bind(userId, date)
        .first<D1Result>();

      if (row) {
        await db
          .prepare("UPDATE ai_usage SET count = count + 1 WHERE user_id = ? AND date = ?")
          .bind(userId, date)
          .run();
      } else {
        await db
          .prepare("INSERT INTO ai_usage (user_id, date, count) VALUES (?, ?, 1)")
          .bind(userId, date)
          .run();
      }
      processed++;
    } catch {
      /* non-fatal */
    }
  }
  writeAnalytics(
    "queue",
    processed === messages.length ? "success" : "error",
    null,
    "/queue/ai-usage",
    Date.now() - startTime,
    { error: processed < messages.length ? "partial_failure" : undefined },
  );
}
