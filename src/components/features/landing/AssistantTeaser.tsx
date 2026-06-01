import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { StatusPill } from "@/components/shared/StatusPill";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { MagneticButton } from "@/components/shared/MagneticButton";

const LINES: Array<{ from: "user" | "ai"; text: string }> = [
  { from: "user", text: "Audit all SSH ingress in the last 24 hours and isolate anomalies." },
  { from: "ai", text: "14,206 sessions scanned. 3 anomalies in EU-WEST-2 region isolated to quarantine VPC. Remediation diff being generated." },
  { from: "user", text: "Verify edge gateway certificate integrity." },
  { from: "ai", text: "All 12 gateway signatures match expected CA pins. Gateway-03 expires in 4 days — schedule automatic renewal?" },
];

export function AssistantTeaser() {
  const navigate = useNavigate();

  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-12 gap-8 lg:gap-16">
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-center">
            <StatusPill tone="accent">Cyber-Pilot · v2</StatusPill>
            <h2 className="mt-6 font-display text-4xl font-bold tracking-[-0.03em] md:text-5xl text-balance">
              Talk to your <span className="gradient-text">infrastructure.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              No more cryptic log greps and fragile runbooks. Describe the state you need;
              CyberAI translates your intent into hardened, audit-ready policy in milliseconds.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Conversational threat hunting across petabyte-scale log lakes.",
                "Use tools to ask, write, and deploy — never raw SQL again.",
                "Every action signed, diffed, and reversible.",
              ].map((l) => (
                <li key={l} className="flex items-start gap-3 text-foreground/85">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px] shadow-primary" />
                  {l}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <MagneticButton onClick={() => navigate({ to: "/chat" })}>
                <Sparkles size={14} /> Open Assistant
              </MagneticButton>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 lg:col-span-7"
          >
            <GlassPanel className="p-2">
              <div className="rounded-2xl bg-black/60 p-5 font-mono">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">CYBERAI · ASSISTANT_V2</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">42ms</span>
                </div>
                <div className="mt-5 space-y-4 text-[13px] leading-relaxed">
                  {LINES.map((l, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.15 + i * 0.12 }}
                      className={
                        l.from === "user"
                          ? "flex flex-col gap-1"
                          : "flex flex-col gap-1 rounded-xl border border-border bg-white/[0.03] p-3"
                      }
                    >
                      <span className={l.from === "user" ? "text-muted-foreground" : "text-primary"}>
                        {l.from === "user" ? "USER:" : "CYBERAI:"}
                      </span>
                      <span className={l.from === "user" ? "text-foreground" : "text-foreground/90"}>{l.text}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-black/40 px-4 py-3">
                  <span className="size-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs text-muted-foreground">Awaiting command_</span>
                  <span className="ml-auto rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">⌘ K</span>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
