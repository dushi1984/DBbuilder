import { pool } from "@/db";

/**
 * Creates the app's own tables if they are missing, so a fresh local
 * database works without running drizzle-kit push first. Mirrors the
 * definitions in src/db/schema.ts. Runs once per server process.
 */
let ready: Promise<void> | null = null;

export function ensureAppSchema(): Promise<void> {
  if (!ready) {
    ready = pool
      .query(
        `
        CREATE TABLE IF NOT EXISTS dashboards (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS widgets (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          dashboard_id uuid NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
          name text NOT NULL,
          sql text NOT NULL,
          type text NOT NULL DEFAULT 'bar',
          span integer NOT NULL DEFAULT 6,
          "order" integer NOT NULL DEFAULT 0,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        `
      )
      .then(() => undefined)
      .catch((e) => {
        // Reset so the next request retries (e.g. once PostgreSQL is up).
        ready = null;
        throw e;
      });
  }
  return ready;
}
