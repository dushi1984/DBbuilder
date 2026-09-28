import { databaseTarget } from "@/db";

type PgLikeError = Error & {
  code?: string;
  detail?: string;
  hint?: string;
  position?: string;
  errors?: unknown[];
};

const CONNECTION_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ECONNRESET",
]);

/**
 * Turns any thrown value (pg errors, Node network errors, AggregateError)
 * into a human-readable message. Node can raise AggregateError with an empty
 * message when localhost resolves to both IPv4 and IPv6, so the nested
 * errors are inspected too.
 */
export function describeError(e: unknown): string {
  if (!(e instanceof Error)) return String(e ?? "Unknown error");
  const err = e as PgLikeError;

  const nested =
    Array.isArray(err.errors) && err.errors[0] instanceof Error
      ? (err.errors[0] as PgLikeError)
      : null;
  const code = err.code ?? nested?.code;

  if (code && CONNECTION_CODES.has(code)) {
    return `Cannot connect to PostgreSQL at ${databaseTarget()} (${code}). Make sure PostgreSQL is running and DATABASE_URL in .env is correct.`;
  }
  if (code === "28P01" || code === "28000") {
    return `PostgreSQL rejected the login for ${databaseTarget()}. Check the username and password in DATABASE_URL.`;
  }
  if (code === "3D000") {
    const target = databaseTarget();
    const dbName = target.split("/").pop() || "app_db";
    return `Database ${target} does not exist. Create it first, e.g. createdb ${dbName}.`;
  }

  let msg = err.message || nested?.message || err.name || "Unknown error";
  if (err.detail) msg += ` — ${err.detail}`;
  if (err.hint) msg += ` (hint: ${err.hint})`;
  return msg;
}

export function errorResponse(e: unknown, status = 500): Response {
  console.error("[gridboard]", e);
  return Response.json({ error: describeError(e) }, { status });
}
