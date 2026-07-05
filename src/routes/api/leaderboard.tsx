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

          // Get best score per user+challenge (no duplicates)
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
            WHERE l.id IN (
              SELECT MAX(id) FROM leaderboard
        `;

          const params: unknown[] = [];

          if (challengeId) {
            query += ` WHERE challenge_id = ?`;
            params.push(challengeId);
            query += ` GROUP BY user_id, challenge_id)`;
          } else {
            query += ` GROUP BY user_id, challenge_id)`;
          }

          query += ` ORDER BY l.score DESC, l.time_seconds ASC`;
          query += ` LIMIT ?`;
          params.push(limit);

          const results = await db
            .prepare(query)
            .bind(...params)
            .all();

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
          console.error("Leaderboard error:", err);
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Failed to load leaderboard",
            }),
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
            return new Response(JSON.stringify({ ok: false, error: "Authentication required" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = (await request.json()) as {
            challenge_id: string;
            score: number;
            time_seconds: number;
            tools_used: string[];
            hints_used: number;
          };

          if (!body.challenge_id || typeof body.score !== "number") {
            return new Response(JSON.stringify({ ok: false, error: "Invalid request body" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // UPSERT: insert or update if exists, keeping the best score
          const result = await db
            .prepare(
              `INSERT INTO leaderboard (user_id, challenge_id, score, time_seconds, tools_used, hints_used, solved_at)
               VALUES (?, ?, ?, ?, ?, ?, unixepoch())
               ON CONFLICT(user_id, challenge_id) DO UPDATE SET
                 score = MAX(leaderboard.score, excluded.score),
                 time_seconds = CASE
                   WHEN excluded.score > leaderboard.score THEN excluded.time_seconds
                   WHEN excluded.score = leaderboard.score AND excluded.time_seconds < leaderboard.time_seconds THEN excluded.time_seconds
                   ELSE leaderboard.time_seconds
                 END,
                 tools_used = CASE WHEN excluded.score > leaderboard.score THEN excluded.tools_used ELSE leaderboard.tools_used END,
                 hints_used = CASE WHEN excluded.score > leaderboard.score THEN excluded.hints_used ELSE leaderboard.hints_used END,
                 solved_at = CASE WHEN excluded.score > leaderboard.score THEN unixepoch() ELSE leaderboard.solved_at END`,
            )
            .bind(
              session.user.id,
              body.challenge_id,
              body.score,
              body.time_seconds ?? 0,
              JSON.stringify(body.tools_used ?? []),
              body.hints_used ?? 0,
            )
            .run();

          return new Response(
            JSON.stringify({
              ok: true,
              data: { id: result.meta?.last_row_id },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (err) {
          console.error("Leaderboard POST error:", err);
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Failed to submit score",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
