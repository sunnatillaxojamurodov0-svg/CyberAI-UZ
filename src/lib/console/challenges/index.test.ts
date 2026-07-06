import { describe, it, expect } from "vitest";
import {
  ALL_CHALLENGES,
  getChallengesByLevel,
  getChallenge,
  isEliteUnlocked,
  isMasterUnlocked,
  LEVEL_META,
  LEVEL1,
  LEVEL2,
  LEVEL3,
  ELITE,
} from "@/lib/console/challenges/index";

describe("Challenges Index", () => {
  describe("ALL_CHALLENGES", () => {
    it("should export a non-empty array", () => {
      expect(Array.isArray(ALL_CHALLENGES)).toBe(true);
      expect(ALL_CHALLENGES.length).toBeGreaterThan(0);
    });

    it("should contain challenges from all levels", () => {
      expect(ALL_CHALLENGES.length).toBe(
        LEVEL1.length + LEVEL2.length + LEVEL3.length + ELITE.length,
      );
    });

    it("should have valid challenge structure for all entries", () => {
      for (const c of ALL_CHALLENGES) {
        expect(c).toHaveProperty("id");
        expect(c).toHaveProperty("level");
        expect(c).toHaveProperty("category");
        expect(c).toHaveProperty("title");
        expect(c).toHaveProperty("flag");
        expect(c).toHaveProperty("points");
        expect(c).toHaveProperty("rubric");
        expect(c).toHaveProperty("env");
      }
    });

    it("should have unique ids", () => {
      const ids = ALL_CHALLENGES.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("getChallengesByLevel", () => {
    it("should return level 1 challenges", () => {
      const result = getChallengesByLevel(1);
      expect(result.length).toBe(LEVEL1.length);
      expect(result.every((c) => c.level === 1)).toBe(true);
    });

    it("should return level 2 challenges", () => {
      const result = getChallengesByLevel(2);
      expect(result.length).toBe(LEVEL2.length);
      expect(result.every((c) => c.level === 2)).toBe(true);
    });

    it("should return level 3 challenges", () => {
      const result = getChallengesByLevel(3);
      expect(result.length).toBe(LEVEL3.length);
      expect(result.every((c) => c.level === 3)).toBe(true);
    });

    it("should return level 4 (elite) challenges", () => {
      const result = getChallengesByLevel(4);
      expect(result.length).toBe(ELITE.length);
      expect(result.every((c) => c.level === 4)).toBe(true);
    });
  });

  describe("getChallenge", () => {
    it("should find a challenge by id", () => {
      const first = ALL_CHALLENGES[0];
      const found = getChallenge(first.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(first.id);
    });

    it("should return undefined for non-existent id", () => {
      const found = getChallenge("non-existent-id");
      expect(found).toBeUndefined();
    });
  });

  describe("isEliteUnlocked", () => {
    it("should return false when solved count is less than 60", () => {
      expect(isEliteUnlocked(0)).toBe(false);
      expect(isEliteUnlocked(30)).toBe(false);
      expect(isEliteUnlocked(59)).toBe(false);
    });

    it("should return true when solved count is 60 or more", () => {
      expect(isEliteUnlocked(60)).toBe(true);
      expect(isEliteUnlocked(100)).toBe(true);
    });
  });

  describe("isMasterUnlocked", () => {
    it("should return false when solved count is less than 60", () => {
      expect(isMasterUnlocked(0)).toBe(false);
      expect(isMasterUnlocked(59)).toBe(false);
    });

    it("should return true when solved count is 60 or more", () => {
      expect(isMasterUnlocked(60)).toBe(true);
      expect(isMasterUnlocked(100)).toBe(true);
    });
  });

  describe("LEVEL_META", () => {
    it("should have metadata for all 4 levels", () => {
      expect(LEVEL_META[1]).toBeDefined();
      expect(LEVEL_META[2]).toBeDefined();
      expect(LEVEL_META[3]).toBeDefined();
      expect(LEVEL_META[4]).toBeDefined();
    });

    it("should have valid structure for each level", () => {
      for (const level of [1, 2, 3, 4] as const) {
        const meta = LEVEL_META[level];
        expect(meta).toHaveProperty("label");
        expect(meta).toHaveProperty("sublabel");
        expect(meta).toHaveProperty("description");
        expect(meta).toHaveProperty("tone");
      }
    });

    it("should mark level 4 as locked", () => {
      expect(LEVEL_META[4].locked).toBe(true);
      expect(LEVEL_META[4].unlockRequirement).toBeTruthy();
    });

    it("should not mark levels 1-3 as locked", () => {
      expect(LEVEL_META[1].locked).toBeUndefined();
      expect(LEVEL_META[2].locked).toBeUndefined();
      expect(LEVEL_META[3].locked).toBeUndefined();
    });
  });
});
