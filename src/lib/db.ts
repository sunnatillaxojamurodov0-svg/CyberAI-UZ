export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...args: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

let _db: unknown = null;
let _env: Record<string, unknown> = {};

export function initDb(db: unknown, env?: Record<string, unknown>) {
  _db = db;
  if (env) _env = env;
}

export function getDb(): D1Database | null {
  return _db as D1Database | null;
}

export function requireDb(): D1Database {
  if (!_db) throw new Error("D1 database not initialized.");
  return _db as D1Database;
}

export function getEnv(): Record<string, unknown> {
  return _env;
}
