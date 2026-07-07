import { describe, it, expect } from "vitest";
import { checkPromptInjection, sanitizeInput, createSecureSystemPrompt } from "@/lib/prompt-guard";

describe("Prompt Guard", () => {
  describe("checkPromptInjection", () => {
    it("should detect safe messages", async () => {
      const result = await checkPromptInjection("What is SQL injection?");
      expect(result.safe).toBe(true);
      expect(result.threats).toHaveLength(0);
    });

    it("should detect script injection", async () => {
      const result = await checkPromptInjection("<script>alert(1)</script>");
      expect(result.safe).toBe(false);
      expect(result.threats.some((t) => t.includes("obvious"))).toBe(true);
    });

    it("should detect base64 encoded payloads", async () => {
      const longB64 = "a".repeat(100) + "=";
      const result = await checkPromptInjection(longB64);
      expect(result.safe).toBe(false);
      expect(result.threats.some((t) => t.includes("encoded"))).toBe(true);
    });

    it("should allow legitimate messages through", async () => {
      const result = await checkPromptInjection("How do I enumerate open ports on a target?");
      expect(result.safe).toBe(true);
    });

    it("should flag excessive length", async () => {
      const result = await checkPromptInjection("x".repeat(11000));
      expect(result.score).toBeGreaterThanOrEqual(10);
    });
  });

  describe("sanitizeInput", () => {
    it("should remove HTML tags", () => {
      const result = sanitizeInput("<script>alert(1)</script>");
      expect(result).not.toContain("<script>");
    });

    it("should remove javascript protocol", () => {
      const result = sanitizeInput("javascript:alert(1)");
      expect(result).not.toContain("javascript:");
    });

    it("should truncate long messages", () => {
      const longMessage = "a".repeat(20000);
      const result = sanitizeInput(longMessage);
      expect(result.length).toBeLessThanOrEqual(10000);
    });

    it("should preserve safe content", () => {
      const safe = "What is SQL injection?";
      const result = sanitizeInput(safe);
      expect(result).toBe(safe);
    });
  });

  describe("createSecureSystemPrompt", () => {
    it("should add security rules to base prompt", () => {
      const base = "You are a cybersecurity assistant.";
      const result = createSecureSystemPrompt(base);
      expect(result).toContain("You are a cybersecurity assistant.");
      expect(result).toContain("refuse");
    });

    it("should preserve original prompt", () => {
      const base = "Custom instructions here.";
      const result = createSecureSystemPrompt(base);
      expect(result).toContain(base);
    });
  });
});
