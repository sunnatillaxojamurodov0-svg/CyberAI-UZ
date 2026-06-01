import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, BrainCircuit, Globe, CheckCircle2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

interface PillarData {
  id: string;
  icon: typeof Target;
  label: string;
  title: string;
  body: string;
  details: string;
  features: string[];
  gradient: string;
  accent?: boolean;
}

const PILLARS: PillarData[] = [
  {
    id: "precision",
    icon: Target,
    label: "Precision",
    title: "Zero false signals at orbital scale.",
    body: "Every signal is a judgment. We optimize for signal density, not telemetry volume.",
    details:
      "Precision is our core engineering mandate. Every detection pipeline undergoes adversarial testing, statistical fuzzing, and real-world red-team campaigns before deployment. False signals are treated as critical bugs — root-caused, fixed, and added to the regression suite. Our multi-stage correlation engine cross-validates signals across 400+ threat profiles, network telemetry, and behavioral baselines before any alert is raised. The result: signals that demand action, not triage.",
    features: [
      "Multi-stage signal correlation before any alert is raised",
      "Adversarial testing and red-team testing on every pipeline",
      "False-signal regression suite with automated root-cause analysis",
      "Sub-40ms inference at 99.97% accuracy at orbital scale",
      "Continuous statistical fuzzing against detection thresholds",
    ],
    gradient: "from-cyan-500/15 via-transparent to-blue-500/10",
  },
  {
    id: "autonomy",
    icon: BrainCircuit,
    label: "Autonomy",
    title: "Decisions are made before humans wake up.",
    body: "Closed-loop reasoning agents that detect, decide, and remediate without escalation.",
    details:
      "Autonomy is not about removing humans — it is about absorbing machine-speed threats that no human can react to. CyberAI's autonomous agents operate as a closed-loop reasoning system: they observe infrastructure state, classify the nature and severity of anomalies, select the appropriate remediation strategy from a verifiable policy graph, execute the response within blast-radius constraints, and record every decision with cryptographic attestation for post-mortem review. Human operators define the policy envelope; agents operate within it at machine speed.",
    features: [
      "Closed-loop observe-classify-act-verify reasoning pipeline",
      "Policy-graph bounded remediation with blast-radius constraints",
      "Cryptographically attested decision logs for compliance",
      "Automatic escalation to human-in-the-loop for edge cases",
      "Sub-second detection-to-remediation cycle time",
    ],
    gradient: "from-purple-500/15 via-transparent to-pink-500/10",
    accent: true,
  },
  {
    id: "sovereignty",
    icon: Globe,
    label: "Sovereignty",
    title: "Your data never leaves the perimeter.",
    body: "Models train, infer, and reason inside your enclave. No telemetry exfiltration. Ever.",
    details:
      "Sovereignty is CyberAI's architectural foundation. Every model, pipeline, and inference engine is designed to run entirely inside your infrastructure perimeter. No telemetry exfiltration, no beaconing to external services, no dependency on cloud-based inference APIs. Models are delivered as hardened enclave images, updated through air-gapped channels, and cryptographically verified before execution. Training, fine-tuning, and inference — all happen on your hardware, under your key material. Your data — your rules.",
    features: [
      "All inference runs inside your perimeter — no external API calls",
      "Hardened enclave images with cryptographic load verification",
      "Air-gapped model update pipeline with signed manifests",
      "On-premise fine-tuning under your key material",
      "Zero telemetry exfiltration — no beaconing, no callbacks, no phoning home",
    ],
    gradient: "from-emerald-500/15 via-transparent to-teal-500/10",
  },
];

function PillarModal({
  pillar,
  open,
  onClose,
}: {
  pillar: PillarData | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!pillar) return null;

  const Icon = pillar.icon;
  const accent = pillar.accent;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-border bg-background p-0 sm:rounded-2xl">
        {/* Gradient header */}
        <div
          className={cn(
            "relative overflow-hidden px-8 pt-10 pb-6 bg-gradient-to-br",
            pillar.gradient,
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute -inset-40 opacity-40 bg-gradient-to-br",
              pillar.gradient,
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
            <DialogTitle className="font-display text-2xl font-bold tracking-tight text-foreground">
              {pillar.label}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {pillar.body}
            </DialogDescription>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-8 px-8 py-6">
          <div>
            <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Principles
            </h4>
            <p className="text-sm leading-relaxed text-foreground/85">{pillar.details}</p>
          </div>

          <div>
            <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Capabilities
            </h4>
            <ul className="space-y-2.5">
              {pillar.features.map((f) => (
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Mission() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedPillar = PILLARS.find((p) => p.id === selectedId) ?? null;

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
            Three principles never{" "}
            <span className="text-muted-foreground">negotiated from day one.</span>
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
                  className="group relative cursor-pointer bg-background/80 p-8 backdrop-blur-md transition-all duration-300 hover:bg-surface/60 hover:shadow-[inset_0_0_30px_-12px] hover:shadow-accent/10"
                  onClick={() => setSelectedId(p.id)}
                >
                  {/* Hover gradient line */}
                  <div className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-accent/40 to-transparent transition-transform duration-500 group-hover:scale-x-100" />

                  <div
                    className={cn(
                      "mb-6 grid size-11 place-items-center rounded-lg border transition-colors",
                      accent
                        ? "border-accent/25 bg-accent/5 text-accent group-hover:border-accent/40 group-hover:bg-accent/10"
                        : "border-primary/25 bg-primary/5 text-primary group-hover:border-primary/40 group-hover:bg-primary/10",
                    )}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                  </div>
                  <div
                    className={cn(
                      "mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em]",
                      accent ? "text-accent" : "text-primary",
                    )}
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

      <AnimatePresence>
        {selectedPillar && (
          <PillarModal
            pillar={selectedPillar}
            open={!!selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
