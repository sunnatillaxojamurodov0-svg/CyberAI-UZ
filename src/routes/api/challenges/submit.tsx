import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";
import { getEnv } from "@/lib/db";

export const Route = createFileRoute("/api/challenges/submit")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          if (!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }
          const session = await verifySession(token);
          if (!session.ok || !session.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const env = getEnv();
          const db = env.cyberai_db as { prepare: (sql: string) => { bind: (...args: unknown[]) => { first<T>(): Promise<T | null>; all<T>(): Promise<{ results: T[] }> } } };

          const result = await db
            .prepare("SELECT * FROM challenge_submissions WHERE submitted_by = ? ORDER BY created_at DESC")
            .bind(session.user.id)
            .all();

          return new Response(JSON.stringify({ ok: true, submissions: result.results }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },

      POST: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          if (!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }
          const session = await verifySession(token);
          if (!session.ok || !session.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }

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
            return new Response(JSON.stringify({ error: "Name, scenario, and flag are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
          }

          const env = getEnv();
          const db = env.cyberai_db as { prepare: (sql: string) => { bind: (...args: unknown[]) => { run(): Promise<unknown> } } };
          const id = crypto.randomUUID();
          const now = Math.floor(Date.now() / 1000);

          await db.prepare(
            "INSERT INTO challenge_submissions (id, name, category, difficulty, scenario, objectives, flag, hints, writeup, submitted_by, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(
            id,
            body.name,
            body.category || "web",
            body.difficulty || 1,
            body.scenario,
            body.objectives || "",
            body.flag,
            body.hints || "",
            body.writeup || "",
            session.user.id,
            "pending",
            now,
          ).run();

          return new Response(JSON.stringify({ ok: true, id }), { headers: { "Content-Type": "application/json" } });
        } catch (err) {
          return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});
