import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { MagneticButton } from "@/components/shared/MagneticButton";
import { AnimatedGrid } from "@/components/shared/AnimatedGrid";

const EASE = [0.16, 1, 0.3, 1] as const;

export function AboutCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-32">
      <AnimatedGrid />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative z-10 mx-auto max-w-3xl text-center"
      >
        <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] md:text-6xl">
          Join the{" "}
          <span className="gradient-text">defense grid.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          Operators, researchers, and infrastructure teams shaping the next
          decade of autonomous defense. Quiet work. Loud consequences.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <MagneticButton>
            Request Clearance
            <ArrowUpRight size={16} className="opacity-80" />
          </MagneticButton>
          <MagneticButton variant="ghost">Read the Docs</MagneticButton>
        </div>
      </motion.div>
    </section>
  );
}
