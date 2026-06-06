import { motion } from "framer-motion";
import { StatusPill } from "@/components/shared/StatusPill";
import { AnimatedGrid } from "@/components/shared/AnimatedGrid";

const EASE = [0.16, 1, 0.3, 1] as const;

export function AboutHero() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-20">
      <AnimatedGrid />
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex justify-center"
        >
          <StatusPill tone="accent">Source Document // CLASSIFIED</StatusPill>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease: EASE }}
          className="mt-7 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-balance"
        >
          Built for the <span className="gradient-text">moment after the alarm.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
          className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty"
        >
          CyberAI exists because the synthetic era never sleeps — and neither do the threats. We
          build sovereign intelligence for the operators who hold the line when seconds become
          casualties.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="mt-14 flex justify-center"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
            ▼ Read the Dossier
          </div>
        </motion.div>
      </div>
    </section>
  );
}
