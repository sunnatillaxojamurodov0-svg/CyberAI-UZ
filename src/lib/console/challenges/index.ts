import type { CTFChallenge, CTFLevel } from "../types";
import { LEVEL1 } from "./level1";
import { LEVEL2 } from "./level2";
import { LEVEL3 } from "./level3";
import { ELITE } from "./elite";

export const ALL_CHALLENGES: CTFChallenge[] = [
  ...LEVEL1,
  ...LEVEL2,
  ...LEVEL3,
  ...ELITE,
];

export function getChallengesByLevel(level: CTFLevel): CTFChallenge[] {
  return ALL_CHALLENGES.filter((c) => c.level === level);
}

export function getChallenge(id: string): CTFChallenge | undefined {
  return ALL_CHALLENGES.find((c) => c.id === id);
}

/** Operators who complete all 30 CTFs gain access to OSCP Elite. */
export function isEliteUnlocked(solvedCount: number): boolean {
  return solvedCount >= 30;
}

export const LEVEL_META: Record<
  CTFLevel,
  {
    label: string;
    sublabel: string;
    description: string;
    tone: "primary" | "accent";
    locked?: boolean;
    unlockRequirement?: string;
  }
> = {
  1: {
    label: "Level 1",
    sublabel: "Beginner",
    description: "Easy and for learning. Each teaches one fundamental technique.",
    tone: "primary",
  },
  2: {
    label: "Level 2",
    sublabel: "Intermediate",
    description: "For those who know the basics. Multi-stage attack chains.",
    tone: "accent",
  },
  3: {
    label: "Level 3",
    sublabel: "Expert",
    description: "OSCP-style full compromise chains. For experts.",
    tone: "accent",
  },
  4: {
    label: "Elite",
    sublabel: "Imtihon",
    description:
      "Real OSCP exam format. 5 machines, 24 hours, 70+ points. GitHub/Telegram/Discord rabbit holes. Only for those who completed all 30 CTFs.",
    tone: "accent",
    locked: true,
    unlockRequirement: "Solve all 30 CTFs",
  },
};

export { LEVEL1, LEVEL2, LEVEL3, ELITE };
