let _db: unknown = null;
let _env: Record<string, unknown> = {};

export function initDb(db: unknown, env?: Record<string, unknown>) {
  _db = db;
  if (env) _env = env;
}

export function getDb<T = unknown>(): T | null {
  return _db as T | null;
}

export function requireDb<T = unknown>(): T {
  if (!_db) throw new Error("D1 database not initialized.");
  return _db as T;
}

export function getEnv(): Record<string, unknown> {
  return _env;
}
