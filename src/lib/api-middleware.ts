import { getSessionToken, verifySession } from "@/lib/auth/auth-server";
import type { AuthUser } from "@/lib/auth/auth-server";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";
import { checkAiQuota } from "@/lib/auth/ai-quota";
import { writeAnalytics } from "@/lib/analytics";
import { getEnv } from "@/lib/db";
import {
  unauthorizedError,
  rateLimitError,
  textError,
  serviceUnavailableText,
} from "@/lib/api-response";

export interface AuthenticatedSession {
  user: AuthUser;
  token: string;
}

export function requireAuth(request: Request): Promise<AuthenticatedSession | Response> {
  return _requireAuth(request);
}

async function _requireAuth(request: Request): Promise<AuthenticatedSession | Response> {
  const token = getSessionToken(request);
  if (!token) {
    return unauthorizedError();
  }
  const session = await verifySession(token);
  if (!session.ok || !session.user) {
    return unauthorizedError();
  }
  return { user: session.user, token };
}

export function isAuthResponse(result: AuthenticatedSession | Response): result is Response {
  return result instanceof Response;
}

export interface OptionalSession {
  userId: string | null;
  user: AuthUser | null;
}

export async function getOptionalAuth(request: Request): Promise<OptionalSession> {
  const token = getSessionToken(request);
  const session = token ? await verifySession(token) : null;
  const user = session?.ok ? (session.user ?? null) : null;
  return { userId: user?.id ?? null, user };
}

export function getClientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") || "unknown";
}

export interface RateLimitGuardResult {
  allowed: true;
  ip: string;
  startTime: number;
}

export async function withRateLimit(
  request: Request,
  action: string,
  tier: string,
  endpoint: string,
  analyticsEvent?: string,
): Promise<RateLimitGuardResult | Response> {
  const ip = getClientIp(request);
  const startTime = Date.now();
  const rl = await checkRateLimit(rateLimitKey(ip, action), tier);
  if (!rl.allowed) {
    if (analyticsEvent) {
      writeAnalytics(
        analyticsEvent as Parameters<typeof writeAnalytics>[0],
        "denied",
        null,
        endpoint,
        Date.now() - startTime,
      );
    }
    return rateLimitError();
  }
  return { allowed: true, ip, startTime };
}

export function isRateLimitResponse(result: RateLimitGuardResult | Response): result is Response {
  return result instanceof Response;
}

export function requireApiKey(keyName: string, errorMessage: string): string | Response {
  const env = getEnv();
  const key = env[keyName] as string;
  if (!key) {
    return serviceUnavailableText(errorMessage);
  }
  return key;
}

export function isApiKeyResponse(result: string | Response): result is Response {
  return result instanceof Response;
}

export interface AiAccessResult {
  apiKey: string;
  userId: string | null;
  ip: string;
  startTime: number;
}

export async function checkAiAccess(
  request: Request,
  action: string,
  endpoint: string,
  analyticsEvent: string,
): Promise<AiAccessResult | Response> {
  const apiKey = requireApiKey("OPENROUTER_API_KEY", "AI service is not configured.");
  if (isApiKeyResponse(apiKey)) return apiKey;

  const rl = await withRateLimit(request, action, "chat", endpoint, analyticsEvent);
  if (isRateLimitResponse(rl)) return rl;

  const { userId } = await getOptionalAuth(request);

  const quota = await checkAiQuota(userId);
  if (!quota.allowed) {
    writeAnalytics("quota", "denied", userId, endpoint, Date.now() - rl.startTime);
    return textError("Daily AI quota exceeded. Try again tomorrow.", 429);
  }

  return { apiKey, userId, ip: rl.ip, startTime: rl.startTime };
}

export function isResponse(result: unknown): result is Response {
  return result instanceof Response;
}

export function trackAiQueue(userId: string | null): void {
  try {
    const env = getEnv();
    const now = new Date();
    const dateStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
    const q = (env as Record<string, unknown>).AI_USAGE_QUEUE as {
      send: (msg: unknown) => Promise<void>;
    };
    q.send({ userId: userId ?? "__anonymous__", date: dateStr }).catch(() => {});
  } catch {
    /* non-fatal */
  }
}
