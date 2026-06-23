import { useState, useEffect } from "react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";
import { 
  Server, 
  Shield, 
  Cpu, 
  Globe, 
  Database, 
  Mail, 
  Terminal,
  Play,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface TargetTemplate {
  id: string;
  name: string;
  description: string;
  os: string;
  services: string[];
  difficulty: number;
  category: string;
}

interface ActiveTarget {
  id: string;
  ip: string;
  template: TargetTemplate;
  status: "spinning" | "running" | "stopped";
  created_at: number;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  web: <Globe size={18} className="text-blue-400" />,
  network: <Shield size={18} className="text-purple-400" />,
  privesc: <Terminal size={18} className="text-red-400" />,
  recon: <Cpu size={18} className="text-green-400" />,
};

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "text-green-400",
  2: "text-yellow-400",
  3: "text-red-400",
};

export function TargetsPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TargetTemplate[]>([]);
  const [activeTargets, setActiveTargets] = useState<ActiveTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [spawning, setSpawning] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("category", filter);

      const res = await fetch(`/api/targets?${params.toString()}`);
      const json = await res.json();
      if (json.ok) {
        setTemplates(json.data);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [filter]);

  const spawnTarget = async (templateId: string) => {
    if (!user) {
      alert("Please sign in to spawn targets");
      return;
    }

    setSpawning(templateId);
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ template_id: templateId }),
      });

      const json = await res.json();
      if (json.ok) {
        const newTarget: ActiveTarget = {
          ...json.data,
          status: "running",
        };
        setActiveTargets((prev) => [...prev, newTarget]);
      }
    } catch {
      // Handle error
    } finally {
      setSpawning(null);
    }
  };

  const getDifficultyLabel = (level: number) => {
    if (level === 1) return "Easy";
    if (level === 2) return "Medium";
    return "Hard";
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <RefreshCw className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Active Targets */}
      {activeTargets.length > 0 && (
        <div className="mb-12">
          <h2 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Active Targets
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeTargets.map((target) => (
              <GlassPanel key={target.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-accent/10">
                      <Server size={18} className="text-accent" />
                    </div>
                    <div>
                      <div className="font-mono text-sm font-medium text-foreground">
                        {target.template.name}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {target.ip}
                      </div>
                    </div>
                  </div>
                  <StatusPill tone="emerald">Running</StatusPill>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {target.template.services.map((service) => (
                    <span
                      key={service}
                      className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {service}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(`/console?target=${target.id}`, "_blank")}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-accent/30 hover:text-accent"
                  >
                    <Terminal size={12} />
                    Open Terminal
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(`http://${target.ip}`, "_blank")}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-accent/30 hover:text-accent"
                  >
                    <ExternalLink size={12} />
                    Web
                  </button>
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Category:
        </span>
        {[
          { value: "all", label: "All" },
          { value: "web", label: "Web" },
          { value: "network", label: "Network" },
          { value: "privesc", label: "Privilege Escalation" },
          { value: "recon", label: "Recon" },
        ].map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 font-mono text-xs transition-colors",
              filter === f.value
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-border bg-surface text-muted-foreground hover:border-accent/30 hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Target Templates */}
      <h2 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Available Templates
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <GlassPanel key={template.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-accent/10">
                  {CATEGORY_ICONS[template.category] ?? <Server size={18} className="text-accent" />}
                </div>
                <div>
                  <div className="font-mono text-sm font-medium text-foreground">
                    {template.name}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {template.os}
                  </div>
                </div>
              </div>
              <span className={cn("font-mono text-xs font-bold", DIFFICULTY_COLORS[template.difficulty])}>
                {getDifficultyLabel(template.difficulty)}
              </span>
            </div>

            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              {template.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {template.services.map((service) => (
                <span
                  key={service}
                  className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  {service}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => spawnTarget(template.id)}
              disabled={spawning === template.id || !user}
              className={cn(
                "mt-4 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-mono text-xs font-bold transition-all",
                spawning === template.id
                  ? "bg-accent/20 text-accent"
                  : "bg-accent text-white shadow-[0_0_18px_-6px] shadow-accent/50 hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
              )}
            >
              {spawning === template.id ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  Spinning up...
                </>
              ) : (
                <>
                  <Play size={12} />
                  Launch Target
                </>
              )}
            </button>
          </GlassPanel>
        ))}
      </div>

      {/* Info Banner */}
      <GlassPanel className="mt-8 p-6">
        <div className="flex items-start gap-4">
          <div className="grid size-10 place-items-center rounded-xl bg-accent/10">
            <Shield size={18} className="text-accent" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-foreground">
              Fully Isolated Environment
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Each target runs in its own isolated network. You cannot access other targets or the
              internet. All traffic is monitored and logged for educational purposes.
            </p>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
