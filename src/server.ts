import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { initDb, requireDb } from "./lib/db";
import { processAiUsageBatch } from "./queues/ai-usage";
import { initMonitoring, monitoring } from "./lib/monitoring";
import { checkRateLimit, rateLimitKey } from "./lib/auth/rate-limit";
import { buildSecurityHeaders, injectNonceIntoHtml } from "./lib/server-security";
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

function addSecurityHeaders(
  response: Response,
  nonce: string,
  isApiRoute: boolean = false,
): Response {
  for (const [key, value] of Object.entries(buildSecurityHeaders(nonce, isApiRoute))) {
    response.headers.set(key, value);
  }
  return response;
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

async function normalizeCatastrophicSsrResponse(
  response: Response,
  nonce: string,
  isApiRoute: boolean = false,
): Promise<Response> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("text/html")) {
    const body = await response.clone().text();
    const newBody = injectNonceIntoHtml(body, nonce);
    const newResponse = new Response(newBody, response);
    return addSecurityHeaders(newResponse, nonce, isApiRoute);
  }

  if (response.status < 500) return addSecurityHeaders(response, nonce, isApiRoute);

  if (!contentType.includes("application/json")) {
    return addSecurityHeaders(response, nonce, isApiRoute);
  }

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return addSecurityHeaders(response, nonce, isApiRoute);
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

      const staticExtensions = [
        ".js",
        ".css",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".svg",
        ".ico",
        ".woff",
        ".woff2",
        ".ttf",
        ".eot",
      ];
      const isStatic = staticExtensions.some((ext) => url.pathname.endsWith(ext));

      if (!isStatic && !url.pathname.startsWith("/api/")) {
        const rl = await checkRateLimit(rateLimitKey(ip, "global"));
        if (!rl.allowed) {
          monitoring.trackRequest(url.pathname, request.method, 429, Date.now() - startTime);
          return new Response("Too many requests. Please slow down.", {
            status: 429,
            headers: {
              "Content-Type": "text/plain",
              "Retry-After": String(Math.ceil(rl.resetAt - Date.now() / 1000)),
              "X-RateLimit-Limit": "500",
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(rl.resetAt),
            },
          });
        }
      }

      const isApiRoute = url.pathname.startsWith("/api/");
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const duration = Date.now() - startTime;
      monitoring.trackRequest(url.pathname, request.method, response.status, duration);

      // Add immutable cache headers for static assets with hashed filenames
      if (staticExtensions.some((ext) => url.pathname.endsWith(ext))) {
        const newResponse = new Response(response.body, response);
        newResponse.headers.set("Cache-Control", "public, max-age=31536000, immutable");
        return await normalizeCatastrophicSsrResponse(newResponse, nonce, isApiRoute);
      }

      return await normalizeCatastrophicSsrResponse(response, nonce, isApiRoute);
    } catch (error) {
      monitoring.trackError(error instanceof Error ? error : new Error(String(error)));
      console.error(error);
      return brandedErrorResponse(nonce);
    }
  },

  async queue(batch: { messages: { body: unknown }[] }, env: unknown): Promise<void> {
    const e = env as Record<string, unknown> | undefined;
    if (e?.cyberai_db) {
      initDb(e.cyberai_db, e);
      initMonitoring(e);
      const db = requireDb();
      await processAiUsageBatch(batch.messages as { body: { userId: string; date: string } }[], db);
    }
  },
};
