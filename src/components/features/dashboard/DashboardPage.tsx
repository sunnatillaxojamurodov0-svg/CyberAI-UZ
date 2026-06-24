import { useState, useEffect } from "react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";
import { useAuth } from "@/lib/auth-context";
import { Activity, Users, Bot, Shield, Calendar, RefreshCw } from "lucide-react";

interface DashboardData {
  users: { total: number };
  aiUsage: { total: number; today: number; thisMonth: number };
  challenges: { total: number; completed: number };
  recentUsers: { id: string; email: string; name: string | null; created_at: number }[];
  workflows: { name: string; binding: string; available: boolean }[];
}

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/stats");
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
      } else {
        setError(json.error ?? "Failed to load");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const StatCard = ({
    label,
    value,
    icon,
    sub,
  }: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    sub?: string;
  }) => (
    <GlassPanel className="flex flex-col gap-2 p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-muted-foreground/60">{icon}</span>
      </div>
      <span className="font-mono text-3xl font-bold tracking-tight text-foreground">{value}</span>
      {sub && <span className="font-mono text-xs text-muted-foreground">{sub}</span>}
    </GlassPanel>
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <RefreshCw className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="font-mono text-sm text-destructive">{error}</p>
        <button
          type="button"
          onClick={fetchStats}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
        >
          <RefreshCw size={14} />
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            System overview &amp; analytics
          </p>
        </div>
        <button
          type="button"
          onClick={fetchStats}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={data?.users.total ?? 0} icon={<Users size={18} />} />
        <StatCard
          label="AI Queries"
          value={(data?.aiUsage.total ?? 0).toLocaleString()}
          icon={<Bot size={18} />}
          sub={`${(data?.aiUsage.today ?? 0).toLocaleString()} today`}
        />
        <StatCard
          label="This Month"
          value={(data?.aiUsage.thisMonth ?? 0).toLocaleString()}
          icon={<Calendar size={18} />}
        />
        <StatCard
          label="Challenges"
          value={`${data?.challenges.completed ?? 0}/${data?.challenges.total ?? 0}`}
          icon={<Shield size={18} />}
          sub={`${((data?.challenges.completed ?? 0) / Math.max(data?.challenges.total ?? 1, 1)) * 100}% complete`}
        />
      </div>

      <div className="mb-10">
        <h2 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Activity size={14} className="mr-2 inline" />
          Workflows
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {data?.workflows.map((wf) => (
            <GlassPanel key={wf.name} className="flex items-center justify-between p-4">
              <div>
                <div className="font-mono text-sm font-medium text-foreground">{wf.name}</div>
                <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  {wf.binding}
                </div>
              </div>
              {wf.available ? (
                <StatusPill tone="emerald">Active</StatusPill>
              ) : (
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  Offline
                </span>
              )}
            </GlassPanel>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Users size={14} className="mr-2 inline" />
          Recent Registrations
        </h2>
        <GlassPanel className="overflow-hidden p-0">
          <div className="divide-y divide-border/50">
            {(data?.recentUsers.length ?? 0) === 0 ? (
              <div className="px-5 py-8 text-center font-mono text-xs text-muted-foreground">
                No users yet
              </div>
            ) : (
              data?.recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-surface/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                      {(u.name ?? u.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-mono text-sm text-foreground">
                        {u.name ?? "Anonymous"}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {new Date(u.created_at * 1000).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
