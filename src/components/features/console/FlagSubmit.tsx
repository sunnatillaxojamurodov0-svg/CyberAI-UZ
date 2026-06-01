import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, CheckCircle2, XCircle, Trophy, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CTFChallenge, ScoreBreakdown } from "@/lib/console/types";

interface FlagSubmitProps {
  challenge: CTFChallenge;
  onSubmit: (flag: string) => { correct: boolean; score?: ScoreBreakdown; points?: number };
}

export function FlagSubmit({ challenge, onSubmit }: FlagSubmitProps) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [points, setPoints] = useState(0);

  const handle = () => {
    if (!value.trim()) return;
    const res = onSubmit(value.trim());
    if (res.correct) {
      setStatus("correct");
      setScore(res.score ?? null);
      setPoints(res.points ?? 0);
    } else {
      setStatus("wrong");
      setTimeout(() => setStatus("idle"), 1600);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Flag size={14} className="text-accent" />
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Submit Flag
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
          {challenge.flagFormat}
        </span>
      </div>

      <div className="flex items-stretch gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handle()}
          placeholder="CYBERAI{...}"
          disabled={status === "correct"}
          className={cn(
            "flex-1 rounded-lg border bg-background/60 px-3 py-2.5 font-mono text-sm text-foreground outline-none transition-colors",
            status === "wrong"
              ? "border-red-500/50 animate-[shake_0.4s]"
              : status === "correct"
                ? "border-emerald-500/50"
                : "border-border focus:border-accent/40",
          )}
        />
        <button
          type="button"
          onClick={handle}
          disabled={status === "correct" || !value.trim()}
          className={cn(
            "shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
            status === "correct"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-accent text-white shadow-[0_0_18px_-6px] shadow-accent/50 hover:brightness-110 disabled:opacity-40 disabled:shadow-none",
          )}
        >
          {status === "correct" ? <CheckCircle2 size={16} /> : "Verify"}
        </button>
      </div>

      <AnimatePresence>
        {status === "wrong" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex items-center gap-2 text-xs text-red-400"
          >
            <XCircle size={13} />
            Incorrect flag. Double-check — format: {challenge.flagFormat}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score report */}
      <AnimatePresence>
        {status === "correct" && score && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 overflow-hidden rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/15">
                  <Trophy size={18} className="text-emerald-400" />
                </span>
                <div>
                  <div className="font-display text-sm font-bold text-emerald-300">
                    Challenge solved!
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-400/70">
                    {score.grade}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-extrabold tabular-nums text-emerald-300">
                  {score.total}
                  <span className="text-base text-emerald-400/60">%</span>
                </div>
                <div className="flex items-center justify-end gap-1 font-mono text-[10px] text-muted-foreground">
                  <Award size={10} className="text-accent" /> +{points} pts
                </div>
              </div>
            </div>

            {/* Breakdown bars */}
            <div className="mt-4 space-y-2">
              {[
                { label: "Correctness", v: score.correctness, max: 40 },
                { label: "Methodology", v: score.methodology, max: 20 },
                { label: "Tool Coverage", v: score.toolCoverage, max: 15 },
                { label: "Efficiency", v: score.efficiency, max: 10 },
                { label: "VAEL Collaboration", v: score.aiCollaboration, max: 10 },
                { label: "Independence", v: score.independence, max: 5 },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {b.label}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(b.v / b.max) * 100}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right font-mono text-[10px] tabular-nums text-foreground/70">
                    {b.v}/{b.max}
                  </span>
                </div>
              ))}
            </div>

            {/* Narrative notes */}
            <div className="mt-4 space-y-1.5 border-t border-emerald-500/15 pt-3">
              {score.notes.map((n, i) => (
                <p key={i} className="text-[11px] leading-relaxed text-foreground/70">
                  {n}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
