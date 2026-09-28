import { pool } from "@/db";

const MAX_ROWS = 1000;

function stripComments(input: string): string {
  return input
    .replace(/--[\s\S]*?(?=\n|$)/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .trim();
}

export interface RunResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  ms: number;
  command?: string;
}

function toRows(rows: Record<string, unknown>[]) {
  return rows.map((r) =>
    Object.fromEntries(
      Object.entries(r).map(([k, v]) => [
        k,
        v instanceof Date ? v.toISOString() : v,
      ])
    )
  );
}

type PgResult = {
  rows?: Record<string, unknown>[];
  rowCount?: number;
  command?: string;
  fields?: { name: string }[];
};

/**
 * Validates that SQL is a single SELECT/WITH statement. Widget SQL must
 * return a result set to render, so only SELECT is allowed there.
 */
export function assertSelect(input: string): string {
  const cleaned = stripComments(input);
  if (!cleaned) throw new Error("Write a SQL command first.");
  const body = cleaned.replace(/;+\s*$/, "").trim();
  if (body.includes(";")) {
    throw new Error("Widget SQL must be a single statement.");
  }
  if (!/^\s*(\(|select|with)\b/i.test(body)) {
    throw new Error("Widget SQL must be a SELECT query.");
  }
  return body;
}

function isSingleSelect(body: string): boolean {
  if (body.includes(";")) return false;
  return /^\s*(\(|select|with)\b/i.test(body);
}

/**
 * Runs any SQL against the database: SELECT, INSERT / UPDATE / DELETE,
 * DDL (CREATE, ALTER, DROP, …), or multi-statement scripts.
 *
 * A lone SELECT statement is wrapped in a 1,000-row cap so a big table
 * cannot blow up the UI; everything else executes exactly as written.
 */
export async function runSql(input: string): Promise<RunResult> {
  const cleaned = stripComments(input);
  if (!cleaned) throw new Error("Write a SQL command first.");
  const t0 = Date.now();
  const body = cleaned.replace(/;+\s*$/, "").trim();
  const sqlToRun = isSingleSelect(body)
    ? `SELECT * FROM (${body}) AS __gridboard_guard LIMIT ${MAX_ROWS}`
    : cleaned;
  // pg returns a single result object for one statement and an array of
  // per-statement results for multi-statement scripts.
  const raw = (await pool.query(sqlToRun)) as unknown as
    | PgResult
    | PgResult[];
  const results: PgResult[] = Array.isArray(raw) ? raw : [raw];
  const last = results[results.length - 1];
  const dataset =
    [...results].reverse().find((r) => (r.fields?.length ?? 0) > 0) ?? last;
  const datasetRows = dataset.rows ?? [];
  const rows = toRows(datasetRows.slice(0, MAX_ROWS));
  const columns =
    (dataset.fields ?? []).map((f) => f.name) ??
    (rows.length ? Object.keys(rows[0]) : []);
  const rowCount =
    (dataset.fields?.length ?? 0) > 0
      ? datasetRows.length
      : last.rowCount ?? rows.length;
  return {
    columns,
    rows,
    rowCount,
    ms: Date.now() - t0,
    command: results.map((r) => r.command).filter(Boolean).join(" · "),
  };
}

/** Runs a validated single SELECT (widgets) with a 1,000-row cap. */
export async function runQuery(input: string): Promise<RunResult> {
  const q = assertSelect(input);
  const t0 = Date.now();
  const result = await pool.query(
    `SELECT * FROM (${q}) AS __gridboard_guard LIMIT ${MAX_ROWS}`
  );
  const rows = toRows(result.rows ?? []);
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return {
    columns,
    rows,
    rowCount: rows.length,
    ms: Date.now() - t0,
    command: "SELECT",
  };
}
