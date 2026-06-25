import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireDb } from "@/lib/db";
import { jsonOk, jsonCreated, jsonError, unauthorizedError, catchError } from "@/lib/api-response";
import { requireAuth, isAuthResponse } from "@/lib/api-middleware";

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

          const results = await db
            .prepare(query)
            .bind(...params)
            .all();

          return jsonOk({ data: results.results ?? [] });
        } catch (err) {
          return catchError(err, "Failed to load leaderboard");
        }
      },

      POST: async ({ request }) => {
        try {
          const db = requireDb();
          const auth = await requireAuth(request);
          if (isAuthResponse(auth)) return auth;

          const body = (await request.json()) as {
            challenge_id: string;
            score: number;
            time_seconds: number;
            tools_used: string[];
            hints_used: number;
          };

          if (!body.challenge_id || typeof body.score !== "number") {
            return jsonError("Invalid request body");
          }

          const result = await db
            .prepare(
              `INSERT INTO leaderboard (user_id, challenge_id, score, time_seconds, tools_used, hints_used)
               VALUES (?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              auth.user.id,
              body.challenge_id,
              body.score,
              body.time_seconds ?? 0,
              JSON.stringify(body.tools_used ?? []),
              body.hints_used ?? 0,
            )
            .run();

          return jsonCreated({ data: { id: result.meta?.last_row_id } });
        } catch (err) {
          return catchError(err, "Failed to submit score");
        }
      },
    },
  },
});
