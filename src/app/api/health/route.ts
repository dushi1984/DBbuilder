import { pool } from "@/db";
import { describeError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await pool.query("select 1");
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { ok: false, error: describeError(e) },
      { status: 500 }
    );
  }
}
