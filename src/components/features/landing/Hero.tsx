import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { StatusPill } from "@/components/shared/StatusPill";
import { MagneticButton } from "@/components/shared/MagneticButton";
import { AnimatedGrid } from "@/components/shared/AnimatedGrid";
import { useAuth } from "@/lib/auth-context";
import { AboutMe } from "./AboutMe";
import BlurText from "@/components/ui/BlurText";
import Silk from "@/components/ui/Silk";
import DotField from "@/components/ui/DotField";

export function Hero() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const launchCtfLab = () => {
    if (user) {
      navigate({ to: "/console" });
    } else {
      openAuthModal();
    }
  };

  return (
    <section className="relative min-h-[921px] flex items-center justify-center px-6 pt-20 overflow-hidden">
      {/* AnimatedGrid - asosiy fon */}
      <AnimatedGrid />

      {/* Silk - binafsharang ipak fon */}
      <div className="absolute inset-0 z-0 opacity-25">
        <Silk speed={5} scale={1} color="#7B2FBE" noiseIntensity={1.5} rotation={0} />
      </div>

      {/* DotField - nuqtalar tarmog'i */}
      <div className="absolute inset-0 z-0">
        <DotField dotColor="rgba(123, 47, 190, 0.2)" dotSize={1.5} gridGap={40} />
      </div>

      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-7xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start gap-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                v2.0 Beta Live
              </span>
            </div>

            <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[1.1] tracking-[-0.04em] text-balance">
              <BlurText
                text="Secure the Synthetic Era"
                animateBy="words"
                direction="top"
                delay={200}
                stepDuration={0.35}
                className="gradient-text"
              />
            </h1>

            <p className="text-base md:text-xl text-muted-foreground max-w-xl">
              Elite cybersecurity training powered by advanced AI. Experience real-world threats in
              our secure cloud environments, guided by your personal AI mentor.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <MagneticButton onClick={launchCtfLab}>
                Start for Free
                <ArrowUpRight size={16} className="opacity-80" />
              </MagneticButton>
              <AboutMe />
            </div>

            <div className="flex items-center gap-4 mt-4">
              <div className="flex -space-x-3">
                {["P1", "P2", "P3"].map((p, i) => (
                  <div
                    key={p}
                    className="size-10 rounded-full border-2 border-background bg-surface-2 flex items-center justify-center text-[10px] font-mono text-muted-foreground"
                  >
                    {p}
                  </div>
                ))}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                Join 50,000+ elite researchers
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block"
          >
            <TerminalVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TerminalVisual() {
  const [lines, setLines] = useState<string[]>([]);
  const fullLines = [
    "> Initializing security protocol...",
    "> Vulnerability detected in sector 7G",
    "> Deploying counter-measures...",
  ];
  const [showAi, setShowAi] = useState(false);

  useEffect(() => {
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const addLine = () => {
      if (cancelled) return;
      if (i < fullLines.length) {
        setLines((prev) => [...prev, fullLines[i]]);
        i++;
        t = setTimeout(addLine, 800);
      } else {
        t = setTimeout(() => setShowAi(true), 600);
      }
    };
    t = setTimeout(addLine, 1000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="relative h-[600px] rounded-2xl bg-surface border border-border/30 overflow-hidden shadow-2xl group transition-all duration-500 hover:border-primary/20 hover:shadow-[0_0_40px_-10px] shadow-primary/20">
      <div className="absolute inset-4 rounded-xl border border-white/5 bg-surface/60 backdrop-blur-md p-6 flex flex-col font-mono text-sm">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2 text-foreground/80">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="font-bold tracking-wider text-primary">cyber-ai_agent_v2</span>
          </div>
          <div className="flex gap-2">
            {["bg-red-400", "bg-accent", "bg-primary"].map((c, i) => (
              <span
                key={i}
                className={`size-3 rounded-full ${c}`}
                style={{ animation: `pulse-soft 2s ${i * 0.3}s infinite` }}
              />
            ))}
          </div>
        </div>
        <div className="flex-grow text-muted-foreground space-y-3">
          {lines.map((l, i) => (
            <p key={i} className={l?.includes("detected") ? "text-primary" : ""}>
              {l}
            </p>
          ))}
          {lines.length > 0 && lines.length <= fullLines.length && (
            <span className="animate-blink">|</span>
          )}
          {showAi && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-4 p-4 bg-surface-2/80 backdrop-blur-sm rounded-lg border border-primary/30 flex items-start gap-4"
            >
              <span className="text-primary mt-1">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="animate-spin"
                  style={{ animationDuration: "3s" }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </span>
              <div>
                <p className="text-primary font-bold tracking-wide text-xs uppercase">
                  AI Assistant
                </p>
                <p className="text-xs mt-1 text-muted-foreground">
                  I've identified the zero-day exploit payload. Recommending immediate sandbox
                  isolation.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
