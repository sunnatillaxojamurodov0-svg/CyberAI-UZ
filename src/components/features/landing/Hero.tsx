import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Play, Terminal, Shield, Activity, Globe } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { StatusPill } from "@/components/shared/StatusPill";
import { MagneticButton } from "@/components/shared/MagneticButton";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { AnimatedGrid } from "@/components/shared/AnimatedGrid";
import { useAuth } from "@/lib/auth-context";
import { AboutMe } from "./AboutMe";

const DASHBOARD_STATS = [
  { label: "Uptime", value: "99.99%", color: "text-primary" },
  { label: "Threats Blocked", value: "14.2M", color: "text-emerald" },
  { label: "Active Nodes", value: "12K+", color: "text-accent" },
  { label: "Avg Response", value: "1.2s", color: "text-primary" },
];

export function Hero() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const [demoOpen, setDemoOpen] = useState(false);

  const launchCtfLab = () => {
    if (user) {
      navigate({ to: "/console" });
    } else {
      openAuthModal();
    }
  };

  return (
    <section className="relative px-6 pt-28 pb-24 overflow-hidden">
      <AnimatedGrid />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-12 gap-6 items-center">
          {/* Left: Hero content */}
          <div className="col-span-12 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <StatusPill>Orbital Intelligence Node · Active</StatusPill>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 font-display text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-balance"
            >
              Secure the <span className="gradient-text">Synthetic Era</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty"
            >
              The first sovereign intelligence platform designed to protect high-stakes
              infrastructure and orbital assets. Silent strength. Kinematic clarity. Autonomous
              defense.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <MagneticButton onClick={launchCtfLab}>
                <Terminal size={15} />
                CTF LAB
                <ArrowUpRight size={16} className="opacity-80" />
              </MagneticButton>
              <button
                onClick={() => setDemoOpen(true)}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-surface/40 px-6 py-3.5 text-sm font-medium text-foreground/80 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <Play size={14} className="ml-0.5" />
                  </span>
                  Watch Demo
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-primary/8 to-transparent transition-transform duration-500 group-hover:translate-x-0" />
              </button>
              <AboutMe />
            </motion.div>

            {/* Dashboard stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 grid grid-cols-4 gap-3"
            >
              {DASHBOARD_STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border bg-surface/30 p-3 text-center"
                >
                  <div className={`font-display text-lg font-bold tabular-nums ${s.color}`}>
                    {s.value}
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 lg:col-span-5 hidden lg:block"
          >
            <GlassPanel variant="cyan" className="p-1">
              <div className="rounded-2xl bg-black/50 p-5">
                <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-primary/70">
                      CYBERAI DASHBOARD
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/50">
                    REF: 00-ALPHA-9
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border bg-surface/40 p-3">
                    <Activity size={14} className="text-primary mb-1" />
                    <div className="font-mono text-[10px] text-muted-foreground">Threat Level</div>
                    <div className="font-display text-sm font-bold text-emerald">LOW</div>
                  </div>
                  <div className="rounded-lg border border-border bg-surface/40 p-3">
                    <Shield size={14} className="text-emerald mb-1" />
                    <div className="font-mono text-[10px] text-muted-foreground">
                      Defense Status
                    </div>
                    <div className="font-display text-sm font-bold text-primary">ACTIVE</div>
                  </div>
                  <div className="col-span-2 rounded-lg border border-border bg-surface/40 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Network Traffic
                      </span>
                      <Globe size={12} className="text-primary/60" />
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full w-[73%] rounded-full bg-gradient-to-r from-primary to-emerald" />
                    </div>
                    <div className="mt-2 flex items-center justify-between font-mono text-[9px] text-muted-foreground/60">
                      <span>Ingress: 2.4 Gbps</span>
                      <span>Egress: 1.1 Gbps</span>
                      <span>73% capacity</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/10 bg-primary/[0.03] px-3 py-2">
                  <Terminal size={12} className="text-primary" />
                  <span className="flex-1 font-mono text-[10px] text-muted-foreground">
                    All sectors operational — no active threats
                  </span>
                  <span className="size-1.5 rounded-full bg-emerald animate-pulse" />
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </div>

      {/* Demo video modal */}
      {demoOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setDemoOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-primary/20 bg-surface shadow-[0_0_80px_-20px] shadow-primary/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDemoOpen(false)}
              className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-black/60 text-foreground/60 hover:text-foreground transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className="aspect-video bg-gradient-to-br from-primary/5 via-surface to-accent/5 flex items-center justify-center">
              <div className="text-center">
                <Play size={48} className="mx-auto text-primary/40 mb-4" />
                <p className="font-mono text-sm text-muted-foreground">
                  Demo video placeholder — embed your platform walkthrough here.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
