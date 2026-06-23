import { useState, useEffect } from "react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";
import { Trophy, Medal, Clock, Wrench, Lightbulb, RefreshCw } from "lucide-react";

interface LeaderboardEntry {
  id: number;
  user_id: string;
  user_name: string | null;
  user_email: string;
  challenge_id: string;
  challenge_name: string | null;
  challenge_level: number | null;
  score: number;
  time_seconds: number;
  tools_used: string;
  hints_used: number;
  solved_at: number;
}

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("challenge_id", filter);
      params.set("limit", "50");

      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      const json = await res.json();
      if (json.ok) {
        setEntries(json.data);
      } else {
        setError(json.error ?? "Failed to load leaderboard");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy size={18} className="text-yellow-400" />;
    if (index === 1) return <Medal size={18} className="text-gray-300" />;
    if (index === 2) return <Medal size={18} className="text-amber-600" />;
    return <span className="font-mono text-sm text-muted-foreground w-5 text-center">{index + 1}</span>;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return "bg-yellow-400/10 text-yellow-400 border-yellow-400/30";
    if (index === 1) return "bg-gray-300/10 text-gray-300 border-gray-300/30";
    if (index === 2) return "bg-amber-600/10 text-amber-600 border-amber-600/30";
    return "";
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <RefreshCw className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <p className="font-mono text-sm text-destructive">{error}</p>
        <button
          type="button"
          onClick={fetchLeaderboard}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
        >
          <RefreshCw size={14} />
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Filter:
        </span>
        {[
          { value: "all", label: "All Challenges" },
          { value: "web", label: "Web" },
          { value: "network", label: "Network" },
          { value: "crypto", label: "Crypto" },
          { value: "forensics", label: "Forensics" },
          { value: "privesc", label: "Privesc" },
        ].map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-4 py-1.5 font-mono text-xs transition-colors ${
              filter === f.value
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-border bg-surface text-muted-foreground hover:border-accent/30 hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      {entries.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center py-16">
          <Trophy size={48} className="text-muted-foreground/30" />
          <p className="mt-4 font-mono text-sm text-muted-foreground">
            No scores yet. Be the first to solve a challenge!
          </p>
        </GlassPanel>
      ) : (
        <GlassPanel className="overflow-hidden p-0">
          <div className="divide-y divide-border/50">
            {/* Header */}
            <div className="grid grid-cols-[60px_1fr_120px_100px_100px_80px] gap-4 px-6 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <div>Rank</div>
              <div>Operator</div>
              <div>Challenge</div>
              <div className="text-right">Score</div>
              <div className="text-right">Time</div>
              <div className="text-right">Hints</div>
            </div>

            {/* Entries */}
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`grid grid-cols-[60px_1fr_120px_100px_100px_80px] gap-4 px-6 py-4 transition-colors hover:bg-surface/50 ${getRankBadge(index)}`}
              >
                <div className="flex items-center">
                  {getRankIcon(index)}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                    {(entry.user_name ?? entry.user_email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-mono text-sm font-medium text-foreground">
                      {entry.user_name ?? "Anonymous"}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {entry.user_email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div>
                    <div className="font-mono text-sm text-foreground">
                      {entry.challenge_name ?? entry.challenge_id}
                    </div>
                    {entry.challenge_level && (
                      <div className="font-mono text-[10px] text-muted-foreground">
                        Level {entry.challenge_level}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <span className="font-mono text-lg font-bold text-accent">
                    {entry.score}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <Clock size={12} className="text-muted-foreground" />
                  <span className="font-mono text-sm text-muted-foreground">
                    {formatTime(entry.time_seconds)}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <Lightbulb size={12} className="text-muted-foreground" />
                  <span className="font-mono text-sm text-muted-foreground">
                    {entry.hints_used}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Stats Summary */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <GlassPanel className="flex flex-col items-center p-6">
          <Trophy size={24} className="text-yellow-400" />
          <span className="mt-2 font-mono text-2xl font-bold text-foreground">
            {entries.length > 0 ? entries[0].score : 0}
          </span>
          <span className="font-mono text-xs text-muted-foreground">Highest Score</span>
        </GlassPanel>
        <GlassPanel className="flex flex-col items-center p-6">
          <Clock size={24} className="text-accent" />
          <span className="mt-2 font-mono text-2xl font-bold text-foreground">
            {entries.length > 0 ? formatTime(Math.min(...entries.map((e) => e.time_seconds))) : "—"}
          </span>
          <span className="font-mono text-xs text-muted-foreground">Fastest Solve</span>
        </GlassPanel>
        <GlassPanel className="flex flex-col items-center p-6">
          <Medal size={24} className="text-emerald-400" />
          <span className="mt-2 font-mono text-2xl font-bold text-foreground">
            {new Set(entries.map((e) => e.user_id)).size}
          </span>
          <span className="font-mono text-xs text-muted-foreground">Unique Operators</span>
        </GlassPanel>
      </div>
    </div>
  );
}
