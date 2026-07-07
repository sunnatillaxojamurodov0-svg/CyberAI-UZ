import { createFileRoute } from "@tanstack/react-router";
import { requireDb } from "@/lib/db";
import { withAdmin } from "@/lib/auth/middleware";

export const Route = createFileRoute("/api/console/analytics/difficulty")({
  server: {
    handlers: {
      GET: withAdmin(async ({ request, user }) => {
        try {

          const db = requireDb();

          // Get difficulty calibration data
          const calibration = await db
            .prepare(
              `
              SELECT 
                challenge_id,
                COUNT(*) as total_attempts,
                SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as total_solved,
                AVG(best_score) as avg_score,
                AVG(time_spent_seconds) as avg_time_seconds,
                AVG(hints_used) as avg_hints_used,
                AVG(tools_used_count) as avg_tools_used
              FROM console_progress
              GROUP BY challenge_id
              HAVING total_attempts >= 3
              ORDER BY total_solved / total_attempts ASC
            `,
            )
            .all();

          // Calculate difficulty metrics
          const challenges = (calibration.results ?? []) as {
            challenge_id: string;
            total_attempts: number;
            total_solved: number;
            avg_score: number;
            avg_time_seconds: number;
            avg_hints_used: number;
            avg_tools_used: number;
          }[];

          const metrics = challenges.map((c) => {
            const solveRate = c.total_solved / c.total_attempts;
            const avgTimeMinutes = c.avg_time_seconds / 60;

            // Calculate difficulty score (0-100, higher = harder)
            let difficultyScore = 0;

            // Low solve rate = harder
            if (solveRate < 0.2) difficultyScore += 40;
            else if (solveRate < 0.4) difficultyScore += 30;
            else if (solveRate < 0.6) difficultyScore += 20;
            else if (solveRate < 0.8) difficultyScore += 10;

            // High time spent = harder
            if (avgTimeMinutes > 30) difficultyScore += 30;
            else if (avgTimeMinutes > 20) difficultyScore += 20;
            else if (avgTimeMinutes > 10) difficultyScore += 10;

            // Many hints used = harder
            if (c.avg_hints_used > 3) difficultyScore += 30;
            else if (c.avg_hints_used > 2) difficultyScore += 20;
            else if (c.avg_hints_used > 1) difficultyScore += 10;

            // Recommended difficulty level
            let recommendedLevel: string;
            if (difficultyScore >= 70) recommendedLevel = "Very Hard";
            else if (difficultyScore >= 50) recommendedLevel = "Hard";
            else if (difficultyScore >= 30) recommendedLevel = "Medium";
            else recommendedLevel = "Easy";

            return {
              challengeId: c.challenge_id,
              totalAttempts: c.total_attempts,
              solveRate: Math.round(solveRate * 100),
              avgScore: Math.round(c.avg_score ?? 0),
              avgTimeMinutes: Math.round(avgTimeMinutes * 10) / 10,
              avgHintsUsed: Math.round((c.avg_hints_used ?? 0) * 10) / 10,
              difficultyScore,
              recommendedLevel,
            };
          });

          // Summary statistics
          const totalChallenges = metrics.length;
          const avgDifficulty =
            metrics.length > 0
              ? Math.round(metrics.reduce((sum, m) => sum + m.difficultyScore, 0) / metrics.length)
              : 0;
          const hardestChallenges = metrics.filter((m) => m.difficultyScore >= 70).length;
          const easiestChallenges = metrics.filter((m) => m.difficultyScore < 30).length;

          return new Response(
            JSON.stringify({
              ok: true,
              data: {
                challenges: metrics,
                summary: {
                  totalChallenges,
                  avgDifficulty,
                  hardestChallenges,
                  easiestChallenges,
                },
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch {
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Failed to load difficulty analytics",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      }),
    },
  },
});
