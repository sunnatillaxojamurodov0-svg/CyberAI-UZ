import { useState, useEffect } from "react";
import { BarChart3, Users, Trophy, TrendingUp, Target, Clock, Lightbulb } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { cn } from "@/lib/utils";

interface ChallengeStats {
  challenge_id: string;
  total_attempts: number;
  total_solved: number;
  avg_score: number;
  avg_points: number;
}

interface UserStats {
  user_id: string;
  challenges_attempted: number;
  challenges_solved: number;
  total_points: number;
}

interface DifficultyStats {
  difficulty: string;
  count: number;
}

interface DifficultyMetrics {
  challengeId: string;
  totalAttempts: number;
  solveRate: number;
  avgScore: number;
  avgTimeMinutes: number;
  avgHintsUsed: number;
  difficultyScore: number;
  recommendedLevel: string;
}

interface AnalyticsData {
  challenges: ChallengeStats[];
  users: UserStats[];
  difficultyDistribution: DifficultyStats[];
}

interface DifficultyData {
  challenges: DifficultyMetrics[];
  summary: {
    totalChallenges: number;
    avgDifficulty: number;
    hardestChallenges: number;
    easiestChallenges: number;
  };
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [difficultyData, setDifficultyData] = useState<DifficultyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [analyticsRes, difficultyRes] = await Promise.all([
          fetch("/api/console/analytics", { credentials: "include" }),
          fetch("/api/console/analytics/difficulty", { credentials: "include" }),
        ]);

        if (analyticsRes.ok) {
          const analyticsJson = await analyticsRes.json();
          if (analyticsJson.ok) {
            setData(analyticsJson.data);
          } else {
            setError(analyticsJson.error);
          }
        } else {
          setError(`Analytics API error: ${analyticsRes.status}`);
        }

        if (difficultyRes.ok) {
          const difficultyJson = await difficultyRes.json();
          if (difficultyJson.ok) {
            setDifficultyData(difficultyJson.data);
          }
        }
      } catch {
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-8 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4 text-center text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!data) return null;

  // Find hardest challenges (lowest solve rate)
  const hardestChallenges = [...data.challenges]
    .sort((a, b) => a.total_solved / a.total_attempts - b.total_solved / b.total_attempts)
    .slice(0, 10);

  // Find easiest challenges (highest solve rate)
  const easiestChallenges = [...data.challenges]
    .sort((a, b) => b.total_solved / b.total_attempts - a.total_solved / a.total_attempts)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="Total Challenges"
          value={data.challenges.length.toString()}
          icon={BarChart3}
        />
        <StatCard title="Total Users" value={data.users.length.toString()} icon={Users} />
        <StatCard
          title="Avg. Score"
          value={
            data.challenges.length > 0
              ? Math.round(
                  data.challenges.reduce((sum, c) => sum + (c.avg_score ?? 0), 0) /
                    data.challenges.length,
                ).toString()
              : "0"
          }
          icon={TrendingUp}
        />
        <StatCard
          title="Total Solves"
          value={data.challenges.reduce((sum, c) => sum + c.total_solved, 0).toString()}
          icon={Trophy}
        />
      </div>

      {/* Difficulty distribution */}
      <GlassPanel className="p-6">
        <h3 className="mb-4 font-display text-lg font-bold">Difficulty Distribution</h3>
        <div className="flex gap-4">
          {data.difficultyDistribution.map((d) => (
            <div key={d.difficulty} className="flex-1 text-center">
              <div
                className={cn(
                  "mb-2 text-2xl font-bold",
                  d.difficulty === "Easy"
                    ? "text-emerald-400"
                    : d.difficulty === "Medium"
                      ? "text-amber-400"
                      : d.difficulty === "Hard"
                        ? "text-orange-400"
                        : "text-red-400",
                )}
              >
                {d.count}
              </div>
              <div className="text-xs text-muted-foreground">{d.difficulty}</div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Hardest challenges */}
      <GlassPanel className="p-6">
        <h3 className="mb-4 font-display text-lg font-bold text-red-400">Hardest Challenges</h3>
        <div className="space-y-2">
          {hardestChallenges.map((c) => (
            <div
              key={c.challenge_id}
              className="flex items-center justify-between rounded-lg bg-surface/40 px-4 py-2"
            >
              <span className="font-mono text-sm">{c.challenge_id}</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  {c.total_solved}/{c.total_attempts} solved
                </span>
                <span
                  className={cn(
                    "font-mono text-sm font-bold",
                    c.total_solved / c.total_attempts < 0.3
                      ? "text-red-400"
                      : c.total_solved / c.total_attempts < 0.6
                        ? "text-amber-400"
                        : "text-emerald-400",
                  )}
                >
                  {Math.round((c.total_solved / c.total_attempts) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Top users */}
      <GlassPanel className="p-6">
        <h3 className="mb-4 font-display text-lg font-bold">Top Users</h3>
        <div className="space-y-2">
          {data.users.map((u, i) => (
            <div
              key={u.user_id}
              className="flex items-center justify-between rounded-lg bg-surface/40 px-4 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-accent/10 font-mono text-xs font-bold text-accent">
                  {i + 1}
                </span>
                <span className="font-mono text-sm">{u.user_id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">{u.challenges_solved} solved</span>
                <span className="font-mono text-sm font-bold text-accent">
                  {u.total_points} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Difficulty Calibration */}
      {difficultyData && (
        <GlassPanel className="p-6">
          <h3 className="mb-4 font-display text-lg font-bold">Difficulty Calibration</h3>
          <div className="grid grid-cols-2 gap-4 mb-4 md:grid-cols-4">
            <div className="text-center">
              <div className="font-display text-2xl font-bold">
                {difficultyData.summary.totalChallenges}
              </div>
              <div className="text-xs text-muted-foreground">Calibrated</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-accent">
                {difficultyData.summary.avgDifficulty}
              </div>
              <div className="text-xs text-muted-foreground">Avg. Difficulty</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-red-400">
                {difficultyData.summary.hardestChallenges}
              </div>
              <div className="text-xs text-muted-foreground">Very Hard</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-emerald-400">
                {difficultyData.summary.easiestChallenges}
              </div>
              <div className="text-xs text-muted-foreground">Easy</div>
            </div>
          </div>
          <div className="space-y-2">
            {difficultyData.challenges.slice(0, 10).map((c) => (
              <div
                key={c.challengeId}
                className="flex items-center justify-between rounded-lg bg-surface/40 px-4 py-2"
              >
                <span className="font-mono text-sm">{c.challengeId}</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Target size={12} /> {c.solveRate}%
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} /> {c.avgTimeMinutes}m
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lightbulb size={12} /> {c.avgHintsUsed}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-xs font-bold",
                      c.recommendedLevel === "Very Hard"
                        ? "text-red-400"
                        : c.recommendedLevel === "Hard"
                          ? "text-orange-400"
                          : c.recommendedLevel === "Medium"
                            ? "text-amber-400"
                            : "text-emerald-400",
                    )}
                  >
                    {c.recommendedLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <GlassPanel className="p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-accent/10">
          <Icon size={18} className="text-accent" />
        </span>
        <div>
          <div className="font-display text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{title}</div>
        </div>
      </div>
    </GlassPanel>
  );
}
