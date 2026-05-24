import { motion } from "framer-motion";
import { Radar, Sparkles, Library, FolderGit2, ShieldCheck, Workflow } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";

const ITEMS = [
  { icon: Radar, label: "Threat Intel", title: "Global Signal Mesh", body: "Predictive pattern matching across 400+ distinct threat actors with sub-second telemetry." },
  { icon: Sparkles, label: "AI Assistant", title: "Cyber-Pilot", body: "Natural-language interface to query logs, write policy, and remediate incidents in flight.", tone: "accent" as const },
  { icon: Library, label: "Prompt Library", title: "Incident Playbooks", body: "Validated, version-controlled prompts for forensic, audit and compliance workflows." },
  { icon: FolderGit2, label: "Projects", title: "Scoped Sandboxes", body: "Isolated environments to model exploits and train custom detection ensembles safely.", tone: "accent" as const },
  { icon: ShieldCheck, label: "Defense", title: "Autonomous Remediation", body: "Closed-loop response: detect, decide, deploy — without waking a human at 03:00." },
  { icon: Workflow, label: "Orchestration", title: "Policy Mesh", body: "Translate business intent into low-level firewall and IAM policy with deterministic diffs." },
];

export function CapabilityGrid() {
  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col items-start gap-6">
          <StatusPill tone="accent">Tactical Capabilities</StatusPill>
          <h2 className="max-w-3xl font-display text-4xl font-bold tracking-[-0.03em] md:text-5xl">
            Built for environments where milliseconds <span className="text-muted-foreground">separate safety from exposure.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((it, i) => {
            const Icon = it.icon;
            const accent = it.tone === "accent";
            return (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="group relative bg-background p-8 transition-colors hover:bg-surface/60"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div
                  className={`mb-6 grid size-11 place-items-center rounded-lg border ${
                    accent ? "border-accent/25 bg-accent/5 text-accent" : "border-primary/25 bg-primary/5 text-primary"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <div className={`mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${accent ? "text-accent" : "text-primary"}`}>
                  {it.label}
                </div>
                <h3 className="mb-2 font-display text-xl font-bold tracking-tight">{it.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{it.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
