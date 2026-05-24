import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";

const STATS = [
  { value: "12K", label: "Operators" },
  { value: "180+", label: "Countries" },
  { value: "47M", label: "Signals / day" },
];

export function CommunitySection() {
  return (
    <section className="relative px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassPanel className="relative overflow-hidden p-10 md:p-16">
            <div className="absolute -top-32 right-0 size-[420px] rounded-full blur-[120px]"
                 style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%)" }} />
            <div className="absolute -bottom-32 left-0 size-[420px] rounded-full blur-[120px]"
                 style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%)" }} />

            <div className="relative grid grid-cols-12 gap-10">
              <div className="col-span-12 lg:col-span-7">
                <StatusPill>The Mission</StatusPill>
                <h2 className="mt-6 font-display text-4xl font-bold tracking-[-0.03em] md:text-6xl text-balance">
                  A network of operators defending the <span className="gradient-text">edge of intelligence.</span>
                </h2>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
                  CyberAI is built with — and for — the engineers, researchers and analysts shaping the next decade of autonomous systems. Join the community shaping how machines defend machines.
                </p>
                <a href="#" className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Apply for early access
                  <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>

              <div className="col-span-12 lg:col-span-5">
                <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
                  {STATS.map((s) => (
                    <div key={s.label} className="bg-background p-6 text-center">
                      <div className="font-display text-3xl font-bold tracking-tighter text-foreground md:text-4xl">{s.value}</div>
                      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-border bg-black/40 p-5">
                  <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">// Operator Log</div>
                  <p className="text-sm italic leading-relaxed text-foreground/80">
                    "It feels like a calm cockpit. Everything I need is one keystroke away — nothing else asking for attention."
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">Dr. M. Aliyev</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Lead Operator · Aetheria</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
