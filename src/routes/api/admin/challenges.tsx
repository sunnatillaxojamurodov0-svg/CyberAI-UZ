import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";
import { getEnv } from "@/lib/db";

export const Route = createFileRoute("/api/admin/challenges")({
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

          const result = await db.prepare("SELECT * FROM challenges ORDER BY created_at DESC").all();
          return new Response(JSON.stringify({ ok: true, challenges: result.results }), {
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

          const body = (await request.json()) as { name?: string; difficulty?: number; category?: string; scenario?: string; objectives?: string; flag?: string };
          if (!body.name || !body.scenario || !body.flag) {
            return new Response(JSON.stringify({ error: "Name, scenario, and flag are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
          }

          const env = getEnv();
          const db = env.cyberai_db as { prepare: (sql: string) => { bind: (...args: unknown[]) => { run(): Promise<unknown> } } };
          const id = crypto.randomUUID();
          const now = Math.floor(Date.now() / 1000);

          await db.prepare("INSERT INTO challenges (id, name, difficulty, category, scenario, objectives, flag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(id, body.name, body.difficulty || 1, body.category || "web", body.scenario, body.objectives || "[]", body.flag, now)
            .run();

          return new Response(JSON.stringify({ ok: true, id }), { headers: { "Content-Type": "application/json" } });
        } catch (err) {
          return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },

      PUT: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          if (!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }
          const session = await verifySession(token);
          if (!session.ok || !session.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const url = new URL(request.url);
          const id = url.searchParams.get("id");
          if (!id) {
            return new Response(JSON.stringify({ error: "ID is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
          }

          const body = (await request.json()) as { name?: string; difficulty?: number; category?: string; scenario?: string; objectives?: string; flag?: string };

          const env = getEnv();
          const db = env.cyberai_db as { prepare: (sql: string) => { bind: (...args: unknown[]) => { run(): Promise<unknown> } } };

          const fields: string[] = [];
          const values: unknown[] = [];
          if (body.name) { fields.push("name = ?"); values.push(body.name); }
          if (body.difficulty !== undefined) { fields.push("difficulty = ?"); values.push(body.difficulty); }
          if (body.category) { fields.push("category = ?"); values.push(body.category); }
          if (body.scenario) { fields.push("scenario = ?"); values.push(body.scenario); }
          if (body.objectives !== undefined) { fields.push("objectives = ?"); values.push(body.objectives); }
          if (body.flag) { fields.push("flag = ?"); values.push(body.flag); }

          if (fields.length === 0) {
            return new Response(JSON.stringify({ error: "No fields to update" }), { status: 400, headers: { "Content-Type": "application/json" } });
          }

          values.push(id);
          await db.prepare(`UPDATE challenges SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();

          return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
        } catch (err) {
          return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },

      DELETE: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          if (!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }
          const session = await verifySession(token);
          if (!session.ok || !session.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const url = new URL(request.url);
          const id = url.searchParams.get("id");
          if (!id) {
            return new Response(JSON.stringify({ error: "ID is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
          }

          const env = getEnv();
          const db = env.cyberai_db as { prepare: (sql: string) => { bind: (...args: unknown[]) => { run(): Promise<unknown> } } };
          await db.prepare("DELETE FROM challenges WHERE id = ?").bind(id).run();

          return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
        } catch (err) {
          return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});
