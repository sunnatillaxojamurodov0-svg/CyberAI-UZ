import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";
import { useTranslation } from "@/lib/i18n";

const STATS = [
  { value: "1", key: "community.operator" },
  { value: "7", key: "community.countries" },
  { value: "200+", key: "community.signals" },
];

export function CommunitySection() {
  const { t } = useTranslation();

  return (
    <section className="relative px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassPanel className="relative overflow-hidden p-10 md:p-16">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 size-[min(90vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%)",
              }}
            />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 size-[min(70vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%)",
              }}
            />

            <div className="relative grid grid-cols-12 gap-10">
              <div className="col-span-12 lg:col-span-7">
                <StatusPill>{t("community.mission")}</StatusPill>
                <h2 className="mt-6 font-display text-4xl font-bold tracking-[-0.03em] md:text-6xl text-balance">
                  {t("community.mission.title")}
                </h2>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
                  {t("community.mission.description")}
                </p>
                <a
                  href="https://t.me/CyberAI_Club"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                >
                  {t("community.cta")}
                  <svg
                    className="size-[0.9em] -translate-x-1 rotate-45 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                    fill="none"
                    viewBox="0 0 10 10"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M1.004 9.166 9.337.833m0 0v8.333m0-8.333H1.004"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>

              <div className="col-span-12 lg:col-span-5">
                <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
                  {STATS.map((s) => (
                    <div key={s.key} className="bg-background p-6 text-center">
                      <div className="font-display text-3xl font-bold tracking-tighter text-foreground md:text-4xl">
                        {s.value}
                      </div>
                      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {t(s.key)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-border bg-surface-2/80 p-5">
                  <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                    // {t("community.operator_log")}
                  </div>
                  <p className="text-sm italic leading-relaxed text-foreground/80">
                    &ldquo;{t("community.quote")}&rdquo;
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        {t("community.quote_name")}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {t("community.quote_title")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
