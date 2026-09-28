import { db } from "@/db";
import { widgets } from "@/db/schema";
import { ensureAppSchema } from "@/db/bootstrap";
import { errorResponse } from "@/lib/errors";
import { validateWidget, type WidgetInput } from "@/lib/widgetValidation";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await ensureAppSchema();
    const body = (await req.json().catch(() => ({}))) as WidgetInput;
    if (typeof body.dashboardId !== "string" || !body.dashboardId) {
      return Response.json({ error: "Dashboard is required" }, { status: 400 });
    }
    const v = await validateWidget(body);
    if ("error" in v) {
      return Response.json({ error: v.error }, { status: 400 });
    }
    const max = await db
      .select({ m: sql<number>`coalesce(max(${widgets.order}), -1)` })
      .from(widgets)
      .where(eq(widgets.dashboardId, body.dashboardId));
    const [created] = await db
      .insert(widgets)
      .values({
        name: v.value.name,
        sql: v.value.sql,
        type: v.value.type,
        span: v.value.span,
        dashboardId: body.dashboardId,
        order: Number(max[0]?.m ?? -1) + 1,
      })
      .returning();
    return Response.json({ widget: created }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
