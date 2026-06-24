import { describe, it, expect } from "vitest";
import { getFallbackModels, addFallbackChain } from "@/lib/fallback-models";

describe("Fallback Models", () => {
  describe("getFallbackModels", () => {
    it("should return fallback chain for known model", () => {
      const fallbacks = getFallbackModels("nvidia/nemotron-3-super-120b-a12b:free");
      expect(fallbacks.length).toBeGreaterThan(0);
      expect(fallbacks).toContain("qwen/qwen-2.5-coder-32b-instruct");
    });

    it("should return empty array for unknown model", () => {
      const fallbacks = getFallbackModels("unknown/model");
      expect(fallbacks).toHaveLength(0);
    });
  });

  describe("addFallbackChain", () => {
    it("should add custom fallback chain", () => {
      addFallbackChain("custom/model", ["fallback1", "fallback2"]);
      const fallbacks = getFallbackModels("custom/model");
      expect(fallbacks).toContain("fallback1");
      expect(fallbacks).toContain("fallback2");
    });
  });
});
