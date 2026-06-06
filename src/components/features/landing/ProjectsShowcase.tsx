import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Satellite,
  Bot,
  Workflow,
  Network,
  Library,
  ArrowUpRight,
  ShieldCheck,
  Code2,
  Gauge,
  Globe,
  X,
  CheckCircle2,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";
import { cn } from "@/lib/utils";

/* ── Project data ──────────────────────────────────────── */

interface Metric {
  label: string;
  value: string;
  accent?: boolean;
}

interface Project {
  id: string;
  icon: typeof Satellite;
  title: string;
  tagline: string;
  description: string;
  details: string;
  status: string;
  statusTone?: "primary" | "accent";
  category: string;
  tech: string[];
  metrics: Metric[];
  features: string[];
  gradient: string;
  accent: boolean;
}

const PROJECTS: Project[] = [
  {
    id: "orbital-sentinel",
    icon: Satellite,
    title: "Orbital Sentinel",
    tagline: "Autonomous threat detection mesh",
    description:
      "A distributed AI mesh correlating threat signals across 400+ actor profiles in sub-40ms, providing real-time surveillance for deep space relays, orbital assets, and edge infrastructure.",
    details:
      "Orbital Sentinel is CyberAI's flagship real-time threat detection platform. It deploys as a lightweight agent mesh across the entire infrastructure surface — from orbital relays to on-premise edge nodes. Each node runs a local inference engine correlating behavioral patterns against a continuously updated threat graph, enabling sub-second detection of zero-day exploits, lateral movement, and data exfiltration attempts. The mesh is self-healing: if a node is compromised, neighboring nodes immediately redistribute its coverage and flag the anomaly.",
    status: "Active",
    statusTone: "primary",
    category: "Defense",
    tech: ["Python", "TensorFlow", "Kubernetes", "Rust", "React"],
    metrics: [
      { label: "Latency", value: "<40ms" },
      { label: "Threats / day", value: "14.2M", accent: true },
      { label: "Coverage", value: "400+" },
      { label: "Uptime", value: "99.99%" },
    ],
    features: [
      "Real-time agent mesh with sub-40ms inference",
      "400+ threat actor profile correlation",
      "Self-healing node architecture",
      "Zero-day exploit pattern matching",
      "Automated incident assessment and prioritization",
    ],
    gradient: "from-violet-500/15 via-transparent to-cyan-500/10",
    accent: true,
  },
  {
    id: "cyber-pilot",
    icon: Bot,
    title: "Cyber-Pilot",
    tagline: "AI-powered infrastructure assistant",
    description:
      "A conversational AI that translates natural language into hardened infrastructure actions — query logs, write firewall policies, run compliance audits, and deploy remediations without a terminal.",
    details:
      "Cyber-Pilot is VAEL's operational interface for your entire stack. Built on a fine-tuned language model with tool-calling capability, it translates human intent into precise, audit-ready actions. Every command is diffed, signed, and reversible. The assistant integrates with your SIEM, IAM, cloud providers, and on-premise infrastructure through a pluggable tool registry. It maintains a full session log with cryptographic attestation for compliance audit.",
    status: "Beta",
    statusTone: "accent",
    category: "AI",
    tech: ["TypeScript", "React", "Python", "FastAPI", "Postgres"],
    metrics: [
      { label: "Accuracy", value: "97.3%", accent: true },
      { label: "Avg Response", value: "1.2s" },
      { label: "Integrations", value: "40+" },
    ],
    features: [
      "Natural language infrastructure management",
      "Per-command diff security model",
      "Pluggable tool registry (40+ integrations)",
      "Cryptographically signed session logs",
      "One-click rollback for every action",
    ],
    gradient: "from-purple-500/15 via-transparent to-pink-500/10",
    accent: true,
  },
  {
    id: "policy-mesh",
    icon: Workflow,
    title: "Policy Mesh",
    tagline: "Deterministic IAM & firewall orchestration",
    description:
      "Translate high-level business intent into low-level firewall rules, IAM policies, and network segmentation — with machine-verified diffs and dry-run previews.",
    details:
      "Policy Mesh bridges the gap between business intent and infrastructure reality. Engineers describe the desired state in a declarative policy language — 'isolate EU-WEST-2 production from staging' — and Policy Mesh calculates the minimal set of firewall rules, IAM bindings, and network policies required to achieve it. Every change is presented as a machine-verified diff with blast radius analysis before deployment.",
    status: "Stable",
    statusTone: "primary",
    category: "Infrastructure",
    tech: ["Go", "TypeScript", "React", "OPA", "gRPC"],
    metrics: [
      { label: "Policy Delta", value: "60%", accent: true },
      { label: "Deploy Time", value: "<2s" },
      { label: "Compliance", value: "100%" },
    ],
    features: [
      "Declarative policy language (DPL)",
      "Machine-verified diffs with blast radius analysis",
      "Dry-run and preview before any deployment",
      "Multi-cloud and on-premise support",
      "Audit trail with cryptographic attestation",
    ],
    gradient: "from-emerald-500/15 via-transparent to-teal-500/10",
    accent: false,
  },
  {
    id: "neural-topology",
    icon: Network,
    title: "Neural Topology",
    tagline: "Real-time network visualization engine",
    description:
      "A cinematic 3D visualization of your entire infrastructure graph — traffic flows, threat heatmaps, anomaly clusters, and dependency chains — rendered at 60 FPS.",
    details:
      "Neural Topology transforms complex infrastructure telemetry into an intuitive, explorable graph. Every node, connection, and data flow is rendered in real-time using a GPU-accelerated WebGL engine. It supports drill-down from global topology to individual packet flows, heatmap overlays for threat levels, latency, and error rates. The engine processes 47M+ signals per day, clustering anomalies and surfacing patterns that static dashboards miss.",
    status: "Active",
    statusTone: "primary",
    category: "Visualization",
    tech: ["WebGL", "TypeScript", "Rust", "React", "D3.js"],
    metrics: [
      { label: "Signals / day", value: "47M", accent: true },
      { label: "Frame Rate", value: "60 FPS" },
      { label: "Nodes Tracked", value: "12K+" },
    ],
    features: [
      "GPU-accelerated WebGL rendering engine",
      "Global-to-packet-level drill-down",
      "Threat heatmap and latency overlays",
      "Anomaly clustering with pattern surfacing",
      "Real-time collaborative annotations",
    ],
    gradient: "from-cyan-500/15 via-transparent to-blue-500/10",
    accent: false,
  },
  {
    id: "incident-playbooks",
    icon: Library,
    title: "Incident Playbooks",
    tagline: "Version-controlled response library",
    description:
      "A living library of validated, version-controlled response playbooks covering forensic acquisition, compliance audit, and automated remediation sequences.",
    details:
      "Incident Playbooks is CyberAI's open-core library of battle-tested response procedures. Each playbook is a version-controlled, machine-readable document encoding precise steps for incident response scenarios — from ransomware containment to insider threat investigation. Playbooks integrate directly with Cyber-Pilot for one-command execution and produce cryptographically verifiable evidence logs suitable for post-incident review and regulatory compliance.",
    status: "Active",
    category: "Security",
    tech: ["YAML", "TypeScript", "React", "Git", "Markdown"],
    metrics: [
      { label: "Playbooks", value: "240+", accent: true },
      { label: "Avg Resolution", value: "4.2m" },
      { label: "CEF Compliant", value: "Yes" },
    ],
    features: [
      "240+ validated response playbooks",
      "Version control with semantic diffing",
      "One-command execution via Cyber-Pilot",
      "Cryptographic evidence logging",
      "Regulatory compliance mapping",
    ],
    gradient: "from-amber-500/15 via-transparent to-orange-500/10",
    accent: false,
  },
];

/* ── Single project card ────────────────────────────────── */

function ProjectCard({
  project,
  index,
  onSelect,
}: {
  project: Project;
  index: number;
  onSelect: () => void;
}) {
  const Icon = project.icon;
  const accent = project.accent;
  const mainColor = accent ? "accent" : "primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group cursor-pointer"
      onClick={onSelect}
    >
      <GlassPanel
        hoverGlow
        className="relative flex h-full min-h-[380px] flex-col overflow-hidden p-7 transition-all duration-500"
      >
        {/* Gradient background overlay */}
        <div
          className={cn(
            "pointer-events-none absolute -inset-40 opacity-0 transition-opacity duration-700 group-hover:opacity-100",
            `bg-gradient-to-br ${project.gradient}`,
          )}
          style={{ maskImage: "radial-gradient(ellipse at 30% 20%, black, transparent 70%)" }}
        />

        {/* Icon */}
        <div
          className={cn(
            "relative mb-5 grid size-11 place-items-center rounded-lg border",
            accent
              ? "border-accent/25 bg-accent/5 text-accent"
              : "border-primary/25 bg-primary/5 text-primary",
          )}
        >
          <Icon size={18} strokeWidth={1.5} />
        </div>

        {/* Status + Category */}
        <div className="relative mb-4 flex items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em]",
              project.statusTone === "accent"
                ? "border-accent/20 bg-accent/5 text-accent"
                : project.statusTone === "primary"
                  ? "border-primary/20 bg-primary/5 text-primary"
                  : "border-border bg-surface-2 text-muted-foreground",
            )}
          >
            {project.status}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60">
            {project.category}
          </span>
        </div>

        {/* Title + tagline */}
        <h3 className="relative font-display text-xl font-bold tracking-tight text-foreground">
          {project.title}
        </h3>
        <p className="relative mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {project.tagline}
        </p>

        {/* Tech tags */}
        <div className="relative mt-4 flex flex-wrap gap-1.5">
          {project.tech.slice(0, 3).map((t) => (
            <span
              key={t}
              className={cn(
                "rounded-md px-2 py-0.5 font-mono text-[9px] font-medium",
                accent ? "bg-accent/8 text-accent/80" : "bg-primary/8 text-primary/80",
              )}
            >
              {t}
            </span>
          ))}
          {project.tech.length > 3 && (
            <span className="font-mono text-[9px] text-muted-foreground/50">
              +{project.tech.length - 3}
            </span>
          )}
        </div>

        {/* Spacer + CTA */}
        <div className="relative mt-auto flex items-center justify-between pt-6">
          <span
            className={cn(
              "font-mono text-[10px] font-bold uppercase tracking-[0.18em] transition-colors",
              accent
                ? "text-accent/70 group-hover:text-accent"
                : "text-primary/70 group-hover:text-primary",
            )}
          >
            Learn{" "}
            <ArrowUpRight
              size={12}
              className="ml-0.5 inline-block transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
          {project.metrics[0] && (
            <div className="text-right">
              <span
                className={cn(
                  "font-display text-lg font-bold tracking-tight",
                  project.metrics[0].accent ? "text-accent" : "text-primary",
                )}
              >
                {project.metrics[0].value}
              </span>
              <span className="ml-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
                {project.metrics[0].label}
              </span>
            </div>
          )}
        </div>

        {/* Bottom accent line */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100",
            accent ? "bg-accent" : "bg-primary",
          )}
        />
      </GlassPanel>
    </motion.div>
  );
}

/* ── Project detail modal ───────────────────────────────── */

function ProjectModal({
  project,
  open,
  onClose,
}: {
  project: Project | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!project) return null;

  const Icon = project.icon;
  const accent = project.accent;
  const mainColor = accent ? "accent" : "primary";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          "max-h-[85vh] max-w-2xl overflow-y-auto border-border bg-background p-0 sm:rounded-2xl",
        )}
      >
        {/* Gradient header */}
        <div
          className={cn(
            "relative overflow-hidden px-8 pt-10 pb-6",
            `bg-gradient-to-br ${project.gradient}`,
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute -inset-40 opacity-40",
              `bg-gradient-to-br ${project.gradient}`,
            )}
            style={{ maskImage: "radial-gradient(ellipse at 30% 30%, black, transparent 70%)" }}
          />

          <div className="relative flex items-start justify-between">
            <div
              className={cn(
                "grid size-12 place-items-center rounded-xl border",
                accent
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-primary/30 bg-primary/10 text-primary",
              )}
            >
              <Icon size={20} strokeWidth={1.5} />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>

          <div className="relative mt-5">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em]",
                  project.statusTone === "accent"
                    ? "border-accent/25 bg-accent/10 text-accent"
                    : project.statusTone === "primary"
                      ? "border-primary/25 bg-primary/10 text-primary"
                      : "border-border bg-surface-2 text-muted-foreground",
                )}
              >
                {project.status}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60">
                {project.category}
              </span>
            </div>
            <DialogTitle className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
              {project.title}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {project.description}
            </DialogDescription>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-8">
          {/* Details */}
          <div>
            <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Overview
            </h4>
            <p className="text-sm leading-relaxed text-foreground/85">{project.details}</p>
          </div>

          {/* Metrics */}
          <div>
            <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Key Metrics
            </h4>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
              {project.metrics.map((m) => (
                <div key={m.label} className="bg-background p-4 text-center">
                  <div
                    className={cn(
                      "font-display text-xl font-bold tracking-tight",
                      m.accent ? "text-accent" : "text-foreground",
                    )}
                  >
                    {m.value}
                  </div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Capabilities
            </h4>
            <ul className="space-y-2.5">
              {project.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-foreground/80">
                  <CheckCircle2
                    size={14}
                    className={cn("mt-0.5 shrink-0", accent ? "text-accent" : "text-primary")}
                  />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div>
            <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Technology Stack
            </h4>
            <div className="flex flex-wrap gap-2">
              {project.tech.map((t) => (
                <span
                  key={t}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 font-mono text-[11px] font-medium transition-colors",
                    accent
                      ? "border-accent/15 bg-accent/5 text-accent/90 hover:border-accent/30"
                      : "border-primary/15 bg-primary/5 text-primary/90 hover:border-primary/30",
                  )}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main showcase section ──────────────────────────────── */

export function ProjectsShowcase() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedProject = PROJECTS.find((p) => p.id === selectedId) ?? null;

  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 flex flex-col items-start gap-6"
        >
          <StatusPill tone="accent">Active Projects</StatusPill>
          <h2 className="max-w-3xl font-display text-4xl font-bold tracking-[-0.03em] md:text-5xl">
            Sovereign infrastructure{" "}
            <span className="text-muted-foreground">for the autonomous era.</span>
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            Every CyberAI project is built to one spec: silent strength at machine speed. Click any
            card to explore architecture, metrics, and capabilities.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} onSelect={() => setSelectedId(p.id)} />
          ))}
        </div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            open={!!selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
