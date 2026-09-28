import { db } from "@/db";
import { widgets } from "@/db/schema";
import { ensureAppSchema } from "@/db/bootstrap";
import { errorResponse } from "@/lib/errors";
import { validateWidget, type WidgetInput } from "@/lib/widgetValidation";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await ensureAppSchema();
    const body = (await req.json().catch(() => ({}))) as WidgetInput;
    const existing = await db.select().from(widgets).where(eq(widgets.id, id));
    if (existing.length === 0) {
      return Response.json({ error: "Widget not found" }, { status: 404 });
    }
    const v = await validateWidget({
      name: body.name ?? existing[0].name,
      sql: body.sql ?? existing[0].sql,
      type: body.type ?? existing[0].type,
      span: body.span ?? existing[0].span,
    });
    if ("error" in v) {
      return Response.json({ error: v.error }, { status: 400 });
    }
    const [updated] = await db
      .update(widgets)
      .set(v.value)
      .where(eq(widgets.id, id))
      .returning();
    return Response.json({ widget: updated });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await ensureAppSchema();
    const rows = await db
      .delete(widgets)
      .where(eq(widgets.id, id))
      .returning({ id: widgets.id });
    if (rows.length === 0) {
      return Response.json({ error: "Widget not found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
