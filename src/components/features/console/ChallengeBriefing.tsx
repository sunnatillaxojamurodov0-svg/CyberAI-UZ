import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Lightbulb, ChevronDown, Crosshair, ListChecks } from "lucide-react";
import { StatusPill } from "@/components/shared/StatusPill";
import { LEVEL_META } from "@/lib/console/challenges";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChallengeRating } from "./ChallengeRating";
import type { CTFChallenge } from "@/lib/console/types";

interface ChallengeBriefingProps {
  challenge: CTFChallenge;
  /** Called each time a new hint is revealed — feeds scorer telemetry. */
  onHintRevealed?: (index: number) => void;
}

export function ChallengeBriefing({ challenge, onHintRevealed }: ChallengeBriefingProps) {
  const [revealed, setRevealed] = useState<number>(0);
  const { t } = useTranslation();
  const meta = LEVEL_META[challenge.level];

  const revealNext = () => {
    if (revealed >= challenge.hints.length) return;
    const next = revealed + 1;
    setRevealed(next);
    onHintRevealed?.(next - 1);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={meta.tone as "primary" | "accent" | "emerald"}>
            {meta.label} · {meta.sublabel}
          </StatusPill>
          <span className="rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {challenge.category}
          </span>
          <span className="rounded-full border border-accent/20 bg-accent/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent">
            {challenge.points} {t("console.points")}
          </span>
        </div>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">{challenge.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{challenge.scenario}</p>
      </div>

      {/* Target */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.03] px-4 py-3">
        <Crosshair size={16} className="shrink-0 text-primary" />
        <div className="flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Target
          </div>
          <div className="font-mono text-sm font-semibold text-primary">{challenge.targetIp}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Format
          </div>
          <div className="font-mono text-xs text-foreground/70">{challenge.flagFormat}</div>
        </div>
      </div>

      {/* Objectives */}
      <div className="rounded-xl border border-border bg-surface/40 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ListChecks size={14} className="text-accent" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t("console.objectives")}
          </span>
        </div>
        <ol className="space-y-2">
          {challenge.objectives.map((o, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-accent/10 font-mono text-[10px] font-bold text-accent">
                {i + 1}
              </span>
              {o}
            </li>
          ))}
        </ol>
      </div>

      {/* Hints */}
      <div className="rounded-xl border border-border bg-surface/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-yellow-400" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {t("console.hints")}
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground/60">
            {revealed}/{challenge.hints.length} {t("console.revealed")}
          </span>
        </div>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {challenge.hints.slice(0, revealed).map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-start gap-2.5 rounded-lg border border-yellow-400/15 bg-yellow-400/[0.04] px-3 py-2.5"
              >
                <span className="mt-0.5 font-mono text-[10px] font-bold text-yellow-400">
                  #{i + 1}
                </span>
                <p className="text-xs leading-relaxed text-foreground/80">{h}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {revealed < challenge.hints.length && (
          <button
            type="button"
            onClick={revealNext}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-yellow-400/25 py-2 font-mono text-[11px] uppercase tracking-wider text-yellow-400/80 transition-colors hover:bg-yellow-400/5 hover:text-yellow-400"
          >
            <ChevronDown size={13} />
            {t("console.reveal_hint")}
            {revealed > 0 && (
              <span className="text-muted-foreground/50">({t("console.hint_cost")})</span>
            )}
          </button>
        )}
      </div>

      {/* Ethics reminder */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface/20 px-4 py-3">
        <Target size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t("console.ethics_reminder")}
        </p>
      </div>

      {/* Community Rating */}
      <ChallengeRating challengeId={challenge.id} />
    </div>
  );
}
