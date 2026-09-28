import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Default matches drizzle.config.json. Used when DATABASE_URL is not set
 * (for example when .env was not included in a downloaded copy) so that
 * importing this module never crashes a route with an opaque 500.
 */
export const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

const databaseUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

if (!process.env.DATABASE_URL) {
  console.warn(
    `[gridboard] DATABASE_URL is not set. Falling back to ${DEFAULT_DATABASE_URL}. ` +
      "Create a .env file (see .env.example) to point at your database."
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

/** Host:port/db for error messages (never includes the password). */
export function databaseTarget(): string {
  try {
    const u = new URL(databaseUrl);
    return `${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "the configured database";
  }
}

export const db = drizzle(pool);
