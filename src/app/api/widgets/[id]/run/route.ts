import { db } from "@/db";
import { widgets } from "@/db/schema";
import { ensureAppSchema } from "@/db/bootstrap";
import { describeError, errorResponse } from "@/lib/errors";
import { eq } from "drizzle-orm";
import { runQuery } from "@/lib/sql";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  let widgetSql: string;
  try {
    const { id } = await params;
    await ensureAppSchema();
    const rows = await db.select().from(widgets).where(eq(widgets.id, id));
    if (rows.length === 0) {
      return Response.json({ error: "Widget not found" }, { status: 404 });
    }
    widgetSql = rows[0].sql;
  } catch (e) {
    return errorResponse(e);
  }
  try {
    const result = await runQuery(widgetSql);
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: describeError(e) }, { status: 400 });
  }
}
