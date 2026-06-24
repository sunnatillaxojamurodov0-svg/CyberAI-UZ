import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { initDb, requireDb } from "./lib/db";
import { processAiUsageBatch } from "./queues/ai-usage";
import { initMonitoring, monitoring } from "./lib/monitoring";
import { checkRateLimit, rateLimitKey } from "./lib/auth/rate-limit";
export { ChatSessionDO, ConsoleSessionDO } from "./durable-objects";
export { ChallengeGenerator, UserOnboarding, ConsoleAnalysis } from "./workflows/workflows";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

function buildCSP(nonce: string): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://storage.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "form-action 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "connect-src 'self' https://*.googleapis.com",
  ].join("; ");
}

function buildSecurityHeaders(nonce: string): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": buildCSP(nonce),
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "X-XSS-Protection": "1; mode=block",
    "X-Permitted-Cross-Domain-Policies": "none",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
}

function addSecurityHeaders(response: Response, nonce: string): Response {
  for (const [key, value] of Object.entries(buildSecurityHeaders(nonce))) {
    response.headers.set(key, value);
  }
  return response;
}

function injectNonceIntoHtml(html: string, _nonce: string): string {
  return html;
}

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(nonce: string): Response {
  const html = injectNonceIntoHtml(renderErrorPage(), nonce);
  return addSecurityHeaders(
    new Response(html, {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
    nonce,
  );
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

async function normalizeCatastrophicSsrResponse(response: Response, nonce: string): Promise<Response> {
  const contentType = response.headers.get("content-type") ?? "";
  
  if (contentType.includes("text/html")) {
    const body = await response.clone().text();
    const newBody = injectNonceIntoHtml(body, nonce);
    const newResponse = new Response(newBody, response);
    return addSecurityHeaders(newResponse, nonce);
  }

  if (response.status < 500) return addSecurityHeaders(response, nonce);
  
  if (!contentType.includes("application/json")) {
    return addSecurityHeaders(response, nonce);
  }

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return addSecurityHeaders(response, nonce);
  }

  console.error(consumeLastCapturedError() ?? new Error(`SSR error: ${body}`));
  return brandedErrorResponse(nonce);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const startTime = Date.now();
    const nonce = generateNonce();
    try {
      const e = env as Record<string, unknown> | undefined;
      if (e?.cyberai_db) {
        initDb(e.cyberai_db, e);
        initMonitoring(e);
      }

      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const url = new URL(request.url);

      const staticExtensions = [".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot"];
      const isStatic = staticExtensions.some((ext) => url.pathname.endsWith(ext));

      if (!isStatic && !url.pathname.startsWith("/api/")) {
        const rl = await checkRateLimit(rateLimitKey(ip, "global"));
        if (!rl.allowed) {
          monitoring.trackRequest(url.pathname, request.method, 429, Date.now() - startTime);
          return new Response("Too many requests. Please slow down.", {
            status: 429,
            headers: {
              "Content-Type": "text/plain",
              "Retry-After": String(Math.ceil((rl.resetAt - Date.now() / 1000))),
              "X-RateLimit-Limit": "500",
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(rl.resetAt),
            },
          });
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const duration = Date.now() - startTime;
      monitoring.trackRequest(url.pathname, request.method, response.status, duration);
      return await normalizeCatastrophicSsrResponse(response, nonce);
    } catch (error) {
      monitoring.trackError(error instanceof Error ? error : new Error(String(error)));
      console.error(error);
      return brandedErrorResponse(nonce);
    }
  },

  async queue(
    batch: { messages: { body: unknown }[] },
    env: unknown,
  ): Promise<void> {
    const e = env as Record<string, unknown> | undefined;
    if (e?.cyberai_db) {
      initDb(e.cyberai_db, e);
      initMonitoring(e);
      const db = requireDb();
      await processAiUsageBatch(
        batch.messages as { body: { userId: string; date: string } }[],
        db,
      );
    }
  },
};
