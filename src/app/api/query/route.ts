import { runSql } from "@/lib/sql";
import { describeError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { sql?: string };
    if (typeof body.sql !== "string" || !body.sql.trim()) {
      return Response.json({ error: "Missing sql field" }, { status: 400 });
    }
    const result = await runSql(body.sql);
    return Response.json(result);
  } catch (e) {
    console.error("[gridboard] query failed:", e);
    return Response.json({ error: describeError(e) }, { status: 400 });
  }
}
