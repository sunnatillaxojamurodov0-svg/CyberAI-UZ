import { useState, useRef, useCallback } from "react";
import { ArrowLeft, RotateCcw, Terminal as TermIcon } from "lucide-react";
import { StatusPill } from "@/components/shared/StatusPill";
import { Terminal, type TerminalHandle } from "./Terminal";
import { ChallengeBriefing } from "./ChallengeBriefing";
import { ChallengeGrid } from "./ChallengeGrid";
import { FlagSubmit } from "./FlagSubmit";
import { VaelFloating } from "./VaelFloating";
import { useConsoleProgress } from "@/hooks/useConsoleProgress";
import { checkFlag } from "@/lib/console/engine";
import { scoreSolve, pointsEarned } from "@/lib/console/scorer";
import type { CTFChallenge, ScoreBreakdown } from "@/lib/console/types";

export function ConsolePage() {
  const [active, setActive] = useState<CTFChallenge | null>(null);
  const terminalRef = useRef<TerminalHandle>(null);
  const { progress, recordSolve, isSolved, totalPoints, solvedCount, base30Solved } =
    useConsoleProgress();

  const bestScore = useCallback((id: string) => progress[id]?.bestScore, [progress]);

  /* Hint reveals -> telemetry */
  const handleHint = useCallback((index: number) => {
    const state = terminalRef.current?.getState();
    if (state) state.telemetry.hintsUsed = index + 1;
  }, []);

  /* VAEL questions -> telemetry */
  const handleAiMessage = useCallback((text: string) => {
    const state = terminalRef.current?.getState();
    if (state) state.telemetry.aiMessages.push(text);
  }, []);

  /* Flag submission -> engine check + scoring */
  const handleFlagSubmit = useCallback(
    async (
      flag: string,
    ): Promise<{ correct: boolean; score?: ScoreBreakdown; points?: number }> => {
      const state = terminalRef.current?.getState();
      if (!state || !active) return { correct: false };

      const correct = checkFlag(state, flag);
      if (!correct) return { correct: false };

      const score = scoreSolve(active, state.telemetry);
      const points = pointsEarned(active, score);
      recordSolve(active.id, score, points);

      // Submit to leaderboard
      try {
        const timeSeconds = Math.floor((Date.now() - state.telemetry.startedAt) / 1000);
        await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            challenge_id: active.id,
            score: score.total,
            time_seconds: timeSeconds,
            tools_used: state.telemetry.toolsUsed,
            hints_used: state.telemetry.hintsUsed,
          }),
        });
      } catch {
        // Non-fatal: leaderboard submission failed
      }

      return { correct: true, score, points };
    },
    [active, recordSolve],
  );

  /* ── Grid view ─────────────────────────────────────────────── */
  if (!active) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <StatusPill tone="accent">Kali Sandbox · Active</StatusPill>
          </div>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">
            CTF <span className="gradient-text">Console</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Fully isolated Kali Linux environment with{" "}
            <span className="font-semibold text-foreground">60 CTFs</span> across 3 difficulty
            tiers. Complete all 60 to unlock{" "}
            <span className="font-semibold text-red-400">10 Master</span> OSCP-level challenges (6
            machines each). Real terminal, VAEL AI co-pilot, OSCP-style scoring.
          </p>

          {/* Certificate unlock banner */}
          {base30Solved >= 60 && (
            <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-display text-sm font-bold text-emerald-300">
                    All 60 base CTFs completed!
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You've unlocked the Master Tier and earned your completion certificate.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-mono text-xs font-bold text-emerald-400 hover:brightness-110 transition-all"
                >
                  Download Certificate
                </button>
              </div>
            </div>
          )}
        </div>

        <ChallengeGrid
          onSelect={setActive}
          isSolved={isSolved}
          bestScore={bestScore}
          totalPoints={totalPoints}
          solvedCount={solvedCount}
          base30Solved={base30Solved}
        />
      </div>
    );
  }

  /* ── Challenge workspace ───────────────────────────────────── */
  return (
    <>
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
        {/* Toolbar */}
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActive(null)}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground"
          >
            <ArrowLeft size={15} />
            Challenges
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:flex">
              <TermIcon size={13} className="text-accent" />
              {active.id}
            </span>
            <button
              type="button"
              onClick={() => terminalRef.current?.reset()}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground"
              title="Restart Terminal"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Split layout: briefing (left) + terminal/flag (right) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          {/* Left: briefing */}
          <div className="order-2 lg:order-1">
            <ChallengeBriefing challenge={active} onHintRevealed={handleHint} />
          </div>

          {/* Right: terminal + flag */}
          <div className="order-1 flex flex-col gap-4 lg:order-2">
            <div className="h-[clamp(420px,60vh,680px)]">
              <Terminal ref={terminalRef} challenge={active} />
            </div>
            <FlagSubmit challenge={active} onSubmit={handleFlagSubmit} />
          </div>
        </div>
      </div>

      {/* Floating VAEL — scoped to the active challenge */}
      <VaelFloating challenge={active} onUserMessage={handleAiMessage} />
    </>
  );
}
