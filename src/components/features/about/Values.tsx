import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, BellOff, ScrollText, CheckCircle2, X } from "lucide-react";
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

interface ValueData {
  id: string;
  icon: typeof Shield;
  label: string;
  title: string;
  body: string;
  details: string;
  features: string[];
  gradient: string;
}

const VALUES: ValueData[] = [
  {
    id: "sovereignty",
    icon: Shield,
    label: "01 // Sovereignty",
    title: "Your perimeter, your weights.",
    body: "No model leaves your enclave. No telemetry leaves your jurisdiction. Quiet by architecture.",
    details:
      "Sovereignty is the non-negotiable foundation of CyberAI. Every computation — from inference to fine-tuning — executes within your defined perimeter. Models are delivered as signed, hardened enclave images that are cryptographically verified before execution. No telemetry is exfiltrated to external services; no model weights are shared with third parties. Your data, your infrastructure, your rules — enforced at the architectural level, not the policy level.",
    features: [
      "All inference and training runs inside your infrastructure perimeter",
      "Hardened enclave images with cryptographic boot verification",
      "Zero telemetry exfiltration — no callbacks to external services",
      "Air-gapped model update pipeline with signed manifests",
      "Customer-controlled key material for all cryptographic operations",
    ],
    gradient: "from-cyan-500/15 via-transparent to-blue-500/10",
  },
  {
    id: "velocity",
    icon: Zap,
    label: "02 // Velocity",
    title: "Milliseconds, not meetings.",
    body: "We measure success in mean-time-to-containment. Everything else is theatre.",
    details:
      "Velocity is measured in milliseconds from detection to containment. CyberAI's autonomous agents operate on a closed-loop pipeline that observes, classifies, decides, and acts within the time window that matters — before a vulnerability can be weaponized, before lateral movement can complete, before data can be exfiltrated. Human operators define the strategic envelope; the system operates within it at machine speed. Every millisecond of delay is a vector of risk, and we treat it as such.",
    features: [
      "Sub-second detection-to-remediation cycle time",
      "Closed-loop observe-classify-act pipeline with no human bottleneck",
      "Parallel threat correlation across 400+ actor profiles",
      "Pre-computed remediation strategies for known threat patterns",
      "Real-time latency monitoring with automated regression detection",
    ],
    gradient: "from-purple-500/15 via-transparent to-pink-500/10",
  },
  {
    id: "silence",
    icon: BellOff,
    label: "03 // Silence",
    title: "If you hear us, we failed.",
    body: "The best defense produces no notifications, no pages, no 03:00 calls. Invisible by design.",
    details:
      "Silence is the metric that matters most. A defense system that generates noise — false positives, redundant alerts, meaningless telemetry — is not a defense system; it's a distraction engine. CyberAI's architecture is designed to absorb threats at machine speed without human notification. Alerts are only surfaced when an event requires human judgment that falls outside the defined policy envelope. By default, the system operates silently: detecting, deciding, and remediating without waking anyone. If you receive a notification, it means the system identified a situation that genuinely requires your expertise.",
    features: [
      "Silent-by-default operation — no notifications for machine-handled events",
      "Intelligent escalation only when human judgment is required",
      "False-positive rate below 0.03% across all detection pipelines",
      "Automated post-mortem logging without operator involvement",
      "Mean-time-to-notification for genuine escalations under 2 seconds",
    ],
    gradient: "from-emerald-500/15 via-transparent to-teal-500/10",
  },
  {
    id: "certainty",
    icon: ScrollText,
    label: "04 // Certainty",
    title: "Every verdict is auditable.",
    body: "Deterministic reasoning trails. Cryptographically signed actions. No black-box defense.",
    details:
      "Certainty means every decision the system makes can be traced, verified, and audited. CyberAI maintains a cryptographically signed chain of reasoning for every detection, classification, and remediation action it takes. This is not optional logging — it's a core architectural property. Each decision includes the input signals that drove it, the policy rules that constrained it, the reasoning path that determined the outcome, and a cryptographic signature that ties it all together. In a post-incident review, compliance audit, or legal proceeding, you can present the complete, verifiable record of exactly what happened and why.",
    features: [
      "Cryptographically signed decision trails for every action",
      "Deterministic reasoning paths with full input signal provenance",
      "Tamper-evident audit logs suitable for regulatory compliance",
      "Policy-constrained decision boundaries with verifiable enforcement",
      "Complete post-incident reconstruction from signed evidence chain",
    ],
    gradient: "from-amber-500/15 via-transparent to-orange-500/10",
  },
];

function ValueModal({
  value,
  open,
  onClose,
}: {
  value: ValueData | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!value) return null;

  const Icon = value.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-border bg-background p-0 sm:rounded-2xl">
        {/* Gradient header */}
        <div
          className={cn(
            "relative overflow-hidden px-8 pt-10 pb-6 bg-gradient-to-br",
            value.gradient,
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute -inset-40 opacity-40 bg-gradient-to-br",
              value.gradient,
            )}
            style={{ maskImage: "radial-gradient(ellipse at 30% 30%, black, transparent 70%)" }}
          />

          <div className="relative flex items-start justify-between">
            <div className="grid size-12 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
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
              {value.label}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {value.body}
            </DialogDescription>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-8 px-8 py-6">
          <div>
            <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Doctrine
            </h4>
            <p className="text-sm leading-relaxed text-foreground/85">{value.details}</p>
          </div>

          <div>
            <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Enforcement
            </h4>
            <ul className="space-y-2.5">
              {value.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-foreground/80">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-primary" />
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

export function Values() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedValue = VALUES.find((v) => v.id === selectedId) ?? null;

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
          <StatusPill tone="accent">Operating Doctrine</StatusPill>
          <h2 className="max-w-3xl font-display text-4xl font-bold tracking-[-0.03em] md:text-5xl">
            Four values{" "}
            <span className="text-muted-foreground">we will not negotiate.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {VALUES.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.label}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: EASE }}
              >
                <GlassPanel
                  hoverGlow
                  className="group relative h-full cursor-pointer p-8 transition-all duration-300"
                  onClick={() => setSelectedId(v.id)}
                >
                  <div className="mb-5 flex items-center gap-3">
                    <div className="grid size-8 place-items-center rounded-lg border border-primary/20 bg-primary/5 text-primary transition-colors group-hover:border-primary/35 group-hover:bg-primary/10">
                      <Icon size={15} strokeWidth={1.5} />
                    </div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                      {v.label}
                    </span>
                  </div>
                  <h3 className="mb-3 font-display text-2xl font-bold leading-tight tracking-tight">
                    {v.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{v.body}</p>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedValue && (
          <ValueModal
            value={selectedValue}
            open={!!selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
