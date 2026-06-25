import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";
import { jsonOk, jsonError, serverError } from "@/lib/api-response";
import { requireAuth, isAuthResponse } from "@/lib/api-middleware";

export const Route = createFileRoute("/api/challenges/submit")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (isAuthResponse(auth)) return auth;

          const env = getEnv();
          const db = env.cyberai_db as {
            prepare: (sql: string) => {
              bind: (...args: unknown[]) => {
                first<T>(): Promise<T | null>;
                all<T>(): Promise<{ results: T[] }>;
              };
            };
          };

          const result = await db
            .prepare(
              "SELECT * FROM challenge_submissions WHERE submitted_by = ? ORDER BY created_at DESC",
            )
            .bind(auth.user.id)
            .all();

          return jsonOk({ submissions: result.results });
        } catch (err) {
          return serverError();
        }
      },

      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (isAuthResponse(auth)) return auth;

          const body = (await request.json()) as {
            name?: string;
            category?: string;
            difficulty?: number;
            scenario?: string;
            objectives?: string;
            flag?: string;
            hints?: string;
            writeup?: string;
          };

          if (!body.name || !body.scenario || !body.flag) {
            return jsonError("Name, scenario, and flag are required");
          }

          const env = getEnv();
          const db = env.cyberai_db as {
            prepare: (sql: string) => { bind: (...args: unknown[]) => { run(): Promise<unknown> } };
          };
          const id = crypto.randomUUID();
          const now = Math.floor(Date.now() / 1000);

          await db
            .prepare(
              "INSERT INTO challenge_submissions (id, name, category, difficulty, scenario, objectives, flag, hints, writeup, submitted_by, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(
              id,
              body.name,
              body.category || "web",
              body.difficulty || 1,
              body.scenario,
              body.objectives || "",
              body.flag,
              body.hints || "",
              body.writeup || "",
              auth.user.id,
              "pending",
              now,
            )
            .run();

          return jsonOk({ id });
        } catch (err) {
          return serverError();
        }
      },
    },
  },
});
