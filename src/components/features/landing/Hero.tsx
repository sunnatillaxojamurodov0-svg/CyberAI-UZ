import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { StatusPill } from "@/components/shared/StatusPill";
import { MagneticButton } from "@/components/shared/MagneticButton";
import { AnimatedGrid } from "@/components/shared/AnimatedGrid";

export function Hero() {
  return (
    <section className="relative px-6 pt-32 pb-16 overflow-hidden">
      <AnimatedGrid />
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center"
        >
          <StatusPill>Orbital Intelligence Node · Active</StatusPill>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 font-display text-[clamp(2.75rem,8vw,6.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-balance"
        >
          Secure the{" "}
          <span className="gradient-text">Synthetic Era</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty"
        >
          The first sovereign intelligence platform designed for high-stakes infrastructure
          and orbital asset protection. Quiet power. Cinematic clarity. Autonomous defense.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <MagneticButton>
            Initialize Command
            <ArrowUpRight size={16} className="opacity-80" />
          </MagneticButton>
          <MagneticButton variant="ghost">View Documentation</MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
