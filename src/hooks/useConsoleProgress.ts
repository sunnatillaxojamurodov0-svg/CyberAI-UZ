import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
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

/* ── localStorage helpers ─────────────────────────────────────── */

function loadLocal(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function saveLocal(progress: ProgressMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* quota / private mode — ignore */
  }
}

/* ── Server API helpers ───────────────────────────────────────── */

async function fetchServerProgress(): Promise<ProgressMap | null> {
  try {
    const res = await fetch("/api/console/progress", {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.ok) return null;
    return data.data as ProgressMap;
  } catch {
    return null;
  }
}

async function postServerProgress(record: ChallengeRecord): Promise<boolean> {
  try {
    const res = await fetch("/api/console/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        challenge_id: record.challengeId,
        solved: record.solved,
        best_score: record.bestScore,
        grade: record.grade,
        points_earned: record.pointsEarned,
        solved_at: record.solvedAt,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ── Merge logic: server wins for best score, local wins for timestamp ── */

function mergeProgress(local: ProgressMap, server: ProgressMap): ProgressMap {
  const merged: ProgressMap = { ...local };

  for (const [id, serverRecord] of Object.entries(server)) {
    const localRecord = merged[id];

    if (!localRecord) {
      // Only exists on server — use it
      merged[id] = serverRecord;
    } else {
      // Exists in both — take the better score
      merged[id] = {
        ...localRecord,
        bestScore: Math.max(localRecord.bestScore, serverRecord.bestScore),
        pointsEarned: Math.max(localRecord.pointsEarned, serverRecord.pointsEarned),
        solved: localRecord.solved || serverRecord.solved,
        // Keep earliest solvedAt
        solvedAt:
          localRecord.solvedAt && serverRecord.solvedAt
            ? Math.min(localRecord.solvedAt, serverRecord.solvedAt)
            : localRecord.solvedAt || serverRecord.solvedAt,
        // Use grade from best score
        grade:
          serverRecord.bestScore > localRecord.bestScore ? serverRecord.grade : localRecord.grade,
      };
    }
  }

  // Check for local-only records that should be pushed to server
  for (const [id, localRecord] of Object.entries(merged)) {
    if (localRecord.solved && !server[id]) {
      // This record exists locally but not on server — will be synced
    }
  }

  return merged;
}

/**
 * Tracks CTF completion + scores across sessions.
 * Syncs with server when user is authenticated, falls back to localStorage.
 */
export function useConsoleProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressMap>(() => loadLocal());
  const syncedRef = useRef(false);
  const pendingSyncRef = useRef<Set<string>>(new Set());

  // ── Sync from server on mount (authenticated users) ──────────
  useEffect(() => {
    if (!user || syncedRef.current) return;

    const sync = async () => {
      const serverProgress = await fetchServerProgress();
      if (serverProgress) {
        setProgress((prev) => {
          const merged = mergeProgress(prev, serverProgress);
          saveLocal(merged);
          return merged;
        });
      }
      syncedRef.current = true;

      // Push any local-only solved challenges to server
      const local = loadLocal();
      for (const [id, record] of Object.entries(local)) {
        if (record.solved && !serverProgress?.[id]) {
          postServerProgress(record);
        }
      }
    };

    sync();
  }, [user]);

  // ── Save to localStorage on every change ─────────────────────
  useEffect(() => {
    saveLocal(progress);
  }, [progress]);

  // ── Record a solve: update local + queue server sync ──────────
  const recordSolve = useCallback(
    (challengeId: string, score: ScoreBreakdown, points: number) => {
      setProgress((prev) => {
        const existing = prev[challengeId];
        const bestScore = Math.max(existing?.bestScore ?? 0, score.total);
        const bestPoints = Math.max(existing?.pointsEarned ?? 0, points);
        const newRecord: ChallengeRecord = {
          challengeId,
          solved: true,
          bestScore,
          grade: score.grade,
          pointsEarned: bestPoints,
          solvedAt: existing?.solvedAt ?? Date.now(),
        };

        // Queue server sync
        if (user) {
          pendingSyncRef.current.add(challengeId);
          postServerProgress(newRecord).then(() => {
            pendingSyncRef.current.delete(challengeId);
          });
        }

        return {
          ...prev,
          [challengeId]: newRecord,
        };
      });
    },
    [user],
  );

  // ── Reset: clear local + server ──────────────────────────────
  const reset = useCallback(async () => {
    setProgress({});
    if (user) {
      try {
        await fetch("/api/console/progress", {
          method: "DELETE",
          credentials: "include",
        });
      } catch {
        // Non-fatal
      }
    }
  }, [user]);

  const isSolved = useCallback((id: string) => Boolean(progress[id]?.solved), [progress]);

  const totalPoints = Object.values(progress).reduce((sum, r) => sum + (r.pointsEarned ?? 0), 0);
  const solvedCount = Object.values(progress).filter((r) => r.solved).length;
  /** Only the base 60 challenges count toward Master unlock. */
  const base60Solved = Object.values(progress).filter(
    (r) => r.solved && !r.challengeId.startsWith("master-"),
  ).length;

  return {
    progress,
    recordSolve,
    reset,
    isSolved,
    totalPoints,
    solvedCount,
    base60Solved,
  };
}
