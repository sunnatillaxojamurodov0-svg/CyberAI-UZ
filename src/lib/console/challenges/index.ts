import type { CTFChallenge, CTFLevel } from "../types";
import { LEVEL1 } from "./level1";
import { LEVEL2 } from "./level2";
import { LEVEL3 } from "./level3";
import { ELITE } from "./elite";

export const ALL_CHALLENGES: CTFChallenge[] = [...LEVEL1, ...LEVEL2, ...LEVEL3, ...ELITE];

export function getChallengesByLevel(level: CTFLevel): CTFChallenge[] {
  return ALL_CHALLENGES.filter((c) => c.level === level);
}

export function getChallenge(id: string): CTFChallenge | undefined {
  return ALL_CHALLENGES.find((c) => c.id === id);
}

/** Operators who complete all 60 CTFs gain access to Master Tier. */
export function isEliteUnlocked(solvedCount: number): boolean {
  return solvedCount >= 60;
}

/** Operators who complete all 60 CTFs gain access to Master Tier (10 OSCP-level CTFs). */
export function isMasterUnlocked(solvedCount: number): boolean {
  return solvedCount >= 60;
}

export const LEVEL_META: Record<
  CTFLevel,
  {
    label: string;
    sublabel: string;
    description: string;
    tone: "primary" | "accent" | "emerald";
    locked?: boolean;
    unlockRequirement?: string;
  }
> = {
  1: {
    label: "Level 1",
    sublabel: "Easy",
    description:
      "20 beginner-friendly CTFs. Each teaches one fundamental technique — recon, web, crypto, and more.",
    tone: "primary",
  },
  2: {
    label: "Level 2",
    sublabel: "Medium",
    description:
      "20 intermediate CTFs. Multi-stage attack chains requiring tool chaining and methodology.",
    tone: "accent",
  },
  3: {
    label: "Level 3",
    sublabel: "Hard",
    description: "20 expert CTFs. OSCP-style full compromise chains. For experienced operators.",
    tone: "emerald",
  },
  4: {
    label: "Master",
    sublabel: "OSCP Elite",
    description:
      "10 OSCP-level CTFs, each with 6 interconnected target machines. 24-hour format. Only for those who completed all 60 CTFs.",
    tone: "accent",
    locked: true,
    unlockRequirement: "Solve all 60 CTFs",
  },
};

export { LEVEL1, LEVEL2, LEVEL3, ELITE };
