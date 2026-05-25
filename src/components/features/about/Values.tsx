import { motion } from "framer-motion";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";

const EASE = [0.16, 1, 0.3, 1] as const;

const VALUES = [
  {
    label: "01 // Sovereignty",
    title: "Your perimeter, your weights.",
    body: "No model leaves your enclave. No telemetry leaves your jurisdiction. Quiet by architecture.",
  },
  {
    label: "02 // Velocity",
    title: "Milliseconds, not meetings.",
    body: "We measure success in mean-time-to-containment. Everything else is theatre.",
  },
  {
    label: "03 // Silence",
    title: "If you hear us, we failed.",
    body: "The best defense produces no notifications, no pages, no 03:00 calls. Invisible by design.",
  },
  {
    label: "04 // Certainty",
    title: "Every verdict is auditable.",
    body: "Deterministic reasoning trails. Cryptographically signed actions. No black-box defense.",
  },
];

export function Values() {
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
          <StatusPill tone="accent">Operating Doctrine</StatusPill>
          <h2 className="max-w-3xl font-display text-4xl font-bold tracking-[-0.03em] md:text-5xl">
            Four values{" "}
            <span className="text-muted-foreground">we will not negotiate.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.label}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.07, ease: EASE }}
            >
              <GlassPanel hoverGlow className="h-full p-8">
                <div className="mb-5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  {v.label}
                </div>
                <h3 className="mb-3 font-display text-2xl font-bold leading-tight tracking-tight">
                  {v.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{v.body}</p>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
