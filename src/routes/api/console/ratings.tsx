import { createFileRoute } from "@tanstack/react-router";
import { requireDb } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";

export const Route = createFileRoute("/api/console/ratings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const challengeId = url.searchParams.get("challengeId");

          if (!challengeId) {
            return new Response(JSON.stringify({ ok: false, error: "challengeId is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const db = requireDb();
          const result = await db
            .prepare(
              `
              SELECT 
                challenge_id,
                COUNT(*) as total_ratings,
                AVG(rating) as avg_rating,
                AVG(difficulty_rating) as avg_difficulty,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
              FROM challenge_ratings
              WHERE challenge_id = ?
            `,
            )
            .bind(challengeId)
            .first();

          return new Response(
            JSON.stringify({
              ok: true,
              data: result ?? {
                challenge_id: challengeId,
                total_ratings: 0,
                avg_rating: 0,
                avg_difficulty: 0,
                five_star: 0,
                four_star: 0,
                three_star: 0,
                two_star: 0,
                one_star: 0,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const isMissingTable =
            err instanceof Error && err.message.includes("no such table");
          if (isMissingTable) {
            return new Response(
              JSON.stringify({
                ok: true,
                data: {
                  challenge_id: challengeId,
                  total_ratings: 0,
                  avg_rating: 0,
                  avg_difficulty: 0,
                  five_star: 0,
                  four_star: 0,
                  three_star: 0,
                  two_star: 0,
                  one_star: 0,
                },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Failed to load ratings",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },

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
            challengeId: string;
            rating: number;
            difficultyRating: number;
          };

          const { challengeId, rating, difficultyRating } = body;

          if (!challengeId || !rating || !difficultyRating) {
            return new Response(
              JSON.stringify({
                ok: false,
                error: "challengeId, rating, and difficultyRating are required",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          if (rating < 1 || rating > 5 || difficultyRating < 1 || difficultyRating > 5) {
            return new Response(
              JSON.stringify({ ok: false, error: "Ratings must be between 1 and 5" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const db = requireDb();
          await db
            .prepare(
              `
              INSERT INTO challenge_ratings (challenge_id, user_id, rating, difficulty_rating, updated_at)
              VALUES (?, ?, ?, ?, unixepoch())
              ON CONFLICT(challenge_id, user_id) DO UPDATE SET
                rating = excluded.rating,
                difficulty_rating = excluded.difficulty_rating,
                updated_at = excluded.updated_at
            `,
            )
            .bind(challengeId, session.user.id, rating, difficultyRating)
            .run();

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const isMissingTable =
            err instanceof Error && err.message.includes("no such table");
          if (isMissingTable) {
            return new Response(
              JSON.stringify({ ok: false, error: "Ratings are not available" }),
              { status: 503, headers: { "Content-Type": "application/json" } },
            );
          }
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Failed to save rating",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
