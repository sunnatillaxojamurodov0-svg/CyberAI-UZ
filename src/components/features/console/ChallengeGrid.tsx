import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Lock,
  ChevronRight,
  Trophy,
  Terminal as TermIcon,
  Skull,
  ShieldAlert,
  Star,
} from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { StatusPill } from "@/components/shared/StatusPill";
import { getChallengesByLevel, LEVEL_META, isEliteUnlocked } from "@/lib/console/challenges";
import { cn } from "@/lib/utils";
import type { CTFChallenge, CTFLevel } from "@/lib/console/types";

interface ChallengeGridProps {
  onSelect: (challenge: CTFChallenge) => void;
  isSolved: (id: string) => boolean;
  bestScore: (id: string) => number | undefined;
  totalPoints: number;
  solvedCount: number;
  base30Solved: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  web: "text-cyan-400",
  network: "text-blue-400",
  crypto: "text-purple-400",
  forensics: "text-amber-400",
  privesc: "text-red-400",
  recon: "text-emerald-400",
  password: "text-pink-400",
  reversing: "text-orange-400",
  stego: "text-teal-400",
  osint: "text-lime-400",
};

const LEVELS: CTFLevel[] = [1, 2, 3, 4];

export function ChallengeGrid({
  onSelect,
  isSolved,
  bestScore,
  totalPoints,
  solvedCount,
  base30Solved,
}: ChallengeGridProps) {
  const [activeLevel, setActiveLevel] = useState<CTFLevel>(1);
  const eliteUnlocked = isEliteUnlocked(base30Solved);
  const challenges = getChallengesByLevel(activeLevel);

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Solved" value={`${solvedCount}/70`} icon={CheckCircle2} />
        <StatCard label="Total points" value={totalPoints.toLocaleString()} icon={Trophy} />
        <StatCard
          label="Progress"
          value={`${Math.round((base30Solved / 60) * 100)}%`}
          icon={TermIcon}
        />
        <StatCard
          label="Master"
          value={eliteUnlocked ? "UNLOCKED" : `${base30Solved}/60`}
          icon={eliteUnlocked ? Star : Lock}
          highlight={eliteUnlocked}
        />
      </div>

      {/* Level tabs */}
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((lvl) => {
          const meta = LEVEL_META[lvl];
          const active = activeLevel === lvl;
          const isElite = lvl === 4;
          const locked = isElite && !eliteUnlocked;
          const total = isElite ? 10 : 20;
          const solved = getChallengesByLevel(lvl).filter((c) => isSolved(c.id)).length;

          return (
            <button
              key={lvl}
              type="button"
              onClick={() => !locked && setActiveLevel(lvl)}
              disabled={locked}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                locked
                  ? "cursor-not-allowed border-border/50 bg-surface/20 opacity-60"
                  : active
                    ? isElite
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-accent/40 bg-accent/10"
                    : "border-border bg-surface/40 hover:border-accent/20",
              )}
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-lg font-display text-lg font-bold",
                  locked
                    ? "bg-surface-2 text-muted-foreground/40"
                    : active
                      ? isElite
                        ? "bg-red-500/20 text-red-400"
                        : "bg-accent/20 text-accent"
                      : "bg-surface-2 text-muted-foreground",
                )}
              >
                {locked ? <Lock size={16} /> : isElite ? <Skull size={16} /> : lvl}
              </span>
              <div className="text-left">
                <div
                  className={cn(
                    "text-sm font-semibold",
                    locked
                      ? "text-muted-foreground/40"
                      : active
                        ? isElite
                          ? "text-red-300"
                          : "text-foreground"
                        : "text-foreground/70",
                  )}
                >
                  {meta.sublabel}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {locked ? meta.unlockRequirement : `${solved}/${total} solved`}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Level description */}
      <p className={cn("text-sm", activeLevel === 4 ? "text-red-400/80" : "text-muted-foreground")}>
        {LEVEL_META[activeLevel].description}
      </p>

      {/* Master Tier locked banner */}
      <AnimatePresence>
        {activeLevel === 4 && !eliteUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="flex items-start gap-4 rounded-2xl border border-red-500/25 bg-red-500/[0.04] p-6"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-red-500/15">
              <ShieldAlert size={22} className="text-red-400" />
            </span>
            <div>
              <div className="font-display text-lg font-bold text-red-300">
                Master Tier — Locked
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                This level only unlocks for operators who have successfully completed all{" "}
                <span className="font-semibold text-foreground">60 CTFs</span>. Currently{" "}
                <span className="font-mono font-bold text-accent">{base30Solved}/60</span> solved.
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(base30Solved / 60) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-accent to-red-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge cards */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2",
          activeLevel === 4 ? "lg:grid-cols-1 xl:grid-cols-2" : "lg:grid-cols-3",
        )}
      >
        {challenges.map((c, i) => {
          const solved = isSolved(c.id);
          const score = bestScore(c.id);
          const isElite = c.level === 4;

          return (
            <motion.button
              key={c.id}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onSelect(c)}
              className="group text-left"
            >
              <GlassPanel
                hoverGlow
                className={cn(
                  "h-full border p-5 transition-colors",
                  solved
                    ? "border-emerald-500/30"
                    : isElite
                      ? "border-red-500/20 hover:border-red-500/40"
                      : "border-border",
                )}
              >
                {/* Master badge */}
                {isElite && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-red-400">
                      <Skull size={10} />
                      Master
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/60">
                      6 machines · 24h
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      "font-mono text-[10px] font-bold uppercase tracking-[0.18em]",
                      CATEGORY_COLORS[c.category] ?? "text-muted-foreground",
                    )}
                  >
                    {c.category}
                  </span>
                  {solved ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 size={15} />
                      {score !== undefined && (
                        <span className="font-mono text-[10px] font-bold">{score}%</span>
                      )}
                    </span>
                  ) : (
                    <ChevronRight
                      size={16}
                      className={cn(
                        "transition-transform group-hover:translate-x-0.5",
                        isElite
                          ? "text-red-400/40 group-hover:text-red-400"
                          : "text-muted-foreground/40 group-hover:text-accent",
                      )}
                    />
                  )}
                </div>

                <h3
                  className={cn(
                    "mt-3 font-display text-base font-bold tracking-tight",
                    isElite && "text-lg",
                  )}
                >
                  {c.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.summary}</p>

                {/* Master rabbit hole warning */}
                {isElite && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2">
                    <ShieldAlert size={12} className="shrink-0 text-amber-400" />
                    <span className="font-mono text-[10px] text-amber-400/80">
                      6 interconnected targets — rabbit holes exist
                    </span>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {c.targetIp}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[10px] font-bold",
                      isElite ? "text-red-400" : "text-accent",
                    )}
                  >
                    {c.points} pts
                  </span>
                </div>
              </GlassPanel>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        highlight ? "border-amber-500/30 bg-amber-500/[0.04]" : "border-border bg-surface/40",
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg",
          highlight ? "bg-amber-500/15" : "bg-accent/10",
        )}
      >
        <Icon size={16} className={highlight ? "text-amber-400" : "text-accent"} />
      </span>
      <div>
        <div
          className={cn(
            "font-display text-lg font-bold leading-none tabular-nums",
            highlight && "text-amber-300",
          )}
        >
          {value}
        </div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}
