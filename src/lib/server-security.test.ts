import { describe, it, expect } from "vitest";
import { buildCSP, injectNonceIntoHtml } from "@/lib/server-security";

describe("buildCSP", () => {
  it("uses nonce for scripts and excludes unsafe script directives", () => {
    const csp = buildCSP("abc123");
    expect(csp).toContain("script-src 'self' 'nonce-abc123'");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(csp).not.toMatch(/script-src[^;]*unsafe-eval/);
  });
});

describe("injectNonceIntoHtml", () => {
  it("adds nonce to script tags without one", () => {
    const html = '<html><head><script type="module" src="/app.js"></script></head></html>';
    const out = injectNonceIntoHtml(html, "n1");
    expect(out).toContain('<script nonce="n1" type="module" src="/app.js">');
  });

  it("does not duplicate nonce on tags that already have it", () => {
    const html = '<script nonce="existing" src="/app.js"></script>';
    const out = injectNonceIntoHtml(html, "n1");
    expect(out).toBe(html);
  });

  it("adds nonce to inline JSON-LD scripts", () => {
    const html = '<script type="application/ld+json">{"@context":"https://schema.org"}</script>';
    const out = injectNonceIntoHtml(html, "n1");
    expect(out).toContain('<script nonce="n1" type="application/ld+json">');
  });
});
