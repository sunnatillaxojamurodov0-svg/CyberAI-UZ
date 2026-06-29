import { createFileRoute } from "@tanstack/react-router";
import { requireDb } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";

export const Route = createFileRoute("/api/console/progress")({
  server: {
    handlers: {
      // GET: Fetch all progress for the authenticated user
      GET: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          const session = token ? await verifySession(token) : null;

          if (!session?.ok || !session.user?.id) {
            return new Response(JSON.stringify({ ok: false, error: "Authentication required" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const db = requireDb();
          const results = await db
            .prepare(
              `SELECT challenge_id, solved, best_score, grade, points_earned, solved_at
               FROM console_progress
               WHERE user_id = ?`,
            )
            .bind(session.user.id)
            .all();

          // Convert to ProgressMap format
          const progress: Record<string, unknown> = {};
          for (const row of results.results ?? []) {
            const r = row as {
              challenge_id: string;
              solved: number;
              best_score: number;
              grade: string;
              points_earned: number;
              solved_at: number | null;
            };
            progress[r.challenge_id] = {
              challengeId: r.challenge_id,
              solved: r.solved === 1,
              bestScore: r.best_score,
              grade: r.grade,
              pointsEarned: r.points_earned,
              solvedAt: r.solved_at ?? 0,
            };
          }

          return new Response(JSON.stringify({ ok: true, data: progress }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Failed to load progress",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },

      // POST: Upsert progress for a challenge
      POST: async ({ request }) => {
        try {
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
            solved: boolean;
            best_score: number;
            grade: string;
            points_earned: number;
            solved_at: number;
          };

          if (!body.challenge_id) {
            return new Response(JSON.stringify({ ok: false, error: "challenge_id is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const db = requireDb();
          const now = Math.floor(Date.now() / 1000);

          // Upsert: insert or update if exists, keeping the best score
          await db
            .prepare(
              `INSERT INTO console_progress (user_id, challenge_id, solved, best_score, grade, points_earned, solved_at, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(user_id, challenge_id) DO UPDATE SET
                 solved = CASE WHEN excluded.solved = 1 THEN 1 ELSE console_progress.solved END,
                 best_score = MAX(console_progress.best_score, excluded.best_score),
                 grade = CASE WHEN excluded.best_score > console_progress.best_score THEN excluded.grade ELSE console_progress.grade END,
                 points_earned = MAX(console_progress.points_earned, excluded.points_earned),
                 solved_at = COALESCE(console_progress.solved_at, excluded.solved_at),
                 updated_at = ?`,
            )
            .bind(
              session.user.id,
              body.challenge_id,
              body.solved ? 1 : 0,
              body.best_score,
              body.grade,
              body.points_earned,
              body.solved_at || null,
              now,
              now,
              now,
            )
            .run();

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Failed to save progress",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },

      // DELETE: Reset all progress for the user
      DELETE: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          const session = token ? await verifySession(token) : null;

          if (!session?.ok || !session.user?.id) {
            return new Response(JSON.stringify({ ok: false, error: "Authentication required" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const db = requireDb();
          await db
            .prepare("DELETE FROM console_progress WHERE user_id = ?")
            .bind(session.user.id)
            .run();

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Failed to reset progress",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
