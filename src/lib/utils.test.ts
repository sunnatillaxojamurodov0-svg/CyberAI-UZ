import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("should merge class names", () => {
    const result = cn("foo", "bar");
    expect(result).toContain("foo");
    expect(result).toContain("bar");
  });

  it("should handle conditional classes", () => {
    const isHidden = false;
    const result = cn("base", isHidden && "hidden", "visible");
    expect(result).toContain("base");
    expect(result).toContain("visible");
    expect(result).not.toContain("hidden");
  });

  it("should resolve tailwind conflicts", () => {
    const result = cn("px-4", "px-6");
    expect(result).toBe("px-6");
    expect(result).not.toContain("px-4");
  });

  it("should handle empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle undefined and null inputs", () => {
    const result = cn("foo", undefined, null, "bar");
    expect(result).toContain("foo");
    expect(result).toContain("bar");
  });

  it("should handle arrays of class names", () => {
    const result = cn(["foo", "bar"]);
    expect(result).toContain("foo");
    expect(result).toContain("bar");
  });

  it("should handle object syntax", () => {
    const result = cn({ "text-red-500": true, "text-blue-500": false });
    expect(result).toContain("text-red-500");
    expect(result).not.toContain("text-blue-500");
  });
});
