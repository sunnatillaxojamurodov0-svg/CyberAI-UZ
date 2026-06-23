import { useState } from "react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";
import { 
  Shield, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2,
  RefreshCw,
  Copy,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface ThreatVector {
  id: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  technique: string;
  mitigation: string;
  cve?: string;
  references?: string[];
}

const SEVERITY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  low: {
    icon: <Info size={14} />,
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/30",
  },
  medium: {
    icon: <AlertCircle size={14} />,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/30",
  },
  high: {
    icon: <AlertTriangle size={14} />,
    color: "text-orange-400",
    bg: "bg-orange-400/10 border-orange-400/30",
  },
  critical: {
    icon: <Shield size={14} />,
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/30",
  },
};

export function ThreatsPage() {
  const { user } = useAuth();
  const [infrastructure, setInfrastructure] = useState("");
  const [threats, setThreats] = useState<ThreatVector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const generateThreats = async () => {
    if (!user) {
      alert("Please sign in to generate threats");
      return;
    }

    setLoading(true);
    setError(null);
    setThreats([]);

    try {
      const res = await fetch("/api/threats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          infrastructure: infrastructure || undefined,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setThreats(json.data);
      } else {
        setError(json.error ?? "Failed to generate threats");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getSeverityStats = () => {
    const stats = { critical: 0, high: 0, medium: 0, low: 0 };
    threats.forEach((t) => {
      stats[t.severity]++;
    });
    return stats;
  };

  const stats = getSeverityStats();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Input Section */}
      <GlassPanel className="mb-8 p-6">
        <h3 className="mb-3 font-mono text-sm font-bold text-foreground">
          Infrastructure Description
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Describe your infrastructure to generate targeted threat vectors. Leave empty for general
          enterprise threats.
        </p>
        <textarea
          value={infrastructure}
          onChange={(e) => setInfrastructure(e.target.value)}
          placeholder={`Example:\n- Cloud: AWS (EC2, S3, RDS)\n- Web: React frontend, Node.js API\n- Database: PostgreSQL on RDS\n- Auth: OAuth2 with Google/GitHub\n- CI/CD: GitHub Actions\n- 50 remote workers`}
          rows={4}
          className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-accent/40"
        />
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {threats.length > 0
              ? `${threats.length} threats generated`
              : "Describe your setup or leave empty for general analysis"}
          </p>
          <button
            type="button"
            onClick={generateThreats}
            disabled={loading || !user}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2.5 font-mono text-xs font-bold transition-all",
              loading
                ? "bg-accent/20 text-accent"
                : "bg-accent text-white shadow-[0_0_18px_-6px] shadow-accent/50 hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
            )}
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Shield size={14} />
                Generate Threats
              </>
            )}
          </button>
        </div>
      </GlassPanel>

      {/* Error */}
      {error && (
        <GlassPanel className="mb-8 border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle size={16} />
            <span className="font-mono text-sm">{error}</span>
          </div>
        </GlassPanel>
      )}

      {/* Stats */}
      {threats.length > 0 && (
        <div className="mb-8 grid grid-cols-4 gap-4">
          {Object.entries(stats).map(([severity, count]) => (
            <GlassPanel
              key={severity}
              className={cn("flex items-center justify-between p-4", SEVERITY_CONFIG[severity].bg)}
            >
              <div className="flex items-center gap-2">
                <span className={SEVERITY_CONFIG[severity].color}>
                  {SEVERITY_CONFIG[severity].icon}
                </span>
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {severity}
                </span>
              </div>
              <span className={cn("font-mono text-2xl font-bold", SEVERITY_CONFIG[severity].color)}>
                {count}
              </span>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* Threat List */}
      {threats.length > 0 && (
        <div className="space-y-4">
          {threats.map((threat) => (
            <GlassPanel
              key={threat.id}
              className={cn(
                "overflow-hidden transition-all",
                expanded === threat.id && "ring-1 ring-accent/30"
              )}
            >
              {/* Header */}
              <div
                className="flex cursor-pointer items-start justify-between p-5"
                onClick={() => setExpanded(expanded === threat.id ? null : threat.id)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl",
                      SEVERITY_CONFIG[threat.severity].bg
                    )}
                  >
                    <span className={SEVERITY_CONFIG[threat.severity].color}>
                      {SEVERITY_CONFIG[threat.severity].icon}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {threat.id}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
                          SEVERITY_CONFIG[threat.severity].bg,
                          SEVERITY_CONFIG[threat.severity].color
                        )}
                      >
                        {threat.severity}
                      </span>
                    </div>
                    <h4 className="mt-1 font-mono text-sm font-bold text-foreground">
                      {threat.name}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">{threat.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {threat.category}
                  </span>
                </div>
              </div>

              {/* Expanded Content */}
              {expanded === threat.id && (
                <div className="border-t border-border/50 bg-surface/30 p-5">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h5 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Attack Technique
                      </h5>
                      <p className="text-sm text-foreground">{threat.technique}</p>
                    </div>
                    <div>
                      <h5 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Mitigation
                      </h5>
                      <p className="text-sm text-foreground">{threat.mitigation}</p>
                    </div>
                  </div>

                  {threat.cve && (
                    <div className="mt-4">
                      <h5 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        CVE Reference
                      </h5>
                      <a
                        href={`https://nvd.nist.gov/vuln/detail/${threat.cve}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-sm text-accent hover:underline"
                      >
                        {threat.cve}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {threat.references && threat.references.length > 0 && (
                    <div className="mt-4">
                      <h5 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        References
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {threat.references.map((ref, i) => (
                          <a
                            key={i}
                            href={ref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 font-mono text-[10px] text-muted-foreground hover:border-accent/30 hover:text-accent"
                          >
                            <ExternalLink size={10} />
                            Reference {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(JSON.stringify(threat, null, 2))}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-accent/30 hover:text-accent"
                    >
                      <Copy size={12} />
                      Copy JSON
                    </button>
                  </div>
                </div>
              )}
            </GlassPanel>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && threats.length === 0 && !error && (
        <GlassPanel className="flex flex-col items-center justify-center py-16">
          <Shield size={48} className="text-muted-foreground/30" />
          <p className="mt-4 font-mono text-sm text-muted-foreground">
            Describe your infrastructure and click "Generate Threats" to start analysis.
          </p>
        </GlassPanel>
      )}
    </div>
  );
}
