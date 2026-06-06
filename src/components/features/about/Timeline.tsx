import { motion } from "framer-motion";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";

const EASE = [0.16, 1, 0.3, 1] as const;

const MILESTONES = [
  {
    year: "2023",
    title: "Origin Cell",
    body: "Four founders, one whiteboard, and one thesis: cognition outpaces credentials. Funded by sovereign infrastructure operators.",
  },
  {
    year: "2024",
    title: "First Autonomous Judgment",
    body: "Our reasoning agent contained a live ransomware outbreak across 12,000 endpoints — 47 seconds, zero analyst involvement.",
  },
  {
    year: "2025",
    title: "Orbital Mesh",
    body: "Deployed across three continents and one low-earth-orbit constellation. Real-time pattern matching across 400+ distinct threat actors.",
  },
  {
    year: "2026",
    title: "Sovereign Era",
    body: "CyberAI becomes the standard cognition layer for high-stakes infrastructure. The perimeter no longer needs to be defended. It defends itself.",
  },
];

export function Timeline() {
  return (
    <section className="relative px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-16 flex flex-col items-start gap-6"
        >
          <StatusPill>Operational Chronology</StatusPill>
          <h2 className="max-w-3xl font-display text-4xl font-bold tracking-[-0.03em] md:text-5xl">
            Four years. <span className="text-muted-foreground">A different theater of war.</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Vertical glowing line */}
          <div
            aria-hidden
            className="absolute left-4 top-0 h-full w-px md:left-1/2 md:-translate-x-1/2"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, color-mix(in oklab, var(--primary) 40%, transparent) 15%, color-mix(in oklab, var(--accent) 40%, transparent) 85%, transparent 100%)",
            }}
          />

          <div className="space-y-12 md:space-y-20">
            {MILESTONES.map((m, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.8, delay: i * 0.06, ease: EASE }}
                  className={`relative grid grid-cols-[40px_1fr] gap-6 md:grid-cols-2 md:gap-12 ${
                    isLeft ? "" : "md:[&>*:first-child]:order-2"
                  }`}
                >
                  {/* Node dot — mobile pinned left, desktop centered */}
                  <div className="relative md:hidden">
                    <div className="absolute left-4 top-6 size-3 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_20px_4px_color-mix(in_oklab,var(--primary)_50%,transparent)]" />
                  </div>

                  <div className={isLeft ? "md:text-right" : ""}>
                    <GlassPanel hoverGlow className="relative p-7">
                      {/* Desktop center dot */}
                      <div
                        className={`absolute top-7 hidden size-3 rounded-full bg-primary shadow-[0_0_20px_4px_color-mix(in_oklab,var(--primary)_50%,transparent)] md:block ${
                          isLeft ? "-right-[calc(50%+12px)]" : "-left-[calc(50%+12px)]"
                        }`}
                      />
                      <div className="mb-3 font-mono text-xs font-bold tracking-[0.2em] text-primary">
                        {m.year}
                      </div>
                      <h3 className="mb-2 font-display text-2xl font-bold tracking-tight">
                        {m.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{m.body}</p>
                    </GlassPanel>
                  </div>
                  <div className="hidden md:block" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
