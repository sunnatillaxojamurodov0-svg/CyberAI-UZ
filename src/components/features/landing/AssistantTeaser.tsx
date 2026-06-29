import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { StatusPill } from "@/components/shared/StatusPill";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { MagneticButton } from "@/components/shared/MagneticButton";
import { useTranslation } from "@/lib/i18n";

export function AssistantTeaser() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const lines: Array<{ from: "user" | "ai"; text: string }> = [
    { from: "user", text: t("assistant.chat_user1") },
    { from: "ai", text: t("assistant.chat_ai1") },
    { from: "user", text: t("assistant.chat_user2") },
    { from: "ai", text: t("assistant.chat_ai2") },
  ];

  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-12 gap-8 lg:gap-16">
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-center">
            <StatusPill tone="accent">{t("assistant.badge")}</StatusPill>
            <h2 className="mt-6 font-display text-4xl font-bold tracking-[-0.03em] md:text-5xl text-balance">
              {t("assistant.title")}{" "}
              <span className="gradient-text">{t("assistant.title.gradient")}</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              {t("assistant.description")}
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[t("assistant.bullet1"), t("assistant.bullet2"), t("assistant.bullet3")].map((l) => (
                <li key={l} className="flex items-start gap-3 text-foreground/85">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px] shadow-primary" />
                  {l}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <MagneticButton onClick={() => navigate({ to: "/chat" })}>
                <Sparkles size={14} /> {t("assistant.cta")}
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
              <div className="rounded-2xl bg-surface-2/80 p-5 font-mono">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {t("assistant.label")}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t("assistant.response_time")}
                  </span>
                </div>
                <div className="mt-5 space-y-4 text-[13px] leading-relaxed">
                  {lines.map((l, i) => (
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
                      <span
                        className={l.from === "user" ? "text-muted-foreground" : "text-primary"}
                      >
                        {l.from === "user" ? t("assistant.user_label") : t("assistant.ai_label")}
                      </span>
                      <span
                        className={l.from === "user" ? "text-foreground" : "text-foreground/90"}
                      >
                        {l.text}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-surface-2/80 px-4 py-3">
                  <span className="size-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs text-muted-foreground">{t("assistant.awaiting")}</span>
                  <span className="ml-auto rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t("assistant.shortcut")}
                  </span>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
