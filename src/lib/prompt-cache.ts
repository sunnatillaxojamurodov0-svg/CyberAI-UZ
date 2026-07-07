import { getEnv } from "./db";

interface CacheEntry {
  response: string;
  model: string;
  timestamp: number;
  hits: number;
}

interface CacheConfig {
  maxEntries: number;
  ttlSeconds: number;
  enabled: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxEntries: 1000,
  ttlSeconds: 3600,
  enabled: true,
};

function generateCacheKey(messages: { role: string; content: string }[], model: string): string {
  const keyParts = messages.map((m) => `${m.role}:${m.content.slice(0, 100)}`);
  const keyString = `${model}:${keyParts.join("|")}`;
  return `cache:${keyString}`;
}

async function getCacheEntry(key: string): Promise<CacheEntry | null> {
  try {
    const env = getEnv();
    const kv = env.CYBERAI_KV as
      { get: (key: string, type?: string) => Promise<string | null> } | undefined;
    if (!kv) return null;

    const cached = await kv.get(key, "json");
    if (!cached) return null;

    const entry = JSON.parse(cached) as CacheEntry;
    const now = Date.now();
    if (now - entry.timestamp > DEFAULT_CONFIG.ttlSeconds * 1000) {
      return null;
    }

    entry.hits++;
    await kv.put(key, JSON.stringify(entry), { expirationTtl: DEFAULT_CONFIG.ttlSeconds });

    return entry;
  } catch {
    return null;
  }
}

async function setCacheEntry(key: string, response: string, model: string): Promise<void> {
  try {
    const env = getEnv();
    const kv = env.CYBERAI_KV as
      | { put: (key: string, value: string, opts?: { expirationTtl?: number }) => Promise<void> }
      | undefined;
    if (!kv) return;

    const entry: CacheEntry = {
      response,
      model,
      timestamp: Date.now(),
      hits: 1,
    };

    await kv.put(key, JSON.stringify(entry), { expirationTtl: DEFAULT_CONFIG.ttlSeconds });
  } catch {
    /* non-fatal */
  }
}

export function getCachedResponse(
  messages: { role: string; content: string }[],
  model: string,
): Promise<CacheEntry | null> {
  if (!DEFAULT_CONFIG.enabled) return Promise.resolve(null);
  const key = generateCacheKey(messages, model);
  return getCacheEntry(key);
}

export function setCachedResponse(
  messages: { role: string; content: string }[],
  response: string,
  model: string,
): Promise<void> {
  if (!DEFAULT_CONFIG.enabled) return Promise.resolve();
  const key = generateCacheKey(messages, model);
  return setCacheEntry(key, response, model);
}

export function getCacheStats(): Promise<{ enabled: boolean; ttl: number }> {
  return Promise.resolve({
    enabled: DEFAULT_CONFIG.enabled,
    ttl: DEFAULT_CONFIG.ttlSeconds,
  });
}
