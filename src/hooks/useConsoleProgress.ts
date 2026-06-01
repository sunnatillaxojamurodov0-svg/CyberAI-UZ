import { useState, useEffect, useCallback } from "react";
import type { ScoreBreakdown } from "@/lib/console/types";

export interface ChallengeRecord {
  challengeId: string;
  solved: boolean;
  bestScore: number;
  grade: string;
  pointsEarned: number;
  solvedAt: number;
}

type ProgressMap = Record<string, ChallengeRecord>;

const STORAGE_KEY = "cyberai_console_progress";

function load(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

/**
 * Tracks CTF completion + scores across sessions (per browser).
 * Lightweight by design — no backend dependency required.
 */
export function useConsoleProgress() {
  const [progress, setProgress] = useState<ProgressMap>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      /* quota / private mode — ignore */
    }
  }, [progress]);

  const recordSolve = useCallback(
    (challengeId: string, score: ScoreBreakdown, points: number) => {
      setProgress((prev) => {
        const existing = prev[challengeId];
        const bestScore = Math.max(existing?.bestScore ?? 0, score.total);
        const bestPoints = Math.max(existing?.pointsEarned ?? 0, points);
        return {
          ...prev,
          [challengeId]: {
            challengeId,
            solved: true,
            bestScore,
            grade: score.grade,
            pointsEarned: bestPoints,
            solvedAt: existing?.solvedAt ?? Date.now(),
          },
        };
      });
    },
    [],
  );

  const reset = useCallback(() => setProgress({}), []);

  const isSolved = useCallback(
    (id: string) => Boolean(progress[id]?.solved),
    [progress],
  );

  const totalPoints = Object.values(progress).reduce(
    (sum, r) => sum + (r.pointsEarned ?? 0),
    0,
  );
  const solvedCount = Object.values(progress).filter((r) => r.solved).length;
  /** Only the base 30 challenges count toward Elite unlock. */
  const base30Solved = Object.values(progress).filter(
    (r) => r.solved && !r.challengeId.startsWith("oscp-"),
  ).length;

  return { progress, recordSolve, reset, isSolved, totalPoints, solvedCount, base30Solved };
}
