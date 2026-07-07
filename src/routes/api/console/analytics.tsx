import { createFileRoute } from "@tanstack/react-router";
import { requireDb } from "@/lib/db";
import { withAdmin } from "@/lib/auth/middleware";

export const Route = createFileRoute("/api/console/analytics")({
  server: {
    handlers: {
      GET: withAdmin(async ({ request, user }) => {
        try {

          const db = requireDb();

          // Get challenge completion stats
          const stats = await db
            .prepare(
              `
              SELECT 
                challenge_id,
                COUNT(*) as total_attempts,
                SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as total_solved,
                AVG(best_score) as avg_score,
                AVG(points_earned) as avg_points
              FROM console_progress
              GROUP BY challenge_id
              ORDER BY total_solved ASC
            `,
            )
            .all();

          // Get user activity stats
          const userStats = await db
            .prepare(
              `
              SELECT 
                user_id,
                COUNT(*) as challenges_attempted,
                SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as challenges_solved,
                SUM(points_earned) as total_points
              FROM console_progress
              GROUP BY user_id
              ORDER BY total_points DESC
              LIMIT 10
            `,
            )
            .all();

          // Get difficulty distribution
          const difficultyStats = await db
            .prepare(
              `
              SELECT 
                CASE 
                  WHEN best_score >= 90 THEN 'Easy'
                  WHEN best_score >= 70 THEN 'Medium'
                  WHEN best_score >= 50 THEN 'Hard'
                  ELSE 'Very Hard'
                END as difficulty,
                COUNT(*) as count
              FROM console_progress
              WHERE solved = 1
              GROUP BY difficulty
            `,
            )
            .all();

          return new Response(
            JSON.stringify({
              ok: true,
              data: {
                challenges: stats.results ?? [],
                users: userStats.results ?? [],
                difficultyDistribution: difficultyStats.results ?? [],
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch {
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Failed to load analytics",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      }),
    },
  },
});
