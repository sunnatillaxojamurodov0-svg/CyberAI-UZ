import { motion } from "framer-motion";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";

const EASE = [0.16, 1, 0.3, 1] as const;

const TECH_ITEMS = [
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "LLM Mentors",
    description: "Context-aware AI that adapts to your skill level in real-time.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
      </svg>
    ),
    title: "Isolated Cloud",
    description: "Spin up realistic vulnerable environments in seconds. No local overhead.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l2 2 4-4" />
      </svg>
    ),
    title: "Zero-Knowledge Proofs",
    description: "Cryptographic verification for every exploit, achievement, and certification.",
  },
];

export function TechStack() {
  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-14 flex flex-col items-start gap-6"
        >
          <StatusPill tone="accent">The Engine Room</StatusPill>
          <h2 className="max-w-3xl font-display text-4xl font-bold tracking-[-0.03em] md:text-5xl">
            Built on <span className="gradient-text">proven technology.</span>
          </h2>
        </motion.div>

        <GlassPanel className="relative overflow-hidden p-8 md:p-12">
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
            <div className="w-full h-full bg-gradient-to-bl from-primary via-accent/50 to-transparent rounded-full blur-[100px]" />
          </div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">
                Technology Stack
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Every component of CyberAI is designed for speed, scale, and security. From our
                adaptive LLM inference engine to our isolated cloud sandboxes — we use proven
                technology so you can focus on what matters: mastering the digital frontier.
              </p>
            </div>
            <div className="grid gap-4">
              {TECH_ITEMS.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
                  className="flex items-start gap-4 rounded-xl border border-border bg-surface/50 p-5 transition-all duration-300 hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="grid size-12 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-foreground">{item.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
