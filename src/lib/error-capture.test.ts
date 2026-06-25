import { describe, it, expect } from "vitest";
import { consumeLastCapturedError } from "@/lib/error-capture";

describe("Error Capture", () => {
  describe("consumeLastCapturedError", () => {
    it("should return undefined when no error has been captured", () => {
      const result = consumeLastCapturedError();
      expect(result).toBeUndefined();
    });

    it("should return undefined on subsequent calls (consumes the error)", () => {
      const first = consumeLastCapturedError();
      const second = consumeLastCapturedError();
      expect(first).toBeUndefined();
      expect(second).toBeUndefined();
    });
  });
});
