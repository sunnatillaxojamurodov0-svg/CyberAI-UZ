import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  RotateCcw,
  Terminal as TermIcon,
  Clock,
  FileText,
  Sun,
  Moon,
} from "lucide-react";
import { StatusPill } from "@/components/shared/StatusPill";
import { Terminal, type TerminalHandle } from "./Terminal";
import { ChallengeBriefing } from "./ChallengeBriefing";
import { ChallengeGrid } from "./ChallengeGrid";
import { FlagSubmit } from "./FlagSubmit";
import { VaelFloating } from "./VaelFloating";
import { SolutionReveal } from "./SolutionReveal";
import { ShareProgress } from "./ShareProgress";
import { useConsoleProgress } from "@/hooks/useConsoleProgress";
import { checkFlag } from "@/lib/console/engine";
import { scoreSolve, pointsEarned } from "@/lib/console/scorer";
import { cn } from "@/lib/utils";
import { getChallenges } from "@/lib/console/challenges";
import type { CTFChallenge, ScoreBreakdown } from "@/lib/console/types";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function ConsolePage() {
  const [active, setActive] = useState<CTFChallenge | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isEntering, setIsEntering] = useState(false);
  const [mobileTab, setMobileTab] = useState<"terminal" | "briefing">("terminal");
  const [terminalTheme, setTerminalTheme] = useState<"dark" | "light">("dark");
  const terminalRef = useRef<TerminalHandle>(null);
  const { progress, recordSolve, isSolved, totalPoints, solvedCount, base60Solved } =
    useConsoleProgress();

  // Timer effect
  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [active?.id]);

  // Handle challenge selection with loading state
  const handleSelectChallenge = useCallback((challenge: CTFChallenge) => {
    setIsEntering(true);
    setActive(challenge);
    setMobileTab("terminal");
    // Simulate brief loading for terminal initialization
    setTimeout(() => setIsEntering(false), 800);
  }, []);

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
    const allChallenges = getChallenges();
    const solvedChallenges = allChallenges.filter((c) => isSolved(c.id));
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <StatusPill tone="accent">Kali Sandbox · Active</StatusPill>
            <ShareProgress
              solved={solvedChallenges}
              totalPoints={totalPoints}
              level={base60Solved >= 60 ? 2 : 1}
            />
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.03em] md:text-5xl md:mt-5">
            CTF <span className="gradient-text">Console</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base leading-relaxed text-muted-foreground">
            Fully isolated Kali Linux environment with{" "}
            <span className="font-semibold text-foreground">60 CTFs</span> across 3 difficulty
            tiers. Complete all 60 to unlock{" "}
            <span className="font-semibold text-red-400">10 Master</span> OSCP-level challenges (6
            machines each). Real terminal, VAEL AI co-pilot, OSCP-style scoring.
          </p>

          {/* Certificate unlock banner */}
          {base60Solved >= 60 && (
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
          onSelect={handleSelectChallenge}
          isSolved={isSolved}
          bestScore={bestScore}
          totalPoints={totalPoints}
          solvedCount={solvedCount}
          base60Solved={base60Solved}
        />
      </div>
    );
  }

  /* ── Challenge workspace ───────────────────────────────────── */
  return (
    <>
      <div className="mx-auto max-w-[1600px] px-3 py-4 md:px-6 md:py-6">
        {/* Toolbar */}
        <div className="mb-4 flex items-center justify-between md:mb-5">
          <button
            type="button"
            onClick={() => setActive(null)}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground md:px-3"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Challenges</span>
          </button>
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Timer */}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-2 font-mono text-sm tabular-nums md:gap-2 md:px-3",
                elapsed > 600
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-border bg-surface/50 text-muted-foreground",
              )}
            >
              <Clock size={13} className={elapsed > 600 ? "text-amber-400" : "text-accent"} />
              <span>{formatTime(elapsed)}</span>
            </div>
            <span className="hidden items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground md:flex">
              <TermIcon size={13} className="text-accent" />
              {active.id}
            </span>
            <button
              type="button"
              onClick={() => terminalRef.current?.reset()}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground md:px-3"
              title="Restart Terminal"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              type="button"
              onClick={() => setTerminalTheme(terminalTheme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground md:px-3"
              title="Toggle Terminal Theme"
            >
              {terminalTheme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>

        {/* Mobile tab switcher */}
        <div className="mb-4 flex rounded-lg border border-border bg-surface/30 p-1 md:hidden">
          <button
            type="button"
            onClick={() => setMobileTab("terminal")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
              mobileTab === "terminal"
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <TermIcon size={14} />
            Terminal
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("briefing")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
              mobileTab === "briefing"
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <FileText size={14} />
            Briefing
          </button>
        </div>

        {/* Loading overlay */}
        {isEntering && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="size-12 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
                <TermIcon
                  size={20}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-accent"
                />
              </div>
              <div className="text-center">
                <p className="font-display text-sm font-bold text-foreground">
                  Initializing Sandbox
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  Loading {active.id}...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Split layout: briefing (left) + terminal/flag (right) */}
        {/* Desktop: side by side */}
        <div className="hidden md:grid md:grid-cols-[minmax(0,380px)_minmax(0,1fr)] md:gap-5">
          {/* Left: briefing */}
          <div className="order-1">
            <ChallengeBriefing key={active.id} challenge={active} onHintRevealed={handleHint} />
          </div>

          {/* Right: terminal + flag */}
          <div className="order-2 flex flex-col gap-4">
            <div className="h-[clamp(420px,60vh,680px)]">
              <Terminal ref={terminalRef} challenge={active} theme={terminalTheme} />
            </div>
            <FlagSubmit challenge={active} onSubmit={handleFlagSubmit} />
            <SolutionReveal solution={active.solution ?? []} isSolved={isSolved(active.id)} />
          </div>
        </div>

        {/* Mobile: tabbed view */}
        <div className="md:hidden">
          {mobileTab === "terminal" ? (
            <div className="flex flex-col gap-4">
              <div className="h-[50vh] min-h-[300px]">
                <Terminal ref={terminalRef} challenge={active} theme={terminalTheme} />
              </div>
              <FlagSubmit challenge={active} onSubmit={handleFlagSubmit} />
              <SolutionReveal solution={active.solution ?? []} isSolved={isSolved(active.id)} />
            </div>
          ) : (
            <ChallengeBriefing key={active.id} challenge={active} onHintRevealed={handleHint} />
          )}
        </div>
      </div>

      {/* Floating VAEL — scoped to the active challenge */}
      <VaelFloating challenge={active} onUserMessage={handleAiMessage} />
    </>
  );
}
