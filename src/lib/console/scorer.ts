/* ──────────────────────────────────────────────────────────────
   CyberAI · CTF Scorer
   OSCP-uslubidagi baholash. Telemetriya (qaysi toollar ishlatilgan,
   metodologiya, samaradorlik, mustaqillik va VAEL bilan hamkorlik)
   asosida foizli ball chiqaradi.

   Baholash o'lchovlari (jami 100%):
   - Correctness    (40) — flag to'g'rimi
   - Methodology    (20) — kutilgan toollar/bosqichlar qamrovi
   - Tool coverage  (15) — kerakli toollarning ishlatilishi
   - Efficiency     (10) — vaqt va buyruqlar soni (par bilan solishtirish)
   - AI collab      (10) — VAEL bilan mazmunli, maqsadli hamkorlik
   - Independence   ( 5) — kam maslahat (hint) va kam noto'g'ri urinish
   ────────────────────────────────────────────────────────────── */

import type { CTFChallenge, ScoreBreakdown, SolveTelemetry } from "./types";

const W = {
  correctness: 40,
  methodology: 20,
  toolCoverage: 15,
  efficiency: 10,
  aiCollaboration: 10,
  independence: 5,
} as const;

function clamp(n: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, n));
}

/** Normalize a command/tool name (strip path, lowercase). */
function norm(tool: string): string {
  return tool.toLowerCase().split("/").pop() ?? tool.toLowerCase();
}

/** Tool synonyms — different tools that satisfy the same expected step. */
const SYNONYMS: Record<string, string[]> = {
  gobuster: ["dirb", "ffuf", "feroxbuster"],
  nc: ["ncat", "netcat"],
  john: ["hashcat"],
  hashid: ["hash-identifier"],
  curl: ["wget"],
  smbclient: ["enum4linux", "smbmap"],
};

function toolMatches(expected: string, used: Set<string>): boolean {
  const e = norm(expected);
  if (used.has(e)) return true;
  const syns = SYNONYMS[e] ?? [];
  if (syns.some((s) => used.has(s))) return true;
  // reverse: expected may be a synonym of a used tool
  for (const [canon, list] of Object.entries(SYNONYMS)) {
    if (list.includes(e) && (used.has(canon) || list.some((s) => used.has(s)))) {
      return true;
    }
  }
  return false;
}

/* ── AI collaboration quality ────────────────────────────────── */

const RELEVANT_AI_TERMS = [
  "nmap",
  "port",
  "scan",
  "curl",
  "http",
  "sql",
  "inject",
  "hash",
  "crack",
  "john",
  "hydra",
  "ssh",
  "privesc",
  "sudo",
  "suid",
  "root",
  "shell",
  "flag",
  "exploit",
  "cookie",
  "jwt",
  "lfi",
  "rfi",
  "xxe",
  "ssrf",
  "smb",
  "ftp",
  "base64",
  "rot13",
  "stego",
  "steghide",
  "gobuster",
  "directory",
  "wordlist",
  "kerber",
  "docker",
  "kernel",
  "pivot",
  "waf",
  "bypass",
  "payload",
  "how",
  "what",
  "which",
  "help",
  "tool",
  "command",
];

function scoreAiCollaboration(tel: SolveTelemetry): { score: number; note: string } {
  const msgs = tel.aiMessages;
  if (msgs.length === 0) {
    return {
      score: 1, // full marks for solving fully independently
      note: "Solved independently without VAEL — excellent autonomy.",
    };
  }

  // Reward purposeful, technical questions; penalize asking for the literal flag.
  let relevant = 0;
  let flagBegging = 0;
  for (const m of msgs) {
    const low = m.toLowerCase();
    if (RELEVANT_AI_TERMS.some((t) => low.includes(t))) relevant += 1;
    if (
      /flag\s*(give|tell|show|what|where)|give\s+(me\s+)?(the\s+)?(answer|flag)|tell\s+(me\s+)?(the\s+)?flag/.test(low)
    ) {
      flagBegging += 1;
    }
  }

  const relevanceRatio = relevant / msgs.length;
  // Too many messages suggests over-reliance; sweet spot 1-5 focused questions.
  const volumePenalty = msgs.length > 8 ? 0.25 : msgs.length > 5 ? 0.1 : 0;
  const beggingPenalty = clamp(flagBegging * 0.2, 0, 0.6);

  const score = clamp(relevanceRatio - volumePenalty - beggingPenalty);

  let note: string;
  if (flagBegging > 0) {
    note = "Directly asked VAEL for the flag — this weakens the methodology.";
  } else if (relevanceRatio > 0.7 && msgs.length <= 5) {
    note = "Purposeful, technical collaboration with VAEL — correct approach.";
  } else if (msgs.length > 8) {
    note = "Over-reliance on VAEL — more independent work is recommended.";
  } else {
    note = "Collaboration with VAEL is at an average level.";
  }

  return { score, note };
}

/* ── Letter grade ────────────────────────────────────────────── */

function letterGrade(total: number): string {
  if (total >= 90) return "S — Elite Operator";
  if (total >= 80) return "A — Professional";
  if (total >= 70) return "B — Strong";
  if (total >= 60) return "C — Sufficient";
  if (total >= 45) return "D — Beginner";
  return "F — Retry required";
}

/* ── Main ────────────────────────────────────────────────────── */

export function scoreSolve(
  challenge: CTFChallenge,
  tel: SolveTelemetry,
): ScoreBreakdown {
  const notes: string[] = [];
  const usedSet = new Set(tel.toolsUsed.map(norm));

  /* 1. Correctness */
  const correctness = tel.solved ? W.correctness : 0;
  if (tel.solved) {
    notes.push(`✓ Flag correctly found (+${W.correctness}%).`);
  } else {
    notes.push("✗ Flag not yet submitted correctly — no base points.");
  }

  /* 2. Methodology — concept/tool coverage from rubric expectedTools */
  const expected = challenge.rubric.expectedTools;
  const matched = expected.filter((t) => toolMatches(t, usedSet));
  const methodRatio = expected.length ? matched.length / expected.length : 1;
  const methodology = Math.round(W.methodology * methodRatio);
  notes.push(
    `Methodology: ${matched.length}/${expected.length} expected steps covered (+${methodology}%).`,
  );
  const missing = expected.filter((t) => !toolMatches(t, usedSet));
  if (missing.length) {
    notes.push(`Recommendation: tools like ${missing.join(", ")} would have provided a more effective solution.`);
  }

  /* 3. Tool coverage — breadth of distinct relevant tools used */
  const relevantUsed = expected.filter((t) => toolMatches(t, usedSet)).length;
  const coverageRatio = expected.length ? relevantUsed / expected.length : 1;
  const toolCoverage = Math.round(W.toolCoverage * coverageRatio);

  /* 4. Efficiency — time + command economy vs par */
  const minutes = tel.submittedAt
    ? (tel.submittedAt - tel.startedAt) / 60000
    : (Date.now() - tel.startedAt) / 60000;
  const par = challenge.rubric.parMinutes;
  const timeRatio = clamp(par / Math.max(minutes, 0.5)); // faster than par -> 1
  // command economy: ideal roughly 2x expected tools count
  const idealCmds = Math.max(expected.length * 2, 4);
  const cmdRatio = clamp(idealCmds / Math.max(tel.commandCount, 1));
  const efficiency = tel.solved
    ? Math.round(W.efficiency * (0.6 * timeRatio + 0.4 * cmdRatio))
    : 0;
  if (tel.solved) {
    const fast = minutes <= par;
    notes.push(
      `Efficiency: ${minutes.toFixed(1)} min (par ${par}), ${tel.commandCount} commands — ${
        fast ? "within par, fast solution" : "slower than par"
      } (+${efficiency}%).`,
    );
  }

  /* 5. AI collaboration */
  const ai = scoreAiCollaboration(tel);
  const aiCollaboration = Math.round(W.aiCollaboration * ai.score);
  notes.push(`VAEL collaboration: ${ai.note} (+${aiCollaboration}%).`);

  /* 6. Independence — fewer hints + fewer wrong attempts */
  const hintPenalty = clamp(tel.hintsUsed * 0.25, 0, 1);
  const wrongPenalty = clamp(tel.wrongAttempts * 0.15, 0, 1);
  const independenceRatio = clamp(1 - hintPenalty - wrongPenalty);
  const independence = Math.round(W.independence * independenceRatio);
  if (tel.hintsUsed > 0 || tel.wrongAttempts > 0) {
    notes.push(
      `Independence: ${tel.hintsUsed} hints, ${tel.wrongAttempts} wrong attempts (+${independence}%).`,
    );
  } else if (tel.solved) {
    notes.push(`Independence: solved without hints or errors (+${independence}%).`);
  }

  const total = clamp(
    (correctness +
      methodology +
      toolCoverage +
      efficiency +
      aiCollaboration +
      independence) /
      100,
    0,
    1,
  ) * 100;

  const rounded = Math.round(total);

  return {
    total: rounded,
    correctness,
    methodology,
    toolCoverage,
    efficiency,
    aiCollaboration,
    independence,
    grade: letterGrade(rounded),
    notes,
  };
}

/** Estimate points earned for the leaderboard/profile (base points × score%). */
export function pointsEarned(challenge: CTFChallenge, score: ScoreBreakdown): number {
  return Math.round(challenge.points * (score.total / 100));
}
