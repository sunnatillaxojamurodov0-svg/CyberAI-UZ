import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireDb } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";

export const Route = createFileRoute("/api/leaderboard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const db = requireDb();
          const url = new URL(request.url);
          const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
          const challengeId = url.searchParams.get("challenge_id");

          let query = `
            SELECT 
              l.id,
              l.user_id,
              u.name as user_name,
              u.email as user_email,
              l.challenge_id,
              c.name as challenge_name,
              c.difficulty as challenge_level,
              l.score,
              l.time_seconds,
              l.tools_used,
              l.hints_used,
              l.solved_at
            FROM leaderboard l
            LEFT JOIN users u ON l.user_id = u.id
            LEFT JOIN challenges c ON l.challenge_id = c.id
          `;

          const params: unknown[] = [];

          if (challengeId) {
            query += " WHERE l.challenge_id = ?";
            params.push(challengeId);
          }

          query += " ORDER BY l.score DESC, l.time_seconds ASC";
          query += " LIMIT ?";
          params.push(limit);

          const results = await db.prepare(query).bind(...params).all();

          return new Response(
            JSON.stringify({
              ok: true,
              data: results.results ?? [],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Failed to load leaderboard" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },

      POST: async ({ request }) => {
        try {
          const db = requireDb();
          const token = getSessionToken(request);
          const session = token ? await verifySession(token) : null;

          if (!session?.ok || !session.user?.id) {
            return new Response(
              JSON.stringify({ ok: false, error: "Authentication required" }),
              { status: 401, headers: { "Content-Type": "application/json" } },
            );
          }

          const body = (await request.json()) as {
            challenge_id: string;
            score: number;
            time_seconds: number;
            tools_used: string[];
            hints_used: number;
          };

          if (!body.challenge_id || typeof body.score !== "number") {
            return new Response(
              JSON.stringify({ ok: false, error: "Invalid request body" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const result = await db
            .prepare(
              `INSERT INTO leaderboard (user_id, challenge_id, score, time_seconds, tools_used, hints_used)
               VALUES (?, ?, ?, ?, ?, ?)`
            )
            .bind(
              session.user.id,
              body.challenge_id,
              body.score,
              body.time_seconds ?? 0,
              JSON.stringify(body.tools_used ?? []),
              body.hints_used ?? 0
            )
            .run();

          return new Response(
            JSON.stringify({
              ok: true,
              data: { id: result.meta?.last_row_id },
            }),
            {
              status: 201,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Failed to submit score" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
