import { motion } from "framer-motion";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { useTranslation } from "@/lib/i18n";
import heroGlobe from "@/assets/hero-globe.jpg";
import neuralTopology from "@/assets/neural-topology.jpg";

const reveal = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
});

export function BentoCommand() {
  const { t } = useTranslation();

  return (
    <section className="py-24 px-6 bg-surface">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-tight text-foreground mb-4">
            {t("bento.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("bento.description")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          <motion.div {...reveal(0)} className="md:col-span-2">
            <GlassPanel
              hoverGlow
              className="h-full p-8 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary mb-4"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <h3 className="text-2xl font-bold text-foreground mb-2">{t("bento.ai_mentor")}</h3>
                <p className="text-muted-foreground max-w-md">{t("bento.ai_mentor.desc")}</p>
              </div>
            </GlassPanel>
          </motion.div>

          <motion.div {...reveal(1)}>
            <GlassPanel className="h-full p-8 flex flex-col justify-between relative overflow-hidden group hover:border-accent/50 transition-colors">
              <div className="relative z-10">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-accent mb-4"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {t("bento.live_targets")}
                </h3>
                <p className="text-muted-foreground">{t("bento.live_targets.desc")}</p>
              </div>
            </GlassPanel>
          </motion.div>

          <motion.div {...reveal(2)}>
            <GlassPanel className="h-full p-8 flex flex-col justify-between relative overflow-hidden group hover:border-emerald/50 transition-colors">
              <div className="relative z-10">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-emerald mb-4"
                >
                  <path d="M12 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" />
                  <path d="M12 22v-4" />
                  <path d="M8 18l-2 4" />
                  <path d="M16 18l2 4" />
                </svg>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {t("bento.gamified_ctf")}
                </h3>
                <p className="text-muted-foreground">{t("bento.gamified_ctf.desc")}</p>
              </div>
            </GlassPanel>
          </motion.div>

          <motion.div {...reveal(3)} className="md:col-span-2">
            <GlassPanel className="h-full p-8 flex flex-col justify-between relative overflow-hidden group hover:border-amber/50 transition-colors">
              <div className="absolute right-0 top-0 w-1/2 h-full opacity-20">
                <img
                  src={neuralTopology}
                  alt={t("bento.code_screen")}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative z-10 w-2/3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/20 text-red-400 mb-4 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" />
                  </svg>
                  {t("bento.premium")}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {t("bento.threat_emulation")}
                </h3>
                <p className="text-muted-foreground mb-6">{t("bento.threat_emulation.desc")}</p>
                <a
                  href="/console"
                  className="group text-primary hover:text-primary/80 flex items-center gap-1 font-semibold transition-colors text-sm"
                >
                  {t("bento.explore")}
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
            </GlassPanel>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
