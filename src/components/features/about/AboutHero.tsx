import { motion } from "framer-motion";
import { AnimatedGrid } from "@/components/shared/AnimatedGrid";

const EASE = [0.16, 1, 0.3, 1] as const;

export function AboutHero() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-20">
      <AnimatedGrid />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-primary">About Us</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease: EASE }}
          className="mt-7 font-display text-[clamp(2.5rem,7vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-balance"
        >
          CyberAI: New Era of{" "}
          <span className="gradient-text">Digital Frontier</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
          className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty"
        >
          We combine LLM-powered hyper-realistic threat emulation with autonomous defense
          infrastructure — built for the operators who hold the line when seconds become casualties.
        </motion.p>
      </div>
    </section>
  );
}
