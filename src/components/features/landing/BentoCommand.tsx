import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/shared/GlassPanel";
import heroGlobe from "@/assets/hero-globe.jpg";
import neuralTopology from "@/assets/neural-topology.jpg";

const reveal = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
});

export function BentoCommand() {
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(clock.getHours()).padStart(2, "0");
  const mm = String(clock.getMinutes()).padStart(2, "0");
  const ss = String(clock.getSeconds()).padStart(2, "0");
  return (
    <section className="relative px-6 pb-24">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4">
        {/* Main instrument */}
        <motion.div {...reveal(0)} className="col-span-12 md:col-span-8">
          <GlassPanel hoverGlow className="h-full min-h-[440px] p-8">
            <div className="absolute right-4 top-4 font-mono text-[10px] tracking-widest text-primary/60">
              REF: 00-ALPHA-9
            </div>
            <div className="flex h-full flex-col">
              <div className="mb-6">
                <h3 className="font-display text-2xl font-bold tracking-tight">
                  Global Threat Visualizer
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Real-time telemetry across deep-space relays.
                </p>
              </div>
              <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-black/40">
                <img
                  src={heroGlobe}
                  alt="Holographic globe visualization of global threat telemetry"
                  width={1600}
                  height={896}
                  className="absolute inset-0 h-full w-full object-cover opacity-90 animate-float"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 4px)",
                    animation: "scanline 4s linear infinite",
                  }}
                />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    Visualizer Active
                  </span>
                  <span className="tabular-nums">
                    {hh}:{mm}:{ss}
                  </span>
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* AI assistant side console */}
        <motion.div {...reveal(1)} className="col-span-12 md:col-span-4">
          <GlassPanel className="flex h-full min-h-[440px] flex-col gap-5 p-6 hover:border-accent/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                AI Assistant
              </span>
              <span className="size-2 rounded-full bg-accent animate-pulse" />
            </div>
            <div className="rounded-xl border border-border bg-black/40 p-4 text-sm leading-relaxed">
              <span className="text-accent">CyberAI: </span>
              Sector 5G perimeter activity being analyzed. Rerouting network traffic through
              isolation filters recommended.
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-white/[0.03] px-4 py-2.5">
              <div className="h-1 w-24 overflow-hidden rounded-full bg-primary/15">
                <div className="h-full w-2/3 bg-primary" />
              </div>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Threat: Past
              </span>
            </div>
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-black/40">
              <img
                src={neuralTopology}
                alt="Neural network topology"
                width={800}
                height={800}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-80"
              />
              <div className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Neural Topology
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Stats trio */}
        <motion.div {...reveal(2)} className="col-span-6 md:col-span-3">
          <GlassPanel className="p-6">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Uptime
            </div>
            <div className="font-display text-4xl font-bold tracking-tighter">
              99.99<span className="text-primary">%</span>
            </div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full bg-primary" style={{ width: "99.9%" }} />
            </div>
          </GlassPanel>
        </motion.div>

        <motion.div {...reveal(3)} className="col-span-6 md:col-span-3">
          <GlassPanel className="p-6">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Threats Blocked
            </div>
            <div className="font-display text-4xl font-bold tracking-tighter">
              14.2<span className="text-accent">M</span>
            </div>
            <div className="mt-4 flex items-end gap-1">
              {[0.2, 0.3, 0.45, 0.6, 0.8, 1].map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-sm bg-accent"
                  style={{ height: `${h * 28}px`, opacity: 0.25 + h * 0.7 }}
                />
              ))}
            </div>
          </GlassPanel>
        </motion.div>

        <motion.div {...reveal(4)} className="col-span-12 md:col-span-6">
          <GlassPanel className="flex items-center justify-between p-6">
            <div>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                System Status
              </div>
              <div className="font-display text-xl font-bold">All sectors operational</div>
            </div>
            <div className="flex -space-x-3">
              {["S1", "S2", "S3"].map((s, i) => (
                <div
                  key={s}
                  className="grid size-10 place-items-center rounded-full border-2 border-background bg-surface-2 font-mono text-[10px]"
                  style={{ zIndex: 10 - i }}
                >
                  {s}
                </div>
              ))}
              <div className="grid size-10 place-items-center rounded-full border-2 border-background bg-primary font-mono text-[10px] font-bold text-primary-foreground">
                +4
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
