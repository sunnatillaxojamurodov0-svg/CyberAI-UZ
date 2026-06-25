import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireDb, getEnv } from "@/lib/db";
import { writeAnalytics } from "@/lib/analytics";
import { jsonOk, catchError } from "@/lib/api-response";

export const Route = createFileRoute("/api/dashboard/stats")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const startTime = Date.now();
          const db = requireDb();
          const env = getEnv();

          const totalUsers = await db
            .prepare("SELECT COUNT(*) as count FROM users")
            .first<{ count: number }>();

          const totalAiUsage = await db
            .prepare("SELECT COALESCE(SUM(count), 0) as total FROM ai_usage")
            .first<{ total: number }>();

          const todayStr = new Date().toISOString().slice(0, 10);
          const todayUsage = await db
            .prepare("SELECT COALESCE(SUM(count), 0) as total FROM ai_usage WHERE date = ?")
            .bind(todayStr)
            .first<{ total: number }>();

          const thisMonth = todayStr.slice(0, 7);
          const monthUsage = await db
            .prepare("SELECT COALESCE(SUM(count), 0) as total FROM ai_usage WHERE date LIKE ?")
            .bind(`${thisMonth}%`)
            .first<{ total: number }>();

          const recentUsers = await db
            .prepare(
              "SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 5",
            )
            .all<{ id: string; email: string; name: string | null; created_at: number }>();

          const challengeCount = await db
            .prepare("SELECT COUNT(*) as count FROM challenges")
            .first<{ count: number }>();

          const completedChallenges = await db
            .prepare("SELECT COUNT(*) as count FROM user_challenges WHERE status = 'completed'")
            .first<{ count: number }>();

          const workflowBindings = [
            {
              name: "ChallengeGenerator",
              binding: "CHALLENGE_GENERATOR",
              available: !!env.CHALLENGE_GENERATOR,
            },
            {
              name: "UserOnboarding",
              binding: "USER_ONBOARDING",
              available: !!env.USER_ONBOARDING,
            },
            {
              name: "ConsoleAnalysis",
              binding: "CONSOLE_ANALYSIS",
              available: !!env.CONSOLE_ANALYSIS,
            },
          ];

          writeAnalytics(
            "dashboard",
            "success",
            null,
            "/api/dashboard/stats",
            Date.now() - startTime,
          );

          return jsonOk({
            data: {
              users: { total: totalUsers?.count ?? 0 },
              aiUsage: {
                total: totalAiUsage?.total ?? 0,
                today: todayUsage?.total ?? 0,
                thisMonth: monthUsage?.total ?? 0,
              },
              challenges: {
                total: challengeCount?.count ?? 0,
                completed: completedChallenges?.count ?? 0,
              },
              recentUsers: recentUsers?.results ?? [],
              workflows: workflowBindings,
            },
          });
        } catch (err) {
          return catchError(err, "Failed to load dashboard stats");
        }
      },
    },
  },
});
