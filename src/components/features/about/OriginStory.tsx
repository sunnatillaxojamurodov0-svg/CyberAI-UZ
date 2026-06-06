import { motion } from "framer-motion";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";

const EASE = [0.16, 1, 0.3, 1] as const;

export function OriginStory() {
  return (
    <section className="px-6 py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <StatusPill>01-Chapter // Origin</StatusPill>
          <h2 className="mt-6 font-display text-4xl font-bold tracking-[-0.03em] md:text-5xl">
            We watched the perimeter{" "}
            <span className="text-muted-foreground">melt in real time.</span>
          </h2>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>
              CyberAI was founded in 2023 by a small group of former intelligence operators, ML
              researchers, and infrastructure engineers. They were united by one frustration: the
              SOC stack had become a museum of dashboards no one had time to read.
            </p>
            <p>
              Adversaries were already deploying generative agents. Defenders were still triaging
              tickets. The asymmetry was no longer about budget —
              <span className="text-foreground"> it was about cognition speed.</span>
            </p>
            <p>
              We didn't set out to build another scanner. We set out to build an intelligence for
              the perimeter — one that thinks in milliseconds, speaks in plain language, and never
              asks permission to defend.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: EASE }}
          className="relative"
        >
          <GlassPanel className="relative aspect-square overflow-hidden p-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--primary) 28%, transparent) 0%, transparent 55%), radial-gradient(circle at 70% 75%, color-mix(in oklab, var(--accent) 32%, transparent) 0%, transparent 55%)",
              }}
            />
            <div className="absolute inset-0 grid-bg opacity-30" />
            <div className="absolute inset-0 [mask-image:radial-gradient(circle_at_center,black_30%,transparent_75%)]">
              <div
                className="absolute left-1/2 top-1/2 size-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/40 animate-pulse-soft"
                style={{
                  boxShadow: "0 0 80px -10px color-mix(in oklab, var(--primary) 60%, transparent)",
                }}
              />
              <div className="absolute left-1/2 top-1/2 size-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/30" />
              <div className="absolute left-1/2 top-1/2 size-[20%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-2xl" />
            </div>
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>NODE-001 / ORBITAL</span>
              <span className="text-primary">● LIVE</span>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
