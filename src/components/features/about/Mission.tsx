import { motion } from "framer-motion";
import { Target, BrainCircuit, Globe } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";

const EASE = [0.16, 1, 0.3, 1] as const;

const PILLARS = [
  {
    icon: Target,
    label: "Precision",
    title: "Zero false positives at orbital scale.",
    body: "Every alert is a verdict. We optimize for signal density, not telemetry volume.",
  },
  {
    icon: BrainCircuit,
    label: "Autonomy",
    title: "Decisions made before humans wake up.",
    body: "Closed-loop reasoning agents that detect, decide, and remediate without escalation.",
    accent: true,
  },
  {
    icon: Globe,
    label: "Sovereignty",
    title: "Your data never leaves the perimeter.",
    body: "Models train, infer, and reason inside your enclave. No telemetry exfiltration. Ever.",
  },
];

export function Mission() {
  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-14 flex flex-col items-start gap-6"
        >
          <StatusPill tone="accent">Mission Directive</StatusPill>
          <h2 className="max-w-3xl font-display text-4xl font-bold tracking-[-0.03em] md:text-5xl">
            Three principles{" "}
            <span className="text-muted-foreground">non-negotiable since day one.</span>
          </h2>
        </motion.div>

        <GlassPanel className="glass-panel-strong p-2 md:p-3">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-border md:grid-cols-3">
            {PILLARS.map((p, i) => {
              const Icon = p.icon;
              const accent = p.accent;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
                  className="group relative bg-background/80 p-8 backdrop-blur-md transition-colors hover:bg-surface/60"
                >
                  <div
                    className={`mb-6 grid size-11 place-items-center rounded-lg border ${
                      accent
                        ? "border-accent/25 bg-accent/5 text-accent"
                        : "border-primary/25 bg-primary/5 text-primary"
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                  </div>
                  <div
                    className={`mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${
                      accent ? "text-accent" : "text-primary"
                    }`}
                  >
                    {p.label}
                  </div>
                  <h3 className="mb-3 font-display text-xl font-bold leading-snug tracking-tight">
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </motion.div>
              );
            })}
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
