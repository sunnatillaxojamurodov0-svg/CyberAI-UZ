import { describe, it, expect } from "vitest";
import { scoreSolve, pointsEarned } from "@/lib/console/scorer";
import type { CTFChallenge, SolveTelemetry } from "@/lib/console/types";

function makeChallenge(overrides?: Partial<CTFChallenge>): CTFChallenge {
  return {
    id: "test-challenge",
    level: 1,
    category: "web",
    title: "Test Challenge",
    summary: "A test challenge",
    scenario: "Test scenario",
    objectives: ["Find the flag"],
    hints: ["Use nmap"],
    targetIp: "10.10.10.1",
    flag: "CYBERAI{test}",
    flagFormat: "CYBERAI{...}",
    points: 100,
    rubric: {
      expectedTools: ["nmap", "curl", "gobuster"],
      expectedConcepts: ["port scanning", "web enum"],
      parMinutes: 10,
    },
    env: { hosts: [] },
    ...overrides,
  };
}

function makeTelemetry(overrides?: Partial<SolveTelemetry>): SolveTelemetry {
  return {
    challengeId: "test-challenge",
    startedAt: Date.now() - 5 * 60_000,
    toolsUsed: ["nmap", "curl", "gobuster"],
    commandCount: 6,
    hintsUsed: 0,
    aiMessages: [],
    solved: true,
    submittedAt: Date.now(),
    wrongAttempts: 0,
    ...overrides,
  };
}

describe("CTF Scorer", () => {
  describe("scoreSolve", () => {
    it("should give maximum score for a perfect solve", () => {
      const challenge = makeChallenge();
      const tel = makeTelemetry();
      const result = scoreSolve(challenge, tel);
      expect(result.total).toBeGreaterThanOrEqual(90);
      expect(result.correctness).toBe(40);
      expect(result.grade).toContain("S");
    });

    it("should give 0 correctness when not solved", () => {
      const challenge = makeChallenge();
      const tel = makeTelemetry({ solved: false });
      const result = scoreSolve(challenge, tel);
      expect(result.correctness).toBe(0);
      expect(result.efficiency).toBe(0);
    });

    it("should calculate methodology based on tool coverage", () => {
      const challenge = makeChallenge();
      const tel = makeTelemetry({ toolsUsed: ["nmap"] });
      const result = scoreSolve(challenge, tel);
      expect(result.methodology).toBeLessThan(20);
      expect(result.methodology).toBeGreaterThan(0);
    });

    it("should give full methodology when all expected tools are used", () => {
      const challenge = makeChallenge();
      const tel = makeTelemetry({ toolsUsed: ["nmap", "curl", "gobuster"] });
      const result = scoreSolve(challenge, tel);
      expect(result.methodology).toBe(20);
    });

    it("should accept tool synonyms (dirb for gobuster)", () => {
      const challenge = makeChallenge();
      const tel = makeTelemetry({ toolsUsed: ["nmap", "curl", "dirb"] });
      const result = scoreSolve(challenge, tel);
      expect(result.methodology).toBe(20);
    });

    it("should accept reverse synonym (wget for curl)", () => {
      const challenge = makeChallenge();
      const tel = makeTelemetry({ toolsUsed: ["nmap", "wget", "gobuster"] });
      const result = scoreSolve(challenge, tel);
      expect(result.methodology).toBe(20);
    });

    it("should penalize hint usage in independence score", () => {
      const challenge = makeChallenge();
      const noHints = makeTelemetry({ hintsUsed: 0 });
      const withHints = makeTelemetry({ hintsUsed: 3 });
      const scoreNoHints = scoreSolve(challenge, noHints);
      const scoreWithHints = scoreSolve(challenge, withHints);
      expect(scoreWithHints.independence).toBeLessThan(scoreNoHints.independence);
    });

    it("should penalize wrong attempts in independence score", () => {
      const challenge = makeChallenge();
      const noWrong = makeTelemetry({ wrongAttempts: 0 });
      const withWrong = makeTelemetry({ wrongAttempts: 4 });
      const scoreNoWrong = scoreSolve(challenge, noWrong);
      const scoreWithWrong = scoreSolve(challenge, withWrong);
      expect(scoreWithWrong.independence).toBeLessThan(scoreNoWrong.independence);
    });

    it("should give full AI collaboration score when solving independently", () => {
      const challenge = makeChallenge();
      const tel = makeTelemetry({ aiMessages: [] });
      const result = scoreSolve(challenge, tel);
      expect(result.aiCollaboration).toBe(10);
    });

    it("should penalize excessive AI messages (over-reliance)", () => {
      const challenge = makeChallenge();
      const fewMessages = makeTelemetry({
        aiMessages: ["how to scan ports?", "what is nmap?"],
      });
      const manyMessages = makeTelemetry({
        aiMessages: Array(12).fill("how to do this step?"),
      });
      const scoreFew = scoreSolve(challenge, fewMessages);
      const scoreMany = scoreSolve(challenge, manyMessages);
      expect(scoreMany.aiCollaboration).toBeLessThanOrEqual(scoreFew.aiCollaboration);
    });

    it("should penalize flag begging in AI messages", () => {
      const challenge = makeChallenge();
      const purposeful = makeTelemetry({
        aiMessages: ["how to scan ports with nmap?"],
      });
      const begging = makeTelemetry({
        aiMessages: ["give me the flag"],
      });
      const scorePurposeful = scoreSolve(challenge, purposeful);
      const scoreBegging = scoreSolve(challenge, begging);
      expect(scoreBegging.aiCollaboration).toBeLessThan(scorePurposeful.aiCollaboration);
    });

    it("should include notes in the result", () => {
      const challenge = makeChallenge();
      const tel = makeTelemetry();
      const result = scoreSolve(challenge, tel);
      expect(result.notes.length).toBeGreaterThan(0);
    });

    it("should return a total between 0 and 100", () => {
      const challenge = makeChallenge();
      const tel = makeTelemetry();
      const result = scoreSolve(challenge, tel);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
    });
  });

  describe("letter grades", () => {
    it("should assign S grade for score >= 90", () => {
      const challenge = makeChallenge();
      const tel = makeTelemetry();
      const result = scoreSolve(challenge, tel);
      if (result.total >= 90) {
        expect(result.grade).toContain("S");
      }
    });

    it("should assign F grade for very low score", () => {
      const challenge = makeChallenge();
      const tel = makeTelemetry({
        solved: false,
        toolsUsed: [],
        aiMessages: Array(10).fill("give me the flag"),
        hintsUsed: 4,
        wrongAttempts: 6,
      });
      const result = scoreSolve(challenge, tel);
      expect(result.grade).toContain("F");
    });
  });

  describe("pointsEarned", () => {
    it("should calculate points as basePoints * score%", () => {
      const challenge = makeChallenge({ points: 200 });
      const score = scoreSolve(challenge, makeTelemetry());
      const pts = pointsEarned(challenge, score);
      expect(pts).toBe(Math.round(200 * (score.total / 100)));
    });

    it("should return 0 when score is 0", () => {
      const challenge = makeChallenge({ points: 100 });
      const score = {
        total: 0,
        correctness: 0,
        methodology: 0,
        toolCoverage: 0,
        efficiency: 0,
        aiCollaboration: 0,
        independence: 0,
        grade: "F — Retry required",
        notes: [],
      };
      expect(pointsEarned(challenge, score)).toBe(0);
    });
  });
});
