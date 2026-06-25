import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getEnv } from "@/lib/db";
import { jsonOk, jsonError, serverError } from "@/lib/api-response";
import { requireAuth, isAuthResponse } from "@/lib/api-middleware";

export const Route = createFileRoute("/api/admin/challenges")({
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
            .prepare("SELECT * FROM challenges ORDER BY created_at DESC")
            .all();
          return jsonOk({ challenges: result.results });
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
            difficulty?: number;
            category?: string;
            scenario?: string;
            objectives?: string;
            flag?: string;
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
              "INSERT INTO challenges (id, name, difficulty, category, scenario, objectives, flag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(
              id,
              body.name,
              body.difficulty || 1,
              body.category || "web",
              body.scenario,
              body.objectives || "[]",
              body.flag,
              now,
            )
            .run();

          return jsonOk({ id });
        } catch (err) {
          return serverError();
        }
      },

      PUT: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (isAuthResponse(auth)) return auth;

          const url = new URL(request.url);
          const id = url.searchParams.get("id");
          if (!id) {
            return jsonError("ID is required");
          }

          const body = (await request.json()) as {
            name?: string;
            difficulty?: number;
            category?: string;
            scenario?: string;
            objectives?: string;
            flag?: string;
          };

          const env = getEnv();
          const db = env.cyberai_db as {
            prepare: (sql: string) => { bind: (...args: unknown[]) => { run(): Promise<unknown> } };
          };

          const fields: string[] = [];
          const values: unknown[] = [];
          if (body.name) {
            fields.push("name = ?");
            values.push(body.name);
          }
          if (body.difficulty !== undefined) {
            fields.push("difficulty = ?");
            values.push(body.difficulty);
          }
          if (body.category) {
            fields.push("category = ?");
            values.push(body.category);
          }
          if (body.scenario) {
            fields.push("scenario = ?");
            values.push(body.scenario);
          }
          if (body.objectives !== undefined) {
            fields.push("objectives = ?");
            values.push(body.objectives);
          }
          if (body.flag) {
            fields.push("flag = ?");
            values.push(body.flag);
          }

          if (fields.length === 0) {
            return jsonError("No fields to update");
          }

          values.push(id);
          await db
            .prepare(`UPDATE challenges SET ${fields.join(", ")} WHERE id = ?`)
            .bind(...values)
            .run();

          return jsonOk({});
        } catch (err) {
          return serverError();
        }
      },

      DELETE: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (isAuthResponse(auth)) return auth;

          const url = new URL(request.url);
          const id = url.searchParams.get("id");
          if (!id) {
            return jsonError("ID is required");
          }

          const env = getEnv();
          const db = env.cyberai_db as {
            prepare: (sql: string) => { bind: (...args: unknown[]) => { run(): Promise<unknown> } };
          };
          await db.prepare("DELETE FROM challenges WHERE id = ?").bind(id).run();

          return jsonOk({});
        } catch (err) {
          return serverError();
        }
      },
    },
  },
});
